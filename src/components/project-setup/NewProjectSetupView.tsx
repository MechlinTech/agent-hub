"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ProjectSetupWizard } from "@/components/project-setup/ProjectSetupWizard";
import {
  PROJECT_SETUP_NEW_PATH,
  useProjectSetupStore,
} from "@/stores/project-setup-store";

export function NewProjectSetupView() {
  const pathname = usePathname();
  const wizardSessionId = useProjectSetupStore((s) => s.wizardSessionId);
  const startNewSetup = useProjectSetupStore((s) => s.startNewSetup);

  useEffect(() => {
    if (pathname === PROJECT_SETUP_NEW_PATH) {
      startNewSetup();
    }
  }, [pathname, startNewSetup]);

  return <ProjectSetupWizard key={wizardSessionId} />;
}
