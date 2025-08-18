import { TableCell, TableHeader, TableRow } from "../../ui/table";

interface RoleTableHeaderProps {
    t: (key: string) => string;
}

export default function RoleTableHeader({ t }: RoleTableHeaderProps) {
    return (
        <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {t("authorization.roleName")}
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {t("authorization.roleDescription")}
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {t("authorization.userCount")}
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {t("authorization.permissionCount")}
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {t("authorization.lastUpdated")}
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {t("authorization.actions")}
                </TableCell>
            </TableRow>
        </TableHeader>
    );
}
