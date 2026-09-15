import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "बारेमा",
  description: "मेचीनगर लोकलको उद्देश्य, सम्पर्क र सच्याइएका त्रुटिहरू सम्बन्धी नीति।",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-10">
      <div>
        <h1 className="h-display">मेचीनगर लोकलको बारेमा</h1>
        <p className="summary-text mt-3">{siteConfig.descriptionNe}</p>
        <p className="summary-text mt-3">
          हाम्रो उद्देश्य हरेक दिन &ldquo;मेचीनगरमा आज के भइरहेको छ?&rdquo; भन्ने प्रश्नको छिटो र
          भरपर्दो जवाफ दिनु हो — काकरभिट्टा, धुलाबारी, इटाभिट्टा, चराली लगायत वरपरका वडाहरूको
          स्थानीय समाचार, सरकारी सूचना र सामुदायिक जानकारी एकै ठाउँमा।
        </p>
      </div>

      <div>
        <h2 className="h-section">सम्पर्क / सूचना पठाउनुहोस्</h2>
        <p className="summary-text mt-2">
          कुनै समाचार, सूचना, वा सुझाव पठाउन चाहनुहुन्छ भने{" "}
          <Link href="/submit" className="text-brand hover:underline">
            सूचना पठाउनुहोस्
          </Link>{" "}
          पृष्ठ हेर्नुहोस्।
        </p>
      </div>

      <div id="corrections">
        <h2 className="h-section">सच्याइएका त्रुटिहरू</h2>
        <p className="summary-text mt-2">
          हामी सही जानकारी दिन प्रतिबद्ध छौं। कुनै त्रुटि भेटिएमा हामी सच्याउँछौं र सच्याइएको
          कुरा स्पष्ट रूपमा सम्बन्धित समाचारमा &ldquo;अद्यावधिक&rdquo; चिन्हसहित देखाउँछौं — कुनै
          पनि सच्याइ लुकाइँदैन।
        </p>
      </div>

      <div className="rounded-md border border-line bg-surface px-4 py-3 meta-text">
        नोट: यो साइट हाल विकास/डिजाइन समीक्षाका लागि नमूना (sample) समाचार सामग्रीसहित निर्माणाधीन
        छ। यहाँ देखिने समाचारहरू वास्तविक प्रतिवेदन होइनन् — पूर्ण प्रकाशन अघि यिनलाई वास्तविक,
        प्रमाणित समाचारले प्रतिस्थापन गरिनेछ।
      </div>
    </div>
  );
}
