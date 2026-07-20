/** Playful status lines shown while generation is running (à la Claude / ChatGPT / Sims). */
export const WHIMSICAL_STATUS_LINES = [
  "Reticulating splines…",
  "Warming up the compilers…",
  "Herding electrons into neat folders…",
  "Consulting the Stack Overflow oracle…",
  "Aligning semicolons…",
  "Teaching components to talk to each other…",
  "Brewing fresh TypeScript…",
  "Convincing npm to cooperate…",
  "Summoning create-project from the void…",
  "Polishing Tailwind utilities…",
  "Dusting off your new project folder…",
  "Spinning up imaginary dev servers…",
  "Counting dependencies (twice, for luck)…",
  "Untangling import paths…",
  "Feeding the linter some fresh code…",
  "Making sure nothing is undefined…",
  "Generating just the right amount of boilerplate…",
  "Checking that all the ducks are in a row…",
  "Almost there - probably…",
] as const;

export function pickWhimsicalStatus(seed: number): string {
  return WHIMSICAL_STATUS_LINES[seed % WHIMSICAL_STATUS_LINES.length];
}
