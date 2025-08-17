"use client"

import React, { useRef } from "react"
import { Button, message } from "antd"
import { DownloadOutlined, PrinterOutlined } from "@ant-design/icons"
import type { Prescription } from "../../types/prescription"
import type { PatientInfo } from "../../types/patient"

// Import html2pdf from CDN (loaded in HTML head)
declare global {
  interface Window {
    html2pdf: any
  }
}

interface PrescriptionPDFProps {
  prescription: Prescription
  patientName?: string
  patientInfo?: PatientInfo
  showControls?: boolean
  className?: string
}

export const PrescriptionPDF: React.FC<PrescriptionPDFProps> = ({
  prescription,
  patientName,
  patientInfo,
  showControls = true,
  className = "",
}) => {
  const prescriptionRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)

  const hospitalData = {
    name: "PHÒNG KHÁM ĐA KHOA QUỐC TẾ WECARE",
    address: "Số 1 Hàn Thuyên - Phường Linh Trung - Tp. Thủ Đức - Tp. Hồ Chí Minh",
    phone: "028 4567896",
    website: "www.wecarehospital.com.vn",
    email: "wecare@hospital.com.vn",
  }

  // Load html2pdf with better error handling
  const loadHtml2Pdf = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        resolve(window.html2pdf)
        return
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="html2pdf"]')
      if (existingScript) {
        // Wait for existing script to load
        const checkInterval = setInterval(() => {
          if (window.html2pdf) {
            clearInterval(checkInterval)
            resolve(window.html2pdf)
          }
        }, 100)
        
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error("Timeout loading html2pdf"))
        }, 10000)
        return
      }

      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
      script.crossOrigin = "anonymous"
      
      script.onload = () => {
        // Wait a bit for the library to initialize
        setTimeout(() => {
          if (window.html2pdf) {
            resolve(window.html2pdf)
          } else {
            reject(new Error("html2pdf not available after loading"))
          }
        }, 100)
      }
      
      script.onerror = (error) => {
        console.error("Script loading error:", error)
        reject(new Error("Failed to load html2pdf script"))
      }
      
      document.head.appendChild(script)
    })
  }

  // Generate PDF with improved error handling
  const generatePDF = async () => {
    if (!prescriptionRef.current) {
      message.error("Không tìm thấy nội dung đơn thuốc")
      return
    }

    setIsGenerating(true)
    try {
      const html2pdf = await loadHtml2Pdf()

      const options = {
        margin: [10, 10, 10, 10],
        filename: `Don_Thuoc_${patientName?.replace(/\s+/g, "_") || "Patient"}_${new Date().toISOString().split("T")[0]}.pdf`,
        image: { 
          type: "jpeg", 
          quality: 0.98 
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: true,
          logging: false,
          width: prescriptionRef.current.scrollWidth,
          height: prescriptionRef.current.scrollHeight,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          compress: true,
        },
      }

      // Clone the element to avoid CSS conflicts
      const element = prescriptionRef.current.cloneNode(true) as HTMLElement
      
      await html2pdf()
        .set(options)
        .from(element)
        .save()
        
      message.success("Tải PDF thành công!")
      
    } catch (error) {
      console.error("Error generating PDF:", error)
      message.error("Có lỗi khi tạo PDF. Vui lòng thử lại.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Print with fallback to browser print
  const printPrescription = async () => {
    if (!prescriptionRef.current) {
      message.error("Không tìm thấy nội dung đơn thuốc")
      return
    }

    setIsGenerating(true)
    try {
      // Try html2pdf first
      try {
        const html2pdf = await loadHtml2Pdf()

        const options = {
          margin: [10, 10, 10, 10],
          image: { 
            type: "jpeg", 
            quality: 0.98 
          },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            allowTaint: true,
            logging: false,
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
          },
        }

        const element = prescriptionRef.current.cloneNode(true) as HTMLElement
        const pdf = await html2pdf()
          .set(options)
          .from(element)
          .outputPdf('arraybuffer')

        const blob = new Blob([pdf], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)

        const printWindow = window.open(url, "_blank")
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print()
              URL.revokeObjectURL(url)
            }, 1000)
          }
          
          // Cleanup after 30 seconds
          setTimeout(() => {
            URL.revokeObjectURL(url)
          }, 30000)
        } else {
          URL.revokeObjectURL(url)
          throw new Error("Popup blocked")
        }
      } catch (pdfError) {
        console.warn("PDF print failed, falling back to browser print:", pdfError)
        // Fallback to browser print
        fallbackPrint()
      }
      
    } catch (error) {
      console.error("Error printing:", error)
      message.error("Có lỗi khi in. Vui lòng thử lại.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Fallback print using browser's native print
  const fallbackPrint = () => {
    if (!prescriptionRef.current) return

    const printContent = prescriptionRef.current.innerHTML
    const originalContent = document.body.innerHTML

    // Create print styles
    const printStyles = `
      <style>
        @media print {
          body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          .no-print { display: none !important; }
          @page { margin: 10mm; size: A4; }
        }
      </style>
    `

    document.body.innerHTML = printStyles + '<div>' + printContent + '</div>'
    window.print()
    document.body.innerHTML = originalContent
    window.location.reload() // Reload to restore React state
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN")
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("vi-VN")
    } catch {
      return dateString
    }
  }

  return (
    <div className={className}>
      {/* Control Panel */}
      {showControls && (
        <div className="mb-4 flex justify-end gap-2 no-print">
          <Button 
            icon={<DownloadOutlined />} 
            onClick={generatePDF} 
            loading={isGenerating} 
            type="primary"
            disabled={!prescription}
          >
            Tải PDF
          </Button>
          <Button 
            icon={<PrinterOutlined />} 
            onClick={printPrescription} 
            loading={isGenerating}
            disabled={!prescription}
          >
            In
          </Button>
        </div>
      )}

      {/* Prescription Content */}
      <div 
        ref={prescriptionRef} 
        className="bg-white p-8" 
        style={{ 
          fontFamily: "Times New Roman, serif",
          minHeight: "297mm", // A4 height
          width: "210mm", // A4 width
          margin: "0 auto",
          boxSizing: "border-box"
        }}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black">
          {/* Hospital Logo */}
          <div className="w-16 h-16 bg-blue-50 border-2 border-blue-600 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">
            <span className="text-blue-600 font-black">We</span>
            <span className="text-black font-black">Care</span>
          </div>

          {/* Hospital Info */}
          <div className="flex-1 mx-4">
            <h1 className="font-bold text-base mb-1">{hospitalData.name}</h1>
            <div className="text-sm leading-relaxed">
              <p>{hospitalData.address}</p>
              <p>
                ĐT: {hospitalData.phone}, Website: {hospitalData.website}
              </p>
              <p>Email: {hospitalData.email}</p>
            </div>
          </div>

          {/* QR Code and Number */}
          <div className="text-right">
            <div className="w-12 h-12 bg-gray-200 border border-gray-400 flex items-center justify-center text-xs">
              QR
            </div>
            <div className="text-sm mt-1">
              <div className="font-bold">Số hồ sơ:</div>
              <div className="font-bold">{prescription?.id || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Prescription Title */}
        <h2 className="text-center text-2xl font-bold mb-6 tracking-widest">ĐƠN THUỐC</h2>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left Column - Department Info */}
          <div className="w-48 border border-black p-3 bg-gray-50">
            <h3 className="font-bold text-sm text-center mb-3 leading-tight">Bệnh viện đa khoa quốc tế WeCare</h3>

            <div className="text-sm mb-4">
              <p className="mb-2">
                Bệnh viện đa khoa quốc tế WeCare là cơ sở y tế hiện đại, luôn đặt chất lượng khám chữa bệnh và sự hài lòng của người bệnh lên hàng đầu.
              </p>
              <p className="mb-2">
                Đội ngũ bác sĩ tại WeCare giàu kinh nghiệm, tận tâm và được đào tạo bài bản, sẵn sàng đồng hành cùng người bệnh trong quá trình chăm sóc sức khỏe.
              </p>
            </div>

            <div className="text-sm">
              <h4 className="font-bold mb-2">Dịch vụ chính</h4>
              <ul className="list-disc pl-4 mb-2">
                <li>Khám và điều trị các bệnh lý nội – ngoại khoa</li>
                <li>Chăm sóc sức khỏe toàn diện</li>
                <li>Tư vấn và theo dõi điều trị lâu dài</li>
                <li>Ứng dụng công nghệ vào y tế hiện đại</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Patient Info and Prescription */}
          <div className="flex-1">
            {/* Patient Information */}
            <div className="grid grid-cols-2 gap-6 mb-2">
              <div className="space-y-2">
                <div className="flex text-sm">
                  <span className="font-bold mr-2">Họ và tên:</span>
                  <span>{patientInfo?.fullName || patientName || "Không xác định"}</span>
                </div>
                <div className="flex text-sm">
                  <span className="font-bold mr-2">Mã bệnh nhân:</span>
                  <span>{prescription?.patientId || patientInfo?.patientId || "N/A"}</span>
                </div>
                <div className="flex text-sm">
                  <span className="font-bold mr-2">Địa chỉ:</span>
                  <span>{patientInfo?.address || "Không xác định"}</span>
                </div>
                <div className="flex text-sm">
                  <span className="font-bold mr-2">Thẻ BHYT:</span>
                  <span>{patientInfo?.insuranceNumber || "Không xác định"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex text-sm">
                  <span className="font-bold w-20">Giới tính:</span>
                  <span>{patientInfo?.gender === "F" ? "Nữ" : patientInfo?.gender === "M" ? "Nam" : "Không xác định"}</span>
                </div>
                <div className="flex text-sm">
                  <span className="font-bold w-20">Ngày sinh:</span>
                  <span>{patientInfo?.birthday ? patientInfo.birthday.split('-').reverse().join('/') : "Không xác định"}</span>
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="mb-5 text-sm">
              <span className="font-bold">Sinh hiệu:</span> 
              Tần số tim: {prescription?.heartRate || "N/A"} L/ph, 
              Huyết áp: {prescription?.systolicBloodPressure || "N/A"}/{prescription?.diastolicBloodPressure || "N/A"} mmHg, 
              Đường huyết: {prescription?.bloodSugar || "N/A"} mg/dL
            </div>

            {/* Diagnosis */}
            <div className="mb-6 text-sm">
              <span className="font-bold">Chẩn đoán:</span>
              <span>{(prescription?.diagnosis || "Không xác định").toUpperCase()}</span>
            </div>

            {/* Medications */}
            <div className="mb-8 space-y-4">
              {prescription?.prescriptionDetails?.map((detail, index) => (
                <div key={detail.detailId || index} className="text-sm">
                  <div className="flex justify-between items-start font-bold mb-1">
                    <span className="flex-1">
                      <span className="inline-block w-6">{index + 1}.</span>
                      {detail.medicine?.medicine_name || "Thuốc không xác định"}
                    </span>
                    <span className="ml-4">
                      {detail.quantity || 0} {detail.medicine?.unit || ""}
                    </span>
                  </div>
                  <div className="ml-6 text-gray-700">
                    {detail.frequency || ""}, {detail.duration || ""} ngày
                  </div>
                </div>
              )) || <div className="text-sm text-gray-500">Không có thuốc được kê đơn</div>}
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="mt-8 text-sm space-y-3" style={{ marginLeft: "220px" }}>
          <div>
            <span className="font-bold">Lời dặn:</span> {prescription?.note || "Không có"}
          </div>
          <div>
            <span className="font-bold">Tái khám:</span>
            {prescription?.followUpDate ? ` vào ngày ${formatDate(prescription.followUpDate)}` : " Không"}
          </div>
          <div className="leading-relaxed">
            Người bệnh đăng ký tái khám TRƯỚC ngày khám qua ứng dụng WeCare hoặc đăng ký tái khám tại các quầy Đăng ký khám bệnh
          </div>
        </div>

        {/* Signature Section */}
        <div className="flex justify-end mt-12">
          <div className="text-center text-sm">
            <div className="w-40 h-12 border-b border-black mb-2 relative bg-gray-50">
              <span className="absolute right-2 bottom-1 italic text-gray-500 text-sm">Signature ✓</span>
            </div>
            <div className="font-bold">Bác sĩ khám bệnh</div>
            <div className="mt-1">Ngày ký: {formatDateTime(prescription?.createdAt || new Date().toISOString())}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-black">
          <div className="text-sm text-center mb-3">
            *Đơn thuốc dùng một lần. Khi cần hỗ trợ, xin vui lòng liên hệ số điện thoại: {hospitalData.phone}.
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex-1">
              <p>Cài đặt ứng dụng WeCare (quét mã QR)</p>
              <p>để đăng ký khám bệnh, thanh toán viện phí và xem Hồ sơ sức khỏe.</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 border border-gray-400 flex items-center justify-center text-xs">
              QR
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}