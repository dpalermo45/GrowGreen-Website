export type NavLink = {
  label: string;
  href: string;
  children?: NavLink[];
};

/** Primary header navigation — logo is home; keep desktop row lean */
export const primaryNav: NavLink[] = [
  {
    label: "Services",
    href: "/services/",
    children: [
      {
        label: "Lawn Fertilization & Weed Control",
        href: "/lawn-fertilization-weed-control/",
      },
      {
        label: "Flower Bed Weed Control",
        href: "/flower-bed-weed-control-and-fertilization/",
      },
      { label: "Fire Ant Treatment", href: "/fire-ant-treatment/" },
      {
        label: "Mosquito, Flea & Tick",
        href: "/mosquito-flea-tick-treatments/",
      },
      { label: "Tree & Shrub Care", href: "/tree-and-shrub-care/" },
      { label: "Lawn Fungus & Insects", href: "/lawn-fungus-and-insects/" },
      { label: "Soil Sampling", href: "/soil-sample/" },
      { label: "Liquid Aeration", href: "/liquid-aeration/" },
      { label: "Core Aeration", href: "/core-aeration/" },
    ],
  },
  { label: "Service Areas", href: "/service-areas/" },
  { label: "About", href: "/about-us/" },
  { label: "Blog", href: "/lawn-care-blog/" },
  { label: "Careers", href: "/careers/" },
  { label: "Contact", href: "/contact-us/" },
];

/** Persistent CTAs (sticky mobile / header actions) */
export const ctaNav = {
  phone: { label: "(225) 461-3199", href: "tel:+12254613199" },
  quote: { label: "Request a Quote", href: "/request-a-quote/" },
  portal: {
    label: "Customer Login",
    href: "/customer-login-pay-bill/",
  },
} as const;

/** Footer link groups */
export const footerNav: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about-us/" },
      { label: "Careers", href: "/careers/" },
      { label: "Contact", href: "/contact-us/" },
      { label: "Blog", href: "/lawn-care-blog/" },
    ],
  },
  {
    heading: "Services",
    links: [
      {
        label: "Lawn Fertilization & Weed Control",
        href: "/lawn-fertilization-weed-control/",
      },
      {
        label: "Flower Bed Weed Control",
        href: "/flower-bed-weed-control-and-fertilization/",
      },
      { label: "Fire Ant Treatment", href: "/fire-ant-treatment/" },
      {
        label: "Mosquito, Flea & Tick",
        href: "/mosquito-flea-tick-treatments/",
      },
      { label: "Tree & Shrub Care", href: "/tree-and-shrub-care/" },
      { label: "Lawn Fungus & Insects", href: "/lawn-fungus-and-insects/" },
      { label: "Soil Sampling", href: "/soil-sample/" },
      { label: "Liquid Aeration", href: "/liquid-aeration/" },
      { label: "Core Aeration", href: "/core-aeration/" },
      { label: "All Services", href: "/services/" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Request a Quote", href: "/request-a-quote/" },
      { label: "Service Areas", href: "/service-areas/" },
      { label: "Customer Portal", href: "/customer-login-pay-bill/" },
      { label: "Privacy Policy", href: "/privacy-policy/" },
      { label: "Terms & Conditions", href: "/terms-and-conditions/" },
    ],
  },
];
