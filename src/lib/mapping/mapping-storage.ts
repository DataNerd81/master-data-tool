import type { MappingConfig } from '@/types';

// ---------------------------------------------------------------------------
// Mapping Storage — persists mapping configs to localStorage
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'kubenest_mapping_';

/**
 * Save a mapping configuration to localStorage, keyed by templateId.
 * Overwrites any existing config for the same template.
 */
export function saveMappingConfig(config: MappingConfig): void {
  const storageKey = `${STORAGE_PREFIX}${config.templateId}`;
  const payload: MappingConfig = {
    ...config,
    savedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (err) {
    console.error('[MappingStorage] Failed to save mapping config:', err);
  }
}

/**
 * Load a previously saved mapping configuration for a given template.
 * Returns null if no config exists or if parsing fails.
 */
export function loadMappingConfig(
  templateId: string,
): MappingConfig | null {
  const storageKey = `${STORAGE_PREFIX}${templateId}`;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as MappingConfig;
  } catch (err) {
    console.error('[MappingStorage] Failed to load mapping config:', err);
    return null;
  }
}

/**
 * List all saved mapping configurations.
 * Returns an array of { templateId, savedAt } summaries.
 */
export function listSavedMappings(): {
  templateId: string;
  savedAt: string;
}[] {
  const results: { templateId: string; savedAt: string }[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const config = JSON.parse(raw) as MappingConfig;
        results.push({
          templateId: config.templateId,
          savedAt: config.savedAt || 'unknown',
        });
      } catch {
        // Skip invalid entries
      }
    }
  } catch (err) {
    console.error('[MappingStorage] Failed to list mappings:', err);
  }

  return results;
}
