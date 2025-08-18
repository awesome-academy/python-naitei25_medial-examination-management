import PageMeta from "../../components/common/PageMeta";
import AddButton from "../../components/ui/button/AddButton";
import DepartmentCards from "./DepartmentCards";
import { useNavigate } from "react-router-dom";

function Department() {
  const navigate = useNavigate();

  const handleAddDepartment = () => {
    navigate("/admin/departments/add");
  };
  return (
    <div>
      <PageMeta
        title="Danh sách khoa | Bệnh viện Đa khoa Wecare"
        description="Danh sách khoa phòng của bệnh viện"
      />
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Quản lý phòng ban
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="col-span-12 xl:col-span-7">
          <DepartmentCards />
        </div>
        <div className="fixed right-5 bottom-5">
          <AddButton onClick={handleAddDepartment} />
        </div>
      </div>
    </div>
  );
}

export default Department