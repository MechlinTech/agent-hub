import { ProjectSetupWizard } from "@/components/project-setup/ProjectSetupWizard";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function ProjectSetupNewPage() {
  return (
    <div className="pb-28">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Agents", href: "/agents" },
          { label: "Project Setup", href: "/agents/project-setup" },
          { label: "New Setup" },
        ]}
      />
      <ProjectSetupWizard />
    </div>
  );
}
