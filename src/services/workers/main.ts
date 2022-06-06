import _ from "lodash";
import { D2Api, getD2APiFromInstance, Pager } from "../../types/d2-api";
import { timeout } from "../../utils/lang";
import { Database } from "../db";
import { fakeOrgUnits } from "../fake-data";
import { isValidUid } from "../fake-data/uid";

export type WorkerInputData =
    | { action: "init"; url: string }
    | { action: "fake-data"; type: "orgUnits"; size: number; parent?: string; maxLevel: number }
    | { action: "export-dependency-gathering"; projectId: string; selection: string[] };

export type WorkerOutputData = { action: "export-dependency-list"; projectId: string; dependencies: string[] };

const sendMessage: (message: WorkerOutputData) => void = postMessage;

let api: D2Api;

onmessage = async (e: MessageEvent<WorkerInputData>) => {
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
            const metadata = await apiExport(e.data.selection);

            const fetchedItems = new Set<string>();
            const ids = await exportDependencies(metadata, fetchedItems);
            sendMessage({ action: "export-dependency-list", projectId: e.data.projectId, dependencies: ids });
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
            console.debug("Metadata", `Ignoring model ${model}`);
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
    console.log("Metadata", api.models);

    for (const model of models) {
        let page = 1;
        let pageCount = 1;

        while (page <= pageCount) {
            const pageMessage = pageCount > 1 ? ` (${page} of ${pageCount})` : "";
            console.debug("Metadata", `Fetching model ${model.schema.collectionName}` + pageMessage);

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

            db.list.bulkAdd(pageItems);
        }
    }
};

function traverse<T>(obj: any, visitor: (obj: Record<string, unknown>) => T): T[] {
    if (Array.isArray(obj)) {
        return obj.filter(item => isObject(item)).flatMap(item => traverse(item, visitor));
    }

    if (isObject(obj)) {
        return [visitor(obj), ...Object.keys(obj).flatMap(key => traverse(obj[key], visitor))];
    }

    return [];
}

function apiExport(ids: string[]) {
    return api
        .get<Record<string, unknown>>("/metadata", {
            filter: `id:in:[${ids.join(",")}]`,
            fields: ":owner",
        })
        .getData();
}

async function exportDependencies(metadata: Record<string, unknown>, fetchedItems: Set<string>): Promise<string[]> {
    const ids = _.uniq(traverse(metadata, obj => obj.id as string));
    const newIds = ids.filter(id => isValidUid(id) && !fetchedItems.has(id));
    if (newIds.length === 0) return [];

    newIds.forEach(id => fetchedItems.add(id));
    const dependencies = await apiExport(newIds);
    const dependenciesIds = await exportDependencies(dependencies, fetchedItems);
    return _.uniq([...newIds, ...dependenciesIds]);
}

function isObject(obj: any): obj is Record<string, unknown> {
    return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}
