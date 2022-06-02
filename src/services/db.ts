import Dexie from "dexie";

export class Database extends Dexie {
    list!: Dexie.Table<ListItem, string>; // number = type of the primkey

    constructor() {
        super("Database");

        this.version(1).stores({
            list: "id, type, name",
        });
    }
}

export interface ListItem {
    id: string;
    type: string;
    name: string;
}
