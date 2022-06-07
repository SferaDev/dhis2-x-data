//@ts-ignore
import { IconDelete24 } from "@dhis2/ui";
import styled from "@emotion/styled";
import MaterialTable from "@material-table/core";
import { IconButton } from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import _ from "lodash";
import React, { useState } from "react";
import { useAppContext } from "../../../hooks/useAppContext";
import i18n from "../../../locales";
import { Database } from "../../../services/db";
import { MetadataExportState } from "../MetadataExport";

const db = new Database();

export const MetadataSelectionStep: React.FC<MetadataExportState> = React.memo(
    ({ exportId, builder, updateBuilder }) => {
        const { api, worker } = useAppContext();

        const [query, setQuery] = useState<{ page?: number; size?: number; search?: string }>({});
        const [dependencySearch, setDependencySearch] = useState("");

        const metadataCount = useLiveQuery(() => db.list.count());
        const metadataList = useLiveQuery(async () => {
            const items = await db.list
                .orderBy("type")
                .filter(item => {
                    if (!query.search) return true;
                    return (
                        (item.name ?? "").toLowerCase().includes(query.search.toLowerCase()) ||
                        (item.id ?? "").toLowerCase().includes(query.search.toLowerCase())
                    );
                })
                .toArray();

            return items.map(item => ({
                ...item,
                // @ts-ignore
                type: api.models[item.type].schema.displayName,
            }));
        }, [query]);

        const dependencyList = useLiveQuery(async () => {
            const items = await db.list
                .orderBy("type")
                .filter(item => {
                    const isSearch =
                        (item.name ?? "").toLowerCase().includes(dependencySearch.toLowerCase()) ||
                        (item.id ?? "").toLowerCase().includes(dependencySearch.toLowerCase());
                    return isSearch && builder.dependencies.includes(item.id);
                })
                .toArray();

            return items.map(item => ({
                ...item,
                // @ts-ignore
                type: api.models[item.type].schema.displayName,
            }));
        }, [builder.dependencies, dependencySearch]);

        return (
            <Wrapper>
                <MaterialTable
                    title={i18n.t("Metadata selection")}
                    data={metadataList ?? []}
                    totalCount={metadataCount}
                    page={query?.page ?? 0}
                    onPageChange={(page, size) => setQuery({ page, size })}
                    onSearchChange={search => setQuery(query => ({ ...query, page: 0, search }))}
                    onSelectionChange={(selection, row) => {
                        updateBuilder(builder => ({ ...builder, baseElements: selection.map(item => item.id) }));
                        if (!row) return;
                        worker.postMessage({
                            action: "export-dependency-gathering",
                            projectId: exportId,
                            selection: [row.id],
                        });
                    }}
                    options={{
                        pageSize: 5,
                        pageSizeOptions: [5, 10, 20, 50],
                        paging: false,
                        selection: true,
                        showTextRowsSelected: false,
                        showSelectGroupCheckbox: false,
                        maxBodyHeight: "calc(100vh - 310px)",
                        groupRowSeparator: " ",
                        groupTitle: () => "",
                    }}
                    columns={[
                        { title: "Type", field: "type", defaultGroupOrder: 0 },
                        { title: "Identifier", field: "id" },
                        { title: "Name", field: "name" },
                    ]}
                />

                <MaterialTable
                    title={i18n.t("Dependencies")}
                    data={dependencyList ?? []}
                    onSearchChange={search => setDependencySearch(search)}
                    options={{
                        paging: false,
                        maxBodyHeight: "calc(100vh - 310px)",
                        groupRowSeparator: " ",
                        groupTitle: ({ data }) => (
                            <span>
                                <IconButton
                                    sx={{ cursor: "pointer" }}
                                    onClick={() => {
                                        const ids = data.map((item: any) => item.id);
                                        updateBuilder(builder => ({
                                            ...builder,
                                            dependencies: _.difference(builder.dependencies, ids),
                                        }));
                                    }}
                                >
                                    <IconDelete24 />
                                </IconButton>
                            </span>
                        ),
                    }}
                    columns={[
                        { title: "Identifier", field: "id" },
                        { title: "Type", field: "type", defaultGroupOrder: 0 },
                        { title: "Name", field: "name" },
                    ]}
                    localization={{
                        header: { actions: "" },
                    }}
                    actions={[
                        {
                            icon: () => <IconDelete24 />,
                            onClick: (_event, row) => {
                                const ids = _.flatten([row]).map(item => item.id);
                                updateBuilder(builder => ({
                                    ...builder,
                                    dependencies: _.difference(builder.dependencies, ids),
                                }));
                            },
                        },
                    ]}
                />
            </Wrapper>
        );
    }
);

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 50% 50%;

    > * {
        margin: 10px;
    }
`;
