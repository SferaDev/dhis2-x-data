import { useConfig } from "@dhis2/app-runtime";
import { Outlet, ReactLocation, Route, Router } from "@tanstack/react-location";
import { ReactLocationDevtools } from "@tanstack/react-location-devtools";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import styled from "styled-components";
import { Sidebar, SidebarItem } from "./components/sidebar/Sidebar";
import { AppContextProvider } from "./hooks/useAppContext";
import { FakeData } from "./pages/fake-data";
import { Home } from "./pages/home";

const location = new ReactLocation();
const queryClient = new QueryClient();

const App = () => {
    const { baseUrl } = useConfig();

    return (
        <Router location={location} routes={routes}>
            <QueryClientProvider client={queryClient}>
                <AppContextProvider baseUrl={baseUrl}>
                    <Grid>
                        <Sidebar items={sidebarItems} />
                        <Outlet />
                    </Grid>
                </AppContextProvider>
            </QueryClientProvider>

            <ReactLocationDevtools initialIsOpen={false} position="bottom-right" />
            <ReactQueryDevtools initialIsOpen={false} position="bottom-left" />
        </Router>
    );
};

const Grid = styled.div`
    display: grid;
    grid-template-columns: 20% 80%;
    height: 100vh;
`;

export default App;

const routes: Route[] = [
    { path: "/", element: <Home /> },
    { path: "/fake-data", element: <FakeData /> },
];

const sidebarItems: SidebarItem[] = [
    { type: "item", label: "Home", icon: "home", route: "/" },
    {
        type: "group",
        label: "Utilities",
        items: [{ type: "item", label: "Fake data", icon: "home", route: "/fake-data" }],
    },
];
