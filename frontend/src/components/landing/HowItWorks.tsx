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
      className="border-y border-black/5 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-5xl dark:text-white">
            You answer questions.
            <br />
            The AI builds everything else.
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl border border-black/5 bg-white p-8 dark:border-white/10 dark:bg-zinc-900"
            >
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {step.number}
              </span>
              <h3 className="mt-3 text-xl font-semibold text-black dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-black/5 bg-white p-8 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500">
              Example roadmap · Build a ₹1 lakh/month agency
            </p>
            <ul className="mt-5 space-y-4">
              {roadmap.map((item) => (
                <li key={item.month} className="flex gap-4">
                  <span className="w-20 shrink-0 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {item.month}
                  </span>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {item.focus}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-8 dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500">
              Example timetable · Generated for your energy and commitments
            </p>
            <ul className="mt-5 space-y-3">
              {timetable.map((slot) => (
                <li key={slot.time} className="flex gap-4">
                  <span className="w-20 shrink-0 font-mono text-sm text-zinc-500">
                    {slot.time}
                  </span>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {slot.activity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl dark:text-white">
              Habits built for your goal — not generic checklists
            </h3>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {habitSets.map((set) => (
              <div
                key={set.goal}
                className="rounded-3xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-zinc-900"
              >
                <p className="font-semibold text-black dark:text-white">
                  {set.goal}
                </p>
                <ul className="mt-4 space-y-2">
                  {set.habits.map((habit) => (
                    <li
                      key={habit}
                      className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      <span className="text-blue-600 dark:text-blue-400">
                        ✓
                      </span>
                      {habit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
