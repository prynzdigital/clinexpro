import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

const SIZES = [180, 192, 512];

export const dynamicParams = false;
export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

// App icon: the Clinex Pro "C" mark on white, inset to stay inside the
// maskable safe zone so Android's circle/squircle crops never cut it.
export async function GET(_req: Request, ctx: RouteContext<"/icons/[size]">) {
  const size = Number((await ctx.params).size);
  const mark = await fs.readFile(path.join(process.cwd(), "public", "brand", "icon-512.png"));
  const src = `data:image/png;base64,${mark.toString("base64")}`;
  const inner = Math.round(size * 0.72);
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
        <img src={src} width={inner} height={inner} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
