// @ts-ignore
import { OrganisationUnitTree, Center, CircularLoader } from "@dhis2/ui";
import _ from "lodash";
import styled from "styled-components";

export interface OrgUnitTreeProps {
    roots: string[];
    selected?: (string | undefined)[];
    setSelected?: (selected: string[]) => void;
}

export const OrgUnitTree: React.FC<OrgUnitTreeProps> = ({ roots, selected, setSelected }) => {
    return (
        <Container>
            {roots.length > 0 ? (
                <OrganisationUnitTree
                    roots={roots}
                    onChange={({ selected }: any) => setSelected?.(selected)}
                    selected={_.compact(selected)}
                    singleSelection
                />
            ) : (
                <Center>
                    <CircularLoader />
                </Center>
            )}
        </Container>
    );
};

const Container = styled.div<{ height?: number }>`
    padding: 15px;
    height: ${props => props.height ?? 200}px;
    overflow-y: auto;

    border: 1px solid rgb(160, 173, 186);
    border-radius: 3px;
    box-shadow: rgb(48 54 60 / 10%) 0px 1px 2px 0px inset;
    text-overflow: ellipsis;
`;
