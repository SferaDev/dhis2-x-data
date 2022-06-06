import { useState } from "react";
import { Page, Title } from "../../components/page/Page";
import { Section } from "../../components/section/Section";
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
        <Page>
            <Title>Fake data</Title>

            <Tabs selected={selectedTab} onChange={setSelectedTab} tabs={tabs} />

            {tabs.map(tab => (
                <Section visible={tab.value === selectedTab}>
                    <Content tab={tab.value} />
                </Section>
            ))}
        </Page>
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
