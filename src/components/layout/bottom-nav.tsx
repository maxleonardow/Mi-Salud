"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, getActiveItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

const BOTTOM_NAV = NAV_ITEMS.filter(i => i.group !== "cuenta");

export function BottomNav() {
  const pathname = usePathname();
  const active = getActiveItem(pathname);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border-strong)] bg-background grid grid-cols-6 px-1 py-1.5 gap-0.5"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {BOTTOM_NAV.map(item => {
        const Icon = item.icon;
        const isActive = active?.href === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-1 rounded-md text-[10px] font-medium",
              isActive ? "text-primary" : "text-[var(--subtle-foreground)]"
            )}
          >
            <Icon className="size-[18px]" />
            <span>{item.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
