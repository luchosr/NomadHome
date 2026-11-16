export const WRAP = "mx-auto w-full max-w-[1280px] px-6 md:px-12";

/** Full-width gantry field: fixed vertical rhythm and a 2px black edge between fields. */
export const FIELD = "border-b-2 border-border py-16 md:py-24";

export const COLIVING_FEATURES = [
  "home.coliving.feature_1",
  "home.coliving.feature_2",
  "home.coliving.feature_3",
] as const;

export const WORKSPACE_FEATURES = [
  "home.workspace.feature_1",
  "home.workspace.feature_2",
  "home.workspace.feature_3",
] as const;

export const HOW_IT_WORKS_STEPS = [
  { n: "01", hKey: "home.how_it_works.step_01_heading", pKey: "home.how_it_works.step_01_body" },
  { n: "02", hKey: "home.how_it_works.step_02_heading", pKey: "home.how_it_works.step_02_body" },
  { n: "03", hKey: "home.how_it_works.step_03_heading", pKey: "home.how_it_works.step_03_body" },
] as const;

// SYNTHETIC (NH-118, design.md D8): the featured stays, their prices (USD), descriptions
// and state tags are invented demo records, not real listings. The tags show state by
// shape (solid = featured/available, dashed = coming soon, struck = unavailable).
// Replace with real data or remove before public launch (change task 11.1).
export const FEATURED_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80&fit=crop",
    codeKey: "home.featured.cards.oaxaca.code",
    cityKey: "home.featured.cards.oaxaca.city",
    titleKey: "home.featured.cards.oaxaca.title",
    metaKey: "home.featured.cards.oaxaca.meta",
    priceKey: "home.featured.cards.oaxaca.price",
    tagKey: "home.featured.cards.oaxaca.tag",
    tagTone: "accent",
  },
  {
    img: "https://picsum.photos/seed/lisboa-house/800/600",
    codeKey: "home.featured.cards.lisbon.code",
    cityKey: "home.featured.cards.lisbon.city",
    titleKey: "home.featured.cards.lisbon.title",
    metaKey: "home.featured.cards.lisbon.meta",
    priceKey: "home.featured.cards.lisbon.price",
    tagKey: "home.featured.cards.lisbon.tag",
    tagTone: "success",
  },
  {
    img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80&fit=crop",
    codeKey: "home.featured.cards.medellin.code",
    cityKey: "home.featured.cards.medellin.city",
    titleKey: "home.featured.cards.medellin.title",
    metaKey: "home.featured.cards.medellin.meta",
    priceKey: "home.featured.cards.medellin.price",
    tagKey: "home.featured.cards.medellin.tag",
    tagTone: "warning",
  },
] as const;

// SYNTHETIC (NH-118, design.md D8): the four cities are demo tiles, not a statement of
// where inventory exists. Replace with real data before public launch (task 11.1).
export const LOCATION_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80&fit=crop",
    cityKey: "home.locations.cards.oaxaca.city",
    detailKey: "home.locations.cards.oaxaca.detail",
  },
  {
    img: "https://picsum.photos/seed/lisboa-city/800/600",
    cityKey: "home.locations.cards.lisbon.city",
    detailKey: "home.locations.cards.lisbon.detail",
  },
  {
    img: "https://picsum.photos/seed/medellin/800/600",
    cityKey: "home.locations.cards.medellin.city",
    detailKey: "home.locations.cards.medellin.detail",
  },
  {
    img: "https://images.unsplash.com/photo-1574936145840-28808d77a0b6?w=800&q=80&fit=crop",
    cityKey: "home.locations.cards.mexico_city.city",
    detailKey: "home.locations.cards.mexico_city.detail",
  },
] as const;

// SYNTHETIC (NH-118, design.md D8): invented figures, no real source. Replace or remove
// before public launch (task 11.1). The city count mirrors the four LOCATION_CARDS.
export const STAT_ITEMS = [
  { v: "4", lKey: "home.stats.cities_label" },
  { v: "142", lKey: "home.stats.rooms_label" },
  { v: "92%", lKey: "home.stats.occupancy_label" },
  { v: "+62", lKey: "home.stats.nps_label" },
] as const;

export const FOOTER_NAV_COLS = [
  {
    hKey: "home.footer.nav_stay",
    links: [
      "home.footer.link_find_home",
      "home.footer.link_locations",
      "home.footer.link_workspaces",
      "home.footer.link_long_stays",
    ],
  },
  {
    hKey: "home.footer.nav_company",
    links: ["home.footer.link_about", "home.footer.link_become_host", "home.footer.link_careers"],
  },
  {
    hKey: "home.footer.nav_support",
    links: ["home.footer.link_help", "home.footer.link_contact"],
  },
] as const;
