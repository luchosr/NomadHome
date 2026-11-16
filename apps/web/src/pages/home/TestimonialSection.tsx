import { t } from "@nomadhome/shared";
import { WRAP, FIELD } from "./constants.js";

// SYNTHETIC placeholder (NH-118, design.md D8): the quote and attribution are invented
// and have no real source. Replace with a real testimonial or remove before public
// launch (change task 11.1). Presenting it as real is a trust and legal risk.
export function TestimonialSection() {
  return (
    <section className={`${FIELD} bg-sage`}>
      <div className={WRAP}>
        <figure className="m-0 max-w-4xl border-2 border-border bg-surface p-8 text-fg md:p-12">
          <blockquote className="m-0">
            <p className="m-0 font-display text-4xl font-black leading-solid">
              {t("home.testimonial.quote_original_1")}
              <br />
              {t("home.testimonial.quote_original_2")}
            </p>
            <p className="mt-6 text-lg font-medium text-fg-muted">
              {t("home.testimonial.quote_translation")}
            </p>
          </blockquote>
          <figcaption className="mt-8 border-t-2 border-border pt-5">
            <p className="m-0 text-base font-black">{t("home.testimonial.author_name")}</p>
            <p className="m-0 text-base font-medium text-fg-muted">
              {t("home.testimonial.author_bio")}
            </p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
