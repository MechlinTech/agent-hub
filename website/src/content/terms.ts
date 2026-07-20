import type { LegalSection } from "./privacy";

export const TERMS_OF_USE = {
  title: "Terms of Use",
  lastUpdated: "July 20, 2026",
  intro:
    "These Terms of Use (“Terms”) govern access to Agent Hub. By using this site and related services, you agree to these Terms.",
  sections: [
    {
      heading: "Service description",
      paragraphs: [
        "Agent Hub provides AI-assisted tools for performance engineering, including script review, results analysis, and local project scaffolding via AgentHub Desktop where enabled.",
        "Features may change over time. Some capabilities require a verified account, desktop pairing, or third-party integrations you authorize.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: [
        "You agree not to misuse Agent Hub, including attempting unauthorized access, interfering with the service, uploading malicious content, or using the service in violation of applicable law or third-party terms.",
        "You are responsible for content you submit and for ensuring you have rights to use and process that content, including data you connect from BlazeMeter or other systems.",
      ],
    },
    {
      heading: "Accounts and preview mode",
      paragraphs: [
        "When sign-up and login are enabled, you must provide accurate information and keep credentials secure. We may suspend or terminate accounts that violate these Terms or pose a security risk.",
        "When the product is offered in preview or disabled mode, only marketing pages and limited endpoints may be available. Do not rely on preview environments for production workloads.",
      ],
    },
    {
      heading: "AI outputs and disclaimers",
      paragraphs: [
        "Agent responses are generated automatically and may be incomplete or incorrect. You must review outputs before relying on them for production testing, capacity planning, or code generation.",
        "Agent Hub is provided “as is” without warranties of any kind, to the maximum extent permitted by law. The operator of your deployment is not liable for indirect, incidental, or consequential damages arising from use of the service.",
      ],
    },
    {
      heading: "Intellectual property",
      paragraphs: [
        "The operator of Agent Hub and its licensors retain rights in Agent Hub software, branding, and documentation. You retain rights in content you submit, subject to the license needed for us to operate the service.",
      ],
    },
    {
      heading: "Changes and contact",
      paragraphs: [
        "We may modify these Terms or discontinue features with notice where reasonable. Continued use after changes constitutes acceptance.",
        "Questions about these Terms should be directed through your organization’s support channel or the contact information provided with your deployment.",
      ],
    },
  ] satisfies LegalSection[],
};
