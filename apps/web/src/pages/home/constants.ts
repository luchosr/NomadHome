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

export const FEATURED_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80&fit=crop",
    city: "Oaxaca · MX",
    title: "Casa del Fig",
    meta: "6 rooms · coworking · courtyard with a fig tree",
    price: "MX$ 18,500 / mo",
    tag: "Featured",
    left: "3 rooms left",
  },
  {
    img: "https://picsum.photos/seed/lisboa-house/800/600",
    city: "Lisboa · PT",
    title: "A Quinta",
    meta: "4 rooms · garden · 10 min from the beach",
    price: "€ 1,250 / mo",
    left: "4 rooms left",
  },
  {
    img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80&fit=crop",
    city: "Medellín · CO",
    title: "El Poblado",
    meta: "8 rooms · big coworking · rooftop pool",
    price: "COP 3.2M / mo",
    left: "Waitlist",
  },
] as const;

export const LOCATION_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80&fit=crop",
    city: "Oaxaca",
    ct: "México · 2 houses",
  },
  {
    img: "https://picsum.photos/seed/lisboa-city/800/600",
    city: "Lisboa",
    ct: "Portugal · 1 house",
  },
  {
    img: "https://picsum.photos/seed/medellin/800/600",
    city: "Medellín",
    ct: "Colombia · 1 house",
  },
  {
    img: "https://images.unsplash.com/photo-1574936145840-28808d77a0b6?w=800&q=80&fit=crop",
    city: "CDMX",
    ct: "México · 1 house",
  },
] as const;

export const STAT_ITEMS = [
  { v: "9", lKey: "home.stats.cities_label" },
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
    links: [
      "home.footer.link_about",
      "home.footer.link_become_host",
      "home.footer.link_community",
      "home.footer.link_careers",
    ],
  },
  {
    hKey: "home.footer.nav_support",
    links: ["home.footer.link_help", "home.footer.link_house_rules", "home.footer.link_contact"],
  },
] as const;
