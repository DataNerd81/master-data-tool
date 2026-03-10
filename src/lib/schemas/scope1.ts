import type { TemplateSchema } from '@/types';

// ---------------------------------------------------------------------------
// NGA Reference Table — Category + Fuel Type combinations
// ---------------------------------------------------------------------------

export interface NGAEntry {
  category: string;
  fuelType: string;
}

export const NGA_REFERENCE_TABLE: NGAEntry[] = [
  // Cars and light commercial vehicles
  { category: 'Cars and light commercial vehicles', fuelType: 'Gasoline (petrol)' },
  { category: 'Cars and light commercial vehicles', fuelType: 'Diesel oil' },
  { category: 'Cars and light commercial vehicles', fuelType: 'Liquefied petroleum gas (LPG)' },
  { category: 'Cars and light commercial vehicles', fuelType: 'Fuel oil' },
  { category: 'Cars and light commercial vehicles', fuelType: 'Ethanol' },
  { category: 'Cars and light commercial vehicles', fuelType: 'Biodiesel' },
  { category: 'Cars and light commercial vehicles', fuelType: 'Renewable diesel' },
  { category: 'Cars and light commercial vehicles', fuelType: 'Other biofuels' },

  // Light duty vehicles
  { category: 'Light duty vehicles', fuelType: 'Compressed natural gas (Light Duty Vehicle)' },
  { category: 'Light duty vehicles', fuelType: 'Liquefied natural gas' },

  // Heavy duty vehicles
  { category: 'Heavy duty vehicles', fuelType: 'Compressed natural gas (Heavy Duty Vehicle)' },
  { category: 'Heavy duty vehicles', fuelType: 'Liquefied natural gas' },
  { category: 'Heavy duty vehicles', fuelType: 'Diesel oil - Euro iv or higher' },
  { category: 'Heavy duty vehicles', fuelType: 'Diesel oil - Euro iii' },
  { category: 'Heavy duty vehicles', fuelType: 'Diesel oil - Euro i' },
  { category: 'Heavy duty vehicles', fuelType: 'Renewable diesel \u2013 Euro iv or higher' },
  { category: 'Heavy duty vehicles', fuelType: 'Renewable diesel \u2013 Euro iii' },
  { category: 'Heavy duty vehicles', fuelType: 'Renewable diesel \u2013 Euro i' },

  // Aviation
  { category: 'Aviation', fuelType: 'Gasoline for use as fuel in an aircraft' },
  { category: 'Aviation', fuelType: 'Kerosene for use as fuel in an aircraft' },
  { category: 'Aviation', fuelType: 'Renewable aviation kerosene' },
];

/**
 * Get all unique NGA categories.
 */
export function getNGACategories(): string[] {
  return [...new Set(NGA_REFERENCE_TABLE.map((e) => e.category))];
}

/**
 * Get fuel types for a given NGA category.
 */
export function getFuelTypesForCategory(category: string): string[] {
  return NGA_REFERENCE_TABLE
    .filter((e) => e.category === category)
    .map((e) => e.fuelType);
}

// ---------------------------------------------------------------------------
// Scope 1 Transport Schema
// ---------------------------------------------------------------------------

export const scope1TransportSchema: TemplateSchema = {
  id: 'scope1-transport',
  name: 'Scope 1 Transport',
  description: 'Scope 1 transport fuel consumption data — extract rego/asset, date, fuel quantity, unit, and auto-detect NGA category and fuel type.',
  group: 'Scope 1 Emissions',
  icon: 'Truck',
  columns: [
    {
      name: 'Rego/Asset Number/Identifier',
      aliases: [
        'rego', 'registration', 'reg', 'reg no', 'reg number', 'registration number',
        'asset', 'asset number', 'asset no', 'asset id', 'asset code',
        'vehicle', 'vehicle id', 'vehicle no', 'vehicle number',
        'fleet', 'fleet id', 'fleet no', 'fleet number',
        'plate', 'plate number', 'number plate', 'license plate',
        'identifier', 'id', 'equipment', 'equipment id', 'equipment no',
      ],
      type: 'text',
      required: true,
      description: 'Vehicle registration, asset number, or unique identifier',
    },
    {
      name: 'Products used/Fuel type',
      aliases: [
        'product', 'product name', 'product description', 'product type',
        'fuel', 'fuel type', 'fuel name', 'fuel description', 'fuel product',
        'fuel source', 'fuel grade', 'fuel kind',
        'description', 'item', 'item description',
        'diesel', 'unleaded', 'petrol', 'gasoline',
      ],
      type: 'text',
      required: true,
      description: 'Product or fuel type (e.g. diesel, unleaded, LPG)',
    },
    {
      name: 'Date of Purchase',
      aliases: [
        'date', 'entry date', 'data entry date', 'data date',
        'transaction date', 'trans date', 'delivery date',
        'period', 'period date', 'reporting date', 'report date',
        'invoice date', 'fill date', 'fuel date', 'purchase date',
      ],
      type: 'date',
      required: true,
      description: 'Date of the fuel purchase or transaction',
    },
    {
      name: 'Qty of Fuel',
      aliases: [
        'quantity', 'qty', 'amount', 'volume', 'fuel qty', 'fuel quantity',
        'fuel amount', 'fuel volume', 'litres', 'liters', 'consumption',
        'usage', 'fuel usage', 'fuel consumption', 'total', 'total litres',
        'total liters', 'net qty', 'net quantity', 'gross qty',
      ],
      type: 'number',
      required: true,
      description: 'Quantity of fuel purchased',
      validation: { min: 0 },
    },
    {
      name: 'Unit Type',
      aliases: [
        'unit', 'uom', 'unit of measure', 'measurement unit', 'units',
        'measure', 'fuel unit', 'qty unit', 'quantity unit',
        'litres', 'liters', 'kl', 'kilolitres',
      ],
      type: 'text',
      required: true,
      description: 'Unit of measurement (e.g. L, kL). Defaults to L if not found.',
    },
    {
      name: 'Category (NGA)',
      aliases: [
        'category', 'nga category', 'vehicle category', 'vehicle type',
        'type', 'class', 'vehicle class', 'asset category', 'asset type',
      ],
      type: 'enum',
      required: true,
      description: 'NGA vehicle category (auto-mapped from Products used/Fuel type)',
      allowedValues: getNGACategories(),
      autoDetected: true,
    },
    {
      name: 'Fuel Type (NGA)',
      aliases: [
        'nga fuel type', 'nga fuel', 'fuel type nga',
      ],
      type: 'text',
      required: true,
      description: 'NGA fuel type (auto-mapped from Products used/Fuel type)',
      autoDetected: true,
    },
  ],
  uniqueConstraint: ['Rego/Asset Number/Identifier', 'Date of Purchase'],
};
