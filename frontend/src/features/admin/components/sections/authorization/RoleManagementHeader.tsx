
interface RoleManagementHeaderProps {
    totalItems: number;
    t: (key: string) => string;
}

export default function RoleManagementHeader({ totalItems, t }: RoleManagementHeaderProps) {
    return (
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex justify-start items-center pt-5">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {t("authorization.roleManagement")}
                </h2>
                <span className="ml-5 text-sm bg-base-600/20 text-base-600 py-1 px-4 rounded-full font-bold">
                    {totalItems} {t("authorization.totalRoles")}
                </span>
            </div>
        </div>
    );
}