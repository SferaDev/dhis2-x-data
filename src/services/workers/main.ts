import _ from "lodash";
import { D2Api, getD2APiFromInstance, Pager } from "../../types/d2-api";
import { timeout } from "../../utils/lang";
import { Database } from "../db";
import { ExportState } from "../entities/ExportState";
import { MetadataPayload } from "../entities/MetadataItem";
import { fakeOrgUnits } from "../fake-data";
import { MetadataD2ApiRepository } from "../metadata/MetadataRepository";
import { ApplySharings } from "../sharing-settings/ApplySharings";

export type WorkerInputData =
    | { action: "init"; url: string }
    | { action: "fake-data"; type: "orgUnits"; size: number; parent?: string; maxLevel: number }
    | { action: "export-dependency-gathering"; projectId: string; selection: string[] }
    | { action: "export-build"; projectId: string; builder: ExportState };

export type WorkerOutputData =
    | { action: "export-dependency-list"; projectId: string; dependencies: string[] }
    | {
          action: "export-build-result";
          projectId: string;
          result: MetadataPayload;
      }
    | { action: "loading"; loading: boolean };

const sendMessage: (message: WorkerOutputData) => void = postMessage;

let api: D2Api;

onmessage = async (e: MessageEvent<WorkerInputData>) => {
    const metadataRepo = new MetadataD2ApiRepository(api);
    const updater = new ApplySharings(metadataRepo);

    switch (e.data.action) {
        case "init":
            api = getD2APiFromInstance({ url: e.data.url });
            await init();
            break;
        case "fake-data":
            const orgUnits = fakeOrgUnits(e.data.size, e.data.maxLevel, e.data.parent);
            const { response } = await api.metadata.postAsync({ organisationUnits: orgUnits }).getData();
            await api.system.waitFor(response.jobType, response.id).getData();
            break;
        case "export-dependency-gathering":
            sendMessage({ action: "loading", loading: true });
            const metadata = await metadataRepo.fetchMetadataWithDependencies(e.data.selection).toPromise();
            const ids = _.values(metadata)
                .flat()
                .map(m => m.id);
            sendMessage({ action: "export-dependency-list", projectId: e.data.projectId, dependencies: ids });
            sendMessage({ action: "loading", loading: false });
            break;
        case "export-build":
            sendMessage({ action: "loading", loading: true });
            const result = await updater.execute(e.data.builder).toPromise();
            sendMessage({ action: "export-build-result", projectId: e.data.projectId, result });
            sendMessage({ action: "loading", loading: false });
            break;
    }
};

const db = new Database();

const pageSize = 10000;

export type MetadataElement = {
    id: string;
    name: string;
    _type: string;
    _modelName: string;
};

export const fetchApi = async (
    model: any,
    query: { page?: number; pageSize?: number },
    retry = 1
): Promise<{ objects: MetadataElement[]; pager?: Pager }> => {
    const { page = 1, pageSize = 10000 } = query;
    const retries = 3;

    try {
        if (model === undefined) {
            console.error("Metadata", `You provided model ${model}, but it does not exist`);
            return { objects: [] };
        }

        const response = await model.get({ fields: { id: true, name: true }, page, pageSize }).getData();
        return response;
    } catch (e: any) {
        if (e.response?.status === 401) {
            console.error("Metadata", `Invalid credentials`);
            return { objects: [] };
        } else if (e.response?.status === 404) {
            console.debug("Metadata", `Ignoring model ${model.schema.collectionName}`);
            return { objects: [] };
        } else if (retry < retries) {
            console.error(
                "Metadata",
                `Failed ${model.schema.collectionName} page ${page}, retrying ${retry}/${retries}...`
            );
            await timeout(2000);
            return fetchApi(model, query, retry + 1);
        } else {
            return { objects: [] };
        }
    }
};

export const init = async () => {
    const models = _.values(api.models).filter(model => model.schema.metadata);

    const count = await db.list.count();
    console.log("Metadata", `Found ${count} items in the database`);

    for (const model of models) {
        const items = [];

        let page = 1;
        let pageCount = 1;

        while (page <= pageCount) {
            const { objects, pager = { page, pageCount } } = await fetchApi(model, {
                page,
                pageSize,
            });
            page = pager.page + 1;
            pageCount = pager.pageCount;

            const pageItems = objects.map(obj => ({
                ...obj,
                type: model.schema.collectionName,
            }));

            if (count === 0) {
                await db.list.bulkAdd(pageItems);
            } else {
                items.push(...pageItems);
            }
        }

        if (count > 0) {
            const oldItems = await db.list.toArray();
            const differentItems = _.differenceWith(items, oldItems, _.isEqual);
            if (differentItems.length > 0) {
                console.log("Metadata", "Adding new items", differentItems.length);
                await db.list.bulkPut(differentItems);
            }
        }
    }
};
