"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Download,
  UserPlus,
  Pencil,
  Trash2,
  Search,
  Users,
} from "lucide-react";

import { Client, CreateClientPayload, ClientForm } from "@/types/client";
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
} from "@/lib/clients";
import { fetchInvoices } from "@/lib/invoices";
import Modal from "@/components/shared/Modal";
import { STATES } from "@/constants/invoice-options";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";
import { exportToCSV } from "@/lib/csv";
import PermissionGate from "@/components/ui/PermissionGate";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  panRules,
  toUpperNoSpace,
  phoneRules,
  formatPhone,
  emailRules,
  gstinRules,
  pincodeRules,
} from "@/lib/validators";

// Constants
const DEFAULT_FORM: ClientForm = {
  name: "",
  email: "",
  phone: "",
  gstin: "",
  pan: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  notes: "",
  countryCode: "+91",
};

const AVATAR_PALETTE = [
  "bg-primary/15 text-primary",
  "bg-chart-2/15 text-chart-2",
  "bg-chart-3/15 text-chart-3",
  "bg-chart-4/15 text-chart-4",
  "bg-chart-5/15 text-chart-5",
  "bg-accent/15 text-accent",
];

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

// Sub-components
function ClientAvatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const color = AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}
    >
      {initials}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1.5">{message}</p>;
}

