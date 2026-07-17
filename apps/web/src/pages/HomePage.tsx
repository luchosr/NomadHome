import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { FormEvent } from "react";
import { t } from "@nomadhome/shared";
import { useAuth } from "../contexts/auth.js";

const WRAP = "mx-auto w-full max-w-[1280px] px-6 md:px-12";

const GRADIENTS: Record<string, string> = {
  twilight: "bg-gradient-to-br from-[#D97757] via-[#8C3E20] to-[#2E4A3F]",
  forest: "bg-gradient-to-br from-[#B8C9C1] via-[#4A6F61] to-[#1C2E27]",
  morning: "bg-gradient-to-b from-[#F2C9B5] via-[#FBF8F2] to-[#B8C9C1]",
  night: "bg-gradient-to-br from-[#4A6F61] via-[#2E4A3F] to-[#1A1A1A]",
  sand: "bg-gradient-to-br from-[#FBF8F2] via-[#DDD2BE] to-[#C4B59B]",
  terracotta: "bg-gradient-to-br from-[#F2C9B5] via-[#D97757] to-[#8C3E20]",
};

const STAR_RATING = Array.from({ length: 5 }, (_, i) => i);

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState("");

  const handleSearch = () => {
    if (city.trim()) navigate(`/search?city=${encodeURIComponent(city.trim())}`);
    else navigate("/search");
  };

  return (
    <div className="w-full">
      <section className="relative overflow-hidden bg-sand-100 pb-16 pt-20">
        <div
          className="pointer-events-none absolute -right-60 -top-40 h-[720px] w-[720px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(217,119,87,0.18) 0%, transparent 62%)",
          }}
        />
        <div className={WRAP}>
          <p className="eyebrow mb-6 text-xs font-medium uppercase tracking-widest text-ink-500">
            Co-living &amp; workspaces · 9 cities
          </p>
          <h1
            className="m-0 max-w-[14ch] font-serif font-normal leading-[0.98] tracking-tight text-ink-900"
            style={{ fontSize: "clamp(52px, 8vw, 100px)" }}
          >
            Find a place to <em className="not-italic text-terracotta-500">land</em>, and people to
            land with.
          </h1>
          <p className="mt-7 max-w-[56ch] text-xl leading-relaxed text-ink-700">
            Private rooms in beautiful shared homes, a desk waiting in every city, and a community
            that turns a stay into a circle of friends.
          </p>

          <svg className="mt-7 w-52" viewBox="0 0 200 12">
            <path
              d="M2 6 Q 25 1, 50 6 T 100 6 T 150 6 T 198 6"
              stroke="#D97757"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          <form
            className="mt-10 flex max-w-[860px] overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-md transition-shadow focus-within:border-forest-700 focus-within:shadow-lg"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <div className="flex flex-1 flex-col gap-1 border-r border-ink-100 px-6 py-[18px]">
              <label
                htmlFor="city-search"
                className="text-[11px] font-medium uppercase tracking-widest text-ink-500"
              >
                Where
              </label>
              <input
                id="city-search"
                className="bg-transparent text-base text-ink-900 outline-none ring-0 focus:outline-none placeholder:text-ink-300"
                placeholder="City or destination"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="flex items-center px-4">
              <button
                type="submit"
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-forest-700 text-sand-50 transition-colors hover:bg-forest-900"
                aria-label="Search"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-ink-500">
            <span className="flex gap-0.5 text-terracotta-500">
              {STAR_RATING.map((i) => (
                <svg key={i} className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                </svg>
              ))}
            </span>
            <span>4.9 from 1,200+ members</span>
            <span>·</span>
            <span>NPS +62 · 92% would stay again</span>
          </div>
        </div>
      </section>

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
            {[
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
            ].map((card) => (
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
                      {card.tag && (
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
            {[
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
            ].map((s) => (
              <div key={s.n}>
                <p className="font-serif text-[56px] leading-none text-terracotta-500">{s.n}</p>
                <h3 className="mt-4 text-xl font-semibold text-ink-900">{s.h}</h3>
                <p className="mt-2 text-base leading-relaxed text-ink-700">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className={`${WRAP} grid grid-cols-1 items-center gap-14 lg:grid-cols-2`}>
          <div>
            <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
              Co-living
            </p>
            <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
              A private room in a home that&apos;s actually been{" "}
              <em className="not-italic text-terracotta-500">designed</em>.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-700">
              Not a hostel, not a sublet. Real bedrooms, stocked kitchens, communal tables built for
              long dinners — and housekeeping so you never argue about the dishes.
            </p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {[
                "Private, furnished bedrooms — yours alone.",
                "Weekly cleaning, fresh linens, and utilities included.",
                "One transparent price per month — no deposits, no surprises.",
              ].map((f) => (
                <li key={f} className="flex gap-3 text-base text-ink-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div
            className={`relative aspect-[5/4] overflow-hidden rounded-3xl shadow-lg ${GRADIENTS.night}`}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.18), transparent 55%)",
              }}
            />
            <div className="absolute bottom-5 left-5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-md">
              <p className="text-[11px] font-medium uppercase tracking-widest text-ink-500">
                All included
              </p>
              <p className="mt-1 font-serif text-2xl leading-tight text-ink-900">
                MX$ 18,500<span className="ml-1 font-sans text-sm text-ink-500">/ mo</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-0 pb-20">
        <div className={`${WRAP} grid grid-cols-1 items-center gap-14 lg:grid-cols-2`}>
          <div
            className={`relative aspect-[5/4] overflow-hidden rounded-3xl shadow-lg lg:order-first ${GRADIENTS.sand}`}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 28% 18%, rgba(255,255,255,0.18), transparent 55%)",
              }}
            />
            <div className="absolute right-5 top-5 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-md">
              <span className="inline-flex items-center gap-2 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-forest-900">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Open now
              </span>
              <p className="mt-2 text-sm text-ink-500">11 desks · 2 booths free</p>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
              Workspace
            </p>
            <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
              A desk waiting for you in <em className="not-italic text-terracotta-500">every</em>{" "}
              city.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-700">
              Your stay includes a seat at the local coworking space — fast Wi-Fi, quiet rooms,
              phone booths and an espresso bar. Book a desk for the day or a meeting room by the
              hour.
            </p>
            <ul className="mt-6 flex flex-col gap-3.5">
              {[
                "300 Mbps Wi-Fi, monitors, and ergonomic chairs.",
                "Reserve desks & meeting rooms from the member app.",
                "Access carries across the whole network as you travel.",
              ].map((f) => (
                <li key={f} className="flex gap-3 text-base text-ink-700">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-sand-300 bg-sand-50 py-20">
        <div className={WRAP}>
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-2 text-xs font-medium uppercase tracking-widest text-ink-500">
                The network · 9 cities · 4 countries
              </p>
              <h2 className="m-0 font-serif text-4xl font-normal leading-tight tracking-tight text-ink-900 md:text-5xl">
                Stay in one. Belong to{" "}
                <em className="not-italic text-terracotta-500">all of them</em>.
              </h2>
            </div>
            <Link
              to="/search"
              className="flex shrink-0 items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-900"
            >
              Explore all
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { grad: "twilight", city: "Oaxaca", ct: "México · 2 houses" },
              { grad: "forest", city: "Lisboa", ct: "Portugal · 1 house" },
              { grad: "night", city: "Medellín", ct: "Colombia · 1 house" },
              { grad: "terracotta", city: "CDMX", ct: "México · 1 house" },
            ].map((loc) => (
              <div
                key={loc.city}
                className={`group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl ${GRADIENTS[loc.grad]}`}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.16), transparent 55%)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, rgba(28,46,39,0.7) 0%, transparent 55%)",
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4 text-sand-50">
                  <p className="font-serif text-2xl leading-tight group-hover:underline">
                    {loc.city}
                  </p>
                  <p className="mt-0.5 text-sm opacity-85">{loc.ct}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className={`${WRAP} grid grid-cols-2 gap-8 sm:grid-cols-4`}>
          {[
            { v: "9", l: "cities, and counting" },
            { v: "142", l: "private rooms" },
            { v: "92%", l: "network occupancy" },
            { v: "+62", l: "member NPS" },
          ].map((s) => (
            <div key={s.l}>
              <p
                className="font-serif leading-none tracking-tight text-ink-900"
                style={{ fontSize: "clamp(48px, 6vw, 72px)" }}
              >
                {s.v.includes("%") || s.v.startsWith("+") ? (
                  <>
                    {s.v.replace("%", "").replace("+", "")}
                    <span className="text-terracotta-500">{s.v.includes("%") ? "%" : "+"}</span>
                  </>
                ) : (
                  s.v
                )}
              </p>
              <p className="mt-2 text-base text-ink-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 pb-20">
        <div className={`${WRAP} mx-auto max-w-4xl text-center`}>
          <p
            className="font-serif leading-[0.4] text-terracotta-500"
            style={{ fontSize: "140px", height: "78px" }}
          >
            "
          </p>
          <p
            className="font-serif font-normal italic leading-snug tracking-tight text-ink-900"
            style={{ fontSize: "clamp(30px, 4.4vw, 52px)" }}
          >
            Llegué para tres semanas.
            <br />
            Me quedé tres meses.
          </p>
          <p className="mt-5 text-lg text-ink-500">
            "I came for three weeks. I stayed three months."
          </p>
          <div className="mt-8 inline-flex items-center gap-3.5">
            <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-900 text-xl font-medium text-sand-50">
              A
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-ink-900">Andrés Soto</p>
              <p className="text-sm text-ink-500">Designer · stayed at Casa del Fig, Oaxaca</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className={WRAP}>
          <div className="relative overflow-hidden rounded-3xl bg-forest-700 px-8 py-16 text-center md:px-16 md:py-[72px]">
            <div
              className="pointer-events-none absolute -bottom-52 -left-40 h-[560px] w-[560px] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(217,119,87,0.28) 0%, transparent 62%)",
              }}
            />
            <p className="eyebrow relative mb-4 text-xs font-medium uppercase tracking-widest text-terracotta-200">
              Your next home is one search away
            </p>
            <h2
              className="relative m-0 font-serif font-normal leading-tight tracking-tight text-sand-50"
              style={{ fontSize: "clamp(38px, 5.5vw, 68px)" }}
            >
              Pick a city. We&apos;ll save{" "}
              <em className="not-italic text-terracotta-200">the rest</em>.
            </h2>
            <p className="relative mx-auto mt-5 max-w-[52ch] text-lg text-forest-200">
              Three rooms left in Oaxaca this month, and new houses opening in Cape Town and Buenos
              Aires this summer.
            </p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-3.5">
              <Link
                to="/search"
                className="rounded-xl bg-sand-50 px-7 py-4 text-base font-medium text-forest-700 transition-colors hover:bg-white"
              >
                {t("search.submit")}
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="rounded-xl border px-7 py-4 text-base font-medium text-sand-50 transition-colors hover:bg-white/10"
                  style={{ borderColor: "rgba(245,240,232,0.4)" }}
                >
                  {t("nav.register")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-sand-300 bg-sand-50 pb-10 pt-16">
        <div className={WRAP}>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5">
                <svg width="30" height="30" viewBox="0 0 64 64">
                  <rect width="64" height="64" rx="14" fill="#2E4A3F" />
                  <path
                    d="M18 44 V32 a14 14 0 0 1 28 0 V44"
                    stroke="#F5F0E8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <line
                    x1="12"
                    y1="48"
                    x2="52"
                    y2="48"
                    stroke="#D97757"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="font-serif text-2xl text-ink-900">NomadHome</span>
              </div>
              <p className="mt-3.5 max-w-[30ch] text-sm leading-relaxed text-ink-500">
                Co-living and workspaces for people who'd rather live in a few places than visit
                many.
              </p>
            </div>
            {[
              { h: "Stay", links: ["Find a home", "Locations", "Workspaces", "Long stays"] },
              { h: "Company", links: ["About us", "Become a host", "Community", "Careers"] },
              { h: "Support", links: ["Help center", "House rules", "Contact"] },
            ].map((col) => (
              <div key={col.h}>
                <h4 className="mb-4 text-xs font-medium uppercase tracking-widest text-ink-500">
                  {col.h}
                </h4>
                {col.links.map((l) => (
                  <a
                    key={l}
                    href="#"
                    className="mb-2.5 block text-sm text-ink-700 no-underline transition-colors hover:text-forest-700"
                  >
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-sand-300 pt-6 text-xs text-ink-500">
            <span>© 2026 NomadHome · Una red de casas y espacios de trabajo</span>
            <span className="flex gap-4">
              <a href="#" className="text-ink-500 no-underline hover:text-ink-900">
                Privacy
              </a>
              <a href="#" className="text-ink-500 no-underline hover:text-ink-900">
                Terms
              </a>
              <a href="#" className="text-ink-500 no-underline hover:text-ink-900">
                Cookies
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
