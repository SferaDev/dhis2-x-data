// @ts-ignore
import { DataTable, DataTableCell, DataTableColumnHeader, DataTableRow, TableBody, TableHead } from "@dhis2/ui";
import { TableInstance } from "@tanstack/react-table";

export interface TableProps<RowType extends Record<string, unknown>> {
    table: TableInstance<RowType>;
}

export const Table: React.FC<TableProps<any>> = ({ table }) => {
    return (
        <DataTable loading={false}>
            <TableHead>
                {table.getHeaderGroups().map(headerGroup => (
                    <DataTableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <DataTableColumnHeader key={header.id} colSpan={`${header.colSpan}`}>
                                {header.isPlaceholder ? null : header.renderHeader()}
                            </DataTableColumnHeader>
                        ))}
                    </DataTableRow>
                ))}
            </TableHead>
            <TableBody>
                {table.getRowModel().rows.map(row => (
                    <DataTableRow key={row.id}>
                        {row.getVisibleCells().map(cell => (
                            <DataTableCell key={cell.id}>{cell.renderCell()}</DataTableCell>
                        ))}
                    </DataTableRow>
                ))}
            </TableBody>
        </DataTable>
    );
};