// Page
export default function ClientsPage() {
  const { businessId } = useBusiness();
  const { confirm, error: toastError } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsWithInvoices, setClientsWithInvoices] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({ defaultValues: DEFAULT_FORM });

  // Data fetching
  useEffect(() => {
    if (!businessId) return;
    const load = async () => {
      try {
        const [clientList, invoiceList] = await Promise.all([
          fetchClients(businessId),
          fetchInvoices(businessId),
        ]);
        setClients(clientList);
        // Build set of client IDs that have any non-cancelled invoice
        setClientsWithInvoices(
          new Set(
            invoiceList
              .filter((inv) => inv.status !== "CANCELLED")
              .map((inv) => inv.clientId),
          ),
        );
      } catch {
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [businessId]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.gstin ?? "").toLowerCase().includes(q),
    );
  }, [clients, search]);

  // Handlers
  const openAddModal = () => {
    setEditingClient(null);
    reset(DEFAULT_FORM);
    setServerError("");
    setIsModalOpen(true);
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    reset({
      name: client.name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      gstin: client.gstin ?? "",
      pan: client.pan ?? "",
      address: client.address ?? "",
      city: client.city ?? "",
      state: client.state ?? "",
      pincode: client.pincode ?? "",
      notes: client.notes ?? "",
    });
    setServerError("");
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setServerError("");
    reset(DEFAULT_FORM);
  };

  const onSubmit = async (values: ClientForm) => {
    setServerError("");
    try {
      if (!businessId) throw new Error("Business ID is required");

      if (editingClient) {
        const updated = await updateClient(editingClient.id, values);
        setClients((prev) =>
          prev.map((c) => (c.id === editingClient.id ? updated : c)),
        );
      } else {
        const payload: CreateClientPayload = {
          ...values,
          businessId,
          email: values.email || undefined,
          phone: values.phone || undefined,
          gstin: values.gstin || undefined,
          pan: values.pan || undefined,
          address: values.address || undefined,
          city: values.city || undefined,
          state: values.state || undefined,
          pincode: values.pincode || undefined,
          notes: values.notes || undefined,
        };
        const created = await createClient(payload);
        setClients((prev) => [created, ...prev]);
      }
      handleClose();
    } catch (err: unknown) {
      let message = "Failed to save client";
      if (typeof err === "object" && err !== null) {
        const e = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        message = e.response?.data?.message || e.message || message;
      }
      setServerError(message);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete Client?",
      message:
        "This client will be permanently deleted. This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Keep",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        "Cannot delete this client — they have associated invoices.";
      toastError("Delete failed", msg);
    }
  };

  const handleExport = () => {
    exportToCSV(
      "clients",
      [
        "Name",
        "Email",
        "Phone",
        "GSTIN",
        "PAN",
        "Address",
        "City",
        "State",
        "Pincode",
        "Notes",
      ],
      clients.map((c) => [
        c.name,
        c.email ?? "",
        c.phone ?? "",
        c.gstin ?? "",
        c.pan ?? "",
        c.address ?? "",
        c.city ?? "",
        c.state ?? "",
        c.pincode ?? "",
        c.notes ?? "",
      ]),
    );
  };

  // Render
  if (loading) return <LoadingState page="clients" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGate permission="report:export">
            <button
              onClick={handleExport}
              disabled={clients.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </PermissionGate>

          <PermissionGate permission="client:create">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 transition-all duration-200 shadow-sm shadow-primary/15"
            >
              <UserPlus className="w-4 h-4" strokeWidth={2.5} />
              Add Client
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone or GSTIN…"
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-input rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>
      )}

      {/* Client table */}
      {clients.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl text-center py-20 px-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1.5">
            No clients yet
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            Add your first client to start creating invoices
          </p>
          <PermissionGate permission="client:create">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add your first client
            </button>
          </PermissionGate>
        </div>
      ) : filtered.length === 0 ? (
        /* No search results */
        <div className="bg-card border border-border rounded-2xl text-center py-16 px-6">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            No clients match
          </p>
          <p className="text-sm text-muted-foreground">
            Try a different search term
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Client", "Contact", "State", "GSTIN", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((client) => {
                  const hasInvoices = clientsWithInvoices.has(client.id);
                  return (
                    <tr
                      key={client.id}
                      className="group hover:bg-muted/30 transition-colors duration-100"
                    >
                      {/* Client — avatar + name + city */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <ClientAvatar name={client.name} />
                          <div>
                            <p className="font-semibold text-foreground leading-tight">
                              {client.name}
                            </p>
                            {client.city && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {client.city}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact — email + phone stacked */}
                      <td className="px-4 py-3.5 max-w-48">
                        <p className="text-sm text-foreground truncate">
                          {client.email || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {client.phone || "—"}
                        </p>
                      </td>

                      {/* State */}
                      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                        {client.state || "—"}
                      </td>

                      {/* GSTIN — monospace chip */}
                      <td className="px-4 py-3.5">
                        {client.gstin ? (
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md text-foreground">
                            {client.gstin}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </td>

                      {/* Actions — fade in on row hover */}
                      <td className="px-4 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div className="flex items-center justify-end gap-1">
                          <PermissionGate permission="client:edit">
                            <button
                              onClick={() => handleEditClick(client)}
                              title="Edit client"
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="client:delete">
                            <Tooltip
                              content={
                                hasInvoices
                                  ? "Client has invoices and cannot be deleted"
                                  : "Delete client"
                              }
                              variant={hasInvoices ? "warning" : "default"}
                              side="left"
                              delay={hasInvoices ? 100 : 500}
                            >
                              <button
                                onClick={() =>
                                  !hasInvoices && handleDelete(client.id)
                                }
                                disabled={hasInvoices}
                                aria-label={
                                  hasInvoices
                                    ? "Cannot delete — client has invoices"
                                    : "Delete client"
                                }
                                className={`p-1.5 rounded-md transition-colors ${
                                  hasInvoices
                                    ? "text-muted-foreground/40 cursor-not-allowed"
                                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Result count when searching */}
          {search && (
            <div className="px-4 py-2.5 border-t border-border/60 bg-muted/20">
              <p className="text-xs text-muted-foreground">
                {filtered.length} of {clients.length} client
                {clients.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingClient ? "Edit Client" : "Add Client"}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          // Added overflow-x-hidden here as a safety net to completely kill horizontal scrolling
          className="space-y-5 max-h-[70vh] overflow-y-auto overflow-x-hidden pr-2"
        >
          {/* Contact info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Contact Info
            </p>

            <div>
              <label className={labelBase}>
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Client or company name"
                {...register("name", { required: "Name is required" })}
                className={errors.name ? inputError : inputNormal}
              />
              <FieldError message={errors.name?.message} />
            </div>

            {/* Using a 12-column grid ensures perfectly equal 50/50 splits on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Email - Takes 6/12 columns */}
              <div className="sm:col-span-6">
                <label className={labelBase}>Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...register("email", emailRules)}
                  className={errors.email ? inputError : inputNormal}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone - Takes 6/12 columns */}
              <div className="sm:col-span-6">
                <label className={labelBase}>Phone</label>
                <div className="flex gap-2 w-full">
                  <select
                    {...register("countryCode")}
                    className={`${inputNormal} w-20! shrink-0 text-center px-1`}
                  >
                    <option value="+91">+91</option>
                  </select>

                  <Controller
                    name="phone"
                    control={control}
                    rules={phoneRules}
                    render={({ field }) => (
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="9876543210"
                        maxLength={10}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(formatPhone(e.target.value))
                        }
                        className={`${errors.phone ? inputError : inputNormal} w-auto! flex-1 min-w-0`}
                      />
                    )}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive mt-1.5">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tax details */}
          <div className="space-y-3 pt-1 border-t border-border/60">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">
              Tax Details
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelBase}>GSTIN</label>
                <Controller
                  name="gstin"
                  control={control}
                  rules={gstinRules}
                  render={({ field }) => (
                    <input
                      type="text"
                      placeholder="07AABCS7414G1ZH"
                      maxLength={15}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(toUpperNoSpace(e.target.value))
                      }
                      className={`uppercase ${errors.gstin ? inputError : inputNormal}`}
                    />
                  )}
                />
                {errors.gstin && (
                  <p className="text-xs text-destructive mt-1.5">
                    {errors.gstin.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelBase}>PAN</label>
                <Controller
                  name="pan"
                  control={control}
                  rules={panRules}
                  render={({ field }) => (
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(toUpperNoSpace(e.target.value))
                      }
                      className={errors.pan ? inputError : inputNormal}
                    />
                  )}
                />
                {errors.pan && (
                  <p className="text-xs text-destructive mt-1.5">
                    {errors.pan.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3 pt-1 border-t border-border/60">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">
              Address
            </p>

            <div>
              <label className={labelBase}>Street</label>
              <input
                type="text"
                placeholder="Street address"
                {...register("address")}
                className={inputNormal}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelBase}>City</label>
                <input
                  type="text"
                  placeholder="New Delhi"
                  {...register("city")}
                  maxLength={25}
                  className={inputNormal}
                />
              </div>
              <div>
                <label className={labelBase}>Pincode</label>
                <input
                  type="text"
                  placeholder="110032"
                  {...register("pincode", pincodeRules)}
                  maxLength={6}
                  className={errors.pincode ? inputError : inputNormal}
                />
                {errors.pincode && (
                  <p className="text-xs text-destructive mt-1.5">
                    {errors.pincode.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={labelBase}>
                State <span className="text-destructive">*</span>
              </label>
              <Controller
                name="state"
                control={control}
                rules={{ required: "State is required for GST calculation" }}
                render={({ field }) => (
                  <select
                    {...field}
                    className={errors.state ? inputError : inputNormal}
                  >
                    <option value="">Select state</option>
                    {STATES.map((s) => (
                      <option key={s.key} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              <FieldError message={errors.state?.message} />
            </div>
          </div>

          {/* Notes */}
          <div className="pt-1 border-t border-border/60">
            <label className={`${labelBase} pt-1`}>Notes</label>
            <textarea
              rows={2}
              placeholder="Any notes about this client"
              {...register("notes")}
              maxLength={150}
              className={`${inputNormal} resize-none`}
            />
            <p className="text-[10px]">Max characters 150</p>
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1 sticky bottom-0 bg-card pb-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
            >
              {isSubmitting
                ? "Saving…"
                : editingClient
                  ? "Save Changes"
                  : "Add Client"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
