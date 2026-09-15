import fs from "node:fs";
import path from "node:path";
import { isValidEvidenceId } from "@/lib/newsroom/evidence";

/**
 * Dev-only: serves the original evidence PDF for a given evidence ID so an
 * editor can open/verify it directly from /newsroom/[slug] instead of
 * finding it on disk by hand. Gated exactly like /newsroom and
 * /review/images (see those pages' own gate comments) — these PDFs can
 * contain personal information (citizenship numbers, addresses) from real
 * government notices and are deliberately gitignored (see
 * .claude/evidence/README.md's "Security" section); this route must never
 * be reachable once deployed.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  const { id } = await params;
  if (!isValidEvidenceId(id)) {
    return new Response("Invalid evidence ID", { status: 400 });
  }

  const filePath = path.join(process.cwd(), ".claude", "evidence", "processed", id, "original.pdf");
  if (!fs.existsSync(filePath)) {
    return new Response(null, { status: 404 });
  }

  const bytes = fs.readFileSync(filePath);
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${id}.pdf"`,
    },
  });
}
