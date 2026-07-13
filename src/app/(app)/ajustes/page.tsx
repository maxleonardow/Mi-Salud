import { ModuleHeader } from "@/components/layout/module-header";
import { SettingsPanel } from "@/components/ajustes/settings-panel";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Ajustes" />
      <SettingsPanel />
    </>
  );
}
