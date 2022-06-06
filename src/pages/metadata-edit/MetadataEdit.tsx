import MaterialTable from "@material-table/core";
import { useEffect, useState } from "react";
import { Page, Title } from "../../components/page/Page";
import { useAppContext } from "../../hooks/useAppContext";

export const MetadataEdit = () => {
    const { api } = useAppContext();
    const [columns, setColumns] = useState<any>([]);

    useEffect(() => {
        const { properties } = api.models["organisationUnits"].schema;
        const columns = properties.map(property => ({
            title: property.name,
            field: property.name,
            render: (rowData: any) => <p>{JSON.stringify(rowData[property.name])}</p>,
        }));
        console.log(columns[0]);

        setColumns(columns);
    }, []);

    return (
        <Page>
            <Title>Metadata edit</Title>

            <MaterialTable
                title={""}
                data={async query => {
                    const { objects, pager } = await api.models["organisationUnits"]
                        .get({
                            fields: { $owner: true },
                            filter: { $identifiable: { ilike: query.search } },
                            pageSize: query.pageSize,
                            page: query.page,
                            order: query.orderBy ? `${query.orderBy.field}:${query.orderDirection}` : undefined,
                        })
                        .getData();

                    return { data: objects, page: pager.page, totalCount: pager.total };
                }}
                options={{
                    pageSize: 10,
                    pageSizeOptions: [10, 20, 50, 100],
                    showTextRowsSelected: false,
                }}
                columns={columns}
            />
        </Page>
    );
};
