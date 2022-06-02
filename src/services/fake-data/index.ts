import { D2OrganisationUnit } from "@eyeseetea/d2-api/2.36";
import { faker } from "@faker-js/faker";
import _ from "lodash";
import { generateUid } from "./uid";

type OrgUnit = Pick<D2OrganisationUnit, "id" | "name" | "shortName" | "openingDate"> & { parent?: { id: string } };

function getAddressType(exclude: string[] = [], retry = 0): string {
    const addressType = ["city", "cityName", "country", "county", "state"] as const;
    const type = addressType[Math.floor(Math.random() * addressType.length)] ?? "city";
    const name = faker.address[type]();

    if (!exclude.includes(name) || retry > 10) return name;
    return getAddressType(exclude, retry + 1);
}

export function fakeOrgUnits(size: number, maxLevel: number, parent?: string) {
    const rootName = getAddressType();
    const root = {
        id: generateUid(),
        name: rootName,
        shortName: rootName.substring(0, 35),
        openingDate: "1970-01-01T00:00:00.000",
        parent: parent ? { id: parent } : undefined,
    };

    const orgUnits: OrgUnit[][] = [[root]];

    for (let i = 1; i < size; i++) {
        const level = Math.floor(Math.random() * maxLevel) + 1;
        const parentLevelOrgUnits = orgUnits[level - 1] ?? [root];
        const { id: parentId } = parentLevelOrgUnits[Math.floor(Math.random() * parentLevelOrgUnits.length)] ?? root;
        const name = getAddressType(parentLevelOrgUnits.map(({ name }) => name));

        orgUnits[level] = [
            ...(orgUnits[level] ?? []),
            {
                id: generateUid(),
                name,
                shortName: name.substring(0, 35),
                parent: { id: parentId },
                openingDate: "1970-01-01T00:00:00.000",
            },
        ];
    }

    return _.flatten(orgUnits);
}
