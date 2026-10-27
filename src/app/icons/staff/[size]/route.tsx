import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

const SIZES = [180, 192, 512];

export const dynamicParams = false;
export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

// Staff app icon: the "C" mark on a white disc over navy, so it is easy to tell
// apart from the customer app on a cleaner's home screen. Inset for maskable crops.
export async function GET(_req: Request, ctx: RouteContext<"/icons/staff/[size]">) {
  const size = Number((await ctx.params).size);
  const mark = await fs.readFile(path.join(process.cwd(), "public", "brand", "icon-512.png"));
  const src = `data:image/png;base64,${mark.toString("base64")}`;
  const disc = Math.round(size * 0.62);
  const inner = Math.round(disc * 0.78);
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, background: "#031432", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: disc, height: disc, borderRadius: disc, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", border: `${Math.max(2, Math.round(size * 0.02))}px solid #fc511d` }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
          <img src={src} width={inner} height={inner} alt="" />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
