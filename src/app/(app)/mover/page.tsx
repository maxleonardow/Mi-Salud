"use client";

import { ModuleHeader } from "@/components/layout/module-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TodayBanner } from "@/components/mover/today-banner";
import { PlanWeekView } from "@/components/mover/plan-week-view";
import { SessionList } from "@/components/mover/session-list";

export default function MoverPage() {
  return (
    <>
      <ModuleHeader title="Ejercicio" />
      <Tabs defaultValue="hoy" className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="hoy">
          <TodayBanner />
        </TabsContent>
        <TabsContent value="plan">
          <PlanWeekView />
        </TabsContent>
        <TabsContent value="historial">
          <SessionList />
        </TabsContent>
      </Tabs>
    </>
  );
}
