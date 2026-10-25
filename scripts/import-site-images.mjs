// One-off import of Clinex Pro's photos from their WordPress site into public/images.
// Card photos on the old site have a dark overlay baked in (text sat on top of
// them); those are brightened here so they read naturally as plain photos.
//
//   node scripts/import-site-images.mjs <folder with the downloaded originals>
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [src] = process.argv.slice(2);
if (!src) throw new Error("Pass the folder containing the downloaded images");
const out = path.join(process.cwd(), "public", "images");
fs.mkdirSync(path.join(out, "services"), { recursive: true });

const jobs = [
  // [source file, destination, brighten?]
  ["Maid_Service.jpg", "services/home-cleaning.jpg", true],
  ["Floor_Cleaning.jpg", "services/deep-cleaning.jpg", true],
  ["Card_1.jpg", "services/maid-service.jpg", false],
  ["Sofa_Cleaning.jpg", "services/sofa-carpet.jpg", true],
  ["Outdoor_Cleaning.jpg", "services/pressure-washing.jpg", true],
  ["Card_5.jpg", "services/office-cleaning.jpg", false],
  ["House_Keeping.jpg", "services/hotel-hospitality.jpg", true],
  ["cta.jpg", "family-booking.jpg", false],
  ["Hero_img.png", "hero-cleaner.png", false],
  ["Contact-img.png", "cleaner-supplies.png", false],
  ["Map.png", "mauritius-map.png", false],
];

for (const [file, dest, brighten] of jobs) {
  let img = sharp(path.join(src, file));
  if (brighten) img = img.modulate({ brightness: 1.45, saturation: 1.1 }).linear(1.05, -6);
  img = dest.endsWith(".png") ? img.png({ compressionLevel: 9 }) : img.jpeg({ quality: 82, mozjpeg: true });
  const info = await img.toFile(path.join(out, dest));
  console.log(`${dest}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
}
