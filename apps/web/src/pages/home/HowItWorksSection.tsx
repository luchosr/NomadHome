import { WRAP } from "./constants.js";

const STEPS = [
  {
    n: "01",
    h: "Pick a city, pick your dates",
    p: "Browse designed homes across nine cities. Filter by coworking, length of stay, pets, or how close you want to be to the beach.",
  },
  {
    n: "02",
    h: "Book a room, get the keys",
    p: "One booking covers your private room and full workspace access. We handle the lease, the Wi-Fi, the kitchen — you just bring a bag.",
  },
  {
    n: "03",
    h: "Move in, meet the house",
    p: "Your host meets you at the door. By the first dinner you'll know your neighbors — and you'll keep running into them in other cities.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="border-y border-sand-300 bg-sand-50 py-20">
      <div className={WRAP}>
        <div className="mb-10">
          <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            How it works
          </p>
          <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
            Three steps to your <em className="not-italic text-terracotta-500">next home</em>.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <p className="font-serif text-[56px] leading-none text-terracotta-500">{s.n}</p>
              <h3 className="mt-4 text-xl font-semibold text-ink-900">{s.h}</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-700">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
