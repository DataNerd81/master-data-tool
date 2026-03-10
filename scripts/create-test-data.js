const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

// ===========================================================================
// Test Data Generator — Scope 1 Transport Fuel Data
//
// Creates two test files:
//   1. test-data-clean.xlsx   — reasonably structured data with clear columns
//   2. test-data-messy.xlsx   — AmpolCard-style fuel card statement (messy)
// ===========================================================================

// ---------------------------------------------------------------------------
// Sample 1: Clean-ish data (columns are named slightly differently)
// ---------------------------------------------------------------------------
function buildCleanData() {
  const header = [
    "Vehicle Rego",    // should map to "Rego/Asset Number/Identifier"
    "Transaction Date", // should map to "Date of Purchase"
    "Location",        // unmapped
    "Product",         // should map to "Products used/Fuel type"
    "Litres",          // should map to "Qty of Fuel"
    "Cost Ex GST",     // unmapped
    "Odometer",        // unmapped
  ];

  const rows = [
    ["ABC123", "11/06/2024", "Ampol Foodary New Lam", "Premium Diesel A", 67.14, 120.79, 218595],
    ["ABC123", "28/06/2024", "Ampol Heatherbrae", "Premium Diesel A", 49.39, 84.82, 219138],
    ["XYZ789", "04/06/2024", "Eg Ampol 91517 Raymond", "Premium Diesel A", 40.45, 68.73, 218075],
    ["XYZ789", "06/06/2024", "Eg Ampol 91517 Raymond", "Premium Diesel A", 57.34, 97.43, 218700],
    ["XYZ789", "14/06/2024", "Ampol Beresfield", "Premium Diesel A", 47.34, 80.44, 219230],
    ["DEF456", "31/05/2024", "Ampol Beresfield", "Premium Unleaded 91", 50.69, 86.04, null],
    ["DEF456", "05/06/2024", "Eg Ampol 91746 Salaman", "Premium Unleaded 91", 44.98, 77.08, null],
    ["DEF456", "13/06/2024", "Ampol Foodary Hamilton", "Unleaded E10", 49.47, 81.81, null],
    ["GHI101", "10/06/2024", "BP Truck Stop Hexham", "Diesel", 120.50, 204.85, 450230],
    ["GHI101", "18/06/2024", "Shell Coles Express", "Diesel", 115.20, 195.84, 451800],
    ["GHI101", "25/06/2024", "Caltex Star Mart", "Diesel", 108.90, 185.13, 453100],
    ["JKL202", "02/06/2024", "Ampol Hamilton", "LPG Autogas", 45.30, 38.51, 89500],
    ["JKL202", "15/06/2024", "BP Autogas Maitland", "LPG", 42.10, 35.79, 90200],
    ["MNO303", "01/06/2024", "Ampol Jet Fuel Terminal", "Jet A-1 Aviation Kerosene", 500.00, 850.00, null],
    ["PQR404", "12/06/2024", "Shell Truck Stop", "Premium Diesel A", 180.40, 306.68, 125000],
    ["PQR404", "20/06/2024", "BP Diesel Stop", "Diesel", 165.80, 281.86, 126500],
    // Row with missing product — fuel type can't be auto-detected
    ["STU505", "08/06/2024", "Local Servo", "", 55.00, 93.50, 67000],
    // Row with vague product name
    ["STU505", "22/06/2024", "Depot Fill", "Fuel", 60.00, 102.00, 68200],
  ];

  return [header, ...rows];
}

