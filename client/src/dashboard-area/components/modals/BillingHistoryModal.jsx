// src/dashboard-area/components/modals/BillingHistoryModal.jsx - Professional billing history modal
import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  CreditCardIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import subscriptionService from "@shared/services/subscriptionService";
import { toast } from "react-hot-toast";

const BillingHistoryModal = ({ isOpen, onClose }) => {
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'paid', 'pending', 'failed'
  const [sortBy, setSortBy] = useState("date"); // 'date', 'amount', 'status'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'

  useEffect(() => {
    if (isOpen) {
      loadBillingData();
    }
  }, [isOpen]);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      const subscriptionData = subscriptionService.getCurrentSubscription();
      setSubscription(subscriptionData);
      setBillingHistory(subscriptionData.billingHistory || []);
    } catch (error) {
      console.error("Failed to load billing data:", error);
      toast.error("Failed to load billing history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "pending":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case "failed":
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <CreditCardIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "failed":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "card":
        return "💳";
      case "paypal":
        return "🅿️";
      case "bank":
        return "🏦";
      default:
        return "💳";
    }
  };

  const filteredHistory = billingHistory.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "date":
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = 0;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleDownloadInvoice = async (invoice) => {
    try {
      // In a real app, this would download the actual PDF
      // For now, we'll just show a success message
      toast.success(`Invoice ${invoice.id} download started`);

      // Simulate download delay
      setTimeout(() => {
        // Create a mock download
        const element = document.createElement("a");
        element.href =
          "data:text/plain;charset=utf-8," +
          encodeURIComponent(
            `Invoice ${invoice.id}\nDate: ${new Date(
              invoice.date
            ).toLocaleDateString()}\nAmount: $${invoice.amount}\nPlan: ${
              invoice.plan
            }\nStatus: ${invoice.status}`
          );
        element.download = `invoice-${invoice.id}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        toast.success("Invoice downloaded successfully");
      }, 1000);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download invoice");
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const totalPaid = billingHistory
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0);

  const currentYear = new Date().getFullYear();
  const thisYearTotal = billingHistory
    .filter(
      (item) =>
        item.status === "paid" &&
        new Date(item.date).getFullYear() === currentYear
    )
    .reduce((sum, item) => sum + item.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] border border-white/20 dark:border-gray-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CreditCardIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Billing History
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and download your payment history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-green-200 dark:border-green-800 border-t-green-600 dark:border-t-green-400 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading billing history...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">$</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Paid
                      </p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${totalPaid.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {currentYear}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This Year
                      </p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ${thisYearTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">#</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Invoices
                      </p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {billingHistory.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {["all", "paid", "pending", "failed"].map((filterOption) => (
                    <button
                      key={filterOption}
                      onClick={() => setFilter(filterOption)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        filter === filterOption
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {filterOption.charAt(0).toUpperCase() +
                        filterOption.slice(1)}
                      {filterOption === "all" && ` (${billingHistory.length})`}
                      {filterOption !== "all" &&
                        ` (${
                          billingHistory.filter(
                            (item) => item.status === filterOption
                          ).length
                        })`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Sort by:
                  </span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-");
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="date-desc">Date (Newest)</option>
                    <option value="date-asc">Date (Oldest)</option>
                    <option value="amount-desc">Amount (High to Low)</option>
                    <option value="amount-asc">Amount (Low to High)</option>
                    <option value="status-asc">Status (A-Z)</option>
                    <option value="status-desc">Status (Z-A)</option>
                  </select>
                </div>
              </div>

              {/* Billing History Table */}
              {sortedHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCardIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No billing history found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {filter === "all"
                      ? "You haven't made any payments yet."
                      : `No ${filter} transactions found.`}
                  </p>
                </div>
              ) : (
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                        <tr>
                          <th
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/50"
                            onClick={() => handleSort("date")}
                          >
                            Date
                            {sortBy === "date" && (
                              <span className="ml-1">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Invoice
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/50"
                            onClick={() => handleSort("amount")}
                          >
                            Amount
                            {sortBy === "amount" && (
                              <span className="ml-1">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-600/50"
                            onClick={() => handleSort("status")}
                          >
                            Status
                            {sortBy === "status" && (
                              <span className="ml-1">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                        {sortedHistory.map((invoice, index) => (
                          <tr
                            key={invoice.id}
                            className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white font-medium">
                                {new Date(invoice.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(invoice.date).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono text-gray-900 dark:text-white">
                                {invoice.id}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {invoice.description}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <span>
                                  {getPaymentMethodIcon(invoice.paymentMethod)}
                                </span>
                                <span className="capitalize">
                                  {invoice.paymentMethod}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                ${invoice.amount.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  invoice.status
                                )}`}
                              >
                                {getStatusIcon(invoice.status)}
                                <span className="capitalize">
                                  {invoice.status}
                                </span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleDownloadInvoice(invoice)}
                                disabled={invoice.status !== "paid"}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                  Download
                                </span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4 p-4">
                    {sortedHistory.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-mono text-gray-900 dark:text-white">
                            {invoice.id}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {getStatusIcon(invoice.status)}
                            <span className="capitalize">{invoice.status}</span>
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Date:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {new Date(invoice.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Amount:
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${invoice.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Payment:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                              <span>
                                {getPaymentMethodIcon(invoice.paymentMethod)}
                              </span>
                              <span className="capitalize">
                                {invoice.paymentMethod}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm text-gray-900 dark:text-white mb-2">
                            {invoice.description}
                          </div>
                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            disabled={invoice.status !== "paid"}
                            className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Download Invoice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Billing Info */}
              {subscription?.nextBillingDate &&
                subscription?.plan !== "free" && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Upcoming Billing
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Next Payment
                        </p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {new Date(
                            subscription.nextBillingDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Amount
                        </p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          ${subscription.price || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Plan
                        </p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400 capitalize">
                          {subscription.plan} ({subscription.billing})
                        </p>
                      </div>
                    </div>

                    {subscription.isTrial && (
                      <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Trial Period:</strong> Your first payment will
                          be charged after your{" "}
                          {subscription.trialDaysRemaining}-day trial ends.
                        </p>
                      </div>
                    )}

                    {subscription.cancelAtPeriodEnd && (
                      <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <strong>Cancellation Scheduled:</strong> Your
                          subscription will be cancelled at the end of the
                          current billing period.
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {/* Payment Methods Info */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Payment Information
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Default Payment Method
                    </span>
                    <div className="flex items-center gap-2">
                      <span>💳</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        Card ending in ****1234
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Billing Email
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {subscription?.email || "user@example.com"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Currency
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      USD ($)
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    <strong>Note:</strong> All payments are processed securely.
                    We use industry-standard encryption to protect your payment
                    information. Invoices are automatically generated and can be
                    downloaded for your records.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Need help? Contact support for billing questions.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const csvContent = [
                    [
                      "Date",
                      "Invoice ID",
                      "Description",
                      "Amount",
                      "Status",
                      "Payment Method",
                    ],
                    ...billingHistory.map((invoice) => [
                      new Date(invoice.date).toLocaleDateString(),
                      invoice.id,
                      invoice.description,
                      invoice.amount,
                      invoice.status,
                      invoice.paymentMethod,
                    ]),
                  ]
                    .map((row) => row.join(","))
                    .join("\n");

                  const element = document.createElement("a");
                  element.href =
                    "data:text/csv;charset=utf-8," +
                    encodeURIComponent(csvContent);
                  element.download = "billing-history.csv";
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);

                  toast.success("Billing history exported to CSV");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium text-sm flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingHistoryModal;
