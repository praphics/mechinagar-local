import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "सूचना पठाउनुहोस्",
  description: "मेचीनगर लोकललाई समाचार, सूचना वा सुझाव कसरी पठाउने।",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="h-display">सूचना पठाउनुहोस्</h1>
      <p className="summary-text mt-3">
        तपाईंसँग मेचीनगर वरपरको कुनै समाचार, घटना, सरकारी सूचना, वा सुधार्नुपर्ने कुरा छ भने
        हामीलाई जानकारी गराउनुहोस्। सबै सूचनाहरू सम्पादकद्वारा जाँच गरिन्छ र आवश्यक परे मात्र
        प्रकाशित गरिन्छ — यो खुला प्रकाशन प्रणाली होइन।
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <div className="rounded-md border border-line bg-surface px-4 py-4">
          <h2 className="h-section">के पठाउन सकिन्छ?</h2>
          <ul className="summary-text mt-2 list-disc pl-5 flex flex-col gap-1">
            <li>स्थानीय समाचार वा घटनाको जानकारी</li>
            <li>सरकारी वा वडा कार्यालयको सूचना</li>
            <li>समुदायिक कार्यक्रम</li>
            <li>कुनै प्रकाशित समाचारमा भएको त्रुटिको सुधार</li>
          </ul>
        </div>

        <div className="rounded-md border border-line bg-surface px-4 py-4">
          <h2 className="h-section">कसरी पठाउने?</h2>
          <p className="summary-text mt-2">
            इमेलमार्फत विवरण, मिति र सम्भव भए स्रोतसहित पठाउनुहोस्:
          </p>
          <a
            href="mailto:submit@mechinagarlocal.com.np"
            className="mt-2 inline-block font-semibold text-brand hover:underline"
          >
            submit@mechinagarlocal.com.np
          </a>
        </div>
      </div>
    </div>
  );
}
