import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Audience } from "@/components/landing/Audience";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { AscendIntro } from "@/components/intro/AnimationTimeline";
import { SceneBreak } from "@/components/landing/SceneBreak";

/**
 * A light stretch of the page with the previous chapter's photo continuing
 * faintly behind it (fixed on desktop, under a warm veil) — each scene break
 * "hands off" its image to the sections that follow it.
 */
function VeiledScene({
  image,
  children,
}: {
  image: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center sm:bg-fixed"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(244,239,230,0.95) 0%, rgba(246,235,216,0.86) 50%, rgba(244,239,230,0.93) 100%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#f4efe6]">
      <AscendIntro />
      <Nav />
      <main id="main-content">
        <Hero />
        {/* Chapter flow: each break shows its photo full-strength, then the
            same photo continues veiled behind the next light stretch. */}
        <VeiledScene image="/dashboard-bg.jpg">
          <Problem />
        </VeiledScene>
        <SceneBreak
          headingKey="scene1.heading"
          subKey="scene1.sub"
          image="/desk-bg.jpg"
        />
        <VeiledScene image="/desk-bg.jpg">
          <HowItWorks />
        </VeiledScene>
        <SceneBreak
          headingKey="scene3.heading"
          subKey="scene3.sub"
          image="/mist-bg.jpg"
        />
        <VeiledScene image="/mist-bg.jpg">
          <Features />
          <Audience />
        </VeiledScene>
        <SceneBreak
          headingKey="scene2.heading"
          subKey="scene2.sub"
          image="/road-bg.jpg"
        />
        <VeiledScene image="/road-bg.jpg">
          <Pricing />
        </VeiledScene>
      </main>
      <Footer />
    </div>
  );
}
