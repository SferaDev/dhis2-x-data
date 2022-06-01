declare module "worker-loader!*" {
    class WebpackWorker<Input, Output> extends Omit<Worker, "postMessage" | "onmessage"> {
        constructor();

        postMessage: (data: Input) => void;
        onmessage: ((this: Worker, ev: MessageEvent<Output>) => void) | null;
    }

    export default WebpackWorker;
}
