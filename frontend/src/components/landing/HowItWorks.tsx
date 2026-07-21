import { ScrollReveal } from "./ScrollReveal";

const roadmap = [
  { month: "Month 1", focus: "Learn web development · Build portfolio" },
  { month: "Month 2", focus: "Cold outreach · Create LinkedIn presence" },
  { month: "Month 3", focus: "Land your first client" },
  { month: "Month 4", focus: "Reach ₹20,000/month" },
  { month: "Month 5", focus: "Automate sales" },
  { month: "Month 6", focus: "Scale" },
];

const timetable = [
  { time: "6:00 AM", activity: "Wake up" },
  { time: "6:30 AM", activity: "Workout" },
  { time: "8:00 AM", activity: "Deep work" },
  { time: "10:00 AM", activity: "College" },
  { time: "6:00 PM", activity: "Client outreach" },
  { time: "8:00 PM", activity: "Reading" },
  { time: "9:00 PM", activity: "Reflection" },
];

const habitSets = [
  {
    goal: "UPSC Aspirant",
    habits: [
      "Morning revision",
      "Editorial reading",
      "Mock tests",
      "Writing practice",
    ],
  },
  {
    goal: "Fitness Goal",
    habits: ["Protein intake", "Workout", "Water", "Sleep", "Walking"],
  },
  {
    goal: "Business Goal",
    habits: [
      "Cold outreach",
      "Sales calls",
      "Networking",
      "Portfolio building",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Ascend gets to know you",
    description:
      "No blank planner. A structured interview learns your goal, timeline, current level, daily schedule, energy patterns, and lifestyle — you just answer questions.",
  },
  {
    number: "02",
    title: "AI analyzes everything",
    description:
      "It estimates goal difficulty, required skills, weekly effort, success probability, risk factors, and bottlenecks — then designs the system to get you there.",
  },
  {
    number: "03",
    title: "Your personalized roadmap",
    description:
      "A complete month-by-month plan built for your goal and your life. Every roadmap is unique.",
  },
  {
    number: "04",
    title: "A realistic daily timetable",
    description:
      "Built around your energy levels, existing commitments, deep work blocks, and recovery — not a fantasy schedule you abandon by Wednesday.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-[#1f1a14]/[0.08] bg-[#f8ecd8]/30 backdrop-blur-md"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-28">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-medium tracking-tight text-[#1f1a14] sm:text-6xl">
            You answer questions.
            <br />
            <span className="bg-gradient-to-r from-[#c79a4a] to-[#d9622b] bg-clip-text text-transparent">
              The AI builds everything else.
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal
          className="mt-16 grid gap-5 sm:grid-cols-2"
          stagger={0.12}
        >
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl border border-[#1f1a14]/[0.09] bg-white/70 p-8 backdrop-blur-xl transition-colors hover:border-[#d9622b]/50"
            >
              <span className="font-mono text-sm font-semibold text-[#d9622b]">
                {step.number}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-[#1f1a14]">
                {step.title}
              </h3>
              <p className="mt-2 leading-7 text-[#6b6155]">
                {step.description}
              </p>
            </div>
          ))}
        </ScrollReveal>

        <ScrollReveal className="mt-5 grid gap-5 lg:grid-cols-2" stagger={0.15}>
          <div className="rounded-3xl border border-[#1f1a14]/[0.09] bg-white/70 p-8 backdrop-blur-xl">
            <p className="text-sm font-medium text-[#9a8f80]">
              Example roadmap · Build a ₹1 lakh/month agency
            </p>
            <ul className="mt-5 space-y-4">
              {roadmap.map((item) => (
                <li key={item.month} className="flex gap-4">
                  <span className="w-20 shrink-0 font-mono text-sm font-semibold text-[#d9622b]">
                    {item.month}
                  </span>
                  <span className="text-sm text-[#4a4239]">{item.focus}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-[#1f1a14]/[0.09] bg-white/70 p-8 backdrop-blur-xl">
            <p className="text-sm font-medium text-[#9a8f80]">
              Example timetable · Generated for your energy and commitments
            </p>
            <ul className="mt-5 space-y-3">
              {timetable.map((slot) => (
                <li key={slot.time} className="flex gap-4">
                  <span className="w-20 shrink-0 font-mono text-sm text-[#9a8f80]">
                    {slot.time}
                  </span>
                  <span className="text-sm text-[#4a4239]">
                    {slot.activity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>

        <div className="mt-20">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h3 className="font-display text-3xl font-medium tracking-tight text-[#1f1a14] sm:text-4xl">
              Habits built for your goal — not generic checklists
            </h3>
          </ScrollReveal>
          <ScrollReveal
            className="mt-10 grid gap-5 sm:grid-cols-3"
            stagger={0.12}
          >
            {habitSets.map((set) => (
              <div
                key={set.goal}
                className="rounded-3xl border border-[#1f1a14]/[0.09] bg-white/60 p-6 backdrop-blur-xl transition-colors hover:border-[#d9622b]/40"
              >
                <p className="font-semibold text-[#1f1a14]">{set.goal}</p>
                <ul className="mt-4 space-y-2">
                  {set.habits.map((habit) => (
                    <li
                      key={habit}
                      className="flex items-center gap-2 text-sm text-[#6b6155]"
                    >
                      <span className="text-[#d9622b]">✓</span>
                      {habit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
