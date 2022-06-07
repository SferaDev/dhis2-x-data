//@ts-ignore
import { Cover, Center, CircularLoader } from "@dhis2/ui";
import { Step, StepLabel, Stepper } from "@mui/material";
import _ from "lodash";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Page, Title } from "../../components/page/Page";
import { Section } from "../../components/section/Section";
import { useAppContext } from "../../hooks/useAppContext";
import i18n from "../../locales";
import { ExportState } from "../../services/entities/ExportState";
import { MetadataPayload } from "../../services/entities/MetadataItem";
import { generateUid } from "../../services/fake-data/uid";
import { ExportStep } from "./steps/ExportStep";
import { MetadataSelectionStep } from "./steps/MetadataSelectionStep";

export interface MetadataExportState {
    exportId: string;
    builder: ExportState;
    updateBuilder: Dispatch<SetStateAction<ExportState>>;
    output?: MetadataPayload;
}

export const MetadataExport = () => {
    const { worker } = useAppContext();

    const [exportId] = useState(generateUid());
    const [step, setStep] = useState(0);
    const [output, setOutput] = useState<MetadataPayload>();
    const [loading, setLoading] = useState(false);
    const [builder, updateBuilder] = useState<ExportState>({
        baseElements: [],
        dependencies: [],
        replaceExistingSharings: false,
        sharings: { publicAccess: "--------", userAccesses: [], userGroupAccesses: [] },
    });

    useEffect(() => {
        worker.onmessage = event => {
            if (event.data.action === "loading") {
                setLoading(event.data.loading);
            } else if (event.data.action === "export-dependency-list" && event.data.projectId === exportId) {
                updateBuilder(builder => ({
                    ...builder,
                    // @ts-ignore
                    dependencies: _.uniq([...builder.dependencies, ...event.data.dependencies]),
                }));
            } else if (event.data.action === "export-build-result" && event.data.projectId === exportId) {
                setOutput(event.data.result);
            }
        };
    }, [worker]);

    return (
        <Page>
            {loading && (
                <Cover translucent>
                    <Center>
                        <CircularLoader large />
                    </Center>
                </Cover>
            )}

            <Title>Metadata export</Title>

            <Stepper nonLinear activeStep={step} sx={{ padding: 3 }}>
                {steps.map((label, index) => (
                    <Step key={label} onClick={() => setStep(index)} sx={{ cursor: "pointer" }}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Section visible={step === 0}>
                <MetadataSelectionStep
                    exportId={exportId}
                    builder={builder}
                    updateBuilder={updateBuilder}
                    output={output}
                />
            </Section>

            <Section visible={step === 1}>
                <ExportStep exportId={exportId} builder={builder} updateBuilder={updateBuilder} output={output} />
            </Section>
        </Page>
    );
};

const steps = [i18n.t("Select metadata"), i18n.t("Export")];
