import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Audience } from "@/components/landing/Audience";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { AscendIntro } from "@/components/intro/AnimationTimeline";

export default function Home() {
  return (
    <div className="bg-white dark:bg-black">
      <AscendIntro />
      <Nav />
      <main id="main-content">
        <Hero />
        <Reveal>
          <Problem />
        </Reveal>
        <Reveal>
          <HowItWorks />
        </Reveal>
        <Reveal>
          <Features />
        </Reveal>
        <Reveal>
          <Audience />
        </Reveal>
        <Reveal>
          <Pricing />
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
