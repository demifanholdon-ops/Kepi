"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createInitialSnapshot, reduceGameState } from "@/engine";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import type { GameAction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastHost } from "@/components/game/ToastHost";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const QUICK_ACTIONS: GameAction[] = [
  { type: "REFRESH_SHOP" },
  { type: "BUY_POPULATION" },
  { type: "START_BATTLE" },
  { type: "END_BATTLE" },
  { type: "ADVANCE_STAGE" },
];

export default function DebugPage() {
  const snapshot = useGameStore((state) => state.snapshot);
  const dispatch = useGameStore((state) => state.dispatch);
  const resetGame = useGameStore((state) => state.resetGame);
  const replaceSnapshot = useGameStore((state) => state.replaceSnapshot);
  const pushToast = useUIStore((state) => state.pushToast);
  const [draft, setDraft] = useState("");

  const pretty = useMemo(() => JSON.stringify(snapshot, null, 2), [snapshot]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">调试页</h1>
          <p className="text-muted-foreground">
            引擎快照、快捷动作与 JSON 导入导出
          </p>
        </div>
        <div className="flex gap-2">
          <Button nativeButton={false} variant="outline" render={<Link href="/" />}>
            返回主战场
          </Button>
          <Button variant="secondary" onClick={resetGame}>
            重置对局
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>当前快照</CardTitle>
            <CardDescription>
              phase={snapshot.phase} · stage={snapshot.state.stage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>金币 {snapshot.state.gold}</Badge>
              <Badge variant="secondary">客批 {snapshot.state.kebi}</Badge>
              <Badge variant="outline">修复 {snapshot.state.homeRepair}%</Badge>
            </div>
            <pre className="max-h-[420px] overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
              {pretty}
            </pre>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>快捷动作</CardTitle>
              <CardDescription>直接 dispatch 到引擎 reducer</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.type}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    dispatch(action);
                    pushToast(`已 dispatch ${action.type}`, "default");
                  }}
                >
                  {action.type}
                </Button>
              ))}
              <Button
                size="sm"
                onClick={() =>
                  dispatch({ type: "BUY_PIECE", pieceType: "farmer" })
                }
              >
                BUY farmer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快照导入</CardTitle>
              <CardDescription>粘贴 JSON 后 LOAD_SNAPSHOT</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="min-h-[160px] w-full rounded-lg border border-input bg-background p-3 font-mono text-xs"
                placeholder="粘贴 GameSnapshot JSON"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(draft) as Parameters<
                        typeof replaceSnapshot
                      >[0];
                      replaceSnapshot(parsed);
                      pushToast("快照已导入", "success");
                    } catch {
                      pushToast("JSON 解析失败", "error");
                    }
                  }}
                >
                  导入
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setDraft(pretty)}
                >
                  复制当前
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const initial = createInitialSnapshot();
                    const stepped = reduceGameState(initial, {
                      type: "BUY_PIECE",
                      pieceType: "guard",
                    });
                    replaceSnapshot(stepped);
                    pushToast("已载入样例快照", "success");
                  }}
                >
                  样例快照
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastHost />
    </main>
  );
}
