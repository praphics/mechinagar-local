import Link from "next/link";
import { getCategoryBySlug } from "@/lib/data/categories";

export default function CategoryTag({ categorySlug }: { categorySlug: string }) {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return null;

  return (
    <Link href={`/category/${category.slug}`} className="eyebrow hover:underline">
      {category.nameNe}
    </Link>
  );
}
