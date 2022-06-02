import { useState } from "react";
import styled from "styled-components";
import { Tabs } from "../../components/tabs/Tabs";
import { OrgUnitsTab } from "./OrgUnits";

const tabs = [
    { label: "Organisation Units", value: "orgUnits" },
    { label: "Data Values", value: "dataValues" },
    { label: "Events", value: "events" },
];

export const FakeData = () => {
    const [selectedTab, setSelectedTab] = useState("orgUnits");

    return (
        <Container>
            <Title>Fake data</Title>

            <Tabs selected={selectedTab} onChange={setSelectedTab} tabs={tabs} />

            {tabs.map(tab => (
                <Section visible={tab.value === selectedTab}>
                    <Content tab={tab.value} />
                </Section>
            ))}
        </Container>
    );
};

const Content: React.FC<{ tab: string }> = ({ tab }) => {
    switch (tab) {
        case "orgUnits":
            return <OrgUnitsTab />;
        default:
            return null;
    }
};

const Container = styled.div`
    padding: 20px;
`;

const Title = styled.h1`
    margin: 15px;
`;

const Section = styled.div<{ visible: boolean }>`
    display: ${({ visible }) => (visible ? "inherit" : "none")};
`;
