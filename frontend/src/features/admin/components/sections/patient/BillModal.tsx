import { Bill, BillDetail } from "../../../types/payment";
import { ServiceOrder } from "../../../types/serviceOrder";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { paymentService } from "../../../services/paymentService";
import Badge from '../../ui/badge/Badge';
import { useTranslation } from "react-i18next";

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
  services?: ServiceOrder[];
}

export function BillModal({ isOpen, onClose, services = [], ...bill }: BillModalProps) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const raw = await paymentService.getTransactionsByBillId(bill.billId);
      const mapped: Transaction[] = raw.map((t: any) => ({
        transactionId: t.id,
        amount: Number(t.amount),
        paymentMethod: t.payment_method === "C" ? "CASH" : "ONLINE_BANKING",
        status:
          t.status === "S"
            ? "SUCCESS"
            : t.status === "P"
            ? "PENDING"
            : "FAILED",
        transactionDate: t.transaction_date,
      }));
      setTransactions(mapped);
    } catch (error: any) {
      setError(error.message || "Không thể tải danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  };

  if (isOpen) {
    loadTransactions();
  }
}, [isOpen, bill.billId]);


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

  const totalServiceCost = services.reduce((sum, svc) => sum + (svc.service?.price || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {t("bill.detail")} #{String(bill.billId || 0).padStart(4, "0")}
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
          <h3 className="font-medium mb-3">{t("bill.usedServices")}</h3>
          {services.length > 0 ? (
            <div className="space-y-2">
              {services.map((svc, idx) => (
                <div key={idx} className="flex justify-between items-center py-1">
                  <span className="font-medium">{svc.service?.serviceName}</span>
                  <span>{(svc.service?.price || 0).toLocaleString("vi-VN")} {t("bill.vnd")}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>{t("bill.totalServiceCost")}</span>
                <span>{totalServiceCost.toLocaleString("vi-VN")} {t("bill.vnd")}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">{t("bill.noServices")}</p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-medium mb-3">{t("bill.details")}</h3>
          <div className="space-y-2">
            {bill.billDetails?.map((detail: BillDetail) => (
              <div
                key={detail.detailId}
                className="flex justify-between items-center py-2"
              >
                <div className="flex-1">
                  <span className="font-medium">{detail.itemName}</span>
                  <div className="text-sm text-gray-500">
                    {detail.quantity} x {detail.unitPrice?.toLocaleString('vi-VN')} {t("bill.vnd")}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {detail.totalPrice?.toLocaleString('vi-VN')} {t("bill.vnd")}
                  </span>
                  {detail.insuranceDiscount > 0 && (
                    <div className="text-sm text-green-600">
                      {t("bill.bhyt")}: {detail.insuranceDiscount?.toLocaleString('vi-VN')} {t("bill.vnd")}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-medium">{t("bill.totalBookingCost")}</span>
              <span className="font-medium">
                {bill.totalCost?.toLocaleString('vi-VN')} {t("bill.vnd")}
              </span>
            </div>
            {bill.insuranceDiscount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>{t("bill.insuranceCovered")}</span>
                <span>-{bill.insuranceDiscount?.toLocaleString('vi-VN')} {t("bill.vnd")}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-semibold">
              <span>{t("bill.amountToPay")}</span>
              <span className="text-green-600">
                {bill.amount?.toLocaleString('vi-VN')} {t("bill.vnd")}
              </span>
            </div>
          </div>
        </div>

        {bill.status === 'PAID' ? (
          <div className="mt-6">
            <h3 className="font-medium mb-3">{t("bill.transactionHistory")}</h3>
            {loading ? (
              <div className="text-center py-4">{t("common.loading")}</div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">{error || t("bill.errorLoadingTransactions")}</div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                {t("bill.noTransactions")}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("bill.transactionId")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("bill.transactionDate")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("bill.paymentMethod")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("bill.amount")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t("bill.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.transactionId}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {t("bill.gd")}{transaction.transactionId.toString().padStart(4, "0")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {format(new Date(transaction.transactionDate), "dd-MM-yyyy HH:mm")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {transaction.paymentMethod === "ONLINE_BANKING"
                            ? t("bill.onlineBanking")
                            : t("bill.cash")}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {transaction.amount?.toLocaleString("vi-VN") || '0'} {t("bill.vnd")}
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
                              ? t("bill.success")
                              : transaction.status === "PENDING"
                                ? t("bill.pending")
                                : t("bill.failed")}
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
              {paymentLoading ? t("common.processing") : t("bill.payOnline")}
            </button>
            <button
              onClick={() => handlePayment('cash')}
              disabled={paymentLoading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {paymentLoading ? t("common.processing") : t("bill.payCash")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
