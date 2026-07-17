import { ScrollReveal } from "./ScrollReveal";

const audiences = [
  "Students",
  "UPSC Aspirants",
  "GATE Aspirants",
  "Entrepreneurs",
  "Founders",
  "Freelancers",
  "Professionals",
  "Fitness Enthusiasts",
  "Content Creators",
];

export function Audience() {
  return (
    <section className="border-y border-[#1f1a14]/[0.08] bg-[#faf6ee]">
      <div className="mx-auto w-full max-w-6xl px-6 py-28 text-center">
        <ScrollReveal>
          <h2 className="font-display text-4xl font-medium tracking-tight text-[#1f1a14] sm:text-6xl">
            Built for anyone with a meaningful goal
          </h2>
        </ScrollReveal>
        <ScrollReveal
          className="mt-10 flex flex-wrap justify-center gap-3"
          stagger={0.05}
          y={20}
        >
          {audiences.map((audience) => (
            <span
              key={audience}
              className="rounded-full border border-[#1f1a14]/[0.09] bg-white px-5 py-2 text-sm font-medium text-[#4a4239] backdrop-blur transition-colors hover:border-[#a8721f]/50 hover:text-[#1f1a14]"
            >
              {audience}
            </span>
          ))}
        </ScrollReveal>
        <ScrollReveal className="mx-auto mt-10 max-w-xl">
          <p className="text-lg leading-8 text-[#6b6155]">
            If you&apos;re working toward a meaningful long-term goal, Ascend is
            for you.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
