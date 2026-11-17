import { Link } from "react-router-dom";
import { t } from "@nomadhome/shared";
import type { SearchResultItem } from "@nomadhome/shared";
import { Arrow, Pictogram, Skeleton } from "@nomadhome/ui";
import { formatRate } from "../../lib/money.js";
import { AMENITY_OPTIONS } from "../../lib/searchData.js";
import { WRAP, FIELD } from "./constants.js";
import { SectionHeading } from "./SectionHeading.js";
import { useFeaturedStays } from "./useFeaturedStays.js";

const MAX_AMENITIES = 3;
const SKELETON_ROWS = 3;

const ROW_GRID =
  "[grid-template-areas:'code_city_arrow''thumb_info_info''price_price_price'] [grid-template-columns:6rem_minmax(0,1fr)_auto] lg:gap-x-6 lg:gap-y-0 lg:[grid-template-areas:'code_thumb_city_price_arrow''code_thumb_info_price_arrow'] lg:[grid-template-columns:4.5rem_9rem_minmax(0,1fr)_auto_2.75rem]";

/** Amenity codes to labels through t(); unknown codes are skipped, never rendered raw. */
function amenityLabels(codes: readonly string[] | undefined): string[] {
  if (!codes) return [];
  return codes
    .flatMap((code) => {
      const option = AMENITY_OPTIONS.find((o) => o.code === code);
      return option ? [t(option.labelKey)] : [];
    })
    .slice(0, MAX_AMENITIES);
}

/** Price text, or null when the rate is not a usable positive amount (never "$0"). */
function priceText(stay: SearchResultItem): string | null {
  if (!(stay.nightlyRateCents > 0)) return null;
  try {
    return formatRate(stay.nightlyRateCents, stay.currency);
  } catch {
    return null;
  }
}

function StayRow({ stay }: { stay: SearchResultItem }) {
  const isProperty = stay.type === "PROPERTY";
  const pictogram = isProperty ? "bed" : "desk";
  const place = stay.country ? `${stay.city}, ${stay.country}` : stay.city;
  const meta = [
    isProperty ? t("host.listings.type_property") : t("host.listings.type_workspace"),
    ...amenityLabels(stay.amenities),
  ];
  const price = priceText(stay);

  return (
    <Link
      to={`/listings/${stay.id}`}
      className={`group grid items-center gap-x-4 gap-y-3 p-4 text-fg-inverse no-underline transition-colors duration-med ease-out hover:bg-ember hover:text-fg focus-visible:bg-ember focus-visible:text-fg focus-visible:[--focus:var(--ink)] focus-visible:-outline-offset-[5px] lg:p-5 ${ROW_GRID}`}
    >
      <span
        aria-hidden="true"
        className="flex size-16 items-center justify-center bg-ember text-fg transition-colors [grid-area:code] group-hover:bg-surface-inverse group-hover:text-ember group-focus-visible:bg-surface-inverse group-focus-visible:text-ember lg:size-[4.5rem]"
      >
        <Pictogram name={pictogram} className="size-10 lg:size-11" />
      </span>
      {stay.primaryPhotoUrl ? (
        <img
          src={stay.primaryPhotoUrl}
          alt=""
          className="aspect-[4/3] w-24 border-2 border-fg-inverse bg-surface-inset object-cover transition-colors [grid-area:thumb] group-hover:border-border group-focus-visible:border-border lg:w-full"
          loading="lazy"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex aspect-[4/3] w-24 items-center justify-center border-2 border-fg-inverse bg-surface-inset text-fg [grid-area:thumb] group-hover:border-border group-focus-visible:border-border lg:w-full"
        >
          <Pictogram name={pictogram} className="size-8 lg:size-12" />
        </span>
      )}
      <p className="m-0 min-w-0 break-words text-base font-bold [grid-area:city] lg:pb-1">
        {place}
      </p>
      <div className="min-w-0 [grid-area:info]">
        <p className="m-0 line-clamp-2 break-words font-display text-2xl font-black leading-[1.1] group-hover:underline group-hover:underline-offset-4 lg:text-4xl">
          {stay.title}
        </p>
        <p className="m-0 mt-2 break-words text-sm font-medium">
          {meta.map((item, i) => (
            <span key={item} className="whitespace-nowrap">
              {i > 0 && (
                <span aria-hidden="true" className="px-1.5">
                  ·
                </span>
              )}
              {i > 0 && <span className="sr-only">, </span>}
              {item}
            </span>
          ))}
        </p>
      </div>
      {price && (
        <p className="m-0 flex flex-wrap items-baseline gap-x-2 [grid-area:price] lg:justify-end">
          <span className="whitespace-nowrap font-display text-3xl font-black leading-none tabular-nums text-ember transition-colors group-hover:text-fg group-focus-visible:text-fg lg:text-4xl">
            {price}
          </span>
          <span className="text-sm font-bold">{t("home.featured.price_per_night")}</span>
        </p>
      )}
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center border-2 border-fg-inverse transition-colors [grid-area:arrow] group-hover:border-border group-hover:bg-surface-inverse group-hover:text-ember group-focus-visible:border-border group-focus-visible:bg-surface-inverse group-focus-visible:text-ember"
      >
        <Arrow className="size-6" />
      </span>
    </Link>
  );
}

