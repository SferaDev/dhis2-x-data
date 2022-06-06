import _ from "lodash";
import i18n from "../locales";
import { FakeData } from "./fake-data";
import { Home } from "./home";
import { MetadataEdit } from "./metadata-edit/MetadataEdit";
import { MetadataExport } from "./metadata-export/MetadataExport";
import { PlaygroundEditor } from "./playground/Playground";

export type PageItem = {
    type: "item";
    label: string;
    description?: string;
    icon?: React.ReactNode;
    route: string;
    element?: React.ReactNode;
};

export type PageGroup = {
    type: "group";
    label: string;
    items: PageItem[];
    collapsed?: boolean;
};

export type Page = PageItem | PageGroup;

export const pages: Page[] = [
    { type: "item", label: i18n.t("Home"), icon: "home", route: "/", element: <Home /> },
    {
        type: "group",
        label: "Metadata",
        items: [
            {
                type: "item",
                label: i18n.t("Export metadata"),
                description: i18n.t(
                    "Select metadata pieces, review dependencies, customize sharing settings and export"
                ),
                route: "/metadata/export",
                element: <MetadataExport />,
            },
            // { type: "item", label: i18n.t("Metadata Hub"), route: "/metadata/hub" },
        ],
    },
    {
        type: "group",
        label: "Utilities",
        items: [
            {
                type: "item",
                label: i18n.t("Fake generator"),
                description: i18n.t("Generate fake metadata (orgUnits) for testing"),
                icon: "home",
                route: "/utils/fake",
                element: <FakeData />,
            },
        ],
    },
    /**{
        type: "group",
        label: "About",
        items: [{ type: "item", label: i18n.t("About xData"), icon: "home", route: "/about" }],
    },**/
];

export const routes = _.compact(
    pages.flatMap(item => {
        if (item.type === "item") {
            return [{ path: item.route, element: item.element }];
        } else if (item.type === "group") {
            return item.items?.map(child => ({ path: child.route, element: child.element }));
        }
    })
);
