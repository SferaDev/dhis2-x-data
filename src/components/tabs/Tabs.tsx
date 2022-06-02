// @ts-ignore
import { Tab, TabBar } from "@dhis2/ui";

export interface TabItem<T> {
    label: string;
    value: T;
}

export interface TabsProps<T extends string> {
    tabs: TabItem<T>[];
    selected: T;
    onChange: (value: T) => void;
}

export function Tabs<T extends string = string>({ tabs, selected, onChange }: TabsProps<T>) {
    return (
        <TabBar>
            {tabs.map(({ label, value }) => (
                <Tab key={value} onClick={() => onChange(value)} selected={selected === value}>
                    {label}
                </Tab>
            ))}
        </TabBar>
    );
}
