import Link from "next/link";
import { categories } from "@/lib/data/categories";

export default function CategoryShortcuts() {
  return (
    <nav aria-label="श्रेणीहरू">
      <ul className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/category/${category.slug}`}
              className="inline-flex items-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand"
            >
              {category.nameNe}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
