'use client';

import { useAppStore } from '@/stores/app-store';
import { UploadStep } from '@/components/steps/UploadStep';
import { MappingStep } from '@/components/steps/MappingStep';
import { AnalysisStep } from '@/components/steps/AnalysisStep';
import { FixesStep } from '@/components/steps/FixesStep';
import { ExecuteStep } from '@/components/steps/ExecuteStep';

export default function HomePage() {
  const currentStep = useAppStore((s) => s.currentStep);

  switch (currentStep) {
    case 'upload':
      return <UploadStep />;
    case 'mapping':
      return <MappingStep />;
    case 'analysis':
      return <AnalysisStep />;
    case 'fixes':
      return <FixesStep />;
    case 'execute':
      return <ExecuteStep />;
    default:
      return <UploadStep />;
  }
}
