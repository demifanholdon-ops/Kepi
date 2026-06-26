import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type WoodPanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  letterEdge?: boolean;
  innerClassName?: string;
};

export function WoodPanel({
  children,
  className,
  innerClassName,
  letterEdge = false,
  ...props
}: WoodPanelProps) {
  return (
    <div className={cn("kepi-wood-frame", className)} {...props}>
      <div
        className={cn(
          "kepi-wood-frame-inner kepi-paper",
          letterEdge && "kepi-letter-edge",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
