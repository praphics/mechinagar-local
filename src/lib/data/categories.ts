import type { Category } from "@/lib/types";

/**
 * Flat, extensible category list per WEBSITE_STRUCTURE.md §3 — adding a
 * future section (Jobs, Events, ...) is adding a row here, not redesigning
 * the site. Only the MVP launch set is included for now.
 */
export const categories: Category[] = [
  {
    slug: "local-news",
    nameNe: "स्थानीय समाचार",
    nameEn: "Local News",
    descriptionNe: "मेचीनगर क्षेत्रका सामान्य समाचार, जुन अरू कुनै विशेष श्रेणीमा नपर्ने।",
  },
  {
    slug: "government",
    nameNe: "सरकार तथा सूचना",
    nameEn: "Government & Announcements",
    descriptionNe: "मेचीनगर नगरपालिका, वडा कार्यालय र जिल्ला प्रशासन कार्यालय झापाका सूचनाहरू।",
  },
  {
    slug: "kakarvitta-border",
    nameNe: "काकरभिट्टा सीमा",
    nameEn: "Kakarvitta Border",
    descriptionNe: "काकरभिट्टा नाकाको भन्सार, आप्रवासन, र सीमापार व्यापार सम्बन्धी अपडेट।",
  },
  {
    slug: "business",
    nameNe: "व्यापार तथा अर्थतन्त्र",
    nameEn: "Business & Economy",
    descriptionNe: "स्थानीय व्यापार, बजार गतिविधि र साना उद्योग सम्बन्धी समाचार।",
  },
  {
    slug: "community",
    nameNe: "समुदाय",
    nameEn: "Community",
    descriptionNe: "स्थानीय घटना, सामुदायिक संस्था र मानवीय कथाहरू।",
  },
  {
    slug: "infrastructure",
    nameNe: "सडक तथा पूर्वाधार",
    nameEn: "Roads & Infrastructure",
    descriptionNe: "सडक अवस्था, निर्माण कार्य र मेची राजमार्ग सम्बन्धी स्थानीय असर।",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
