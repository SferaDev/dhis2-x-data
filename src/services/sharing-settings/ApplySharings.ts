import _ from "lodash";
import { FutureData } from "../entities/Futures";
import { MetadataItem, MetadataPayload } from "../entities/MetadataItem";
import { buildAccessString, getAccessFromString, SharedObject, SharingSetting } from "../entities/SharedObject";
import { ExportState } from "../entities/ExportState";
import { MetadataD2ApiRepository } from "../metadata/MetadataRepository";

export class ApplySharings {
    constructor(private metadataRepository: MetadataD2ApiRepository) {}

    public execute(update: ExportState): FutureData<MetadataPayload> {
        const { baseElements, dependencies, sharings, replaceExistingSharings } = update;
        return this.metadataRepository
            .fetchMetadata([...baseElements, ...dependencies])
            .map(payload => this.cleanPayload(payload, []))
            .map(payload => this.sharePayload(payload, sharings, replaceExistingSharings));
    }

    private cleanPayload(
        { system, ...payload }: Record<string, any[]>,
        excludedDependencies: string[]
    ): MetadataPayload {
        return _.mapValues(payload, items => {
            return items.filter(item => {
                return !excludedDependencies.includes(item.id);
            });
        });
    }

    private sharePayload(payload: MetadataPayload, sharings: SharedObject, replace: boolean): MetadataPayload {
        return _.mapValues(payload, (items, model) =>
            items
                .map(item => this.updateSharingSettings(item, sharings, replace))
                .map(item => this.assertValidSharingSettings(model, item))
        );
    }

    private updateSharingSettings(
        { sharing, createdBy, created, lastUpdated, lastUpdatedBy, ...item }: MetadataItem,
        sharings: SharedObject,
        replace: boolean
    ): MetadataItem {
        return {
            ...item,
            publicAccess: sharings.publicAccess,
            userAccesses: replace
                ? sharings.userAccesses
                : joinSharingSettings(sharings.userAccesses, item.userAccesses),
            userGroupAccesses: replace
                ? sharings.userGroupAccesses
                : joinSharingSettings(sharings.userGroupAccesses, item.userGroupAccesses),
        };
    }

    private assertValidSharingSettings(model: string, item: MetadataItem): MetadataItem {
        return {
            ...item,
            publicAccess: this.assertDataAccess(model, item.publicAccess),
            userAccesses: item.userAccesses.map(item => ({
                ...item,
                access: this.assertDataAccess(model, item.access),
            })),
            userGroupAccesses: item.userGroupAccesses.map(item => ({
                ...item,
                access: this.assertDataAccess(model, item.access),
            })),
        };
    }

    private assertDataAccess(model: string, permission: string): string {
        const access = getAccessFromString(permission);
        const stripDataPermissions = !this.metadataRepository.isDataShareable(model);
        return buildAccessString(access, stripDataPermissions);
    }
}

function joinSharingSettings(base: SharingSetting[] = [], update: SharingSetting[] = []): SharingSetting[] {
    return _.uniqBy([...base, ...update], ({ id }) => id);
}
