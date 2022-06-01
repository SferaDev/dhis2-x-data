import { useConfig } from "@dhis2/app-runtime";
import { Outlet, ReactLocation, Route, Router } from "@tanstack/react-location";
import { ReactLocationDevtools } from "@tanstack/react-location-devtools";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import styled from "styled-components";
import { AppContextProvider } from "./hooks/useAppContext";
import { Home } from "./pages/home";

const location = new ReactLocation();
const queryClient = new QueryClient();

const App = () => {
    const { baseUrl } = useConfig();

    return (
        <Container>
            <Router location={location} routes={routes}>
                <QueryClientProvider client={queryClient}>
                    <AppContextProvider baseUrl={baseUrl}>
                        <Outlet />
                    </AppContextProvider>
                </QueryClientProvider>

                <ReactLocationDevtools initialIsOpen={false} position="bottom-right" />
                <ReactQueryDevtools initialIsOpen={false} position="bottom-left" />
            </Router>
        </Container>
    );
};

export default App;

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
`;

const routes: Route[] = [{ path: "/", element: <Home /> }];
