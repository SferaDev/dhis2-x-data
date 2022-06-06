import { useAlert } from "@dhis2/app-runtime";
import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { AutoTypings, SourceCache, SourceResolver } from "monaco-editor-auto-typings/custom-editor";
import { FC, ReactNode, useEffect, useRef, useState } from "react";
import SplitPaneLegacy, { SplitPaneProps } from "react-split-pane";
import Worker from "worker-loader!../../services/workers/runner";
import { Page, Title } from "../../components/page/Page";
import type { WorkerInputData, WorkerOutputData } from "../../services/workers/runner";
import { Output, OutputViewer } from "./OutputViewer";
import styles from "./Playground.module.css";

type PlaygroundEditorProps = {};

// This library uses the old React.FC type and assumes children exists, so just a quick polyfill.
const SplitPane = SplitPaneLegacy as unknown as FC<SplitPaneProps & { children: ReactNode }>;

const runnerWorker = new Worker<WorkerInputData, WorkerOutputData>();

export const PlaygroundEditor: React.FC<PlaygroundEditorProps> = ({}) => {
    const [splitDirection, setSplitDirection] = useState<"vertical" | "horizontal">("vertical");
    const [bottomPanelHeight, setBottomPanelHeight] = useState("50%");
    const [loading, setLoading] = useState(false);
    const runCodeRef = useRef<() => void>(() => null);
    const [value, setValue] = useState<string | undefined>();
    const [clientCode, setClientCode] = useState<string>("");
    const [outputs, setOutputs] = useState<Output[]>([]);
    const [primaryPaneSize, setPrimaryPaneSize] = useState(0);
    const monaco = useMonaco();
    const { show: alert } = useAlert(str => str);

    const handleEditorBeforeMount = (monaco: Monaco) => {
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            allowSyntheticDefaultImports: true,
        });

        const model = monaco.editor.getModel(monaco.Uri.parse("src/index.ts"));
        if (!model) monaco.editor.createModel("", "typescript", monaco.Uri.parse("src/index.ts"));
        monaco.languages.typescript.typescriptDefaults.addExtraLib(actionGlobals, "globals.d.ts");

        runnerWorker.onmessage = event => {
            if (event.data.action !== "output") return;

            setOutputs(prevOutputs => [{ date: new Date(), events: event.data.events }, ...prevOutputs]);
            setLoading(false);
        };

        monaco.editor.defineTheme("dark-mode", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
                "editor.background": "#191D28",
                "editor.foreground": "#ffffff",
            },
        });
    };

    const handleEditorOnMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        if (editor.getModel() === undefined) return;

        void AutoTypings.create(editor, {
            sourceCache: new SessionStorageCache(),
            monaco,
            sourceResolver: new SkypackSourceResolver(),
            fileRootPath: "",
            preloadPackages: true,
            versions: { "@eyeseetea/d2-api": "latest" },
        });

        const run = async (editor: editor.IStandaloneCodeEditor) => {
            const entry = editor.getModel()?.uri.toString();
            if (!entry) {
                alert("Unable to run code, no entry point found");
                return;
            }

            const tsWorker = await monaco.languages.typescript.getTypeScriptWorker();
            const files: Record<string, string> = {};

            for await (const file of monaco.editor.getModels()) {
                try {
                    if (!file.uri.path.startsWith("/node_modules/")) {
                        const tsModel = await tsWorker(file.uri);
                        const emitOutput = await tsModel.getEmitOutput(file.uri.toString());
                        // TODO: FIXME: https://github.com/microsoft/monaco-editor/pull/3057
                        files[file.uri.path] = emitOutput.outputFiles[0]?.text.replace("%40", "@") ?? "";
                    }
                } catch (error) {
                    console.error(`Unable to retrieve emit output for ${file.uri.path}`, error);
                }
            }

            runnerWorker.postMessage({ action: "run-bundle", entry, files });
            setLoading(true);
        };

        runCodeRef.current = () => run(editor);

        editor.addAction({
            id: "run",
            label: "Run code",
            contextMenuGroupId: "1_modification",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
            run,
        });
    };

    useEffect(() => {
        if (!monaco) return;
        const uri = monaco.Uri.parse("src/xata.ts");
        const model = monaco.editor.getModel(uri) ?? monaco.editor.createModel(clientCode, "typescript", uri);
        model.setValue(clientCode);
    }, [monaco, clientCode]);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(min-width: 768px)`);
        const handleChange = (matches: boolean) => {
            if (matches) {
                setSplitDirection("vertical");
            } else {
                setSplitDirection("horizontal");
            }
        };

        handleChange(mediaQuery.matches);
        mediaQuery.onchange = e => handleChange(e.matches);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const $pane1: HTMLDivElement | null = document.querySelector(".Pane1");
            if (!$pane1) {
                return;
            }

            if (splitDirection === "horizontal") {
                $pane1.style.height = "50%";
            }

            if (splitDirection === "vertical") {
                $pane1.style.width = "50%";
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [splitDirection]);

    return (
        <Page>
            <Title>API Playground</Title>

            <div style={{ position: "relative", height: "calc(100vh - 160px)" }}>
                <SplitPane
                    onChange={size => {
                        setPrimaryPaneSize(size);
                        if (splitDirection !== "horizontal") {
                            return;
                        }
                        setBottomPanelHeight(`calc(100% - ${size}px)`);
                    }}
                    pane2Style={splitDirection === "horizontal" ? { height: bottomPanelHeight } : undefined}
                    split={splitDirection}
                    allowResize
                    resizerClassName={styles.Resizer}
                    minSize={50}
                    defaultSize="50%"
                >
                    <Editor
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore TODO: css property does not exist on Editor
                        css={{ width: "100% !important" }}
                        defaultLanguage="typescript"
                        onChange={setValue}
                        value={value}
                        options={monacoOptions}
                        key={splitDirection}
                        beforeMount={handleEditorBeforeMount}
                        onMount={handleEditorOnMount}
                        path="src/index.ts"
                    />
                    <div>
                        {/**<Button
                        zIndex="100"
                        position="absolute"
                        transform={splitDirection === "vertical" ? "translateX(-50%)" : undefined}
                        top={{ base: "-20px", md: "128px" }}
                        right={splitDirection === "vertical" ? undefined : 0}
                        mx={splitDirection === "vertical" ? undefined : "auto"}
                        left={0}
                        onClick={() => {
                            runCodeRef.current();
                        }}
                        bgColor={"#00bcd4"}
                        _hover={{
                            ...(loading && { backgroundColor: "orange.400" }),
                        }}
                        rounded="full"
                        w={{ base: "40px", md: "64px" }}
                        h={{ base: "40px", md: "64px" }}
                    >
                        {loading ? (
                            <Spinner w="32px" h="32px" />
                        ) : (
                            <Icon color="white" width="32px" height="32px" as={Play20Filled}></Icon>
                        )}
                        </Button>**/}
                        <OutputViewer
                            onClear={() => setOutputs([])}
                            outputs={outputs}
                            loading={loading}
                            primaryPaneSize={primaryPaneSize}
                        />
                    </div>
                </SplitPane>
            </div>
        </Page>
    );
};

export class SkypackSourceResolver implements SourceResolver {
    public async resolvePackageJson(
        packageName: string,
        version: string | undefined,
        subPath: string | undefined
    ): Promise<string | undefined> {
        return await this.resolveFile(
            `https://cdn.skypack.dev/${packageName}${version ? `@${version}` : ""}${
                subPath ? `/${subPath}` : ""
            }/package.json`
        );
    }

    public async resolveSourceFile(
        packageName: string,
        version: string | undefined,
        path: string
    ): Promise<string | undefined> {
        return await this.resolveFile(`https://cdn.skypack.dev/${packageName}${version ? `@${version}` : ""}/${path}`);
    }

    private async resolveFile(url: string) {
        const res = await fetch(url, { method: "GET" });

        if (res.ok) {
            return await res.text();
        } else if (res.status === 404) {
            return "";
        } else {
            throw Error(`Error other than 404 while fetching from Skypack at ${url}`);
        }
    }
}

const monacoOptions: editor.IEditorConstructionOptions = {
    minimap: { enabled: false },
    autoIndent: "advanced",
    formatOnPaste: true,
    formatOnType: true,
    padding: { top: 16 },
    fontSize: 14,
    scrollbar: { vertical: "visible" },
};

class SessionStorageCache implements SourceCache {
    public static PREFIX = "__autotyper_cache_";

    public async getFile(uri: string): Promise<string | undefined> {
        return sessionStorage.getItem(SessionStorageCache.PREFIX + uri) ?? undefined;
    }

    public async storeFile(uri: string, content: string): Promise<void> {
        sessionStorage.setItem(SessionStorageCache.PREFIX + uri, content);
    }

    public async clear(): Promise<void> {
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(SessionStorageCache.PREFIX)) {
                sessionStorage.removeItem(key);
            }
        }
    }
}

const actionGlobals = `import { D2Api } from "@eyeseetea/d2-api";\ndeclare const api: D2Api;`;
