import pg from "pg";
import { env, requireEnv } from "../lib/env";

const PRODUCT_DATA = `
CL130 - Manual (Professional Model),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/13-PROFESSIONAL-MODEL.jpg
CL130 - Manual (New Model),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/13-NEW-MODEL.jpg
CL130 - Manual (Eco Model),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/13-MANUAL.jpg
CL130 - AUTO (Fully-Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/13-SEMI-AUTO.jpg
CL 220 - Manual (New Model),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/22-NEW-MODEL.jpg
CL 220 - Manual (Professional Model),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/22-PROFESSIONAL-MODEL.jpg
CL 220 - AUTO (Semi Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/22-SEMI-AUTO.jpg
CL 220 - AUTO (Fully Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/22-AUTO-WITH-STAND.jpg
CL 320 Manual,https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/32-MANUAL.jpg
CL 320 Professional Model (Manual),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/32-PROFESSIONAL-MODEL.jpg
CL 320 AUTO (Semi Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/32-SEMI-AUTO.jpg
CL 320 AUTO (Fully Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/32-FULLY-AUTO.jpg
CL 320 Flatbed Laminator,https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/32-FLATBED-LAMINATOR.jpg
CL 420 Manual (Professional Model),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/42-MANUAL.jpg
CL 520 Manual (Professional Model),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/52-MANUAL.jpg
CL 520 AUTO (Semi Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/52-SEMI-AUTO.jpg
CL 520 AUTO (Fully Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/52-FULLY-AUTO.jpg
CL 620 Manual (Professional Model),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/62-MANUAL.jpg
CL 620 AUTO (Semi Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/62-SEMI-AUTO.jpg
CL 620 AUTO (Fully Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/05/62-FULLY-AITO.jpg
CL 620 Flatbed Laminator,https://www.fotolaminate.com/wp-content/uploads/2024/05/62-FLATBED-LAMINATOR.jpg
UV (Ultra Violet) Coating Machine,https://www.fotolaminate.com/wp-content/uploads/2024/05/CL20-UV.jpg
"All in One Machine: Creasing, Hot Aligner, Hot & Cold Press",https://www.fotolaminate.com/wp-content/uploads/2024/05/ALL-IN-1-2.jpg
Album Cutter with Stand (Manual),https://www.fotolaminate.com/wp-content/uploads/2024/05/20-ALBUM-CUTTER-STAND.jpg
Hot Gluing Machine with Speed Control System,https://www.fotolaminate.com/wp-content/uploads/2024/09/1-14-HOT-MELT-GLUEING-MACHINE_1.jpg
Cold Press (Manual),https://www.fotolaminate.com/wp-content/uploads/2024/05/COLD-PRESS-MANUAL.jpg
HOT Gliding and Burnishing Machine,https://www.fotolaminate.com/wp-content/uploads/2024/05/HOT-GILDING-BURNISHING-MACHINE.jpg
Roll to Sheet Cutter,https://www.fotolaminate.com/wp-content/uploads/2024/05/ROLL-TO-SHEET-CUTTER-1.jpg
3mm MDF Board Cutter,https://www.fotolaminate.com/wp-content/uploads/2024/09/3MM-MDF-CUTTER.jpg
Round Corner Cutter (Manual),https://www.fotolaminate.com/wp-content/uploads/2024/05/ROUND-CUTTER-MANUAL.jpg
Round Corner Cutter (Auto),https://www.fotolaminate.com/wp-content/uploads/2024/05/ROUND-CUTTER-AUTO-1.jpg
Thermal Lamination Machine 14 inch,https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/2-14-THERMAL-LAMINATION-MACHINE-1.jpg
Thermal Lamination Machine 14-Inch,https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/3-14-THERMAL-LAMINATION-MACHINE.jpg
Thermal Lamination Machine 20-Inch,https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/5-20-THERMAL-LAMINATION-MACHINE.jpg
Window Dye Cutter 20-Inch,https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/7-WINDOW-DYE-CUTTER.jpg
V Window Dye Cutter,https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/8-V-WINDOW-DYE-CUTTER.jpg
Window Dye Cutter with Stapling Table,https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/9-WINDOW-DYE-CUTTER-WITH-STAPLER-TABLE-WHOLE-PUNCH.jpg
Pinning Machine (Manual),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/1-PINNING-MACHINE-MANUAL.jpg
Pinning Machine (Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/2-PINNING-MACHINE-AUTO.jpg
45-Degree V Cutter (Manual),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/3-V-FRAME-CUTTER-MANUAL-1.jpg
45-Degree Circular Cutter (Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/4-45°-CIRCULAR-CUTTER-AUTO.jpg
45-Degree Cutter (Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/5-45°-CIRCULAR-CUTTER-AUTO-1.jpg
45-Degree Double Saw Blade Cutter (Auto),https://www.fotolaminate.com/wp-content/uploads/2024/07/8.jpg
Board Buffing Machine (Auto),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/7-45°-BOARD-BUFFING-MACHINE.jpg
45-Degree PVC Beading Cutter (Auto),https://www.fotolaminate.com/wp-content/uploads/2024/07/9.jpg
45-Degree Aluminum Cutter (Auto),https://www.fotolaminate.com/wp-content/uploads/2024/07/10.jpg
Grooving Machine (Manual),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/v-grooving-machine-manual.jpg
Grooving Machine (AUTO),https://devupwork.v2web.in/fotolaminate/wp-content/uploads/2024/07/v-grooving-machine-auto.jpg
Hot Melt Gluing Machine (Auto) - 20 Inch,https://www.fotolaminate.com/wp-content/uploads/2024/08/2-20-HOT-MELT-GLUEING-MACHINE_1.jpg
Hot Melt Gluing Machine (Auto) -14 Inch,https://www.fotolaminate.com/wp-content/uploads/2024/09/1-14-HOT-MELT-GLUEING-MACHINE_1.jpg
Hot Melt Gluing Machine with Stand (Auto),https://www.fotolaminate.com/wp-content/uploads/2024/09/3-HOT-GLUEING-MACHINE-WITH-STAND_1.jpg
Hot Melt gluing Machine (Semi Auto),https://www.fotolaminate.com/wp-content/uploads/2024/09/4-HOT-GLUEING-MACHINE-SEMI-AUTO_1.jpg
Hot Gluing Machine Pneumatic System (Fully Auto),https://www.fotolaminate.com/wp-content/uploads/2024/09/5-HOT-GLUEING-MACHINE-FULLY-AUTO-WITH-PNUMATIC-SYSTEM_1.jpg
Gluing Machine Side Edge (Auto),https://www.fotolaminate.com/wp-content/uploads/2024/09/6-GLUEING-MACHINE-SIDE-EDGE_1.jpg
Cold Gluing Machine (Auto) - 15 Inch,https://www.fotolaminate.com/wp-content/uploads/2024/09/7-15-COLD-GLUEING-MACHINE_1.jpg
"Cold Gluing, Folding & Pasting Machine (Auto)",https://www.fotolaminate.com/wp-content/uploads/2024/09/9-22-COLD-GLUEING-FOLDING-PASTING-MACHINE_1.jpg
Cold Gluing Machine (Auto) - 32 Inch,https://www.fotolaminate.com/wp-content/uploads/2024/09/8-32-COLD-GLUEING-MACHINE-AUTO_1.jpg
`;

