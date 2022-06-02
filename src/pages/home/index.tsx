// @ts-ignore
import { Checkbox } from "@dhis2/ui";
import { createTable, getCoreRowModel, useTableInstance } from "@tanstack/react-table";
import * as React from "react";
import { ChangeEvent } from "react";
import { Table } from "../../components/table/Table";
import { useLiveQuery } from "dexie-react-hooks";
import { Database, ListItem } from "../../services/db";

const metadata = createTable().setRowType<ListItem>();
const dependencies = createTable().setRowType<ListItem>();

const db = new Database();

const columns = [
    metadata.createDisplayColumn({
        id: "select",
        header: ({ instance }) => (
            <Checkbox
                checked={instance.getIsAllRowsSelected()}
                indeterminate={instance.getIsSomeRowsSelected()}
                onChange={(data: { value?: string; name?: string; checked: boolean }, event: ChangeEvent) =>
                    instance.getToggleAllRowsSelectedHandler()(event)
                }
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                indeterminate={row.getIsSomeSelected()}
                onChange={(data: { value?: string; name?: string; checked: boolean }, event: ChangeEvent) =>
                    row.getToggleSelectedHandler()(event)
                }
            />
        ),
    }),
    metadata.createDataColumn(row => row.id, {
        id: "id",
        cell: info => info.getValue(),
        header: () => <span>Identifier</span>,
    }),
    metadata.createDataColumn(row => row.type, {
        id: "type",
        cell: info => info.getValue(),
        header: () => <span>Type</span>,
    }),
    metadata.createDataColumn(row => row.name, {
        id: "name",
        cell: info => info.getValue(),
        header: () => <span>Name</span>,
    }),
];

export const Home = () => {
    const friends = useLiveQuery(() => db.list.toArray());

    const metadataTable = useTableInstance(metadata, {
        data: friends ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const dependenciesTable = useTableInstance(dependencies, {
        data: friends ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div style={{ display: "flex", gap: 20 }}>
            <Table table={metadataTable} />

            <Table table={dependenciesTable} />
        </div>
    );
};
