"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  getAllBusinesses,
  getCurrentBusiness,
  switchBusiness,
  getUser,
} from "@/lib/auth";
import { createBusiness } from "@/lib/business";
import { BusinessSummary } from "@/types/auth";

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
        <div className="w-6 h-6 rounded-md bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
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
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
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
                <button
                  key={biz.id}
                  onClick={() => onSwitch(biz)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition ${
                    biz.id === current.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
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
                  {biz.id === current.id && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-border p-1">
              {!creating ? (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
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
