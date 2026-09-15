import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { getNepalNow } from "@/lib/datetime";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-lg font-bold text-brand">मेचीनगर लोकल</span>
            <p className="meta-text mt-2">{siteConfig.descriptionNe}</p>
          </div>

          <div>
            <h4 className="eyebrow mb-3">बारेमा</h4>
            <ul className="flex flex-col gap-2">
              <li><Link href="/about" className="meta-text hover:text-brand">हाम्रो बारेमा</Link></li>
              <li><Link href="/about#corrections" className="meta-text hover:text-brand">सच्याइएका त्रुटिहरू</Link></li>
              <li><Link href="/submit" className="meta-text hover:text-brand">सूचना/समाचार पठाउनुहोस्</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow mb-3">न्यूजलेटर</h4>
            <ul className="flex flex-col gap-2">
              <li><Link href="/newsletter" className="meta-text hover:text-brand">सदस्यता लिनुहोस्</Link></li>
              <li><Link href="/search" className="meta-text hover:text-brand">समाचार खोज्नुहोस्</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow mb-3">सामाजिक सञ्जाल</h4>
            <p className="meta-text">छिट्टै आउँदैछ</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-line meta-text">
          © {getNepalNow().getFullYear()} मेचीनगर लोकल — {siteConfig.nameEn}
        </div>
      </div>
    </footer>
  );
}
