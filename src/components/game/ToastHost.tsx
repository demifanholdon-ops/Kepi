"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

export function ToastHost() {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-[max(4.5rem,env(safe-area-inset-top))] right-[5%] z-[60] flex w-full max-w-xs flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className="kepi-toast kepi-wood-frame pointer-events-auto text-left transition-opacity"
          onClick={() => dismissToast(toast.id)}
        >
          <div
            className={cn(
              "kepi-toast-inner kepi-paper",
              toast.variant === "success" && "border-l-4 border-l-emerald-700",
              toast.variant === "error" && "border-l-4 border-l-red-800",
            )}
          >
            {toast.message}
          </div>
        </button>
      ))}
    </div>
  );
}
