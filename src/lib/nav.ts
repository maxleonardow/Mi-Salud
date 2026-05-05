import {
  Home,
  SquareCheck,
  Pill,
  Utensils,
  Dumbbell,
  FlaskConical,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  group: "hoy" | "tracking" | "salud" | "cuenta";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/",            label: "Hoy",            shortLabel: "Hoy",     icon: Home,         group: "hoy" },
  { href: "/habitos",     label: "Hábitos",        shortLabel: "Hábitos", icon: SquareCheck,  group: "tracking" },
  { href: "/suplementos", label: "Suplementación", shortLabel: "Sups",    icon: Pill,         group: "tracking" },
  { href: "/comer",       label: "Alimentación",   shortLabel: "Comer",   icon: Utensils,     group: "tracking" },
  { href: "/mover",       label: "Ejercicio",      shortLabel: "Mover",   icon: Dumbbell,     group: "tracking" },
  { href: "/labs",        label: "Biomarcadores",  shortLabel: "Labs",    icon: FlaskConical, group: "salud" },
  { href: "/ajustes",     label: "Ajustes",        shortLabel: "Cuenta",  icon: Settings,     group: "cuenta" },
];

export const NAV_GROUPS = [
  { key: "hoy",      label: "Hoy" },
  { key: "tracking", label: "Tracking" },
  { key: "salud",    label: "Salud" },
  { key: "cuenta",   label: "Cuenta" },
] as const;

export function getActiveItem(pathname: string): NavItem | undefined {
  if (pathname === "/") return NAV_ITEMS[0];
  return NAV_ITEMS.slice(1).find(item => pathname.startsWith(item.href));
}
