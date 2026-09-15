"use client";

import { useState } from "react";
import { newsletterConfig } from "@/lib/data/newsletter";

/**
 * Visual signup form only — no email backend wired up at MVP (see
 * NEWSLETTER_STRATEGY.md). Swap the form body for a beehiiv embed when
 * that integration is ready; the surrounding section markup can stay.
 */
export default function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section
      className={`rounded-md border border-line bg-surface ${compact ? "p-5" : "p-6 sm:p-8"}`}
    >
      <h2 className={compact ? "h-section" : "h-headline"}>{newsletterConfig.headlineNe}</h2>
      <p className="summary-text mt-2">{newsletterConfig.descriptionNe}</p>

      {submitted ? (
        <p className="meta-text mt-4 text-brand font-medium">
          न्यूजलेटर सदस्यता सेवा चाँडै सक्रिय हुनेछ। पर्ख्नुभएकोमा धन्यवाद।
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="mt-4 flex flex-col sm:flex-row gap-3"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            इमेल ठेगाना
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            placeholder="तपाईंको इमेल ठेगाना"
            className="flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {newsletterConfig.ctaLabelNe}
          </button>
        </form>
      )}
    </section>
  );
}
