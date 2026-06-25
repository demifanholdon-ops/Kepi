import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-sm tracking-[0.3em] text-muted-foreground uppercase">Kepi</p>
      <h1 className="text-4xl font-bold tracking-tight">客批</h1>
      <p className="max-w-xl text-muted-foreground">
        AI 驱动的客家文化自走棋。Phase 0 基础设施已就绪，下一步进入规则引擎骨架。
      </p>
      <Button nativeButton={false} render={<Link href="/debug" />}>
        调试页
      </Button>
    </main>
  );
}
