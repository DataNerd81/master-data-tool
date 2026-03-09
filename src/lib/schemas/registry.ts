import type { TemplateSchema } from '@/types';
import { scope1TransportSchema } from './scope1';

// ---------------------------------------------------------------------------
// Schema Registry — single Scope 1 Transport template
// ---------------------------------------------------------------------------

const allSchemas: TemplateSchema[] = [scope1TransportSchema];

/**
 * Central registry of all template schemas, keyed by schema id.
 */
export const schemaRegistry: Map<string, TemplateSchema> = new Map(
  allSchemas.map((schema) => [schema.id, schema]),
);

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
 * Return the default (only) schema.
 */
export function getDefaultSchema(): TemplateSchema {
  return scope1TransportSchema;
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
