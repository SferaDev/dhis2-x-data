import styled from "@emotion/styled";
import MaterialTable from "@material-table/core";
import { Step, StepLabel, Stepper } from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Page, Title } from "../../components/page/Page";
import { Section } from "../../components/section/Section";
import { useAppContext } from "../../hooks/useAppContext";
import i18n from "../../locales";
import { Database } from "../../services/db";
import { generateUid } from "../../services/fake-data/uid";

const db = new Database();

export const MetadataExport = () => {
    const { api } = useAppContext();
    const [id] = useState(generateUid());
    const [query, setQuery] = useState<{ page?: number; size?: number; search?: string }>({});
    const [step, setStep] = useState(0);

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

    const packageInfo = useLiveQuery(async () => {
        const info = await db.metadataExport.filter(item => item.id === id).first();
        const dependencies = await db.list.filter(item => info?.dependencies?.includes(item.id) ?? false).toArray();

        return { ...info, dependencies };
    });

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
                        options={{
                            pageSize: 5,
                            pageSizeOptions: [5, 10, 20, 50],
                            paging: false,
                        }}
                        columns={[
                            { title: "Type", field: "type", defaultGroupOrder: 0 },
                            { title: "Identifier", field: "id" },
                            { title: "Name", field: "name" },
                        ]}
                    />

                    <MaterialTable
                        title={i18n.t("Dependencies")}
                        data={packageInfo?.dependencies ?? []}
                        options={{
                            search: false,
                            paging: false,
                        }}
                        columns={[
                            { title: "Identifier", field: "id" },
                            { title: "Type", field: "type" },
                            { title: "Name", field: "name" },
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

const steps = [
    i18n.t("Select metadata"),
    i18n.t("Review dependencies"),
    i18n.t("Sharing and access"),
    i18n.t("Transform"),
    i18n.t("Export"),
];
