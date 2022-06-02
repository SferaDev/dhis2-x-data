// @ts-ignore
import { InputField, Button, OrganisationUnitTree } from "@dhis2/ui";
import styled from "styled-components";
import i18n from "../../locales";
import { useState } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { OrgUnitTree } from "../../components/org-unit-tree/OrgUnitTree";
import { useGetRoots } from "../../services/api";

export const OrgUnitsTab = () => {
    const { worker } = useAppContext();
    const { data: roots = [] } = useGetRoots();

    const [size, setSize] = useState(100);
    const [maxLevel, setMaxLevel] = useState(3);
    const [parent, setParent] = useState<string>();

    const generate = () => {
        const parentId = parent?.split("/").pop();
        worker.postMessage({ action: "fake-data", type: "orgUnits", size, maxLevel, parent: parentId });
    };

    return (
        <Container>
            <InputField
                initialFocus
                label={i18n.t("Number of organisation units")}
                type="number"
                value={`${size}`}
                onChange={({ value }: any) => setSize(parseInt(value))}
            />

            <InputField
                label={i18n.t("Depth level")}
                type="number"
                value={`${maxLevel}`}
                onChange={({ value }: any) => setMaxLevel(parseInt(value))}
            />

            <div>
                <Label>{i18n.t("Parent")}</Label>
                <OrgUnitTree
                    roots={roots.map(({ id }) => id)}
                    selected={[parent]}
                    setSelected={([parent]) => setParent(parent)}
                />
            </div>

            <Button onClick={generate} primary>
                {i18n.t("Generate")}
            </Button>
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 25px;
`;

const Label = styled.label`
    display: block;
    box-sizing: border-box;
    font-size: 14px;
    line-height: 24px;
    padding: 0px;
    margin-bottom: 4px;
`;
