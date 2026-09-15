import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
      <h1 className="h-display">पृष्ठ भेटिएन</h1>
      <p className="summary-text mt-3">
        तपाईंले खोज्नुभएको पृष्ठ फेला परेन। यो सारिएको वा हटाइएको हुन सक्छ।
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        गृहपृष्ठमा फर्कनुहोस्
      </Link>
    </div>
  );
}
