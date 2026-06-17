"use client";

import { ModuleHeader } from "@/components/layout/module-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyChecklist } from "@/components/suplementos/daily-checklist";
import { SupplementList } from "@/components/suplementos/supplement-list";
import { StackBuilder } from "@/components/suplementos/stack-builder";

export default function SuplementosPage() {
  return (
    <>
      <ModuleHeader title="Suplementación" />
      <Tabs defaultValue="hoy" className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="catalogo">Mis Suplementos</TabsTrigger>
          <TabsTrigger value="stacks">Stacks</TabsTrigger>
        </TabsList>
        <TabsContent value="hoy">
          <DailyChecklist />
        </TabsContent>
        <TabsContent value="catalogo">
          <SupplementList />
        </TabsContent>
        <TabsContent value="stacks">
          <StackBuilder />
        </TabsContent>
      </Tabs>
    </>
  );
}
