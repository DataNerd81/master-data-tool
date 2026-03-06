const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------------------
// Helper: Build the "Locations" sheet data matching the real KubeNest template
// Headers: Identifier, Name (optional), % Owned, Address (optional),
//          City (optional), State (optional), Postcode (optional),
//          Country (optional), Tags (optional)
// ---------------------------------------------------------------------------
function buildLocationsData() {
  const header = [
    "Loc ID",           // should map to "Identifier"
    "site name",        // should map to "Name (optional)"
    "ownership %",      // should map to "% Owned"
    "address",          // should map to "Address (optional)"
    "suburb",           // should map to "City (optional)"
    "state",            // should map to "State (optional)"
    "postcode",         // should map to "Postcode (optional)"
    "country",          // should map to "Country (optional)"
    "labels",           // should map to "Tags (optional)"
  ];

  const rows = [
    // Row 1 - lowercase name (naming convention issue)
    [
      "SYD-001",
      "sydney office",                  // lowercase naming
      100,
      "100 George St",
      "Sydney",
      "NSW",
      "2000",
      "Australia",
      "office, headquarters",
    ],
    // Row 2 - ALL CAPS name, percent > 100
    [
      "MEL-001",
      "MELBOURNE WAREHOUSE",            // ALL CAPS
      150,                              // invalid: > 100%
      "200 Collins St",
      "Melbourne",
      "VIC",
      "3000",
      "Australia",
      "warehouse",
    ],
    // Row 3 - trailing spaces in name, invalid 3-digit postcode
    [
      "BRI-001",
      "Brisbane  HQ  ",                 // trailing spaces + double spaces
      100,
      "50 Ann St",
      "Brisbane",
      "QLD",
      "210",                            // invalid: only 3 digits
      "Australia",
      "",
    ],
    // Row 4 - clean row
    [
      "PER-001",
      "Perth Distribution Centre",
      100,
      "10 Hay St",
      "Perth",
      "WA",
      "6000",
      "Australia",
      "distribution",
    ],
    // Row 5 - missing Identifier (required field), text in % Owned
    [
      "",                               // missing required Identifier
      "Adelaide Office",
      "one hundred",                    // text instead of number
      "1 King William St",
      "Adelaide",
      "SA",
      "5000",
      "Australia",
      "",
    ],
    // Row 6 - special characters in name
    [
      "SYD-002",
      "Sydney @ HQ!",                   // special characters
      75,
      "1 Macquarie Place",
      "Sydney",
      "NSW",
      "2000",
      "Australia",
      "head-office",
    ],
    // Row 7 - missing % Owned (required field)
    [
      "HOB-001",
      "Hobart Workshop",
      "",                               // missing required % Owned
      "5 Elizabeth St",
      "Hobart",
      "TAS",
      "7000",
      "Australia",
      "",
    ],
    // Row 8 - missing Identifier (required)
    [
      "",                               // missing required Identifier
      "Darwin Depot",
      100,
      "88 Mitchell St",
      "Darwin",
      "NT",
      "0800",
      "Australia",
      "",
    ],
    // Row 9 - DUPLICATE of row 1 (same Identifier)
    [
      "SYD-001",                        // duplicate Identifier
      "sydney office",
      100,
      "100 George St",
      "Sydney",
      "NSW",
      "2000",
      "Australia",
      "office, headquarters",
    ],
    // Row 10 - negative % Owned
    [
      "CAN-001",
      "Canberra Office",
      -25,                              // negative value
      "1 Commonwealth Ave",
      "Canberra",
      "ACT",
      "2600",
      "Australia",
      "government",
    ],
    // Row 11 - normal row
    [
      "GLD-001",
      "Gold Coast Storage",
      50,
      "22 Surfers Paradise Blvd",
      "Surfers Paradise",
      "QLD",
      "4217",
      "Australia",
      "storage, seasonal",
    ],
    // Row 12 - postcode/state mismatch
    [
      "CNS-001",
      "Cairns Satellite",
      100,
      "15 Spence St",
      "Cairns",
      "NSW",                            // wrong state for 4870 (should be QLD)
      "4870",
      "Australia",
      "",
    ],
    // Row 13 - clean row
    [
      "NEW-001",
      "Newcastle Office",
      100,
      "10 Hunter St",
      "Newcastle",
      "NSW",
      "2300",
      "Australia",
      "",
    ],
    // Row 14 - DUPLICATE of row 2 (same Identifier)
    [
      "MEL-001",                        // duplicate Identifier
      "MELBOURNE WAREHOUSE",
      150,
      "200 Collins St",
      "Melbourne",
      "VIC",
      "3000",
      "Australia",
      "warehouse",
    ],
    // Row 15 - missing Identifier AND % Owned
    [
      "",                               // missing required
      "",                               // missing name too
      "",                               // missing required
      "7 Flinders St",
      "Townsville",
      "QLD",
      "4810",
      "Australia",
      "",
    ],
    // Row 16 - clean row
    [
      "WOL-001",
      "Wollongong Depot",
      100,
      "3 Crown St",
      "Wollongong",
      "NSW",
      "2500",
      "Australia",
      "depot",
    ],
    // Row 17 - ALL CAPS name
    [
      "ALC-001",
      "ALICE SPRINGS YARD",             // ALL CAPS
      100,
      "12 Todd St",
      "Alice Springs",
      "NT",
      "",                               // missing postcode (optional, no issue)
      "Australia",
      "yard, remote",
    ],
    // Row 18 - trailing spaces in city
    [
      "GEL-001",
      "Geelong Workshop",
      80,
      "8 Moorabool St",
      "Geelong  ",                      // trailing spaces
      "VIC",
      "3220",
      "Australia",
      "",
    ],
    // Row 19 - text in % Owned
    [
      "LAU-001",
      "Launceston Office",
      "fifty percent",                  // text instead of number
      "55 Cameron St",
      "Launceston",
      "TAS",
      "7250",
      "Australia",
      "",
    ],
    // Row 20 - invalid postcode (letters)
    [
      "BAL-001",
      "Ballarat Storage",
      100,
      "4 Sturt St",
      "Ballarat",
      "VIC",
      "33AB",                           // letters in postcode
      "Australia",
      "storage",
    ],
  ];

  return [header, ...rows];
}

