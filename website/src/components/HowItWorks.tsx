import { Workflow } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      title: "Sign in to your workspace",
      body: "Create an account or log in to access agents, history, and team settings.",
    },
    {
      title: "Pick an agent",
      body: "Upload a JMX, import BlazeMeter results, or configure a project scaffold-each agent guides you step by step.",
    },
    {
      title: "Act on insights",
      body: "Export reports, share executive summaries, or generate code on disk with the desktop executor.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center gap-3">
          <Workflow className="h-8 w-8 text-brand-600" />
          <h2 className="text-3xl font-bold tracking-tight text-indigo-950">
            How it works
          </h2>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-card ring-1 ring-indigo-950/5"
            >
              <span className="text-sm font-bold text-brand-600">
                Step {i + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-indigo-950">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-indigo-900/70">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
