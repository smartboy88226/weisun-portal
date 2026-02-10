"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import teamSeed from "@/data/team.json";

type Member = { id: string; name: string; intro: string; avatar: string; signature: string };

const STORAGE_KEY = "weisun_team_v5";

function readStore(fallback: Member[]): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return fallback;
    return data.map((x, i) => ({
      id: String(x.id ?? fallback[i]?.id ?? i),
      name: String(x.name ?? fallback[i]?.name ?? `Member ${i + 1}`),
      intro: String(x.intro ?? fallback[i]?.intro ?? ""),
      avatar: String(x.avatar ?? fallback[i]?.avatar ?? "/avatars/placeholder.png"),
      signature: String(x.signature ?? fallback[i]?.signature ?? ""),
    })) as Member[];
  } catch {
    return fallback;
  }
}

function writeStore(members: Member[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {}
}

export default function TeamPage() {
  const seed = (teamSeed as any[]).map((m) => ({ ...m, signature: "" })) as Member[];
  const [members, setMembers] = useState<Member[]>(seed);
  const [activeId, setActiveId] = useState<string>(seed[0]?.id ?? "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadForId, setUploadForId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = readStore(seed);
    setMembers(loaded);
    setActiveId(loaded[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = useMemo(
    () => members.find((m) => m.id === activeId) ?? members[0],
    [activeId, members]
  );

  function updateMember(id: string, patch: Partial<Member>) {
    setMembers((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...patch } : m));
      writeStore(next);
      return next;
    });
  }

  async function onPickFile(file: File, id: string) {
    const maxMB = 2;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`檔案太大（請小於 ${maxMB}MB）`);
      return;
    }
    const dataUrl = await fileToDataURL(file);
    updateMember(id, { avatar: dataUrl });
    setActiveId(id);
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      {/* Full-page background */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center kenburns"
          style={{ backgroundImage: active?.avatar ? `url(${active.avatar})` : undefined }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75" />

        {/* Projection (middle-left, lower) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[330px] top-[64%] -translate-y-1/2">
            <div className="text-white drop-shadow-[0_18px_40px_rgba(0,0,0,0.60)]">
              <div className="text-[46px] font-semibold tracking-tight text-white/92">
                {active?.name ?? ""}
              </div>

              {active?.signature ? (
                <div className="art-signature mt-2 max-w-[760px] text-[22px] leading-snug">
                  {active.signature}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Left sidebar - stick to the very left */}
      <aside className="fixed left-0 top-[64px] bottom-0 w-[320px] overflow-auto border-r border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs tracking-[0.25em] text-white/60">TEAM</div>
          <div className="text-[11px] text-white/45">威勝創投</div>
        </div>

        <div className="space-y-2">
          {members.map((m) => {
            const isActive = m.id === activeId;
            return (
              <div
                key={m.id}
                className={
                  "rounded-2xl border p-3 transition " +
                  (isActive ? "border-white/30 bg-white/15" : "border-white/10 bg-white/5 hover:bg-white/10")
                }
              >
                <button
                  onClick={() => setActiveId(m.id)}
                  className="flex w-full items-center gap-3 text-left"
                  aria-label={`選取 ${m.name}`}
                >
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="h-12 w-12 rounded-xl border border-white/15 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{m.name}</div>
                    <div className="truncate text-xs text-white/60">{m.signature || "—"}</div>
                  </div>
                </button>

                {isActive ? (
                  <div className="mt-3 space-y-2">
                    <input
                      value={m.name}
                      onChange={(e) => updateMember(m.id, { name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25"
                      placeholder="姓名"
                    />
                    <input
                      value={m.signature}
                      onChange={(e) => updateMember(m.id, { signature: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25"
                      placeholder="個性簽名"
                    />
                    <button
                      onClick={() => {
                        setUploadForId(m.id);
                        fileInputRef.current?.click();
                      }}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      上傳頭貼
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            const id = uploadForId;
            if (!file || !id) return;
            onPickFile(file, id);
            e.target.value = "";
          }}
        />
      </aside>

      {/* Spacer so content doesn't hide under sidebar */}
      <div className="pl-[320px]"></div>
    </div>
  );
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
