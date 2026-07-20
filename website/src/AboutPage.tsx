import { ABOUT_CONTENT } from "./content/about";
import { MarketingShell } from "./components/MarketingShell";

export type AboutPageProps = {
  productEnabled: boolean;
  isAuthenticated: boolean;
};

export function AboutPage({ productEnabled, isAuthenticated }: AboutPageProps) {
  const { title, intro, mission, agentsHeading, agents, companyHeading, company } = ABOUT_CONTENT;

  return (
    <MarketingShell productEnabled={productEnabled} isAuthenticated={isAuthenticated}>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-indigo-950 sm:text-4xl">{title}</h1>
          <p className="mt-6 text-base leading-relaxed text-indigo-900/80">{intro}</p>
          <p className="mt-4 text-base leading-relaxed text-indigo-900/75">{mission}</p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-indigo-950">{agentsHeading}</h2>
          <ul className="mt-4 space-y-6">
            {agents.map((agent) => (
              <li key={agent.name}>
                <h3 className="font-medium text-indigo-950">{agent.name}</h3>
                <p className="mt-1 text-base leading-relaxed text-indigo-900/75">{agent.summary}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-indigo-950">{companyHeading}</h2>
          <p className="mt-3 text-base leading-relaxed text-indigo-900/75">{company}</p>
        </section>
      </article>
    </MarketingShell>
  );
}
