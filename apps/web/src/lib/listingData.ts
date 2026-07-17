export const AMENITIES = [
  { code: "wifi", label: "Wi-Fi" },
  { code: "kitchen", label: "Kitchen" },
  { code: "workspace_desk", label: "Dedicated desk" },
  { code: "meeting_room", label: "Meeting room" },
  { code: "phone_booth", label: "Phone booth" },
  { code: "laundry", label: "Laundry" },
  { code: "air_conditioning", label: "Air conditioning" },
  { code: "heating", label: "Heating" },
  { code: "parking", label: "Parking" },
  { code: "coffee", label: "Coffee" },
] as const;

export interface OptionItem {
  code: string;
  label: string;
}

export interface OptionGroup {
  group: string;
  options: OptionItem[];
}

export const COUNTRIES: OptionGroup[] = [
  {
    group: "European Union",
    options: [
      { code: "AT", label: "Austria" },
      { code: "BE", label: "Belgium" },
      { code: "BG", label: "Bulgaria" },
      { code: "HR", label: "Croatia" },
      { code: "CY", label: "Cyprus" },
      { code: "CZ", label: "Czech Republic" },
      { code: "DK", label: "Denmark" },
      { code: "EE", label: "Estonia" },
      { code: "FI", label: "Finland" },
      { code: "FR", label: "France" },
      { code: "DE", label: "Germany" },
      { code: "GR", label: "Greece" },
      { code: "HU", label: "Hungary" },
      { code: "IE", label: "Ireland" },
      { code: "IT", label: "Italy" },
      { code: "LV", label: "Latvia" },
      { code: "LT", label: "Lithuania" },
      { code: "LU", label: "Luxembourg" },
      { code: "MT", label: "Malta" },
      { code: "NL", label: "Netherlands" },
      { code: "PL", label: "Poland" },
      { code: "PT", label: "Portugal" },
      { code: "RO", label: "Romania" },
      { code: "SK", label: "Slovakia" },
      { code: "SI", label: "Slovenia" },
      { code: "ES", label: "Spain" },
      { code: "SE", label: "Sweden" },
    ],
  },
  {
    group: "North America",
    options: [
      { code: "CA", label: "Canada" },
      { code: "CR", label: "Costa Rica" },
      { code: "GT", label: "Guatemala" },
      { code: "MX", label: "Mexico" },
      { code: "PA", label: "Panama" },
      { code: "US", label: "United States" },
    ],
  },
  {
    group: "South America",
    options: [
      { code: "AR", label: "Argentina" },
      { code: "BO", label: "Bolivia" },
      { code: "BR", label: "Brazil" },
      { code: "CL", label: "Chile" },
      { code: "CO", label: "Colombia" },
      { code: "EC", label: "Ecuador" },
      { code: "PY", label: "Paraguay" },
      { code: "PE", label: "Peru" },
      { code: "UY", label: "Uruguay" },
      { code: "VE", label: "Venezuela" },
    ],
  },
  {
    group: "Asia",
    options: [
      { code: "BD", label: "Bangladesh" },
      { code: "CN", label: "China" },
      { code: "IN", label: "India" },
      { code: "ID", label: "Indonesia" },
      { code: "JP", label: "Japan" },
      { code: "MY", label: "Malaysia" },
      { code: "NP", label: "Nepal" },
      { code: "PH", label: "Philippines" },
      { code: "SG", label: "Singapore" },
      { code: "KR", label: "South Korea" },
      { code: "LK", label: "Sri Lanka" },
      { code: "TW", label: "Taiwan" },
      { code: "TH", label: "Thailand" },
      { code: "VN", label: "Vietnam" },
    ],
  },
];

export const CURRENCIES: OptionGroup[] = [
  {
    group: "European Union",
    options: [
      { code: "EUR", label: "EUR — Euro" },
      { code: "BGN", label: "BGN — Bulgarian Lev" },
      { code: "CZK", label: "CZK — Czech Koruna" },
      { code: "DKK", label: "DKK — Danish Krone" },
      { code: "HUF", label: "HUF — Hungarian Forint" },
      { code: "PLN", label: "PLN — Polish Złoty" },
      { code: "RON", label: "RON — Romanian Leu" },
      { code: "SEK", label: "SEK — Swedish Krona" },
    ],
  },
  {
    group: "North America",
    options: [
      { code: "USD", label: "USD — US Dollar" },
      { code: "CAD", label: "CAD — Canadian Dollar" },
      { code: "MXN", label: "MXN — Mexican Peso" },
      { code: "CRC", label: "CRC — Costa Rican Colón" },
      { code: "GTQ", label: "GTQ — Guatemalan Quetzal" },
    ],
  },
  {
    group: "South America",
    options: [
      { code: "ARS", label: "ARS — Argentine Peso" },
      { code: "BOB", label: "BOB — Bolivian Boliviano" },
      { code: "BRL", label: "BRL — Brazilian Real" },
      { code: "CLP", label: "CLP — Chilean Peso" },
      { code: "COP", label: "COP — Colombian Peso" },
      { code: "PYG", label: "PYG — Paraguayan Guaraní" },
      { code: "PEN", label: "PEN — Peruvian Sol" },
      { code: "UYU", label: "UYU — Uruguayan Peso" },
    ],
  },
  {
    group: "Asia",
    options: [
      { code: "BDT", label: "BDT — Bangladeshi Taka" },
      { code: "CNY", label: "CNY — Chinese Yuan" },
      { code: "INR", label: "INR — Indian Rupee" },
      { code: "IDR", label: "IDR — Indonesian Rupiah" },
      { code: "JPY", label: "JPY — Japanese Yen" },
      { code: "MYR", label: "MYR — Malaysian Ringgit" },
      { code: "NPR", label: "NPR — Nepalese Rupee" },
      { code: "PHP", label: "PHP — Philippine Peso" },
      { code: "SGD", label: "SGD — Singapore Dollar" },
      { code: "KRW", label: "KRW — South Korean Won" },
      { code: "LKR", label: "LKR — Sri Lankan Rupee" },
      { code: "TWD", label: "TWD — New Taiwan Dollar" },
      { code: "THB", label: "THB — Thai Baht" },
      { code: "VND", label: "VND — Vietnamese Đồng" },
    ],
  },
];

export const ALL_COUNTRY_CODES = COUNTRIES.flatMap((g) => g.options.map((o) => o.code));
export const ALL_CURRENCY_CODES = CURRENCIES.flatMap((g) => g.options.map((o) => o.code));
