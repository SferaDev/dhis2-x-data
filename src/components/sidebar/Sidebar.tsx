// @ts-ignore
import { MenuItem as D2MenuItem, MenuSectionHeader as D2MenuSectionHeader } from "@dhis2/ui";
import styled from "@emotion/styled";
import { useRouter } from "../../hooks/useRouter";
import { Page } from "../../pages";

export interface SidebarProps {
    items: Page[];
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

const Item: React.FC<Page> = props => {
    const { navigate } = useRouter();
    switch (props.type) {
        case "item":
            return <MenuItem label={props.label} item={props.icon} onClick={() => navigate(props.route)} />;
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
