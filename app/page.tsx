import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Workflow } from "@/components/landing/workflow";
import { AISection } from "@/components/landing/ai-section";
import { Footer } from "@/components/landing/footer";
import { auth } from "@/lib/auth";

export default async function LandingPage(): Promise<React.ReactElement> {
  const session = await auth();
  return (
    <main>
      <Navbar />
      <CommandPalette />
      <Hero authed={Boolean(session?.user)} />
      <Workflow />
      <Features />
      <AISection />
      <Footer />
    </main>
  );
}