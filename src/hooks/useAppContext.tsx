import React, { useContext, useEffect, useState } from "react";
import Worker from "worker-loader!../services/workers/main";
import { WorkerInputData, WorkerOutputData } from "../services/workers/main";
import { D2Api, getD2APiFromInstance } from "../types/d2-api";

export interface AppContextState {
    api: D2Api;
    worker: Worker<WorkerInputData, WorkerOutputData>;
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
    const [value] = useState<AppContextState>(() => ({
        api: getD2APiFromInstance({ url: baseUrl }),
        worker: new Worker(),
    }));

    useEffect(() => {
        value.worker.postMessage({ action: "init", url: baseUrl });
    }, [value]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
