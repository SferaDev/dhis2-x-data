import { useConfig } from "@dhis2/app-runtime";
import { ReactQueryDevtools } from "react-query/devtools";
import styled from "@emotion/styled";
import { Section } from "./components/section/Section";
import { Sidebar } from "./components/sidebar/Sidebar";
import { AppContextProvider } from "./hooks/useAppContext";
import { RouterProvider, useRouter } from "./hooks/useRouter";
import { pages, routes } from "./pages";

const App = () => {
    const { baseUrl } = useConfig();
    const realUrl = process.env.NODE_ENV === "development" ? baseUrl : new URL(baseUrl, window.location.href).href;

    return (
        <>
            <AppContextProvider baseUrl={realUrl}>
                <RouterProvider>
                    <Grid>
                        <Sidebar items={pages} />
                        <Overflow>
                            <Outlet />
                        </Overflow>
                    </Grid>
                </RouterProvider>
            </AppContextProvider>

            <ReactQueryDevtools initialIsOpen={false} position="bottom-left" />
        </>
    );
};

const Outlet = () => {
    const { path } = useRouter();

    return (
        <>
            {routes.map(route => (
                <Section key={route.path} visible={route.path === path}>
                    {route.element}
                </Section>
            ))}
        </>
    );
};

const Grid = styled.div`
    display: grid;
    grid-template-columns: 15% 85%;
    height: calc(100vh - 48px);
`;

const Overflow = styled.div`
    overflow: auto;
`;

export default App;
