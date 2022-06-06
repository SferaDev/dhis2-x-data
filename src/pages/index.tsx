import _ from "lodash";
import i18n from "../locales";
import { FakeData } from "./fake-data";
import { Home } from "./home";
import { MetadataEdit } from "./metadata-edit/MetadataEdit";
import { MetadataExport } from "./metadata-export/MetadataExport";

type Item = {
    type: "item";
    label: string;
    icon?: React.ReactNode;
    route: string;
    element?: React.ReactNode;
};

type Group = {
    type: "group";
    label: string;
    items: Item[];
    collapsed?: boolean;
};

export type Page = Item | Group;

export const pages: Page[] = [
    { type: "item", label: i18n.t("Home"), icon: "home", route: "/", element: <Home /> },
    {
        type: "group",
        label: "Metadata",
        items: [
            { type: "item", label: i18n.t("Edit metadata"), route: "/metadata/edit", element: <MetadataEdit /> },
            { type: "item", label: i18n.t("Import metadata"), route: "/metadata/import" },
            { type: "item", label: i18n.t("Export metadata"), route: "/metadata/export", element: <MetadataExport /> },
        ],
    },
    {
        type: "group",
        label: "Data",
        items: [
            { type: "item", label: i18n.t("Edit data"), route: "/data/edit" },
            { type: "item", label: i18n.t("Import data"), route: "/data/import" },
            { type: "item", label: i18n.t("Export data"), route: "/data/export" },
        ],
    },
    {
        type: "group",
        label: "Utilities",
        items: [
            {
                type: "item",
                label: i18n.t("Fake generator"),
                icon: "home",
                route: "/utils/fake",
                element: <FakeData />,
            },
            { type: "item", label: i18n.t("API Playground"), icon: "home", route: "/utils/playground" },
        ],
    },
    {
        type: "group",
        label: "About",
        items: [{ type: "item", label: i18n.t("About xData"), icon: "home", route: "/about" }],
    },
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
