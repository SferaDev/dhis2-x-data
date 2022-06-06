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
import { isValidUid } from "../fake-data/uid";

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

export class MetadataD2ApiRepository {
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

    public getModelName(model: string): string {
        return this.api.models[model as ModelIndex].schema.displayName ?? i18n.t("Unknown model");
    }

    public isShareable(model: string): boolean {
        return this.api.models[model as ModelIndex].schema.shareable ?? false;
    }

    public isDataShareable(model: string): boolean {
        return this.api.models[model as ModelIndex].schema.dataShareable ?? false;
    }

    public fetchMetadata(ids: string[]): FutureData<MetadataPayload> {
        const chunks = _.chunk(ids, 200);
        return Future.futureMap(chunks, chunk =>
            apiToFuture(
                this.api.get("/metadata", {
                    filter: `id:in:[${chunk.join(",")}]`,
                    fields: ":owner",
                    defaults: "EXCLUDE",
                })
            )
        ).map(data => {
            return _.mergeWith({}, ...data, mergeCustomizer);
        });
    }

    public fetchMetadataWithDependencies(
        input: string[],
        fetchedItems = new Set<string>()
    ): FutureData<MetadataPayload> {
        return this.fetchMetadata(input).flatMap(metadata => {
            const ids = _.uniq(traverse(metadata, obj => obj.id as string));
            const newIds = ids.filter(id => isValidUid(id) && !fetchedItems.has(id));
            if (newIds.length === 0) return Future.success({});

            newIds.forEach(id => fetchedItems.add(id));
            return this.fetchMetadataWithDependencies(newIds, fetchedItems).map(payload =>
                _.mergeWith(payload, metadata, mergePayloads, mergeCustomizer)
            );
        });
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

function traverse<T>(obj: any, visitor: (obj: Record<string, unknown>) => T): T[] {
    if (Array.isArray(obj)) {
        return obj.filter(item => isObject(item)).flatMap(item => traverse(item, visitor));
    }

    if (isObject(obj)) {
        return [visitor(obj), ...Object.keys(obj).flatMap(key => traverse(obj[key], visitor))];
    }

    return [];
}

function isObject(obj: any): obj is Record<string, unknown> {
    return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

const mergeCustomizer = (obj: any, src: unknown) => (_.isArray(obj) ? obj.concat(src) : src);
