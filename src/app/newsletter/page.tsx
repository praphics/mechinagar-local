import type { Metadata } from "next";
import NewsletterSignup from "@/components/NewsletterSignup";

export const metadata: Metadata = {
  title: "न्यूजलेटर",
  description: "मेचीनगर लोकलको साप्ताहिक न्यूजलेटरमा सदस्यता लिनुहोस्।",
};

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="h-display">न्यूजलेटर</h1>
      <p className="summary-text mt-3">
        हरेक हप्ता मेचीनगर र वरपरका क्षेत्रका महत्त्वपूर्ण समाचार, सरकारी सूचना, र स्थानीय
        गतिविधिहरूको छोटो सारांश सिधै तपाईंको इमेल इनबक्समा पाउनुहोस्। कुनै स्प्याम छैन, जहिले
        पनि सदस्यता रद्द गर्न सकिन्छ।
      </p>

      <div className="mt-8">
        <NewsletterSignup />
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <div>
          <h2 className="h-section">के पाउनुहुन्छ?</h2>
          <ul className="summary-text mt-2 list-disc pl-5 flex flex-col gap-1">
            <li>हप्ताभरका महत्त्वपूर्ण स्थानीय समाचारको सारांश</li>
            <li>सरकारी तथा नगरपालिकाका सूचनाहरू</li>
            <li>काकरभिट्टा सीमा र व्यापार सम्बन्धी अपडेट</li>
          </ul>
        </div>
        <div>
          <h2 className="h-section">कतिपटक?</h2>
          <p className="summary-text mt-2">
            हप्तामा एक पटक — दैनिक इमेलले भन्दा नियमित र भरपर्दो जानकारी दिने लक्ष्यका साथ।
          </p>
        </div>
      </div>
    </div>
  );
}
