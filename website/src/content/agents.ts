export type LandingAgentMedia = {
  hero: string;
  screenshots: { src: string; alt: string }[];
  video?: { src: string; poster: string; label: string };
};

export type LandingAgent = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  media: LandingAgentMedia;
};

export const LANDING_AGENTS: LandingAgent[] = [
  {
    id: "project-setup",
    name: "Dev Scaffold Agent",
    tagline: "Scaffold full stacks on your machine",
    description:
      "Configure frontend, backend, and DevOps choices, then generate a project on disk through the AgentHub Desktop local executor.",
    features: [
      "Three-step wizard: configure, review, generate",
      "Frontend: Next.js, React, Flutter, or React Native",
      "Backend: Express or NestJS with JWT or OAuth providers",
      "Architecture preview before generation",
      "Streamed logs and history via AgentHub Desktop pairing",
    ],
    media: {
      hero: "/media/project-setup/hero.png",
      screenshots: [
        {
          src: "/media/project-setup/screen-wizard.png",
          alt: "Dev Scaffold configuration wizard",
        },
        {
          src: "/media/project-setup/screen-history.png",
          alt: "Dev Scaffold history",
        },
      ],
      video: {
        src: "/media/project-setup/demo.mp4",
        poster: "/media/project-setup/hero.png",
        label: "Dev Scaffold walkthrough",
      },
    },
  },
  {
    id: "script-review",
    name: "Script Review Agent",
    tagline: "Ship BlazeMeter-ready JMeter scripts",
    description:
      "Reviews JMeter scripts for quality, correlation, assertions, timers, and BlazeMeter readiness before you run a test.",
    features: [
      "20 deterministic rules with weighted 0-100 readiness score",
      "Upload JMX plus optional CSV attachments",
      "Findings with severity, rule IDs, and exportable reports",
      "Markdown, HTML, JSON exports and PDF via print",
      "Optional AI enhancement when enabled in settings",
    ],
    media: {
      hero: "/media/script-review/hero.png",
      screenshots: [
        {
          src: "/media/script-review/screen-new.png",
          alt: "New Script Review upload and configuration",
        },
        {
          src: "/media/script-review/screen-detail.png",
          alt: "Script review findings or configure rules",
        },
      ],
      video: {
        src: "/media/script-review/demo.mp4",
        poster: "/media/script-review/hero.png",
        label: "Script Review walkthrough",
      },
    },
  },
  {
    id: "results-analysis",
    name: "BlazeMeter Results Analysis Agent",
    tagline: "Turn test results into executive insight",
    description:
      "Analyze BlazeMeter or CSV results, validate SLAs, detect bottlenecks, and generate executive summaries for release decisions.",
    features: [
      "CSV upload or BlazeMeter API import when integrated",
      "SLA validation, timeline views, and baseline comparison",
      "Root-cause hypotheses and defect highlighting",
      "Go/No-Go guidance and saved executive summary library",
      "Works with CSV alone-no BlazeMeter API required",
    ],
    media: {
      hero: "/media/results-analysis/hero.png",
      screenshots: [
        {
          src: "/media/results-analysis/screen-new.png",
          alt: "Start a new results analysis with CSV upload",
        },
        {
          src: "/media/results-analysis/screen-detail.png",
          alt: "Executive summary dashboard or SLA configuration",
        },
      ],
      video: {
        src: "/media/results-analysis/demo.mp4",
        poster: "/media/results-analysis/hero.png",
        label: "Results Analysis walkthrough",
      },
    },
  },
];
