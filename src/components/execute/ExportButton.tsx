'use client';

import { Download, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useExport } from '@/hooks/use-export';
import { useAppStore } from '@/stores/app-store';
import { getSchema } from '@/lib/schemas/registry';
import { cn } from '@/components/ui/cn';

interface ExportButtonProps {
  disabled?: boolean;
}

export function ExportButton({ disabled = false }: ExportButtonProps) {
  const { exportData, isExporting } = useExport();
  const selectedTemplateId = useAppStore((s) => s.selectedTemplateId);

  const fileName = useMemo(() => {
    if (!selectedTemplateId) return 'cleaned-data.xlsx';
    const schema = getSchema(selectedTemplateId);
    if (!schema) return 'cleaned-data.xlsx';
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${schema.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}.xlsx`;
  }, [selectedTemplateId]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled || isExporting}
        onClick={exportData}
        className={cn(
          'inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold shadow-md transition-all',
          disabled || isExporting
            ? 'cursor-not-allowed bg-gray-200 text-gray-400'
            : 'bg-kn-blue text-white hover:bg-kn-blue/90 hover:shadow-lg active:scale-[0.98]',
        )}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            Download Cleaned File
          </>
        )}
      </button>

      {!disabled && (
        <p className="text-xs text-gray-500">
          Will download as{' '}
          <span className="font-medium text-gray-700">{fileName}</span>
        </p>
      )}
    </div>
  );
}
