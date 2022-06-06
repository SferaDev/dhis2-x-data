import _ from "lodash";
import i18n from "../../locales";
import { D2Api, D2ApiDefinition, MetadataResponse, Stats } from "../../types/d2-api";
import { apiToFuture } from "../../utils/api-futures";
import { Future, FutureData } from "../entities/Futures";
import { ImportResult, ImportStats } from "../entities/ImportResult";
import {
    DataDimensionItem,
    isValidModel,
    MetadataItem,
    MetadataModel,
    MetadataPayload,
    Visualization,
} from "../entities/MetadataItem";

export interface MetadataRepository {
    list(options: ListOptions): FutureData<ListMetadataResponse>;
    getDependencies(ids: string[]): FutureData<MetadataPayload>;
    save(payload: MetadataPayload): FutureData<ImportResult>;
    getModelName(model: string): string;
    isShareable(model: string): boolean;
    isDataShareable(model: string): boolean;
}

export interface ListOptions {
    model: MetadataModel;
    page?: number;
    pageSize?: number;
    search?: string;
    sorting?: { field: string; order: "asc" | "desc" };
}

export interface ListMetadataResponse {
    objects: MetadataItem[];
    pager: Pager;
}

export interface Pager {
    page: number;
    pageSize: number;
    total: number;
}

export class MetadataD2ApiRepository implements MetadataRepository {
    constructor(private api: D2Api) {}

    public list(options: ListOptions): FutureData<ListMetadataResponse> {
        const { model, page, pageSize, search, sorting = { field: "id", order: "asc" } } = options;

        return apiToFuture(
            //@ts-ignore: d2-api incorrectly guessing model with string access
            this.api.models[model].get({
                page,
                pageSize,
                paging: true,
                filter: { identifiable: search ? { token: search } : undefined },
                fields: { $owner: true },
                order: `${sorting.field}:${sorting.order}`,
            })
        );
    }

    public save(payload: MetadataPayload): FutureData<ImportResult> {
        return apiToFuture(this.api.metadata.post(payload)).map(response => buildMetadataImportResult(response));
    }

    public getDependencies(ids: string[]): FutureData<MetadataPayload> {
        return this.fetchMetadata(ids)
            .flatMap(payload => {
                const items = _(payload)
                    .mapValues((items, key) => {
                        if (!Array.isArray(items) || !isValidModel(key)) return undefined;
                        return items.map(item => ({ model: key, id: item.id }));
                    })
                    .values()
                    .flatten()
                    .compact()
                    .value();

                return Future.futureMap(items, ({ model, id }) => this.fetchMetadataWithDependencies(model, id));
            })
            .flatMap(payloads => {
                const payload = mergePayloads(payloads);
                const extraIds = extractExtraDependencies(payload);
                if (extraIds.length === 0) return Future.success(payload);

                return this.fetchMetadata(extraIds).map(dependencies => mergePayloads([payload, dependencies]));
            })
            .map(payload => removeDefaults(payload));
    }

    public getModelName(model: string): string {
        return this.api.models[model as ModelIndex].schema.displayName ?? i18n.t("Unknown model");
    }

    public isShareable(model: string): boolean {
        return this.api.models[model as ModelIndex].schema.shareable ?? false;
    }

    public isDataShareable(model: string): boolean {
        return this.api.models[model as ModelIndex].schema.dataShareable ?? false;
    }

    private fetchMetadata(ids: string[]): FutureData<MetadataPayload> {
        return apiToFuture(this.api.get("/metadata", { filter: `id:in:[${ids.join(",")}]` }));
    }

    private fetchMetadataWithDependencies(model: MetadataModel, id: string): FutureData<MetadataPayload> {
        return apiToFuture<MetadataPayload>(this.api.get(`/${model}/${id}/metadata.json`));
    }
}

export function mergePayloads(payloads: MetadataPayload[]): MetadataPayload {
    return _.reduce(
        payloads,
        (result, payload) => {
            _.forOwn(payload, (value, key) => {
                if (Array.isArray(value)) {
                    const existing = result[key] ?? [];
                    result[key] = _.uniqBy([...existing, ...value], ({ id }) => id);
                }
            });
            return result;
        },
        {} as MetadataPayload
    );
}

function removeDefaults(payload: MetadataPayload): MetadataPayload {
    return _.mapValues(payload, items => items.filter(({ code, name }) => code !== "default" && name !== "default"));
}

function extractExtraDependencies(payload: MetadataPayload): string[] {
    return _(payload)
        .mapValues((value, key) => {
            if (key === "visualizations") {
                return _.flatten(
                    value.map((element: Visualization) =>
                        _.flatMap(element.dataDimensionItems ?? [], (item: DataDimensionItem) => {
                            const indicator = item.indicator?.id;
                            const programIndicator = item.programIndicator?.id;
                            return _.compact([indicator, programIndicator]);
                        })
                    )
                );
            }

            return [];
        })
        .values()
        .flatten()
        .value();
}

function buildMetadataImportResult(response: MetadataResponse): ImportResult {
    const { status, stats, typeReports = [] } = response;
    const typeStats = typeReports.flatMap(({ klass, stats }) => formatStats(stats, getClassName(klass)));

    const messages = typeReports.flatMap(({ objectReports = [] }) =>
        objectReports.flatMap(({ uid: id, errorReports = [] }) =>
            _.take(errorReports, 1).map(({ mainKlass, errorProperty, message }) => ({
                id,
                type: getClassName(mainKlass),
                property: errorProperty,
                message: message,
            }))
        )
    );

    return {
        title: i18n.t("Metadata"),
        date: new Date(),
        status: status === "OK" ? "SUCCESS" : status,
        stats: [formatStats(stats), ...typeStats],
        errors: messages,
        rawResponse: response,
    };
}

function formatStats(stats: Stats, type?: string): ImportStats {
    return {
        ..._.omit(stats, ["created"]),
        imported: stats.created,
        type,
    };
}

function getClassName(className: string): string | undefined {
    return _(className).split(".").last();
}

type ModelIndex = keyof D2ApiDefinition["schemas"];
