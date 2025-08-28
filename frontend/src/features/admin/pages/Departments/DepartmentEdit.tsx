import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  message,
  Spin,
  Row,
  Col,
} from "antd";
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import { departmentService } from "../../services/departmentService";
import { doctorService } from "../../services/doctorService";
import type { DepartmentFromAPI } from "../../types/department";
import type { Doctor } from "../../types/doctor";

const { TextArea } = Input;
const { Option } = Select;

interface DepartmentEditForm {
  departmentName: string;
  description: string;
  phoneNumber?: string;
  email?: string;
  headDoctorId?: number;
}

const DepartmentEdit: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [department, setDepartment] = useState<DepartmentFromAPI | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Helper function to extract numeric ID from formatted ID
  const extractDepartmentId = (formattedId: string): number => {
    const match = formattedId.match(/\d+$/);
    return match ? parseInt(match[0]) : parseInt(formattedId);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          message.error("ID khoa không hợp lệ");
          navigate("/admin/departments");
          return;
        }

        const numericId = extractDepartmentId(id);

        // Fetch department details
        const departmentData = await departmentService.getDepartmentById(numericId);
        setDepartment(departmentData);

        // Fetch doctors in this department
        try {
          const doctorsData = await departmentService.getDoctorsByDepartmentId(numericId);
          setDoctors(doctorsData as Doctor[]);
        } catch (error) {
          console.error("Error fetching doctors:", error);
          setDoctors([]);
        }

        // Set form values
        form.setFieldsValue({
          departmentName: departmentData.department_name,
          description: departmentData.description,
          phoneNumber: departmentData.phoneNumber || "",
          email: departmentData.email || "",
          headDoctorId: departmentData.head_doctor_id || undefined,
        });

      } catch (error) {
        console.error("Error fetching department data:", error);
        message.error("Có lỗi xảy ra khi tải thông tin khoa");
        navigate("/admin/departments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, form, navigate]);

  // Handle head doctor selection to fetch doctor details and populate email/phone
  const handleHeadDoctorChange = async (doctorId: number) => {
    if (!doctorId) {
      // Clear fields when no doctor is selected
      form.setFieldsValue({
        email: "",
        phoneNumber: "",
      });
      return;
    }

    try {
      // Fetch doctor details using the API endpoint /api/v1/doctors/{id}/
      const response = await fetch(`http://127.0.0.1:8000/api/v1/doctors/${doctorId}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const doctorData = await response.json();
      
      // Update form fields with doctor's contact information from User model
      form.setFieldsValue({
        email: doctorData.user?.email || "",
        phoneNumber: doctorData.user?.phone || "",
      });
      
    } catch (error) {
      console.error("Error fetching doctor details:", error);
      message.warning("Không thể tải thông tin liên hệ của bác sĩ");
    }
  };

  const handleSubmit = async (values: DepartmentEditForm) => {
    try {
      setSaving(true);
      
      const numericId = extractDepartmentId(id!);
      
      const updateData = {
        department_name: values.departmentName,
        description: values.description,
        phone_number: values.phoneNumber || null,
        email: values.email || null,
        head_doctor_id: values.headDoctorId || null,
      };

      await departmentService.updateDepartment(numericId, updateData);
      message.success("Cập nhật thông tin khoa thành công!");
      navigate(`/admin/departments/${id}`);
      
    } catch (error) {
      console.error("Error updating department:", error);
      message.error("Có lỗi xảy ra khi cập nhật thông tin khoa");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {t("department.notFound")}
        </h3>
        <Button
          onClick={() => navigate("/admin/departments")}
          type="primary"
        >
          {t("common.back")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={t("department.edit.seo.title", {
          name: department.department_name ?? t("department.unnamed"),
          site: t("seo.siteName")
        })}
        description={t("department.edit.seo.description", {
          name: department.department_name ?? t("department.unnamed")
        })}
      />

      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/admin/departments/${id}`)}
              className="mr-4"
            >
              {t("common.back")}
            </Button>
            <h2 className="text-xl font-semibold">
              {t("department.edit.title", {
                name: department.department_name ?? t("department.unnamed")
              })}
            </h2>
          </div>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="max-w-4xl"
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="departmentName"
                  label={t("department.name")}
                  rules={[
                    { required: true, message: t("common.required") },
                    { min: 2, message: t("common.min2") },
                  ]}
                >
                  <Input placeholder={t("department.namePlaceholder")} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="headDoctorId"
                  label={t("department.headDoctor")}
                >
                  <Select
                    placeholder={t("department.headDoctorPlaceholder")}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    onChange={handleHeadDoctorChange}
                    filterOption={(input, option) =>
                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {doctors.map((doctor: any) => (
                      <Option key={doctor.id || doctor.doctorId} value={doctor.id || doctor.doctorId}>
                        {doctor.fullName || 
                         (doctor.first_name && doctor.last_name 
                           ? `${doctor.first_name} ${doctor.last_name}`
                           : doctor.name || `Bác sĩ ${doctor.id || doctor.doctorId}`)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t("department.phoneNumber")}
                  name="phoneNumber"
                  rules={[
                    {
                      pattern: /^[0-9+\-\s()]+$/,
                      message: t("common.phoneNumberInvalid"),
                    },
                  ]}
                >
                  <Input placeholder={t("common.phoneNumberPlaceholder")} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={t("department.email")}
                  name="email"
                  rules={[
                    {
                      type: "email",
                      message: t("common.emailInvalid"),
                    },
                  ]}
                >
                  <Input placeholder={t("common.emailPlaceholder")} />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label= {t("department.description")}
                  name="description"
                  rules={[
                    { required: true, message: t("common.required") },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder={t("department.descriptionPlaceholder")}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => navigate(`/admin/departments/${id}`)}
                disabled={saving}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                {t("common.save")}
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </>
  );
};

export default DepartmentEdit;
