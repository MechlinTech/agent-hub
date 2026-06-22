export type IntegrationStatus = "active" | "coming_soon";

export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  category: string;
}

export const INTEGRATION_CATALOG: IntegrationDefinition[] = [
  {
    id: "blazemeter",
    name: "BlazeMeter",
    description: "Load test execution, result import, and workspace configuration.",
    status: "active",
    category: "Performance Testing",
  },
  {
    id: "jira",
    name: "Jira",
    description: "Create and link performance defects from analysis findings.",
    status: "coming_soon",
    category: "Issue Tracking",
  },
  {
    id: "confluence",
    name: "Confluence",
    description: "Publish executive and technical performance reports.",
    status: "coming_soon",
    category: "Documentation",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Share analysis summaries and go/no-go recommendations.",
    status: "coming_soon",
    category: "Collaboration",
  },
];

export function getIntegrationById(id: string): IntegrationDefinition | undefined {
  return INTEGRATION_CATALOG.find((i) => i.id === id);
}

export function getActiveIntegrations(): IntegrationDefinition[] {
  return INTEGRATION_CATALOG.filter((i) => i.status === "active");
}
