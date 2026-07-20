import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { NewProjectSetupView } from "@/components/project-setup/NewProjectSetupView";

export default function ProjectSetupNewPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "Dev Scaffold", href: "/agents/project-setup" },
          { label: "New Setup" },
        ]}
      />
      <NewProjectSetupView />
    </div>
  );
}