// ---------------------------------------------------------------------------
// Helper: Build the "Notes" sheet data
// ---------------------------------------------------------------------------
function buildNotesData() {
  return [
    ["Title", "Content"],
    [
      "Import Instructions",
      "This file was generated for testing the Master Data Tool import pipeline. It contains intentional data quality issues.",
    ],
    [
      "Known Issues",
      "Column headers do not match the KubeNest template exactly. Some postcodes are invalid. Several required fields are missing.",
    ],
    [
      "Template",
      "This test data is designed to be imported using the Location template.",
    ],
  ];
}

// ---------------------------------------------------------------------------
// Main: create workbook and write to disk
// ---------------------------------------------------------------------------
function main() {
  const outDir = path.resolve(__dirname, "..", "public");
  const outPath = path.join(outDir, "test-data.xlsx");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const wb = XLSX.utils.book_new();

  // --- Locations sheet ---
  const locData = buildLocationsData();
  const wsLocations = XLSX.utils.aoa_to_sheet(locData);

  wsLocations["!cols"] = [
    { wch: 12 }, // Loc ID
    { wch: 28 }, // site name
    { wch: 14 }, // ownership %
    { wch: 28 }, // address
    { wch: 20 }, // suburb
    { wch: 8 },  // state
    { wch: 10 }, // postcode
    { wch: 12 }, // country
    { wch: 22 }, // labels
  ];

  XLSX.utils.book_append_sheet(wb, wsLocations, "Locations");

  // --- Notes sheet ---
  const notesData = buildNotesData();
  const wsNotes = XLSX.utils.aoa_to_sheet(notesData);
  wsNotes["!cols"] = [
    { wch: 22 },
    { wch: 90 },
  ];
  XLSX.utils.book_append_sheet(wb, wsNotes, "Notes");

  // Write file
  XLSX.writeFile(wb, outPath);

  console.log(`Test data written to: ${outPath}`);
  console.log(`  Sheets: ${wb.SheetNames.join(", ")}`);
  console.log(`  Locations rows: ${locData.length - 1} (excluding header)`);
}

main();
