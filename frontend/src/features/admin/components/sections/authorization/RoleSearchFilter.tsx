import SearchInput from "../../common/SearchInput";

interface RoleSearchFilterProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    t: (key: string) => string;
}

export default function RoleSearchFilter({ searchTerm, onSearchChange, t }: RoleSearchFilterProps) {
    return (
        <div className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                <SearchInput
                    placeholder={t("authorization.searchRoles")}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    );
}
