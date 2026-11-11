/**
 * Checklist for a Google Business Profile. The guidance is general good practice, not a ranking
 * recipe. The app never edits the live profile. Google's help can change, so we link to the help
 * centre root rather than to individual articles that may move.
 */
export const HELP_URL = "https://support.google.com/business/";

export const STATUSES = { complete: "Complete", needs_attention: "Needs attention", unknown: "Unknown" } as const;
export type TaskStatus = keyof typeof STATUSES;
export const PRIORITIES = { high: "High", medium: "Medium", low: "Low" } as const;
export type Priority = keyof typeof PRIORITIES;

export type ChecklistItem = { key: string; title: string; guidance: string };

export const ITEMS: ChecklistItem[] = [
  {
    key: "name_category",
    title: "Business name and primary category",
    guidance:
      "Use the name people see on your signage and website. Choose the primary category that best describes your main service, and add secondary categories only if they genuinely apply.",
  },
  {
    key: "description",
    title: "Description",
    guidance:
      "Explain in plain words what you offer and who you help. Keep it factual: avoid promotional claims, health promises you cannot support, and links.",
  },
  {
    key: "hours",
    title: "Regular opening hours",
    guidance: "Make sure the hours match reality, including days you are closed.",
  },
  {
    key: "special_hours",
    title: "Special and holiday hours",
    guidance: "Set holiday or temporary closures ahead of time so people are not sent to a closed clinic.",
  },
  {
    key: "phone_website",
    title: "Phone number and website",
    guidance: "Check the phone rings to the right place and the website link opens the page you intend.",
  },
  {
    key: "address_area",
    title: "Address and service area",
    guidance: "Confirm the address and pin are correct. Set a service area only if you really travel to people.",
  },
  {
    key: "services",
    title: "Services",
    guidance: "List the services you actually provide, using clear names and short factual descriptions.",
  },
  {
    key: "photos",
    title: "Photos",
    guidance: "Add current photos of the entrance, waiting area and treatment rooms. Do not show patients without their written consent.",
  },
  {
    key: "booking",
    title: "Booking link",
    guidance: "If you take online bookings, add the booking link and test it on a phone.",
  },
  {
    key: "other",
    title: "Other profile fields",
    guidance: "Review the remaining fields Google offers for your category (for example attributes or accessibility details) and fill in those that are true.",
  },
];
