import React, { useContext, useEffect, useState } from "react";
import Worker from "worker-loader!../services/workers/main";
import { WorkerInputData, WorkerOutputData } from "../services/workers/main";
import { D2Api, getD2APiFromInstance } from "../types/d2-api";

export interface AppContextState {
    api: D2Api;
    worker: Worker<WorkerInputData, WorkerOutputData>;
    roots: { id: string; name: string; path: string }[];
}

export const AppContext = React.createContext<AppContextState | null>(null);

export function useAppContext() {
    const context = useContext(AppContext);
    if (context) {
        return context;
    } else {
        throw new Error("App context not found");
    }
}

export const AppContextProvider: React.FC<{ baseUrl: string; children: React.ReactNode }> = ({ children, baseUrl }) => {
    const [initialized, setInitialized] = useState(false);
    const [value, setValue] = useState<AppContextState>(() => ({
        api: getD2APiFromInstance({ url: baseUrl }),
        worker: new Worker(),
        roots: [],
    }));

    useEffect(() => {
        if (!value || initialized) return;
        value.worker.postMessage({ action: "init", url: baseUrl });
        setInitialized(true);
    }, [value, initialized]);

    useEffect(() => {
        const api = getD2APiFromInstance({ url: baseUrl });
        api.models.organisationUnits
            .get({ filter: { level: { eq: "1" } }, fields: { id: true, name: true, path: true } })
            .getData()
            .then(({ objects }) => setValue(value => ({ ...value, roots: objects })));
    }, [baseUrl]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
