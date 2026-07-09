type LocalExecutorInstructionsProps = {
  /** On the settings page, steps reference the pairing controls on the same screen. */
  variant?: "settings" | "overview";
};

function InstructionSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <ol className="mt-2 list-decimal space-y-2 pl-5">{children}</ol>
    </div>
  );
}

export function LocalExecutorInstructions({
  variant = "overview",
}: LocalExecutorInstructionsProps) {
  const isSettings = variant === "settings";

  return (
    <div className="space-y-4 text-sm text-slate-600">
      <p>
        {isSettings
          ? "Project Setup runs on your PC through AgentHub Desktop — not on the AgentHub server. Desktop must be on the same machine as this browser."
          : "Project Setup scaffolds projects locally via AgentHub Desktop. Pair once, then run setups from the wizard."}
      </p>

      <InstructionSection title="First-time pairing">
        {isSettings ? (
          <>
            <li>
              Start <strong>AgentHub Desktop</strong> on this PC (download
              below if you have not installed it yet).
            </li>
            <li>
              Click <strong>Generate pairing token</strong> below, then choose{" "}
              <strong>Allow access</strong> when your browser prompts you.
            </li>
            <li>
              Click <strong>Pair executor</strong>. A success message means you
              are connected and ready to go.
            </li>
          </>
        ) : (
          <>
            <li>
              Download and start <strong>AgentHub Desktop</strong> on the same PC
              you use in the browser.
            </li>
            <li>
              Open <strong>Settings → Local Executor</strong> (or use the
              Local Executor card above).
            </li>
            <li>
              Click <strong>Generate pairing token</strong>, then choose{" "}
              <strong>Allow access</strong> when your browser prompts you.
            </li>
            <li>
              Click <strong>Pair executor</strong>. Once connected, you are ready
              to run project setups.
            </li>
          </>
        )}
      </InstructionSection>

      <InstructionSection title="Every setup after that">
        <li>
          Keep <strong>AgentHub Desktop</strong> running on your PC.
        </li>
        <li>
          In the desktop app, click <strong>Open AgentHub to connect</strong>{" "}
          to open the browser.
        </li>
        <li>
          In the wizard, choose your scope, stack, and target folder.
        </li>
        <li>
          Click <strong>Run Agent</strong> to scaffold the project locally.
        </li>
      </InstructionSection>
    </div>
  );
}
