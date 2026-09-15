import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#fbf8f4",
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 700, color: "#9c2b34" }}>{siteConfig.nameEn}</div>
        <div style={{ fontSize: 30, color: "#5c5450", marginTop: 20 }}>
          Mechinagar Municipality, Jhapa, Nepal
        </div>
        <div style={{ fontSize: 28, color: "#211c1a", marginTop: 40, maxWidth: 900 }}>
          {siteConfig.descriptionEn}
        </div>
      </div>
    ),
    { ...size }
  );
}
