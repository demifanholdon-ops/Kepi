"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type WoodButtonVariant = "default" | "primary" | "danger";

type WoodButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: WoodButtonVariant;
};

export function WoodButton({
  className,
  variant = "default",
  type = "button",
  children,
  ...props
}: WoodButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "kepi-wood-btn inline-flex items-center justify-center gap-1.5 font-medium",
        variant === "primary" && "kepi-wood-btn-primary",
        variant === "danger" && "kepi-wood-btn-danger",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
