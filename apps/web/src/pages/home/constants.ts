export const WRAP = "mx-auto w-full max-w-[1280px] px-6 md:px-12";

export const GRADIENTS: Record<string, string> = {
  twilight: "bg-gradient-to-br from-[#D97757] via-[#8C3E20] to-[#2E4A3F]",
  forest: "bg-gradient-to-br from-[#B8C9C1] via-[#4A6F61] to-[#1C2E27]",
  morning: "bg-gradient-to-b from-[#F2C9B5] via-[#FBF8F2] to-[#B8C9C1]",
  night: "bg-gradient-to-br from-[#4A6F61] via-[#2E4A3F] to-[#1A1A1A]",
  sand: "bg-gradient-to-br from-[#FBF8F2] via-[#DDD2BE] to-[#C4B59B]",
  terracotta: "bg-gradient-to-br from-[#F2C9B5] via-[#D97757] to-[#8C3E20]",
};

export const STAR_RATING = Array.from({ length: 5 }, (_, i) => i);

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

export const LOCATION_CARDS = [
  { grad: "twilight", city: "Oaxaca", ct: "México · 2 houses" },
  { grad: "forest", city: "Lisboa", ct: "Portugal · 1 house" },
  { grad: "night", city: "Medellín", ct: "Colombia · 1 house" },
  { grad: "terracotta", city: "CDMX", ct: "México · 1 house" },
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
