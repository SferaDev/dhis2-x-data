import { useQuery } from "react-query";
import { useAppContext } from "../hooks/useAppContext";

export function useGetRoots() {
    const { api } = useAppContext();

    return useQuery("org-unit-roots", async () => {
        const { objects } = await api.models.organisationUnits
            .get({ filter: { level: { eq: "1" } }, fields: { id: true, name: true, path: true } })
            .getData();

        return objects;
    });
}
