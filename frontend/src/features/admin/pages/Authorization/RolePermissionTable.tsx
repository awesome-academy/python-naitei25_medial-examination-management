import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import Badge from "../../components/ui/badge/Badge";
import Pagination from "../../components/common/Pagination";
import { useState, useEffect } from "react";
import SearchInput from "../../components/common/SearchInput";
import { Shield, Trash2 } from "lucide-react";
import type { Permission, Role } from "../../services/authorizationService";
import { permissionsData, roleService } from "../../services/authorizationService";

// Using Role type from authorizationService





const PAGE_SIZE = 10;

export default function RolePermissionTable() {


  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);

  useEffect(() => {
    const fetchRolesWithUserCount = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Lấy danh sách role từ backend
        const res = await roleService.getRoles({
          page: currentPage,
          limit: PAGE_SIZE,
          search: searchTerm || undefined,
        });
        // Lấy tất cả user từ backend (không phân trang, chỉ lấy để đếm)
        const userRes = await import("../../services/authorizationService").then(m => m.userService.getUsers({ limit: 1000 }));
        const users = userRes.users;
        // Map tên role hiển thị sang role backend
        const nameToRole = {
          "Quản trị viên": "ADMIN",
          "Bác sĩ": "DOCTOR",
          "Lễ tân": "RECEPTIONIST",
          "Bệnh nhân": "PATIENT",
        };
        // Gán lại userCount cho từng role dựa trên dữ liệu thật
        const rolesWithUserCount = res.roles.map((role) => {
          const backendRole = nameToRole[role.name as keyof typeof nameToRole];
          const userCount = users.filter((u) => u.role === backendRole).length;
          return { ...role, userCount };
        });
        setRoles(rolesWithUserCount);
        setTotalItems(res.total);
        setTotalPages(res.totalPages);
      } catch (err: any) {
        setError(err.message || "Không thể tải dữ liệu vai trò");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRolesWithUserCount();
  }, [currentPage, searchTerm]);

  const handleStartEditingPermissions = () => {
    if (selectedRole) {
      setEditingPermissions([...selectedRole.permissions]);
      setIsEditingPermissions(true);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    setEditingPermissions((current) => {
      if (current.includes(permissionId)) {
        return current.filter((id) => id !== permissionId);
      } else {
        return [...current, permissionId];
      }
    });
  };

  const handleSavePermissions = () => {
    // TODO: Call API to update permissions for the selected role
    setIsEditingPermissions(false);
  };

  const handleCancelEditingPermissions = () => {
    setIsEditingPermissions(false);
    setEditingPermissions([]);
  };

  const filteredData = roles;
  const paginatedData = filteredData;

  const getPermissionsByCategory = (permissions: string[]) => {
    const categories: { [key: string]: Permission[] } = {};
    permissions.forEach((permId) => {
      const permission = permissionsData.find((p) => p.id === permId);
      if (permission) {
        if (!categories[permission.category]) {
          categories[permission.category] = [];
        }
        categories[permission.category].push(permission);
      }
    });
    return categories;
  };

  const handleViewPermissions = (role: Role) => {
    setSelectedRole(role);
    setShowPermissionModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-t-base-600 border-base-200 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400">
            Đang tải dữ liệu vai trò...
          </p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-red-100 p-3">
          <svg
            className="size-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-gray-900 font-medium dark:text-white">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Roles Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex justify-start items-center pt-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Quản lý vai trò
            </h2>
            <span className="ml-5 text-sm bg-base-600/20 text-base-600 py-1 px-4 rounded-full font-bold">
              {totalItems} vai trò
            </span>
          </div>
        </div>
        {/* Search */}
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            <SearchInput
              placeholder="Tìm kiếm vai trò..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">Tên vai trò</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">Mô tả</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">Số người dùng</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">Số quyền</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">Cập nhật cuối</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paginatedData.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{role.name}</p>
                        <p className="text-gray-500 text-theme-xs dark:text-gray-400">{role.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 max-w-xs">
                    <div className="truncate" title={role.description}>{role.description}</div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color="base">{role.userCount} người</Badge>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{role.permissions.length} quyền</TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{role.updatedAt}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewPermissions(role)}
                        className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
                        title="Xem quyền"
                      >
                        <Shield size={14} />
                        Phân quyền
                      </button>
                      
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
      {/* Permission Modal */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-10  overflow-hidden">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">Quyền của vai trò: {selectedRole.name}</h3>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-slate-50 rounded-full dark:text-gray-400 dark:hover:text-gray-200 p-2"
                title="Đóng"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(getPermissionsByCategory(isEditingPermissions ? editingPermissions : selectedRole.permissions)).map(([category]) => (
                <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 dark:text-white/90 mb-3">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {permissionsData.filter((p) => p.category === category).map((permission) => (
                      <div
                        key={permission.id}
                        className={`flex items-center gap-2 p-2 rounded-md ${isEditingPermissions ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : editingPermissions.includes(permission.id) ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-800"}`}
                        onClick={() => {
                          if (isEditingPermissions) {
                            handleTogglePermission(permission.id);
                          }
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full ${(isEditingPermissions ? editingPermissions : selectedRole.permissions).includes(permission.id) ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{permission.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              {isEditingPermissions ? (
                <>
                  <button
                    onClick={handleCancelEditingPermissions}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    className="px-4 py-2 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-base-700"
                  >
                    Lưu thay đổi
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowPermissionModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleStartEditingPermissions}
                    className="px-4 py-2 text-sm font-medium text-white bg-base-600 rounded-lg hover:bg-base-700"
                  >
                    Chỉnh sửa quyền
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
