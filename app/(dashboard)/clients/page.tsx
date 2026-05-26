"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";

import { Client, CreateClientPayload } from "@/types/client";
import { fetchClients, createClient, deleteClient } from "@/lib/clients";
import { getUser } from "@/lib/auth";
import Modal from "@/components/shared/Modal";
import { STATES } from "@/constants/invoice-options";
import { ClientForm } from "@/types/client";
import { useBusiness } from "@/hooks/useBusiness";

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const inputError = `${inputBase} border-destructive bg-destructive/5`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { businessId } = useBusiness();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({
    defaultValues: {
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
    },
  });

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const data = await fetchClients(businessId);
        setClients(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [businessId]);

  const onSubmit = async (values: ClientForm) => {
    try {
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
      const newClient = await createClient(payload);
      setClients((prev) => [newClient, ...prev]);
      reset();
      setIsModalOpen(false);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  console.log(clients);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition"
        >
          Add client
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-40">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No clients yet. Add your first one.
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Phone
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  State
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  GSTIN
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {client.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.state || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {client.gstin || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-destructive hover:text-destructive/70 text-xs transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title="Add Client"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
        >
          {/* Name */}
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
            {errors.name && (
              <p className="text-xs text-destructive mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelBase}>Email</label>
              <input
                type="email"
                placeholder="client@example.com"
                {...register("email")}
                className={inputNormal}
              />
            </div>
            <div>
              <label className={labelBase}>
                Phone <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                {...register("phone", { required: "Phone Number is required" })}
                className={inputNormal}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* GSTIN + PAN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelBase}>GSTIN</label>
              <input
                type="text"
                placeholder="07AABCS7414G1ZH"
                {...register("gstin")}
                className={inputNormal}
              />
            </div>
            <div>
              <label className={labelBase}>PAN</label>
              <input
                type="text"
                placeholder="AABCS7414G"
                {...register("pan")}
                className={inputNormal}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelBase}>Address</label>
            <input
              type="text"
              placeholder="Street address"
              {...register("address")}
              className={inputNormal}
            />
          </div>

          {/* City + Pincode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelBase}>City</label>
              <input
                type="text"
                placeholder="New Delhi"
                {...register("city")}
                className={inputNormal}
              />
            </div>
            <div>
              <label className={labelBase}>Pincode</label>
              <input
                type="text"
                placeholder="110032"
                {...register("pincode")}
                className={inputNormal}
              />
            </div>
          </div>

          {/* State */}
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
            {errors.state && (
              <p className="text-xs text-destructive mt-1">
                {errors.state.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelBase}>Notes</label>
            <textarea
              rows={2}
              placeholder="Any notes about this client"
              {...register("notes")}
              className={`${inputNormal} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-1 sticky bottom-0 bg-card pb-1">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }}
              className="flex-1 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Adding..." : "Add Client"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
