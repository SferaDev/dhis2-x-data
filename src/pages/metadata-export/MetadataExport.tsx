//@ts-ignore
import { IconDelete24, SegmentedControl, Button } from "@dhis2/ui";
import styled from "@emotion/styled";
import { ShareUpdate, Sharing, SharingRule } from "@eyeseetea/d2-ui-components";
import MaterialTable from "@material-table/core";
import { IconButton, Step, StepLabel, Stepper } from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import FileSaver from "file-saver";
import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import ReactJson from "react-json-view";
import { Page, Title } from "../../components/page/Page";
import { Section } from "../../components/section/Section";
import { useAppContext } from "../../hooks/useAppContext";
import i18n from "../../locales";
import { Database } from "../../services/db";
import { MetadataPayload } from "../../services/entities/MetadataItem";
import { SharingSetting } from "../../services/entities/SharedObject";
import { SharingUpdate } from "../../services/entities/SharingUpdate";
import { generateUid } from "../../services/fake-data/uid";
import { XataClient } from "../../xata";

const db = new Database();

export const MetadataExport = () => {
    const { api, worker } = useAppContext();
    const [builder, updateBuilder] = useState<SharingUpdate>({
        baseElements: [],
        excludedDependencies: [],
        replaceExistingSharings: false,
        sharings: { publicAccess: "--------", userAccesses: [], userGroupAccesses: [] },
    });
    const [exportId] = useState(generateUid());
    const [query, setQuery] = useState<{ page?: number; size?: number; search?: string }>({});
    const [dependencies, setDependencies] = useState<string[]>([]);
    const [step, setStep] = useState(0);
    const [dependencySearch, setDependencySearch] = useState("");
    const [output, setOutput] = useState<MetadataPayload>();

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
                return isSearch && dependencies.includes(item.id);
            })
            .toArray();

        return items.map(item => ({
            ...item,
            // @ts-ignore
            type: api.models[item.type].schema.displayName,
        }));
    }, [dependencies, dependencySearch]);

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

    useEffect(() => {
        worker.onmessage = event => {
            if (event.data.action === "export-dependency-list" && event.data.projectId === exportId) {
                // @ts-ignore
                setDependencies(dependencies => _.uniq([...dependencies, ...event.data.dependencies]));
            } else if (event.data.action === "export-build-result" && event.data.projectId === exportId) {
                setOutput(event.data.result);
            }
        };
    }, [worker]);

    return (
        <Page>
            <Title>Metadata export</Title>

            <Stepper nonLinear activeStep={step} sx={{ padding: 3 }}>
                {steps.map((label, index) => (
                    <Step key={label} onClick={() => setStep(index)} sx={{ cursor: "pointer" }}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Section visible={step === 0}>
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
                                            setDependencies(dependencies => _.difference(dependencies, ids));
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
                                    setDependencies(dependencies => _.difference(dependencies, ids));
                                },
                            },
                        ]}
                    />
                </Wrapper>
            </Section>

            <Section visible={step === 1}>
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
            </Section>

            <Section visible={step === 2}>
                <div style={{ display: "flex", gap: 20, flexDirection: "column" }}>
                    <div style={{ display: "flex", gap: 20, width: "100%" }}>
                        <Button
                            primary
                            onClick={() =>
                                worker.postMessage({
                                    action: "export-build",
                                    projectId: exportId,
                                    builder: { ...builder, baseElements: [...builder.baseElements, ...dependencies] },
                                })
                            }
                        >
                            {output ? i18n.t("Regenerate package") : i18n.t("Generate package")}
                        </Button>
                        {output ? (
                            <Button
                                onClick={() => {
                                    const json = JSON.stringify(output, null, 4);
                                    const blob = new Blob([json], { type: "application/json" });
                                    const name = "export";
                                    FileSaver.saveAs(blob, `${name}.json`);
                                }}
                            >
                                {i18n.t("Download")}
                            </Button>
                        ) : null}

                        {false && output ? (
                            <Button
                                onClick={async () => {
                                    const xata = new XataClient({ apiKey: process.env.REACT_APP_XATA_API_KEY });
                                    await xata.db.metadata.create({
                                        id: exportId,
                                        name: "export",
                                        data: JSON.stringify(output),
                                    });
                                }}
                            >
                                {i18n.t("Publish")}
                            </Button>
                        ) : null}
                    </div>

                    {output ? <ReactJson src={output} /> : null}
                </div>
            </Section>
        </Page>
    );
};

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 50% 50%;

    > * {
        margin: 10px;
    }
`;

const steps = [i18n.t("Select metadata"), i18n.t("Sharing and access"), i18n.t("Export")];

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
