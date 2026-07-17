import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { WRAP, STAR_RATING } from "./constants.js";

export function HeroSection() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");

  const handleSearch = () => {
    if (city.trim()) navigate(`/search?city=${encodeURIComponent(city.trim())}`);
    else navigate("/search");
  };

  return (
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
  );
}
