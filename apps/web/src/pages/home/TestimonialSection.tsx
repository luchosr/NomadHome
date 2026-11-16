import { t } from "@nomadhome/shared";
import { WRAP } from "./constants.js";

export function TestimonialSection() {
  return (
    <section className="py-10 pb-20">
      <div className={`${WRAP} mx-auto max-w-4xl text-center`}>
        <p
          className="font-display leading-[0.4] text-fg"
          style={{ fontSize: "140px", height: "78px" }}
        >
          "
        </p>
        <p
          className="font-display font-normal italic leading-snug tracking-tight text-fg"
          style={{ fontSize: "clamp(30px, 4.4vw, 52px)" }}
        >
          {t("home.testimonial.quote_original_1")}
          <br />
          {t("home.testimonial.quote_original_2")}
        </p>
        <p className="mt-5 text-lg text-fg-subtle">{t("home.testimonial.quote_translation")}</p>
        <div className="mt-8 inline-flex items-center gap-3.5">
          <div className="flex h-13 w-13 items-center justify-center rounded-full bg-action text-xl font-medium text-fg-inverse">
            A
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-fg">{t("home.testimonial.author_name")}</p>
            <p className="text-sm text-fg-subtle">{t("home.testimonial.author_bio")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
