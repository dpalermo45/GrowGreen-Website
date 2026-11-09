import type { CareerOpening } from "./types";

/** Sample openings for local mock preview when CRM is not called. */
export const mockCareerOpenings: CareerOpening[] = [
  {
    slug: "lawn-treatment-technician",
    title: "Lawn Treatment Technician",
    summary:
      "Apply seasonal lawn treatments on local routes, document lawn conditions, and represent Grow Green with professionalism.",
    employment_type: "full_time",
    employment_type_label: "Full-time",
    location: "Greater Baton Rouge, LA",
    pay_min: 18,
    pay_max: 24,
    pay_unit: "hour",
    pay_unit_label: "per hour",
    incentive: "Production commission available",
    date_posted: new Date().toISOString().slice(0, 10),
    requires_technician_screening: true,
  },
  {
    slug: "part-time-office-assistant",
    title: "Part-Time Office Assistant",
    summary:
      "Support scheduling, customer communication, and day-to-day office coordination for our local team.",
    employment_type: "part_time",
    employment_type_label: "Part-time",
    location: "St. Amant, LA",
    pay_min: 15,
    pay_max: 18,
    pay_unit: "hour",
    pay_unit_label: "per hour",
    date_posted: new Date().toISOString().slice(0, 10),
    requires_technician_screening: false,
  },
];
