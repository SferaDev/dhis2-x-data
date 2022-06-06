import { buildClient, BaseClientOptions, XataRecord } from "@xata.io/client";

export interface Metadatum {
    name?: string | null;
    description?: string | null;
    downloads?: number | null;
    owner?: UserRecord | null;
    data?: string | null;
}

export type MetadatumRecord = Metadatum & XataRecord;

export interface User {
    name?: string | null;
    email?: string | null;
    instance?: string | null;
}

export type UserRecord = User & XataRecord;

export type DatabaseSchema = {
    metadata: Metadatum;
    users: User;
};

const links = { metadata: [["owner", "users"]], users: [] };

const tables = ["metadata", "users"];

const DatabaseClient = buildClient();

export class XataClient extends DatabaseClient<DatabaseSchema> {
    constructor(options?: BaseClientOptions) {
        super({ databaseURL: "https://dhis-ec2444.xata.sh/db/x-data", ...options }, links);
    }
}
