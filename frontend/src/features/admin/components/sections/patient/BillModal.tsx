import { Modal } from "../../ui/modal";
import InfoField from "../../form/InfoField";
import { Bill, BillDetail } from "../../../types/payment";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { paymentService } from "../../../services/paymentService";
import Badge from '../../ui/badge/Badge';

interface Transaction {
  transactionId: number;
  amount: number;
  paymentMethod: 'ONLINE_BANKING' | 'CASH';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  transactionDate: string;
}

interface BillModalProps extends Bill {
  isOpen: boolean;
  onClose: () => void;
}

// Chỉ dùng BillModalProps cho BillModal
export function BillModal({ isOpen, onClose, ...bill }: BillModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const data = await paymentService.getTransactionsByBillId(bill.billId);
        setTransactions(data);
      } catch (error: any) {
        setError(error.message || "Không thể tải danh sách giao dịch");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && bill.status === "PAID") {
      loadTransactions();
    }
  }, [isOpen, bill.billId, bill.status]);

  const handlePayment = async (method: 'online' | 'cash') => {
    try {
      setPaymentLoading(true);
      if (method === 'online') {
        const paymentUrl = await paymentService.createPayment(bill.billId);
        window.open(paymentUrl, '_blank');
      } else {
        await paymentService.processCashPayment(bill.billId);
        onClose();
      }
    } catch (error: any) {
      setError(error.message || 'Không thể thực hiện thanh toán');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Chi tiết hóa đơn #{bill.billId.toString().padStart(4, '0')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-500 text-sm">Ngày tạo</p>
              <p className="font-medium">
                {format(new Date(bill.createdAt), 'dd-MM-yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Tình trạng</p>
              <Badge
                size="sm"
                color={
                  bill.status === 'PAID'
                    ? 'success'
                    : bill.status === 'UNPAID'
                    ? 'warning'
                    : 'error'
                }
              >
                {bill.status === 'PAID'
                  ? 'Đã thanh toán'
                  : bill.status === 'UNPAID'
                  ? 'Chưa thanh toán'
                  : 'Đã hủy'}
              </Badge>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium mb-3">Chi tiết</h3>
            <div className="space-y-2">
              {bill.billDetails?.map((detail: BillDetail, index: number) => (
                <div
                  key={detail.detailId}
                  className="flex justify-between items-center py-2"
                >
                  <div className="flex-1">
                    <span className="font-medium">{detail.itemName}</span>
                    <div className="text-sm text-gray-500">
                      {detail.quantity} x {detail.unitPrice?.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {detail.totalPrice?.toLocaleString('vi-VN')} VNĐ
                    </span>
                    {detail.insuranceDiscount > 0 && (
                      <div className="text-sm text-green-600">
                        -BHYT: {detail.insuranceDiscount?.toLocaleString('vi-VN')} VNĐ
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-medium">Tổng tiền dịch vụ</span>
                <span className="font-medium">
                  {bill.totalCost?.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              {bill.insuranceDiscount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Bảo hiểm y tế chi trả</span>
                  <span>-{bill.insuranceDiscount?.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-semibold">
                <span>Số tiền phải thanh toán</span>
                <span className="text-green-600">
                  {bill.amount?.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>
          </div>

          {bill.status === 'PAID' ? (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Lịch sử giao dịch</h3>
              {loading ? (
                <div className="text-center py-4">Đang tải...</div>
              ) : error ? (
                <div className="text-center text-red-500 py-4">{error}</div>
              ) : transactions.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  Không có giao dịch nào
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Mã giao dịch
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Thời gian
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Phương thức
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Số tiền
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.transactionId}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            GD{transaction.transactionId.toString().padStart(4, "0")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {format(new Date(transaction.transactionDate), "dd-MM-yyyy HH:mm")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.paymentMethod === "ONLINE_BANKING"
                              ? "Chuyển khoản"
                              : "Tiền mặt"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.amount?.toLocaleString("vi-VN") || '0'} VNĐ
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge
                              size="sm"
                              color={
                                transaction.status === "SUCCESS"
                                  ? "success"
                                  : transaction.status === "PENDING"
                                  ? "warning"
                                  : "error"
                              }
                            >
                              {transaction.status === "SUCCESS"
                                ? "Thành công"
                                : transaction.status === "PENDING"
                                ? "Đang xử lý"
                                : "Thất bại"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : bill.status === 'UNPAID' ? (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handlePayment('online')}
                disabled={paymentLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {paymentLoading ? 'Đang xử lý...' : 'Thanh toán online'}
              </button>
              <button
                onClick={() => handlePayment('cash')}
                disabled={paymentLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {paymentLoading ? 'Đang xử lý...' : 'Thanh toán tiền mặt'}
              </button>
            </div>
          ) : null}

          {error && (
            <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// DeleteBillModal chỉ nhận các prop cần thiết
interface DeleteBillModalProps {
  billId: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => Promise<void>;
}

export function DeleteBillModal({
  billId,
  isOpen,
  onClose,
  onDelete,
}: DeleteBillModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) await onDelete();
      onClose();
    } catch (error) {
      console.error("Error deleting bill:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[400px] min-w-[300px] p-6"
    >
      <div className="space-y-6 mb-10">
        <h3 className="text-xl font-semibold text-gray-800">
          Xác nhận xóa hóa đơn #{billId}
        </h3>
        <p>Bạn có chắc chắn muốn xóa hóa đơn này không?</p>
      </div>
      <div className="flex justify-end space-x-4">
        <button
          className="btn btn-secondary"
          onClick={onClose}
          disabled={isDeleting}
        >
          Đóng
        </button>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Đang xóa..." : "Xóa hóa đơn"}
        </button>
      </div>
    </Modal>
  );
}
