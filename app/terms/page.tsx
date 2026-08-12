import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of ArchVision AI.",
};

export default function TermsPage(): React.ReactElement {
  return (
    <LegalPage
      title="Terms of Service"
      updated="August 12, 2026"
      sections={[
        {
          heading: "Acceptance",
          body: [
            "By creating an account or using ArchVision AI, you agree to these terms. If you do not agree, do not use the service.",
          ],
        },
        {
          heading: "The service",
          body: [
            "ArchVision AI turns natural language, code and schemas into UML diagrams, and provides AI-assisted editing, validation and code generation. The service is provided as a web application; features, including AI provider integrations, may vary by deployment.",
            "You acknowledge that diagrams generated from your input are based on automated processing and are provided as a drafting aid — not as professional architecture or legal advice. Always review generated output before relying on it.",
          ],
        },
        {
          heading: "Accounts",
          body: [
            "You sign in with a supported OAuth provider (or the built-in demo account in preview deployments). You are responsible for keeping your provider account secure. One person per account: don't share credentials.",
            "The demo account, where offered, is a shared evaluation identity — treat anything you create in it as public within that deployment.",
          ],
        },
        {
          heading: "Your content",
          body: [
            "You own the diagrams and other content you create. You grant us the limited right to store, process and display that content solely to operate the service for you.",
            "You may not use the service to store or transmit unlawful content, malware, or content that infringes third-party rights.",
          ],
        },
        {
          heading: "Beta status",
          body: [
            "The service is provided 'as is' during its preview period. We work to keep it reliable, but we do not guarantee uninterrupted availability, and automated features may produce incorrect results.",
            "Autosave runs continuously while you edit, but you are responsible for keeping durable copies of anything you cannot afford to lose.",
          ],
        },
        {
          heading: "Termination",
          body: [
            "You can stop using the service at any time and delete your account from Settings. We may suspend or terminate access for violations of these terms, and will give you a reasonable opportunity to export your content where possible.",
          ],
        },
        {
          heading: "Changes",
          body: [
            "We may update these terms as the product evolves. Material changes will be reflected here with an updated date. Continued use after changes take effect constitutes acceptance.",
          ],
        },
      ]}
    />
  );
}
