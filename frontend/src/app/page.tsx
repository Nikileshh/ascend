import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Audience } from "@/components/landing/Audience";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { AscendIntro } from "@/components/intro/AnimationTimeline";

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
          <HowItWorks />
          <Features />
          <Audience />
          <Pricing />
        </div>
      </main>
      <Footer />
    </div>
  );
}
