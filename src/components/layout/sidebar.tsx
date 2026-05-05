"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, NAV_GROUPS, getActiveItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const active = getActiveItem(pathname);

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-[var(--border-strong)] bg-[var(--surface)] px-3 py-4">
      <div className="px-2 py-1 mb-4 flex items-center gap-2 font-bold text-sm tracking-tight">
        <span className="inline-block size-[18px] rounded-md bg-primary" />
        Mi Salud
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_GROUPS.map(group => {
          const items = NAV_ITEMS.filter(i => i.group === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className={group.key === "cuenta" ? "mt-auto" : ""}>
              {group.key !== "hoy" && (
                <div className="px-2 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--subtle-foreground)]">
                  {group.label}
                </div>
              )}
              {items.map(item => {
                const Icon = item.icon;
                const isActive = active?.href === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors",
                      isActive
                        ? "bg-[var(--accent-bg)] text-primary font-semibold"
                        : "text-[var(--foreground)]/85 hover:bg-[var(--surface-alt)]"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