/** Skeleton rows sized like real rows so a successful load does not shift the page (design.md D3). */
function BoardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t("home.featured.loading_label")}
      className="mt-12 border-2 border-border bg-surface-inverse"
    >
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <div
          key={i}
          className={`grid min-h-56 items-center gap-x-4 gap-y-3 p-4 lg:min-h-[9.5rem] lg:p-5 ${ROW_GRID} ${i > 0 ? "border-t-2 border-fg-inverse" : ""}`}
        >
          <Skeleton aria-hidden="true" className="size-16 [grid-area:code] lg:size-[4.5rem]" />
          <Skeleton aria-hidden="true" className="aspect-[4/3] w-24 [grid-area:thumb] lg:w-full" />
          <Skeleton aria-hidden="true" className="h-5 w-32 [grid-area:city]" />
          <Skeleton aria-hidden="true" className="h-10 w-full max-w-md [grid-area:info]" />
          <Skeleton aria-hidden="true" className="h-8 w-28 [grid-area:price] lg:justify-self-end" />
          <Skeleton aria-hidden="true" className="size-11 [grid-area:arrow]" />
        </div>
      ))}
    </div>
  );
}

/**
 * The three newest published listings as a departure board. Real data only: the section is
 * hidden when the request fails or returns nothing (design.md D3, D9).
 */
export function FeaturedStaysSection() {
  const { data, isPending } = useFeaturedStays();
  const stays = data?.data ?? [];

  if (!isPending && stays.length === 0) return null;

  return (
    <section className={`${FIELD} bg-surface`}>
      <div className={WRAP}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            pre={t("home.featured.headline_pre")}
            em={t("home.featured.headline_em")}
          />
          <Link
            to="/search"
            className="inline-flex shrink-0 items-center gap-3 self-start border-2 border-border px-5 py-3 text-base font-bold text-fg no-underline transition-colors hover:bg-action hover:text-fg-inverse md:self-auto"
          >
            {t("home.featured.see_all")}
            <Arrow className="size-5" />
          </Link>
        </div>

        {isPending ? (
          <BoardSkeleton />
        ) : (
          /* Departure board: one full-width ink row per stay. Rows are real links and invert to
             ember on hover and focus. The focus ring stays ink because the row turns ember. */
          <ul className="m-0 mt-12 list-none border-2 border-border bg-surface-inverse p-0 text-fg-inverse">
            {stays.map((stay, i) => (
              <li key={stay.id} className={i > 0 ? "border-t-2 border-fg-inverse" : undefined}>
                <StayRow stay={stay} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
