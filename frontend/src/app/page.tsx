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
        {/* Below the hero, the page warms into the sunset tones of the
            summit photo (bone → peach → gold-tinted → bone). */}
        <div className="bg-[linear-gradient(180deg,#f4efe6_0%,#f8ecd8_30%,#f6e3c9_65%,#f4efe6_100%)]">
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
      </main>
      <Footer />
    </div>
  );
}
