"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Users,
  Banknote,
  CalendarRange,
  ListChecks,
  Pencil,
  Trash2,
} from "lucide-react";
import { getUser } from "@/lib/auth";
import { Employee, EmployeesResponse, EmploymentStatus } from "@/types/employee";
import { fetchEmployees, deleteEmployee } from "@/lib/employees";
import { useToast } from "@/components/ui/Toast";
import { LoadingState } from "@/components/ui/LoadingState";
import DataTable, { TableColumn } from "@/components/shared/DataTable";
import { EmptyCell } from "@/components/ui/EmptyCell";
import PermissionGate from "@/components/ui/PermissionGate";
import AddEmployeeModal from "./_components/AddEmployeeModal";

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const STATUS_STYLE: Record<EmploymentStatus, string> = {
  ACTIVE: "bg-status-paid text-status-paid-foreground",
  UPCOMING: "bg-status-pending text-status-pending-foreground",
  EXITED: "bg-status-cancelled text-status-cancelled-foreground",
};
const STATUS_LABEL: Record<EmploymentStatus, string> = {
  ACTIVE: "Active",
  UPCOMING: "Upcoming",
  EXITED: "Exited",
};

export default function PayrollPage() {
  const businessId = getUser()?.business?.id;
  const { confirm, success, error } = useToast();

  const [data, setData] = useState<EmployeesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [mounted, setMounted] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetchEmployees(businessId);
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

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleDelete = async (emp: Employee) => {
    const confirmed = await confirm({
      title: `Remove ${emp.name}?`,
      message:
        "This permanently removes the employee record. Past payroll figures in reports will recalculate without them.",
      confirmText: "Remove",
      danger: true,
    });
    if (!confirmed) return;
    try {
      await deleteEmployee(emp.id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              employees: prev.employees.filter((e) => e.id !== emp.id),
            }
          : prev,
      );
      success("Employee removed");
    } catch {
      error("Failed to remove employee");
    }
  };

  const columns: TableColumn<Employee>[] = [
    {
      key: "name",
      header: "Name",
      render: (e) => (
        <div>
          <p className="font-semibold text-foreground">{e.name}</p>
          {e.role && <p className="text-xs text-muted-foreground">{e.role}</p>}
        </div>
      ),
    },
    {
      key: "monthlySalary",
      header: "Monthly Salary",
      align: "right",
      render: (e) => (
        <span className="font-medium text-foreground tabular-nums">
          {fmt(e.monthlySalary)}
        </span>
      ),
    },
    {
      key: "startDate",
      header: "Started",
      render: (e) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {fmtDate(e.startDate)}
        </span>
      ),
    },
    {
      key: "exitDate",
      header: "Exit",
      render: (e) =>
        e.exitDate ? (
          <span className="text-muted-foreground whitespace-nowrap">
            {fmtDate(e.exitDate)}
          </span>
        ) : (
          <EmptyCell label="active" />
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[e.status]}`}
        >
          {STATUS_LABEL[e.status]}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <PermissionGate permission="employee:edit">
            <button
              onClick={() => handleEdit(e)}
              title="Edit employee"
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </PermissionGate>
          <PermissionGate permission="employee:delete">
            <button
              onClick={() => handleDelete(e)}
              title="Remove employee"
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
          label: "Active Staff",
          value: String(data.summary.active),
          hint:
            data.summary.upcoming > 0
              ? `${data.summary.upcoming} joining soon`
              : "Currently employed",
          icon: Users,
        },
        {
          label: "Current Monthly",
          value: fmt(data.summary.currentMonthly),
          hint: "Active staff only",
          icon: Banknote,
        },
        {
          label: "Committed (12 mo)",
          value: fmt(data.summary.committedAnnual),
          hint: "Accounts for joins & exits",
          icon: CalendarRange,
        },
        {
          label: "Total Records",
          value: String(data.summary.total),
          hint:
            data.summary.exited > 0
              ? `${data.summary.exited} exited`
              : "All-time employee records",
          icon: ListChecks,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track employee salaries — flows into cashflow and reports
          </p>
        </div>
        <PermissionGate permission="employee:create">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 transition-all duration-200 shadow-sm shadow-primary/15"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </PermissionGate>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          data={data?.employees ?? []}
          keyExtractor={(e) => e.id}
          emptyText="No employees yet. Add one to track payroll."
        />
      </div>

      {modalOpen && (
        <AddEmployeeModal
          isOpen={modalOpen}
          employee={editing}
          businessId={businessId!}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            const wasEdit = !!editing;
            setModalOpen(false);
            setEditing(null);
            void load();
            success(wasEdit ? "Employee updated" : "Employee added");
          }}
        />
      )}
    </div>
  );
}
