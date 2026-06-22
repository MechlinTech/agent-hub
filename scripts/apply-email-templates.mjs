import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, "..", "supabase", "email-templates");

const SITE_URL = "https://agenthub.mechlintech.com";

function loadTemplate(name) {
  const layout = readFileSync(join(templatesDir, "base-layout.html"), "utf8");
  const body = readFileSync(join(templatesDir, `${name}.html`), "utf8");
  return layout.replace("{{BODY}}", body);
}

const templates = {
  confirmation: {
    subject: "Confirm your Agent Hub account",
    content: loadTemplate("confirm-signup"),
  },
  recovery: {
    subject: "Reset your Agent Hub password",
    content: loadTemplate("reset-password"),
  },
  magic_link: {
    subject: "Sign in to Agent Hub",
    content: loadTemplate("magic-link"),
  },
  invite: {
    subject: "You are invited to Agent Hub",
    content: loadTemplate("invite-user"),
  },
};

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!token || !projectRef) {
  console.log("Supabase email templates (preview only — set SUPABASE_ACCESS_TOKEN to apply):\n");
  for (const [key, value] of Object.entries(templates)) {
    console.log(`--- ${key} ---`);
    console.log(`Subject: ${value.subject}`);
    console.log(`Body length: ${value.content.length} chars\n`);
  }
  console.log(
    "To apply automatically:\n" +
      "  SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=aqrcuwgwwpwijgugdhrk node scripts/apply-email-templates.mjs\n"
  );
  process.exit(0);
}

const payload = {
  site_url: SITE_URL,
  uri_allow_list: `${SITE_URL}/auth/callback,http://localhost:3040/auth/callback`,
  mailer_subjects_confirmation: templates.confirmation.subject,
  mailer_templates_confirmation_content: templates.confirmation.content,
  mailer_subjects_recovery: templates.recovery.subject,
  mailer_templates_recovery_content: templates.recovery.content,
  mailer_subjects_magic_link: templates.magic_link.subject,
  mailer_templates_magic_link_content: templates.magic_link.content,
  mailer_subjects_invite: templates.invite.subject,
  mailer_templates_invite_content: templates.invite.content,
};

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  console.error("Failed to update Supabase auth config:", response.status, await response.text());
  process.exit(1);
}

console.log("Updated Supabase auth config:");
console.log(`  Site URL: ${SITE_URL}`);
console.log("  Email templates: confirmation, recovery, magic link, invite");
