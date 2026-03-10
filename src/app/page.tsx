'use client';

import { useAppStore } from '@/stores/app-store';
import { TemplateStep } from '@/components/steps/TemplateStep';
import { NamingConventionStep } from '@/components/steps/NamingConventionStep';
import { HierarchyStep } from '@/components/steps/HierarchyStep';
import { UploadStep } from '@/components/steps/UploadStep';
import { MappingStep } from '@/components/steps/MappingStep';
import { AnalysisStep } from '@/components/steps/AnalysisStep';
import { FixesStep } from '@/components/steps/FixesStep';
import { LocationStep } from '@/components/steps/LocationStep';
import { ActiveDatesStep } from '@/components/steps/ActiveDatesStep';
import { Pre2004Step } from '@/components/steps/Pre2004Step';
import { ExecuteStep } from '@/components/steps/ExecuteStep';

export default function HomePage() {
  const currentStep = useAppStore((s) => s.currentStep);

  switch (currentStep) {
    case 'template':
      return <TemplateStep />;
    case 'naming-convention':
      return <NamingConventionStep />;
    case 'hierarchy':
      return <HierarchyStep />;
    case 'upload':
      return <UploadStep />;
    case 'scan-extract':
      return <MappingStep />;
    case 'review-dashboard':
      return <AnalysisStep />;
    case 'sign-off':
      return <FixesStep />;
    case 'location':
      return <LocationStep />;
    case 'active-dates':
      return <ActiveDatesStep />;
    case 'pre-2004':
      return <Pre2004Step />;
    case 'final-export':
      return <ExecuteStep />;
    default:
      return <TemplateStep />;
  }
}
