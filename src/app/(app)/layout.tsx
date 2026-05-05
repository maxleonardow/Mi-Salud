import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex">
      <Sidebar />
      <main className="flex-1 px-5 py-6 md:px-8 md:py-7 pb-24 md:pb-7">{children}</main>
      <BottomNav />
    </div>
  );
}
