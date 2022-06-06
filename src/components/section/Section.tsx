import styled from "@emotion/styled";

export const Section = styled.div<{ visible: boolean }>`
    display: ${({ visible }) => (visible ? "inherit" : "none")};
`;
