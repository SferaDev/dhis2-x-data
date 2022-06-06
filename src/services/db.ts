import Dexie from "dexie";

export class Database extends Dexie {
    list!: Dexie.Table<ListItem, string>;
    metadataExport!: Dexie.Table<MetadataExport, string>;

    constructor() {
        super("Database");

        this.version(1).stores({
            list: "id, type, name",
            metadataExport: "id",
        });
    }
}

export interface ListItem {
    id: string;
    type: string;
    name: string;
}

export interface MetadataExport {
    id: string;
    selection: string[];
    dependencies: string[];
}
