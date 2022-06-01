export type WorkerInputData = { action: "init"; url: string };

export type WorkerOutputData = { action: "output" };

const sendMessage: (message: WorkerOutputData) => void = postMessage;

onmessage = async (e: MessageEvent<WorkerInputData>) => {
    switch (e.data.action) {
        case "init":
            break;
        default:
            throw new Error(`Unknown action: ${e.data.action}`);
    }
};
