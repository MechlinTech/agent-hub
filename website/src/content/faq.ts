export type FaqItem = {
  question: string;
  answer: string;
};

export const LANDING_FAQ: FaqItem[] = [
  {
    question: "What is Agent Hub?",
    answer:
      "Agent Hub is a workspace where specialized AI agents help you review JMeter scripts, analyze BlazeMeter test results, and scaffold project stacks on your machine.",
  },
  {
    question: "Which agents are available today?",
    answer:
      "Three agents are live: Script Review (JMeter quality and BlazeMeter readiness), BlazeMeter Results Analysis (SLAs, bottlenecks, executive summaries), and Dev Scaffold (full-stack scaffolding via AgentHub Desktop).",
  },
  {
    question: "Do I need BlazeMeter to use Results Analysis?",
    answer:
      "No. You can upload CSV exports (request stats and optional timeline, errors, baseline) without connecting the BlazeMeter API. API import is available when you configure Integrations.",
  },
  {
    question: "What is the Local Executor / Desktop app for?",
    answer:
      "Dev Scaffold writes files to folders on your computer. Pair AgentHub Desktop with your account so generation runs locally while you control the stack from the web wizard.",
  },
  {
    question: "Is AI required for Script Review?",
    answer:
      "No. Twenty deterministic rules always run first with scoring and templates. AI enhancement is optional and can be enabled in Settings or per review when API keys are configured.",
  },
];
