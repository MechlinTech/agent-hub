export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export const PRIVACY_POLICY = {
  title: "Privacy Policy",
  lastUpdated: "July 20, 2026",
  intro:
    "This Privacy Policy describes how the operator of your Agent Hub deployment (“we”, “us”) collects and uses information when you use Agent Hub and related services.",
  sections: [
    {
      heading: "Information you provide",
      paragraphs: [
        "When you create an account, we process your email address and authentication credentials through our identity provider. Profile details you choose to add in the application are stored with your account.",
        "When you use agents, you may upload files, paste scripts, or connect third-party services (such as BlazeMeter). That content is processed to deliver agent responses and may be stored according to your workspace settings and retention policies.",
      ],
    },
    {
      heading: "Information we collect automatically",
      paragraphs: [
        "We collect standard technical data such as IP address, browser type, device information, and usage logs needed to operate, secure, and improve the service.",
        "Cookies and similar technologies are used for session management and preferences. You can control cookies through your browser settings, though some features may not work without them.",
      ],
    },
    {
      heading: "How we use information",
      paragraphs: [
        "We use information to authenticate users, run Agent Hub features, prevent abuse, troubleshoot issues, and improve product quality.",
        "We do not sell your personal information. We may use subprocessors (for example hosting, authentication, and analytics providers) under agreements that require appropriate safeguards.",
      ],
    },
    {
      heading: "Data retention and security",
      paragraphs: [
        "We retain account and usage data for as long as your account is active or as needed to provide the service and meet legal obligations. You may request deletion of your account subject to applicable law and contractual requirements.",
        "We apply administrative, technical, and organizational measures designed to protect data. No method of transmission or storage is completely secure.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: [
        "You may access and update certain account information in the product. Depending on your region, you may have rights to access, correct, delete, or restrict processing of personal data.",
        "To exercise privacy rights or ask questions about this policy, contact your organization’s designated support channel or the contact information provided with your deployment.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        "We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the “Last updated” date. Continued use of Agent Hub after changes constitutes acceptance of the updated policy.",
      ],
    },
  ] satisfies LegalSection[],
};
