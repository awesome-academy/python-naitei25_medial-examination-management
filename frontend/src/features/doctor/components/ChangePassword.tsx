import { useEffect } from "react"
import { Form, Input, Button } from "antd"
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons"
import { usePasswordChange } from "../../hooks/usePasswordChange"

const ChangePassword = () => {
  const { loading, error, success, handleSubmit, resetState } = usePasswordChange()
  const [form] = Form.useForm()

  useEffect(() => {
    resetState()
  }, [resetState])

  const onFinish = async (values: any) => {
    await handleSubmit({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })

    if (!error) {
      form.resetFields()
    }
  }

  return (
    <div className="bg-white w-full px-5 py-3 rounded-2xl">
      <h2 className="text-xl font-semibold mb-6">Đổi mật khẩu</h2>

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">Mật khẩu đã được thay đổi thành công!</div>
      )}

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="currentPassword"
          label="Mật khẩu hiện tại"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu hiện tại!" },
            { min: 1, message: "Mật khẩu không được để trống!" },
          ]}
        >
          <Input.Password
            placeholder="Nhập mật khẩu hiện tại"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu mới!" },
            { min: 1, message: "Mật khẩu mới không được để trống!" },
          ]}
        >
          <Input.Password
            placeholder="Nhập mật khẩu mới"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"))
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="Nhập lại mật khẩu mới"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item className="flex justify-end">
          <Button type="primary" htmlType="submit" loading={loading}>
            Đổi mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default ChangePassword
