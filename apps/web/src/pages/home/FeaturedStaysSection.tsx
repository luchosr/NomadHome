import { Link } from "react-router-dom";
import { WRAP, GRADIENTS } from "./constants.js";

const CARDS = [
  {
    grad: "twilight",
    city: "Oaxaca · MX",
    title: "Casa del Fig",
    meta: "6 rooms · coworking · courtyard with a fig tree",
    price: "MX$ 18,500 / mo",
    tag: "Featured",
    left: "3 rooms left",
  },
  {
    grad: "forest",
    city: "Lisboa · PT",
    title: "A Quinta",
    meta: "4 rooms · garden · 10 min from the beach",
    price: "€ 1,250 / mo",
    left: "4 rooms left",
  },
  {
    grad: "morning",
    city: "Medellín · CO",
    title: "El Poblado",
    meta: "8 rooms · big coworking · rooftop pool",
    price: "COP 3.2M / mo",
    left: "Waitlist",
  },
] as const;

export function FeaturedStaysSection() {
  return (
    <section className="py-20">
      <div className={WRAP}>
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
              Featured · this month
            </p>
            <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
              Houses we&apos;d <em className="not-italic text-terracotta-500">recommend</em> right
              now.
            </h2>
          </div>
          <Link
            to="/search"
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-900"
          >
            See all stays
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <article
              key={card.title}
              className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
            >
              <Link to="/search" className="block no-underline">
                <div className={`relative aspect-[4/3] ${GRADIENTS[card.grad]}`}>
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 52%)",
                    }}
                  />
                  <div className="absolute left-3.5 top-3.5 flex gap-1.5">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium text-sand-50"
                      style={{ background: "rgba(28,46,39,0.82)", backdropFilter: "blur(8px)" }}
                    >
                      {card.city}
                    </span>
                    {"tag" in card && card.tag && (
                      <span className="rounded-full bg-terracotta-50 px-3 py-1 text-xs font-medium text-terracotta-900">
                        {card.tag}
                      </span>
                    )}
                  </div>
                </div>
                <div className="px-[18px] pb-[18px] pt-4">
                  <p className="font-serif text-2xl leading-tight text-ink-900">{card.title}</p>
                  <p className="mt-1 text-sm text-ink-500">{card.meta}</p>
                  <div className="mt-3.5 flex items-baseline justify-between">
                    <span className="text-base font-medium text-ink-900">{card.price}</span>
                    <span className="text-sm font-medium text-terracotta-700">{card.left}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
