import React, { useContext, useState, useCallback, useMemo } from "react";

export interface RouterContextState {
    path: string;
    navigate: (path: string) => void;
}

export const RouterContext = React.createContext<RouterContextState | null>(null);

export function useRouter() {
    const context = useContext(RouterContext);
    if (context) {
        return context;
    } else {
        throw new Error("App context not found");
    }
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [path, setPath] = useState("/");

    const navigate = useCallback((path: string) => {
        setPath(path);
        // TODO: Update URL Params
    }, []);

    const value = useMemo(() => ({ path, navigate }), [path]);

    return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};
