import { rollup } from "rollup";
import { importCdn } from "rollup-plugin-import-cdn";
import { virtualFs } from "rollup-plugin-virtual-fs";

export type WorkerInputData =
    | { action: "run"; code: string }
    | { action: "run-bundle"; entry: string; files: Record<string, string> };

export type WorkerOutputData = { action: "output"; events: RunnerEvent[] };

const sendMessage: (message: WorkerOutputData) => void = postMessage;

onmessage = async (e: MessageEvent<WorkerInputData>) => {
    switch (e.data.action) {
        case "run": {
            await run(e.data.code);
            return;
        }
        case "run-bundle": {
            const code = await bundle(e.data.entry, e.data.files);
            await run(code);
            return;
        }
    }
};

async function bundle(input: string, files: Record<string, string>): Promise<string> {
    try {
        const bundle = await rollup({
            input,
            output: { file: `file://bundle.js` },
            plugins: [importCdn({ fetchImpl: fetch }), virtualFs({ files })],
        });

        const { output } = await bundle.generate({});

        return output[0].code;
    } catch (error) {
        sendMessage({
            action: "output",
            events: [{ type: "console.error", extra: JSON.parse(JSON.stringify(error)) }],
        });
        throw error;
    }
}

const backupConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.trace,
    clear: console.clear,
};

async function run(code: string) {
    try {
        const events: RunnerEvent[] = [];

        for (const method of consoleMethods) {
            console[method] = (...extra: unknown[]) => {
                const value = extra.length === 1 ? extra[0] : extra;
                events.push({
                    type: `console.${method}`,
                    extra: JSON.parse(JSON.stringify(value)),
                });
            };
        }

        try {
            await eval(`(async () => { ${code} })()`);
        } catch (error) {
            if (error instanceof Error) {
                events.push({ type: "console.error", extra: error.message });
            } else {
                events.push({ type: "console.error", extra: error });
            }
        }

        for (const method of consoleMethods) {
            console[method] = backupConsole[method];
        }

        sendMessage({ action: "output", events });
    } catch (error) {
        sendMessage({
            action: "output",
            events: [{ type: "console.error", extra: JSON.parse(JSON.stringify(error)) }],
        });
    }
}

const consoleMethods = ["log", "info", "warn", "error", "debug", "trace", "clear"] as const;

type RunnerEventType = `console.${typeof consoleMethods[number]}`;

export type RunnerEvent = {
    type: RunnerEventType;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extra?: any;
};
