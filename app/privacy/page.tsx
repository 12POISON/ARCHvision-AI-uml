import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ArchVision AI collects, uses and protects your data.",
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 12, 2026"
      sections={[
        {
          heading: "What we collect",
          body: [
            "Account identity: when you sign in with GitHub or Google (or the built-in demo account), we receive the name, email address and avatar provided by that provider. This identity is stored in our database so your workspace is associated with your account.",
            "Your content: the diagrams, projects, prompts, validation reports and export files you create. This is the core of the service and is stored so you can return to it across devices.",
            "Local-only data: comments and quick notes are stored only in your browser's local storage on the device you used. They are never sent to our servers.",
            "Technical information: standard logs (IP address, browser type, timestamps) and error reports (including error digests) so we can operate the service and fix bugs.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "Your content is used to render, edit and persist your diagrams and to power the AI assistant. When an AI provider key is configured, the text you send (prompts and diagram code) is forwarded to that provider to generate responses; in offline mode all extraction and generation runs locally in your browser.",
            "We do not sell your personal data. We share data only with the subprocessors needed to run the product (hosting, database and AI providers), each bound to confidentiality obligations.",
          ],
        },
        {
          heading: "Cookies and sessions",
          body: [
            "We use a single session cookie to keep you signed in. It is HTTP-only and scoped to the ArchVision AI domain. We do not run advertising or third-party tracking cookies.",
          ],
        },
        {
          heading: "Retention and deletion",
          body: [
            "Workspace data is retained until you delete your account (available in Settings), which removes your projects, diagrams and account records. Logs are retained for a limited period for operational purposes.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You can access and export your diagrams at any time, and you can delete your account and all associated data from Settings. For any other privacy request, contact us using the Contact page and we will respond within 30 days.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "If this policy changes materially, we will update this page and revise the date above. Continued use of the service after changes take effect constitutes acceptance.",
          ],
        },
      ]}
    />
  );
}
