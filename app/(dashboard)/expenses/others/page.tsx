"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Wallet,
  ListChecks,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";
import { getUser } from "@/lib/auth";
import { Expense, ExpensesResponse, EXPENSE_CATEGORIES } from "@/types/expense";
import { fetchExpenses, deleteExpense } from "@/lib/expenses";
import { useToast } from "@/components/ui/Toast";
import { LoadingState } from "@/components/ui/LoadingState";
import DataTable, { TableColumn } from "@/components/shared/DataTable";
import PermissionGate from "@/components/ui/PermissionGate";
import AddExpenseModal from "./_components/AddExpenseModal";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const catLabel = (v: string) =>
  EXPENSE_CATEGORIES.find((c) => c.value === v)?.label ?? v;

export default function OtherExpensesPage() {
  const businessId = getUser()?.business?.id;
  const { confirm, success, error } = useToast();

  const [data, setData] = useState<ExpensesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [mounted, setMounted] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetchExpenses(businessId);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const handleEdit = (e: Expense) => {
    setEditing(e);
    setModalOpen(true);
  };

  const handleDelete = async (exp: Expense) => {
    const confirmed = await confirm({
      title: `Delete "${exp.title}"?`,
      message: `This expense of ${fmt(exp.amount)} will be removed and excluded from your reports and cashflow.`,
      confirmText: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    try {
      await deleteExpense(exp.id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              expenses: prev.expenses.filter((e) => e.id !== exp.id),
            }
          : prev,
      );
      success("Expense deleted");
    } catch {
      error("Failed to delete expense");
    }
  };

  const columns: TableColumn<Expense>[] = [
    {
      key: "title",
      header: "Expense",
      render: (e) => (
        <div>
          <p className="font-semibold text-foreground">{e.title}</p>
          {e.isRecurring && (
            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-0.5">
              <RefreshCw className="w-3 h-3" />
              Recurring monthly
            </span>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (e) => (
        <span className="px-2 py-1 bg-muted/60 text-muted-foreground text-xs font-medium rounded-md">
          {catLabel(e.category)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (e) => (
        <span className="font-medium text-foreground tabular-nums">
          {fmt(e.amount)}
        </span>
      ),
    },
    {
      key: "expenseDate",
      header: "Date",
      render: (e) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {fmtDate(e.expenseDate)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <PermissionGate permission="expense:edit">
            <button
              onClick={() => handleEdit(e)}
              title="Edit expense"
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </PermissionGate>
          <PermissionGate permission="expense:delete">
            <button
              onClick={() => handleDelete(e)}
              title="Delete expense"
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingState page="vendors" />;

  const cardAnim = `transition-all duration-300 ${
    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
  }`;

  const summaryCards = data
    ? [
        {
          label: "Total This Period",
          value: fmt(data.summary.total),
          hint: "All logged expenses",
          icon: Wallet,
        },
        {
          label: "Records",
          value: String(data.summary.count),
          hint: "Total expense entries",
          icon: ListChecks,
        },
        {
          label: "Recurring",
          value: String(data.expenses.filter((e) => e.isRecurring).length),
          hint: "Repeats every month",
          icon: RefreshCw,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Other Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Rent, utilities, supplies and more — flows into cashflow and reports
          </p>
        </div>
        <PermissionGate permission="expense:create">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 transition-all duration-200 shadow-sm shadow-primary/15"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </PermissionGate>
      </div>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {summaryCards.map(({ label, value, hint, icon: Icon }, i) => (
            <div
              key={label}
              className={`bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${cardAnim}`}
              style={{ transitionDelay: mounted ? `${i * 60}ms` : "0ms" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-2 tabular-nums leading-none">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{hint}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={data?.expenses ?? []}
          keyExtractor={(e) => e.id}
          emptyText="No expenses logged yet. Add one to track your spending."
        />
      </div>

      <AddExpenseModal
        isOpen={modalOpen}
        businessId={businessId!}
        expense={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          const wasEdit = !!editing;
          setModalOpen(false);
          setEditing(null);
          void load();
          success(wasEdit ? "Expense updated" : "Expense added");
        }}
      />
    </div>
  );
}
