'use client';

import { useMemo, useState } from 'react';
import {
  Building2,
  Flame,
  Truck,
  Trash2,
  Droplets,
  ShieldAlert,
  Tags,
  Zap,
  PlugZap,
  Globe,
  TreePine,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { getSchemasByGroup } from '@/lib/schemas/registry';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/components/ui/cn';

const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Flame,
  Truck,
  Trash2,
  Droplets,
  ShieldAlert,
  Tags,
  Zap,
  PlugZap,
  Globe,
  TreePine,
};

// Icon to use for each group header
const GROUP_ICONS: Record<string, LucideIcon> = {
  Location: Building2,
  Tags: Tags,
  Energy: Zap,
  'Scope 1 Emissions': Flame,
  'Scope 2 Emissions': PlugZap,
  'Scope 3 Emissions': Globe,
  Waste: Trash2,
  Water: Droplets,
  WHS: ShieldAlert,
  'Habitat & Biodiversity': TreePine,
};

export function TemplateSelector() {
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);
  const setTemplate = useAppStore((s) => s.setTemplate);
  const grouped = useMemo(() => getSchemasByGroup(), []);

  // Track which groups are expanded — all start expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(grouped.keys()),
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Select Template
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        Choose which KubeNest data template you are uploading for.
      </p>

      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([group, schemas]) => {
          const isExpanded = expandedGroups.has(group);
          const GroupIcon = GROUP_ICONS[group] || Tags;
          const hasSelection = schemas.some((s) => s.id === selectedTemplateId);

          return (
            <div
              key={group}
              className={cn(
                'rounded-xl border-2 transition-colors',
                hasSelection
                  ? 'border-kn-teal/40 bg-kn-teal/[0.02]'
                  : 'border-gray-200 bg-white',
              )}
            >
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                    hasSelection
                      ? 'bg-kn-teal/10 text-kn-teal'
                      : 'bg-gray-100 text-gray-500',
                  )}
                >
                  <GroupIcon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    'flex-1 text-sm font-semibold',
                    hasSelection ? 'text-kn-teal' : 'text-gray-700',
                  )}
                >
                  {group}
                </span>
                <span className="text-xs text-gray-400">
                  {schemas.length} {schemas.length === 1 ? 'template' : 'templates'}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {/* Template list */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-3 pb-3 pt-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {schemas.map((schema) => {
                      const isSelected = selectedTemplateId === schema.id;
                      const IconComponent = ICON_MAP[schema.icon] || Tags;

                      return (
                        <button
                          key={schema.id}
                          type="button"
                          onClick={() => setTemplate(schema.id)}
                          className={cn(
                            'group flex items-start gap-2.5 rounded-lg border p-3 text-left transition-all duration-150',
                            isSelected
                              ? 'border-kn-teal bg-kn-teal/5 shadow-sm shadow-kn-teal/10'
                              : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white hover:shadow-sm',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-colors',
                              isSelected
                                ? 'bg-kn-teal/10 text-kn-teal'
                                : 'bg-white text-gray-400 group-hover:text-gray-500',
                            )}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'text-sm font-medium leading-tight',
                                isSelected ? 'text-kn-teal' : 'text-gray-800',
                              )}
                            >
                              {schema.name}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                              {schema.description}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 pt-0.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-kn-teal">
                                <svg
                                  className="h-3 w-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
