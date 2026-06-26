"use client";

import { useUIStore } from "@/store/uiStore";
import { WoodButton, WoodPanel } from "@/components/game/ui";

export function GameDialogs() {
  const dialog = useUIStore((state) => state.dialog);
  const closeDialog = useUIStore((state) => state.closeDialog);

  if (!dialog.open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px]"
        aria-label="关闭对话框"
        onClick={() => closeDialog()}
      />
      <div
        className="fixed top-1/2 left-1/2 z-[71] w-[min(100%-2rem,24rem)] -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-labelledby="kepi-dialog-title"
      >
        <WoodPanel letterEdge innerClassName="p-5">
          <h2
            id="kepi-dialog-title"
            className="text-lg font-bold text-kepi-ink"
          >
            {dialog.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-kepi-ink-muted">
            {dialog.description}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <WoodButton className="px-4 py-2 text-sm" onClick={() => closeDialog()}>
              取消
            </WoodButton>
            <WoodButton
              variant="primary"
              className="px-4 py-2 text-sm"
              onClick={() => {
                dialog.onConfirm?.();
                closeDialog();
              }}
            >
              {dialog.confirmLabel}
            </WoodButton>
          </div>
        </WoodPanel>
      </div>
    </>
  );
}
