//@ts-ignore
import { IconDelete24 } from "@dhis2/ui";
import styled from "@emotion/styled";
import MaterialTable from "@material-table/core";
import { Step, StepLabel, Stepper } from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import _ from "lodash";
import { useState, useEffect } from "react";
import { Page, Title } from "../../components/page/Page";
import { Section } from "../../components/section/Section";
import { useAppContext } from "../../hooks/useAppContext";
import i18n from "../../locales";
import { Database } from "../../services/db";
import { generateUid } from "../../services/fake-data/uid";

const db = new Database();

export const MetadataExport = () => {
    const { api, worker } = useAppContext();
    const [exportId] = useState(generateUid());
    const [query, setQuery] = useState<{ page?: number; size?: number; search?: string }>({});
    const [dependencies, setDependencies] = useState<string[]>([]);
    const [step, setStep] = useState(0);
    const [dependencySearch, setDependencySearch] = useState("");

    const metadataCount = useLiveQuery(() => db.list.count());
    const metadataList = useLiveQuery(async () => {
        const items = await db.list
            .orderBy("type")
            .filter(item => {
                if (!query.search) return true;
                return item.name.toLowerCase().includes(query.search.toLowerCase());
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
                const isSearch = item.name.toLowerCase().includes(dependencySearch.toLowerCase());
                return isSearch && dependencies.includes(item.id);
            })
            .toArray();

        return items.map(item => ({
            ...item,
            // @ts-ignore
            type: api.models[item.type].schema.displayName,
        }));
    }, [dependencies, dependencySearch]);

    useEffect(() => {
        worker.onmessage = event => {
            if (event.data.action === "export-dependency-list" && event.data.projectId === exportId) {
                setDependencies(dependencies => [...dependencies, ...event.data.dependencies]);
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
                        onSelectionChange={(_selection, row) => {
                            console.log(row, _selection);
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
                        }}
                        columns={[
                            { title: "Identifier", field: "id" },
                            { title: "Type", field: "type" },
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
