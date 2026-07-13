"use client";

import { ModuleHeader } from "@/components/layout/module-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HabitsChecklist } from "@/components/habitos/habits-checklist";
import { HabitList } from "@/components/habitos/habit-list";

export default function HabitosPage() {
  return (
    <>
      <ModuleHeader title="Hábitos" />
      <Tabs defaultValue="hoy" className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="mis-habitos">Mis hábitos</TabsTrigger>
        </TabsList>
        <TabsContent value="hoy">
          <HabitsChecklist />
        </TabsContent>
        <TabsContent value="mis-habitos">
          <HabitList />
        </TabsContent>
      </Tabs>
    </>
  );
}
