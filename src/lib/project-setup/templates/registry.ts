import type { ProjectSetupConfig, CommandStep, FileTemplate } from "@/lib/project-setup/types";

export interface StackModule {
  id: string;
  appliesTo: (config: ProjectSetupConfig) => boolean;
  files: (config: ProjectSetupConfig, projectRoot: string) => FileTemplate[];
  commands: (config: ProjectSetupConfig, projectRoot: string) => CommandStep[];
  checklist: (config: ProjectSetupConfig) => string[];
  dependencies: (config: ProjectSetupConfig) => string[];
}

export interface RegisteredModule {
  id: string;
  module: StackModule;
}

const modules: RegisteredModule[] = [];

export function registerStackModule(module: StackModule): void {
  modules.push({ id: module.id, module });
}

export function getStackModules(): StackModule[] {
  return modules.map((m) => m.module);
}

export function getApplicableModules(config: ProjectSetupConfig): StackModule[] {
  return modules.filter((m) => m.module.appliesTo(config)).map((m) => m.module);
}
