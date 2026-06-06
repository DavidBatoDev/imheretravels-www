import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/**
 * POST /api/revalidate — on-demand ISR revalidation.
 *
 * The admin pings this after any tour/host mutation (and `migrate.ts revalidate`
 * after migrations) so changes appear on the next visit instead of waiting for
 * the time-based `revalidate` window.
 *
 * Auth: `x-revalidate-secret` header must equal REVALIDATE_SECRET.
 * Body: { all?: boolean; paths?: string[] }
 *   - all / default → revalidatePath("/", "layout")  (whole site incl. nav)
 *   - paths         → revalidatePath(p) for each      (targeted / manual)
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { revalidated: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 500 },
    );
  }

  const provided =
    request.headers.get("x-revalidate-secret") ??
    new URL(request.url).searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json(
      { revalidated: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: { all?: boolean; paths?: string[] } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // No/invalid body → treat as a whole-site revalidation.
  }

  const paths = Array.isArray(body.paths) ? body.paths.filter(Boolean) : [];

  if (paths.length > 0) {
    for (const path of paths) revalidatePath(path);
  } else {
    // Whole site: the nav lives in the root layout, so revalidate the layout.
    revalidatePath("/", "layout");
  }

  return NextResponse.json({
    revalidated: true,
    all: paths.length === 0,
    paths,
    now: Date.now(),
  });
}
