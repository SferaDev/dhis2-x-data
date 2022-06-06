import _ from "lodash";
import i18n from "../locales";
import { FakeData } from "./fake-data";
import { Home } from "./home";
import { MetadataEdit } from "./metadata-edit/MetadataEdit";
import { MetadataExport } from "./metadata-export/MetadataExport";
import { PlaygroundEditor } from "./playground/Playground";

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
            { type: "item", label: i18n.t("Export metadata"), route: "/metadata/export", element: <MetadataExport /> },
            { type: "item", label: i18n.t("Metadata Hub"), route: "/metadata/hub" },
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
