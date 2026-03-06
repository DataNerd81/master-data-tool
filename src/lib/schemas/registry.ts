import type { TemplateSchema } from '@/types';

// --- Location & Tags ---
import { locationSchema } from './location';
import { tagSchema } from './tag';

// --- Energy ---
import { energySourceSchema, energyQtySchema } from './energy';

// --- Scope 1 Emissions ---
import {
  scope1StationarySourceSchema,
  scope1TransportSchema,
  scope1AssignmentSchema,
  scope1QtySchema,
} from './scope1';

// --- Scope 2 Emissions ---
import { scope2SourceSchema, scope2QtySchema, scope2TenantSchema } from './scope2';

// --- Scope 3 Emissions ---
import { scope3SourceSchema, scope3QtySchema, scope3SupplierSchema } from './scope3';

// --- Waste ---
import { wasteSourceSchema, wasteQtySchema } from './waste';

// --- Water ---
import { waterSourceSchema, waterQtySchema } from './water';

// --- WHS ---
import { whsSourceSchema, whsQtySchema } from './whs';

// --- Habitat & Biodiversity ---
import {
  habitatBiodiversitySourceSchema,
  habitatManagementQtySchema,
  speciesEndangermentQtySchema,
  wildlifeFatalitiesQtySchema,
} from './habitat-biodiversity';

// ---------------------------------------------------------------------------
// All 24 Schemas
// ---------------------------------------------------------------------------

const allSchemas: TemplateSchema[] = [
  // Location & Tags
  locationSchema,
  tagSchema,
  // Energy
  energySourceSchema,
  energyQtySchema,
  // Scope 1
  scope1StationarySourceSchema,
  scope1TransportSchema,
  scope1AssignmentSchema,
  scope1QtySchema,
  // Scope 2
  scope2SourceSchema,
  scope2QtySchema,
  scope2TenantSchema,
  // Scope 3
  scope3SourceSchema,
  scope3QtySchema,
  scope3SupplierSchema,
  // Waste
  wasteSourceSchema,
  wasteQtySchema,
  // Water
  waterSourceSchema,
  waterQtySchema,
  // WHS
  whsSourceSchema,
  whsQtySchema,
  // Habitat & Biodiversity
  habitatBiodiversitySourceSchema,
  habitatManagementQtySchema,
  speciesEndangermentQtySchema,
  wildlifeFatalitiesQtySchema,
];

/**
 * Central registry of all template schemas, keyed by schema id.
 */
export const schemaRegistry: Map<string, TemplateSchema> = new Map(
  allSchemas.map((schema) => [schema.id, schema]),
);

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Retrieve a single schema by its id.
 */
export function getSchema(id: string): TemplateSchema | undefined {
  return schemaRegistry.get(id);
}

/**
 * Return every registered schema as an array.
 */
export function getAllSchemas(): TemplateSchema[] {
  return Array.from(schemaRegistry.values());
}

/**
 * Return a lightweight list of schemas suitable for rendering selection UIs.
 */
export function getSchemaList(): {
  id: string;
  name: string;
  description: string;
  group: string;
  icon: string;
}[] {
  return getAllSchemas().map(({ id, name, description, group, icon }) => ({
    id,
    name,
    description,
    group,
    icon,
  }));
}

/**
 * Return schemas grouped by their `group` field, preserving insertion order.
 */
export function getSchemasByGroup(): Map<
  string,
  { id: string; name: string; description: string; group: string; icon: string }[]
> {
  const grouped = new Map<
    string,
    { id: string; name: string; description: string; group: string; icon: string }[]
  >();
  for (const schema of getAllSchemas()) {
    const { id, name, description, group, icon } = schema;
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push({ id, name, description, group, icon });
  }
  return grouped;
}
