import { registerStackModule } from "@/lib/project-setup/templates/registry";
import {
  nextjsModule,
  reactViteModule,
  reduxViteModule,
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
  stateStubModule,
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
  registerStackModule(stateStubModule);
  registerStackModule(authStubModule);
  registered = true;
}
