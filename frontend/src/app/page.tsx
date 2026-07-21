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

export default function Home() {
  return (
    <div className="bg-[#f4efe6]">
      <AscendIntro />
      <Nav />
      <main id="main-content">
        <Hero />
        {/* Below the hero, the summit photo sits fixed behind everything
            under a warm veil — so the frosted-glass cards genuinely blur
            imagery, and scrolling feels layered (the scene breaks land on
            top of it at full strength). */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-cover bg-center sm:bg-fixed"
            style={{ backgroundImage: "url(/dashboard-bg.jpg)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(244,239,230,0.94) 0%, rgba(248,236,216,0.86) 30%, rgba(246,227,201,0.82) 65%, rgba(244,239,230,0.92) 100%)",
            }}
          />
          <div className="relative">
            <Problem />
            <SceneBreak
              headingKey="scene1.heading"
              subKey="scene1.sub"
              image="/desk-bg.jpg"
            />
            <HowItWorks />
            <SceneBreak
              headingKey="scene3.heading"
              subKey="scene3.sub"
              image="/mist-bg.jpg"
            />
            <Features />
            <Audience />
            <SceneBreak
              headingKey="scene2.heading"
              subKey="scene2.sub"
              image="/road-bg.jpg"
            />
            <Pricing />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
