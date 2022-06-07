//@ts-ignore
import { Button } from "@dhis2/ui";
import FileSaver from "file-saver";
import React from "react";
import ReactJson from "react-json-view";
import { useAppContext } from "../../../hooks/useAppContext";
import i18n from "../../../locales";
import { MetadataExportState } from "../MetadataExport";

export const ExportStep: React.FC<MetadataExportState> = React.memo(({ output, exportId, builder }) => {
    const { worker } = useAppContext();

    return (
        <div style={{ display: "flex", gap: 20, flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 20, width: "100%" }}>
                <Button
                    primary
                    onClick={() => worker.postMessage({ action: "export-build", projectId: exportId, builder })}
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
            </div>

            {output ? <ReactJson src={output} /> : null}
        </div>
    );
});
