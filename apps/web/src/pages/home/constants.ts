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

// Editorial destination links (design.md D10): city names that preselect the search page.
// They make no claim about inventory, price or availability.
export const LOCATION_CARDS = [
  {
    cityKey: "home.locations.cards.oaxaca.city",
    detailKey: "home.locations.cards.oaxaca.detail",
  },
  {
    cityKey: "home.locations.cards.lisbon.city",
    detailKey: "home.locations.cards.lisbon.detail",
  },
  {
    cityKey: "home.locations.cards.medellin.city",
    detailKey: "home.locations.cards.medellin.detail",
  },
  {
    cityKey: "home.locations.cards.mexico_city.city",
    detailKey: "home.locations.cards.mexico_city.detail",
  },
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
