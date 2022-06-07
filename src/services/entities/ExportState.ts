import { SharedObject } from "./SharedObject";

export interface ExportState {
    baseElements: string[];
    dependencies: string[];
    sharings: SharedObject;
    replaceExistingSharings: boolean;
}
