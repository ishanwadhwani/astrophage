"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2, Check, HousePlus, CircleChevronDown } from "lucide-react";
import {
  getAllBusinesses,
  getCurrentBusiness,
  switchBusiness,
  getUser,
} from "@/lib/auth";
import { createBusiness, deleteBusiness } from "@/lib/business";
import { BusinessSummary } from "@/types/auth";
import { useToast } from "@/components/ui/Toast";
import PermissionGate from "../ui/PermissionGate";

type NewBizForm = { name: string };

export default function BusinessSwitcher() {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  //   const [isMounted, setIsMounted] = useState(false);

  //     useEffect(() => {
  //     setIsMounted(true);
  //   }, []);

  const current = getCurrentBusiness();
  const businesses = getAllBusinesses();

  const { confirm, success, error } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<NewBizForm>({ defaultValues: { name: "" } });

  const onSwitch = (biz: BusinessSummary) => {
    if (biz.id === current?.id) {
      setOpen(false);
      return;
    }
    switchBusiness(biz);
  };

  const onCreateBusiness = async (values: NewBizForm) => {
    try {
      const biz = await createBusiness(values.name);

      // Add to user's businesses list in localStorage
      const user = getUser();
      if (user) {
        const updated = {
          ...user,
          businesses: [...user.businesses, biz],
        };
        localStorage.setItem("user", JSON.stringify(updated));
      }

      reset();
      setCreating(false);
      switchBusiness(biz);
    } catch {}
  };

  //   if (!isMounted) return null;
  if (!current) return null;

  return (
    <div className="relative px-3 py-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted transition group"
      >
        <div className="w-6 h-6 rounded-md bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">
          {current.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-foreground truncate">
            {current.name}
          </p>
          {current.gstin && (
            <p className="text-xs text-muted-foreground truncate font-mono">
              {current.gstin}
            </p>
          )}
        </div>
        <CircleChevronDown
          className={`w-4 h-4 shrink-0 text-primary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setCreating(false);
            }}
          />

          {/* Dropdown */}
          <div className="absolute left-3 right-3 bottom-full mb-2 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {/* Existing businesses */}
            <div className="p-1">
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  onClick={() => onSwitch(biz)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition ${
                    biz.id === current.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                      biz.id === current.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {biz.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{biz.name}</p>
                    {biz.gstin && (
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {biz.gstin}
                      </p>
                    )}
                  </div>
                  {biz.id === current.id && <Check className="h-4 w-4" />}
                  {biz.id !== current.id && (
                    <PermissionGate permission="business:delete">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmed = await confirm({
                            title: "Delete Business",
                            message:
                              "This will permanently delete the business and all the data.",
                            confirmText: "Delete",
                            danger: true,
                          });
                          if (!confirmed) return;
                          try {
                            await deleteBusiness(biz.id);
                            success("Business deleted");
                            const user = getUser();
                            if (user) {
                              const updated = {
                                ...user,
                                businesses: user.businesses.filter(
                                  (b) => b.id !== biz.id,
                                ),
                              };
                              localStorage.setItem(
                                "user",
                                JSON.stringify(updated),
                              );
                              window.location.reload();
                            }
                          } catch {
                            error("Failed to delete", "Please try again.");
                          }
                        }}
                        className="group-hover/biz:opacity-100 transition p-0.5 cursor-pointer"
                      >
                        <span className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </span>
                      </button>
                    </PermissionGate>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border p-1">
              {!creating ? (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <HousePlus className="w-5 h-5" />
                  Add business
                </button>
              ) : (
                <form
                  onSubmit={handleSubmit(onCreateBusiness)}
                  noValidate
                  className="p-2 space-y-2"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Business name"
                    {...register("name", { required: true })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm outline-none focus:border-primary transition"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        reset();
                      }}
                      className="flex-1 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
                    >
                      {isSubmitting ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
