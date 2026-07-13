import { ModuleHeader } from "@/components/layout/module-header";
import { BiomarkerDashboard } from "@/components/labs/biomarker-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Biomarcadores" />
      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">
          <BiomarkerDashboard />
        </TabsContent>
        <TabsContent value="historial">
          <BiomarkerDashboard history />
        </TabsContent>
      </Tabs>
    </>
  );
}