// ---------------------------------------------------------------------------
// Sample 2: Messy AmpolCard-style fuel card statement
// Regos are in section headers, data is mixed with totals and fees
// ---------------------------------------------------------------------------
function buildMessyData() {
  // This mimics the real AmpolCard statement structure
  const header = [
    "Date",            // column A
    "Transaction",     // column B — transaction number
    "Location no",     // column C
    "",                // column D — empty header (Odometer in some rows)
    "Product",         // column E
    "",                // column F — empty
    "",                // column G — empty
    "Quantity",        // column H
    "Total excl",      // column I
    "GST $",           // column J
    "Total inc",       // column K
  ];

  const rows = [
    // Title row (junk)
    ["Your AmpolCard transactions", "", "", "", "", "", "", "", "", "", ""],
    // Column headers row (already captured above)

    // --- Section 1: Rego CH76CU ---
    ["Card no 7071 3400 9049 3809 Rego CH76CU Name", "", "", "", "", "", "", "", "", "", ""],
    ["11/06/2024", "E65956", "Ampol Foodary New Lam", 218595, "Premium Diesel A", "", "", 67.14, 120.79, 12.08, 132.87],
    ["28/06/2024", "E22080", "Ampol Heatherbrae", 219138, "Premium Diesel A", "", "", 49.39, 84.82, 8.48, 93.30],
    ["29/06/2024", "", "Periodic Card Fee (Month", "", "", "", "", "", 2.00, 0.20, 2.20],
    ["30/06/2024", "", "Total for Card no 7071 3400 9049", "", "", "", "", 116.53, 207.61, 20.76, 228.37],

    // --- Section 2: Rego CJ98LW ---
    ["Card no 7071 3400 9049 3833 Rego CJ98LW Name", "", "", "", "", "", "", "", "", "", ""],
    ["04/06/2024", "E774402", "Eg Ampol 91517 Raymond", 218075, "Premium Diesel A", "", "", 40.45, 68.73, 6.87, 75.60],
    ["06/06/2024", "E775730", "Eg Ampol 91517 Raymond", 218700, "Premium Diesel A", "", "", 57.34, 97.43, 9.74, 107.17],
    ["14/06/2024", "E64181", "Ampol Beresfield", 219230, "Premium Diesel A", "", "", 47.34, 80.44, 8.04, 88.48],
    ["21/06/2024", "E784098", "Eg Ampol 91517 Raymond", 220000, "Premium Diesel A", "", "", 60.60, 104.62, 10.46, 115.08],
    ["29/06/2024", "", "Periodic Card Fee (Month", "", "", "", "", "", 2.00, 0.20, 2.20],
    ["30/06/2024", "", "Total for Card no 7071 3400 9049", "", "", "", "", 205.73, 353.22, 35.31, 388.53],

    // --- Section 3: Rego CNQ37G ---
    ["Card no 7071 3400 9049 3858 Rego CNQ37G Name", "", "", "", "", "", "", "", "", "", ""],
    ["31/05/2024", "E62578", "Ampol Beresfield", "", "Premium Diesel A", "", "", 50.69, 86.04, 8.60, 94.64],
    ["05/06/2024", "E244887", "Eg Ampol 91746 Salaman", "", "Premium Diesel A", "", "", 44.98, 77.08, 7.71, 84.79],
    ["13/06/2024", "E9150", "Ampol Foodary Hamilton", "", "Premium Diesel A", "", "", 49.47, 81.81, 8.18, 89.99],
    ["18/06/2024", "E848439", "Eg Ampol 91746 Salaman", "", "Premium Diesel A", "", "", 37.30, 64.05, 6.41, 70.46],
    ["24/06/2024", "E59139", "Ampol Salt Ash S/Stn", "", "Premium Diesel A", "", "", 42.80, 74.28, 7.43, 81.71],
    ["29/06/2024", "", "Periodic Card Fee (Month", "", "", "", "", "", 2.00, 0.20, 2.20],
    ["30/06/2024", "", "Total for Card no 7071 3400 9049", "", "", "", "", 225.24, 385.26, 38.53, 423.79],

    // --- Section 4: Rego DPQ12X (Unleaded vehicle) ---
    ["Card no 7071 3400 9049 4102 Rego DPQ12X Name", "", "", "", "", "", "", "", "", "", ""],
    ["03/06/2024", "E881234", "Shell Coles Express", 45200, "Premium Unleaded 91", "", "", 38.50, 65.45, 6.55, 72.00],
    ["17/06/2024", "E882456", "BP Wallsend", 45890, "Unleaded E10", "", "", 42.10, 71.57, 7.16, 78.73],
    ["29/06/2024", "", "Periodic Card Fee (Month", "", "", "", "", "", 2.00, 0.20, 2.20],
    ["30/06/2024", "", "Total for Card no 7071 3400 9049", "", "", "", "", 80.60, 138.02, 13.91, 152.93],

    // Grand total (junk)
    ["", "", "Grand Total:", "", "", "", "", "", 1084.11, 108.51, 1193.62],
  ];

  return [header, ...rows];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const outDir = path.resolve(__dirname, "..", "public", "test-data");

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // --- File 1: Clean data ---
  const wb1 = XLSX.utils.book_new();
  const cleanData = buildCleanData();
  const ws1 = XLSX.utils.aoa_to_sheet(cleanData);
  ws1["!cols"] = [
    { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 30 },
    { wch: 10 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb1, ws1, "Fuel Transactions");

  const cleanPath = path.join(outDir, "test-data-clean.xlsx");
  XLSX.writeFile(wb1, cleanPath);
  console.log(`Clean test data written to: ${cleanPath}`);
  console.log(`  Rows: ${cleanData.length - 1} (excluding header)`);
  console.log(`  Columns: ${cleanData[0].join(", ")}`);

  // --- File 2: Messy AmpolCard statement ---
  const wb2 = XLSX.utils.book_new();
  const messyData = buildMessyData();
  const ws2 = XLSX.utils.aoa_to_sheet(messyData);
  ws2["!cols"] = [
    { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 10 },
    { wch: 25 }, { wch: 5 }, { wch: 5 }, { wch: 12 },
    { wch: 12 }, { wch: 10 }, { wch: 12 },
  ];

  // Add some merged cells to simulate real AmpolCard layout
  // Merge the title row across all columns
  ws2["!merges"] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },  // Title row
    { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } },   // Card no CH76CU
    { s: { r: 10, c: 0 }, e: { r: 10, c: 10 } },  // Card no CJ98LW
    { s: { r: 17, c: 0 }, e: { r: 17, c: 10 } },  // Card no CNQ37G
    { s: { r: 25, c: 0 }, e: { r: 25, c: 10 } },  // Card no DPQ12X
  ];

  XLSX.utils.book_append_sheet(wb2, ws2, "AmpolCard Statement");

  const messyPath = path.join(outDir, "test-data-messy.xlsx");
  XLSX.writeFile(wb2, messyPath);
  console.log(`\nMessy test data written to: ${messyPath}`);
  console.log(`  Rows: ${messyData.length - 1} (excluding header)`);
  console.log(`  Columns: ${messyData[0].filter(h => h).join(", ")}`);
  console.log(`  Section headers: 4 (CH76CU, CJ98LW, CNQ37G, DPQ12X)`);
  console.log(`  Fee rows: 4, Total rows: 5`);
}

main();
