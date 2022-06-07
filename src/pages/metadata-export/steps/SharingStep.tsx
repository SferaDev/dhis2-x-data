//@ts-ignore
import { SegmentedControl } from "@dhis2/ui";
import { ShareUpdate, Sharing, SharingRule } from "@eyeseetea/d2-ui-components";
import React, { useCallback } from "react";
import { useAppContext } from "../../../hooks/useAppContext";
import i18n from "../../../locales";
import { SharingSetting } from "../../../services/entities/SharedObject";
import { MetadataExportState } from "../MetadataExport";

export const SharingStep: React.FC<MetadataExportState> = React.memo(({ updateBuilder, builder }) => {
    const { api } = useAppContext();

    const search = useCallback(
        (query: string) => {
            const options = {
                fields: { id: true, displayName: true },
                filter: { displayName: { ilike: query } },
            };

            return api.metadata.get({ users: options, userGroups: options }).getData();
        },
        [api]
    );

    const setModuleSharing = useCallback(
        async ({ publicAccess, userAccesses, userGroupAccesses }: ShareUpdate) => {
            updateBuilder(builder => ({
                ...builder,
                sharings: {
                    publicAccess: publicAccess ?? builder.sharings.publicAccess,
                    userAccesses: mapSharingSettings(userAccesses) ?? builder.sharings.userAccesses,
                    userGroupAccesses: mapSharingSettings(userGroupAccesses) ?? builder.sharings.userGroupAccesses,
                },
            }));
        },
        [updateBuilder]
    );

    return (
        <>
            <SegmentedControl
                onChange={({ value }: any) =>
                    updateBuilder(builder => ({ ...builder, replaceExistingSharings: value === "replace" }))
                }
                options={[
                    {
                        label: "Merge",
                        value: "merge",
                    },
                    {
                        label: "Replace",
                        value: "replace",
                    },
                ]}
                selected={builder.replaceExistingSharings ? "replace" : "merge"}
            />
            <Sharing
                showOptions={showOptions}
                onSearch={search}
                onChange={setModuleSharing}
                meta={{
                    meta: { allowPublicAccess: true, allowExternalAccess: false },
                    object: {
                        id: "meta-object",
                        displayName: i18n.t("Global sharing settings"),
                        publicAccess: builder.sharings.publicAccess,
                        userAccesses: mapSharingRules(builder.sharings.userAccesses),
                        userGroupAccesses: mapSharingRules(builder.sharings.userGroupAccesses),
                    },
                }}
            />
        </>
    );
});

const mapSharingSettings = (settings?: SharingRule[]): SharingSetting[] | undefined => {
    return settings?.map(item => {
        return { id: item.id, access: item.access, name: item.displayName };
    });
};

const mapSharingRules = (settings?: SharingSetting[]): SharingRule[] | undefined => {
    return settings?.map(item => {
        return { id: item.id, access: item.access, displayName: item.name };
    });
};

const showOptions = {
    title: false,
    dataSharing: false,
    publicSharing: true,
    externalSharing: false,
    permissionPicker: true,
};
