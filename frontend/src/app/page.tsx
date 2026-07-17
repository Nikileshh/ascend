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
        <Problem />
        <HowItWorks />
        <Features />
        <Audience />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
