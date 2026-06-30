import { registerStackModule } from "@/lib/project-setup/templates/registry";
import {
  nextjsModule,
  reactViteModule,
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
  expressBaseModule,
  mongooseModule,
  prismaModule,
  redisModule,
  socketIoModule,
  swaggerModule,
} from "@/lib/project-setup/templates/backend/modules";
import {
  authStubModule,
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
  registerStackModule(tailwindFrontendModule);
  registerStackModule(shadcnFrontendModule);
  registerStackModule(reduxViteModule);
  registerStackModule(reduxNextModule);
  registerStackModule(zustandViteModule);
  registerStackModule(zustandNextModule);
  registerStackModule(contextViteModule);
  registerStackModule(contextNextModule);
  registerStackModule(expressBaseModule);
  registerStackModule(prismaModule);
  registerStackModule(mongooseModule);
  registerStackModule(swaggerModule);
  registerStackModule(redisModule);
  registerStackModule(socketIoModule);
  registerStackModule(dockerModule);
  registerStackModule(githubActionsModule);
  registerStackModule(deployStubModule);
  registerStackModule(stylingStubModule);
  registerStackModule(authStubModule);
  registered = true;
}
