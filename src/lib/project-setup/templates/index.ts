import { registerStackModule } from "@/lib/project-setup/templates/registry";
import {
  nextjsModule,
  reactViteModule,
  flutterModule,
  reduxNextModule,
  reduxViteModule,
  zustandNextModule,
  zustandViteModule,
  contextNextModule,
  contextViteModule,
  shadcnFrontendModule,
  tailwindFrontendModule,
} from "@/lib/project-setup/templates/frontend/modules";
import {
  authNextModule,
  authViteModule,
} from "@/lib/project-setup/templates/frontend/auth-templates";
import {
  expressBaseModule,
  nestBaseModule,
  mongooseModule,
  prismaModule,
  redisModule,
  socketIoModule,
  swaggerModule,
} from "@/lib/project-setup/templates/backend/modules";
import {
  deployStubModule,
  dockerModule,
  githubActionsModule,
  stylingStubModule,
} from "@/lib/project-setup/templates/devops/modules";

let registered = false;

export function ensureTemplatesRegistered(): void {
  if (registered) return;
  registerStackModule(nextjsModule);
  registerStackModule(reactViteModule);
  registerStackModule(flutterModule);
  registerStackModule(tailwindFrontendModule);
  registerStackModule(shadcnFrontendModule);
  registerStackModule(reduxViteModule);
  registerStackModule(reduxNextModule);
  registerStackModule(zustandViteModule);
  registerStackModule(zustandNextModule);
  registerStackModule(contextViteModule);
  registerStackModule(contextNextModule);
  registerStackModule(expressBaseModule);
  registerStackModule(nestBaseModule);
  registerStackModule(prismaModule);
  registerStackModule(mongooseModule);
  registerStackModule(swaggerModule);
  registerStackModule(redisModule);
  registerStackModule(socketIoModule);
  registerStackModule(dockerModule);
  registerStackModule(githubActionsModule);
  registerStackModule(deployStubModule);
  registerStackModule(stylingStubModule);
  registerStackModule(authViteModule);
  registerStackModule(authNextModule);
  registered = true;
}
