// @ts-ignore
import { MenuItem as D2MenuItem, MenuSectionHeader as D2MenuSectionHeader } from "@dhis2/ui";
import { useNavigate } from "@tanstack/react-location";
import styled from "styled-components";

type Item = {
    type: "item";
    label: string;
    icon?: React.ReactNode;
    route: string;
};

type Group = {
    type: "group";
    label: string;
    items: SidebarItem[];
    collapsed?: boolean;
};

export type SidebarItem = Item | Group;

export interface SidebarProps {
    items: SidebarItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ items }) => {
    return (
        <Container>
            {items.map((item, index) => (
                <Item key={`item-${index}`} {...item} />
            ))}
        </Container>
    );
};

const Item: React.FC<SidebarItem> = props => {
    const navigate = useNavigate();
    switch (props.type) {
        case "item":
            return <MenuItem label={props.label} item={props.icon} onClick={() => navigate({ to: props.route })} />;
        case "group":
            return (
                <>
                    <MenuSectionHeader label={props.label} hideDivider />
                    {props.items.map((item, index) => (
                        <Item key={`item-${index}`} {...item} />
                    ))}
                </>
            );
        default:
            return null;
    }
};

const Container = styled.div`
    background-color: #f3f5f7;
    border-right: 1px solid #e5e5e5;
`;

const MenuSectionHeader = styled(D2MenuSectionHeader)`
    * {
        background-color: #f3f5f7;
    }
`;

const MenuItem = styled(D2MenuItem)`
    * {
        background-color: #f3f5f7;

        &:hover {
            background-color: #fff;
        }
    }
`;
