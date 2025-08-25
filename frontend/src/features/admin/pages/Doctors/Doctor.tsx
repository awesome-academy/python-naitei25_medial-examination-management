import PageMeta from "../../components/common/PageMeta";
import DoctorTable from "../../components/sections/doctor/DoctorTable";
import AddButton from "../../components/ui/button/AddButton";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Doctor() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleAddDoctor = () => {
    navigate("/admin/doctors/add");
  };

  return (
    <div>
      <PageMeta
        title={t("doctors.title")}
        description={t("doctors.pageDescription")}
      />
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          {t("doctors.title")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="col-span-12 xl:col-span-7">
          <DoctorTable />
        </div>
        <div className="fixed right-5 bottom-5">
          <AddButton onClick={handleAddDoctor} />
        </div>
      </div>
    </div>
  );
}
