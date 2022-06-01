import { D2Api } from "@eyeseetea/d2-api/2.36";

export * from "@eyeseetea/d2-api/2.36";

export function getD2APiFromInstance(instance: { url: string; username?: string; password?: string }) {
    const auth =
        instance.username && instance.password
            ? { username: instance.username, password: instance.password }
            : undefined;

    return new D2Api({ baseUrl: instance.url, backend: "fetch", auth });
}
