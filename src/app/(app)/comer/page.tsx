import { ModuleHeader } from "@/components/layout/module-header";
import { FoodEntryList } from "@/components/comer/food-entry-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Alimentación" />
      <Tabs defaultValue="hoy" className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="hoy">
          <FoodEntryList />
        </TabsContent>
        <TabsContent value="historial">
          <FoodEntryList recent />
        </TabsContent>
      </Tabs>
    </>
  );
}
