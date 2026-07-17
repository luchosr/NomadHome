import { WRAP } from "./constants.js";

export function TestimonialSection() {
  return (
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
  );
}
