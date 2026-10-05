import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { SITE } from '../content/site.config';

async function generateFavicon() {
  const rootDir = process.cwd();
  const svgRelativePath = SITE.brand.logo.src.replace(/^\//, '');
  const svgPath = path.resolve(rootDir, 'public', svgRelativePath);
  const outputPngPath = path.resolve(rootDir, 'app', 'icon.png');

  if (!fs.existsSync(svgPath)) {
    throw new Error(`Logo source not found at ${svgPath}`);
  }

  const inputBuffer = fs.readFileSync(svgPath);

  await sharp(inputBuffer).resize(512, 512).png().toFile(outputPngPath);

  console.log(`✓ Generated ${outputPngPath} (512x512) from ${SITE.brand.logo.src}`);
}

generateFavicon().catch((err) => {
  console.error(err);
  process.exit(1);
});