function extractRelativePath(absUrl: string) {
  const match = absUrl.match(/\/2024\/.*$/);
  return match ? match[0] : null;
}

function parseCsv(csv: string) {
  const lines = csv.trim().split("\n");
  const results: { name: string; url: string }[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Simple CSV parser for quoted names
    let name = "";
    let url = "";
    if (line.startsWith('"')) {
      const closingQuoteIdx = line.indexOf('"', 1);
      name = line.slice(1, closingQuoteIdx);
      url = line.slice(closingQuoteIdx + 2).trim(); // Skip ", "
    } else {
      const firstComma = line.indexOf(",");
      name = line.slice(0, firstComma).trim();
      url = line.slice(firstComma + 1).trim();
    }
    results.push({ name, url });
  }
  return results;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const connectionString = requireEnv(env.supabasePoolerConnectionString, "SUPABASE_POOLER_CONNECTION_STRING");

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const products = parseCsv(PRODUCT_DATA);
  process.stdout.write(`Parsed ${products.length} products from input.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  try {
    for (const p of products) {
      const relPath = extractRelativePath(p.url);
      if (!relPath) {
        process.stdout.write(`Skipping ${p.name}: could not extract relative path from ${p.url}\n`);
        skippedCount++;
        continue;
      }

      // Manual overrides for known discrepancies
      const MANUAL_MAPPING: Record<string, string> = {
        "CL130 - Manual (Eco Model)": "CL130 Manual (Economy Model)",
        "Pinning Machine (Auto)": "Pinning Machine Auto with Pneumatic System",
        "45-Degree V Cutter (Manual)": "45° V Frame Cutter Machine Manual",
        "Grooving Machine (AUTO)": "V Grooving Machine Auto",
        "Grooving Machine (Manual)": "V Grooving Machine Manual",
        "Round Corner Cutter (Manual)": "Round Corner Cutter Manual",
        "Round Corner Cutter (Auto)": "ROUND CORNER CUTTER AUTO",
        "CL 320 Manual": "CL320 Manual (Professional Model)",
        "CL 320 Professional Model (Manual)": "CL320 Manual (Professional Model)",
        "Thermal Lamination Machine 14 inch": "14 Inch Thermal Lamination Machine",
        "Thermal Lamination Machine 14-Inch": "14 Inch Thermal Lamination Machine with Stand",
        "Thermal Lamination Machine 20-Inch": "20 Inch Thermal Lamination Machine with Stand",
        "Hot Melt Gluing Machine (Auto) - 20 Inch": "20 Inch Hot Glueing Machine",
        "Hot Melt Gluing Machine (Auto) -14 Inch": "14 Inch Hot Melt Glueing Machine",
        "Hot Melt Gluing Machine with Stand (Auto)": "Hot Glueing Machine with Stand (Auto)",
        "Hot Melt gluing Machine (Semi Auto)": "Hot Glueing Machine (Semi Auto)",
        "Hot Gluing Machine Pneumatic System (Fully Auto)": "Hot Glueing machine Fully Auto With Pnumatic System",
        "Gluing Machine Side Edge (Auto)": "Glueing Machine Side Edge",
        "Cold Gluing Machine (Auto) - 15 Inch": "15 Inch Cold Glueing Machine",
        "Cold Gluing Machine (Auto) - 32 Inch": "32 Inch Cold Glueing Machine Auto",
        "Cold Gluing, Folding & Pasting Machine (Auto)": "22 Inch Cold Glueing Folding & Pasting Machine",
        "45-Degree Double Saw Blade Cutter (Auto)": "45° Double Saw Blade Circular Cutter Auto",
        "Board Buffing Machine (Auto)": "45° Board Buffing Machine",
        "45-Degree PVC Beading Cutter (Auto)": "45 degree PVC Beading Cutter Auto",
        "45-Degree Aluminum Cutter (Auto)": "45 degree Aluminium Cutter Auto",
        "UV (Ultra Violet) Coating Machine": "UV Coating Machine",
        "Album Cutter with Stand (Manual)": "Album Cutter with Stand Manual",
        "Window Dye Cutter 20-Inch": "20 Inch Window Dye Cutting Machine",
        "V Window Dye Cutter": "20 Inch V Window Dye Cutting Machine",
        "Window Dye Cutter with Stapling Table": "20 Inch Window Dye Cutting Machine with Whole Punch & Stapler Table",
      };

      const dbNameTarget = MANUAL_MAPPING[p.name] || p.name;

      // Find product in DB
      let matchRes = await client.query("SELECT id, name, cover_image_url, gallery_image_urls FROM public.products WHERE LOWER(name) = LOWER($1)", [dbNameTarget]);
      let match = matchRes.rows[0];

      if (!match) {
        // Aggressive fuzzy matching
        const strip = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/gluing/g, 'glueing');
        const getWords = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/gluing/g, 'glueing').split(/\s+/).filter(Boolean));
        
        const targetStripped = strip(dbNameTarget);
        const targetWords = getWords(dbNameTarget);
        
        const allRes = await client.query("SELECT id, name, cover_image_url, gallery_image_urls FROM public.products");
        match = allRes.rows.find(r => {
          const dbStripped = strip(r.name);
          if (dbStripped === targetStripped) return true;
          
          const dbWords = getWords(r.name);
          // Check if targetWords is subset of dbWords or vice versa
          return Array.from(targetWords).every(word => dbWords.has(word)) || Array.from(dbWords).every(word => targetWords.has(word));
        });
      }

      if (match) {
        if (!dryRun) {
          const oldGallery = match.gallery_image_urls || [];
          const newGallery = oldGallery.map((u: string) => u === p.url ? relPath : u);
          await client.query(
            "UPDATE public.products SET cover_image_url = $1, og_image_url = $1, gallery_image_urls = $2 WHERE id = $3",
            [relPath, newGallery, match.id]
          );
          process.stdout.write(`Updated ${p.name} [DB: ${match.name}] -> ${relPath}\n`);
        } else {
          process.stdout.write(`[DryRun] Would update ${p.name} [DB: ${match.name}] -> ${relPath}\n`);
        }
        updatedCount++;
      } else {
        process.stdout.write(`Could not find product in DB: ${p.name}\n`);
        skippedCount++;
      }
    }

    process.stdout.write(`\nSummary: Updated ${updatedCount}, Skipped ${skippedCount}.\n`);
  } finally {
    if (!dryRun) await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
