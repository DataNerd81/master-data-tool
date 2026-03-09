const XLSX = require("xlsx");
const path = require("path");

// We can't import TypeScript directly, so we'll simulate the key logic here

// ---------------------------------------------------------------------------
// Simulate pre-processor logic
// ---------------------------------------------------------------------------
const REGO_PATTERN = /\bRego\s*:?\s*([A-Z0-9][-A-Z0-9]{2,10})\b/i;
const SECTION_HEADER = /\bCard\s*no\b.*\bRego\b/i;
const JUNK_PATTERNS = [
  /\btotal\s*(for|:)/i,
  /\bsubtotal\b/i,
  /\bgrand\s*total\b/i,
  /\bperiodic\s*card\s*fee\b/i,
  /\bcard\s*fee\b/i,
];

const FUEL_KEYWORDS = [
  { pattern: /renewable\s*diesel/i, category: "Cars and light commercial vehicles", fuelType: "Renewable diesel" },
  { pattern: /diesel/i, category: "Cars and light commercial vehicles", fuelType: "Diesel oil" },
  { pattern: /\b(petrol|gasoline)\b/i, category: "Cars and light commercial vehicles", fuelType: "Gasoline (petrol)" },
  { pattern: /\bunleaded\b/i, category: "Cars and light commercial vehicles", fuelType: "Gasoline (petrol)" },
  { pattern: /\b(ulp|pulp|e10|e85)\b/i, category: "Cars and light commercial vehicles", fuelType: "Gasoline (petrol)" },
  { pattern: /\b(lpg|liquefied\s*petroleum|autogas)\b/i, category: "Cars and light commercial vehicles", fuelType: "Liquefied petroleum gas (LPG)" },
  { pattern: /\b(jet\s*fuel|jet\s*a|avtur|aviation\s*kerosene)\b/i, category: "Aviation", fuelType: "Kerosene for use as fuel in an aircraft" },
];

function inferFuel(text) {
  if (!text) return null;
  for (const { pattern, category, fuelType } of FUEL_KEYWORDS) {
    if (pattern.test(text)) return { category, fuelType };
  }
  return null;
}

function getAllText(row) {
  return Object.values(row).filter(v => v != null).map(v => String(v)).join(" ");
}

function isSectionHeader(row) { return SECTION_HEADER.test(getAllText(row)); }
function isJunk(row) { return JUNK_PATTERNS.some(p => p.test(getAllText(row))); }
function hasNumbers(row) { return Object.values(row).some(v => typeof v === "number" && v > 0); }

// ---------------------------------------------------------------------------
// Process a single file
// ---------------------------------------------------------------------------
function processFile(filePath) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`Processing: ${path.basename(filePath)}`);
  console.log("=".repeat(70));

  const wb = XLSX.read(require("fs").readFileSync(filePath), { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Handle merged cells
  const merges = ws["!merges"] || [];
  for (const merge of merges) {
    const topLeft = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
    const topCell = ws[topLeft];
    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        if (r === merge.s.r && c === merge.s.c) continue;
        const addr = XLSX.utils.encode_cell({ r, c });
        if (topCell) ws[addr] = { ...topCell };
      }
    }
  }

  const rawData = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`\nRaw rows: ${rawData.length}`);
  console.log(`Headers: ${Object.keys(rawData[0] || {}).join(", ")}`);

  // Pre-process
  let currentRego = null;
  const regosFound = [];
  let junkSkipped = 0;
  let headersSkipped = 0;
  const cleanRows = [];

  // Check if there's a rego column
  const headers = Object.keys(rawData[0] || {});
  const regoCol = headers.find(h => /rego|registration|vehicle.*(?:id|no)|asset/i.test(h));
  const hasUnitCol = headers.some(h => /^unit/i.test(h) || /\buom\b/i.test(h));

  for (const row of rawData) {
    const allText = getAllText(row);

    if (isSectionHeader(row)) {
      const match = allText.match(REGO_PATTERN);
      if (match) {
        currentRego = match[1].toUpperCase();
        if (!regosFound.includes(currentRego)) regosFound.push(currentRego);
      }
      headersSkipped++;
      continue;
    }

    if (isJunk(row)) { junkSkipped++; continue; }
    if (!hasNumbers(row)) continue;

    const cleanRow = { ...row };
    if (!regoCol && currentRego) cleanRow["Rego or Asset Number"] = currentRego;
    if (!hasUnitCol) cleanRow["Unit"] = "L";
    cleanRows.push(cleanRow);
  }

  console.log(`\n--- Pre-Processing Summary ---`);
  console.log(`  Clean data rows: ${cleanRows.length}`);
  console.log(`  Section headers skipped: ${headersSkipped}`);
  console.log(`  Junk rows skipped: ${junkSkipped}`);
  console.log(`  Regos found: ${regosFound.length > 0 ? regosFound.join(", ") : "(from column)"}`);
  console.log(`  Unit defaulted: ${!hasUnitCol ? "Yes (L)" : "No"}`);

  // Auto-detect fuel types
  let autoDetected = 0;
  for (const row of cleanRows) {
    const allText = getAllText(row);
    const fuel = inferFuel(allText);
    if (fuel) {
      row["(NGA) Category"] = fuel.category;
      row["(NGA) Fuel Type"] = fuel.fuelType;
      autoDetected++;
    } else {
      row["(NGA) Category"] = "??? NEEDS CLARIFICATION";
      row["(NGA) Fuel Type"] = "??? NEEDS CLARIFICATION";
    }
  }

  console.log(`  Fuel types auto-detected: ${autoDetected}/${cleanRows.length}`);

  // Print the output table
  console.log(`\n--- Output Data ---`);
  console.log(
    "Rego".padEnd(12) +
    "Date".padEnd(14) +
    "Qty".padEnd(10) +
    "Unit".padEnd(6) +
    "NGA Category".padEnd(40) +
    "NGA Fuel Type"
  );
  console.log("-".repeat(120));

  for (const row of cleanRows) {
    const rego = (row["Rego or Asset Number"] || row[regoCol] || "").toString().padEnd(12);
    // Find the date value
    const dateCol = Object.keys(row).find(k => /date/i.test(k)) || Object.keys(row)[0];
    const date = (row[dateCol] || "").toString().padEnd(14);
    // Find quantity
    const qtyCol = Object.keys(row).find(k => /qty|quantity|litres|liters|amount/i.test(k));
    const qty = (qtyCol ? (row[qtyCol] || "") : "").toString().padEnd(10);
    const unit = (row["Unit"] || "").toString().padEnd(6);
    const cat = (row["(NGA) Category"] || "").toString().padEnd(40);
    const ft = (row["(NGA) Fuel Type"] || "").toString();

    console.log(`${rego}${date}${qty}${unit}${cat}${ft}`);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const testDir = path.resolve(__dirname, "..", "public", "test-data");
const file = process.argv[2];

if (file) {
  processFile(path.resolve(testDir, file));
} else {
  // Process both
  processFile(path.join(testDir, "test-data-clean.xlsx"));
  processFile(path.join(testDir, "test-data-messy.xlsx"));
}
