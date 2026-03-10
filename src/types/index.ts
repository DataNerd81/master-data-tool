// ============================================================
// KubeNest Master Data Tool — Core Types
// ============================================================

// --- Template Schema Types ---

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'enum';
export type TransformType = 'titleCase' | 'uppercase' | 'lowercase' | 'trim';

export interface ColumnValidation {
  pattern?: string; // RegExp pattern as string (for JSON serialization)
  min?: number;
  max?: number;
  dateFormat?: string;
  maxLength?: number;
  minLength?: number;
}

export interface ColumnDef {
  name: string;
  aliases: string[];
  type: ColumnType;
  required: boolean;
  description?: string;
  allowedValues?: string[];
  validation?: ColumnValidation;
  transform?: TransformType;
  defaultValue?: string | number | boolean;
  /** If true, this field is auto-populated by the tool (not mapped from user columns). */
  autoDetected?: boolean;
}

export interface HierarchyRule {
  levels: string[]; // Column names forming the hierarchy (e.g. ['Country', 'State', 'Site'])
  parentColumn?: string;
}

export interface TemplateSchema {
  id: string;
  name: string;
  description: string;
  group: string; // Category group for UI display (e.g. 'Scope 1 Emissions')
  icon: string; // Lucide icon name
  columns: ColumnDef[];
  hierarchy?: HierarchyRule;
  uniqueConstraint?: string[];
}

// --- Data Types ---

export type CellValue = string | number | boolean | Date | null | undefined;
export type DataRow = Record<string, CellValue>;

export interface ParsedSheet {
  name: string;
  headers: string[];
  data: DataRow[];
  rowCount: number;
}

export interface ParsedWorkbook {
  fileName: string;
  sheets: ParsedSheet[];
}

// --- Mapping Types ---

export type MappingConfidence = 'exact' | 'high' | 'medium' | 'low' | 'unmapped';

export interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string | null;
  confidence: MappingConfidence;
  score: number; // 0-1
}

export interface MappingConfig {
  templateId: string;
  mappings: ColumnMapping[];
  savedAt?: string;
}

// --- Validation Types ---

export type IssueSeverity = 'critical' | 'warning' | 'suggestion';
export type IssueCategory =
  | 'required_fields'
  | 'naming_convention'
  | 'data_type'
  | 'date_format'
  | 'duplicate'
  | 'hierarchy'
  | 'unit'
  | 'australian_format'
  | 'auto_detected'
;

export interface ValidationIssue {
  id: string;
  row: number;
  column: string;
  severity: IssueSeverity;
  category: IssueCategory;
  message: string;
  currentValue: CellValue;
  suggestedValue?: CellValue;
}

export interface CategoryScore {
  category: string;
  label: string;
  weight: number;
  score: number; // 0-100
  issueCount: number;
}

export interface ValidationResult {
  overallScore: number;
  categoryScores: CategoryScore[];
  issues: ValidationIssue[];
  totalRows: number;
  cleanRows: number;
}

// --- Fix Types ---

export interface FixGroup {
  id: string;
  category: IssueCategory;
  label: string;
  description: string;
  issueCount: number;
  affectedRows: number;
  enabled: boolean;
  samples: FixSample[];
}

export interface FixSample {
  row: number;
  column: string;
  before: CellValue;
  after: CellValue;
}

// --- App State Types ---

export type WizardStep =
  | 'template'           // 1. Select mandatory field document
  | 'naming-convention'  // 2. Naming convention document (optional)
  | 'hierarchy'          // 3. Hierarchy structure document (optional)
  | 'upload'             // 4. Upload messy file
  | 'scan-extract'       // 5. Scan & extract data
  | 'review-dashboard'   // 6. Review 7 columns + dashboard
  | 'sign-off'           // 7. Sign off on fixes & NGA mapping
  | 'location'           // 8. Assign location to assets
  | 'active-dates'       // 9. Set active dates
  | 'pre-2004'           // 10. Pre-2004 asset flagging
  | 'final-export'       // 11. Final export
;

export type WizardPhase = 'Setup' | 'Process' | 'Enrich' | 'Export';

export interface WizardStepDef {
  id: WizardStep;
  label: string;
  shortLabel: string;
  phase: WizardPhase;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  // Setup phase
  { id: 'template',          label: 'Select Template',       shortLabel: 'Template',   phase: 'Setup' },
  { id: 'naming-convention', label: 'Naming Convention',     shortLabel: 'Naming',     phase: 'Setup' },
  { id: 'hierarchy',         label: 'Hierarchy Structure',   shortLabel: 'Hierarchy',  phase: 'Setup' },
  // Process phase
  { id: 'upload',            label: 'Upload Data',           shortLabel: 'Upload',     phase: 'Process' },
  { id: 'scan-extract',      label: 'Scan & Extract',        shortLabel: 'Scan',       phase: 'Process' },
  { id: 'review-dashboard',  label: 'Review & Dashboard',    shortLabel: 'Review',     phase: 'Process' },
  { id: 'sign-off',          label: 'Sign Off',              shortLabel: 'Sign Off',   phase: 'Process' },
  // Enrich phase
  { id: 'location',          label: 'Assign Location',       shortLabel: 'Location',   phase: 'Enrich' },
  { id: 'active-dates',      label: 'Active Dates',          shortLabel: 'Dates',      phase: 'Enrich' },
  { id: 'pre-2004',          label: 'Pre-2004 Assets',       shortLabel: 'Pre-2004',   phase: 'Enrich' },
  // Export phase
  { id: 'final-export',      label: 'Final Export',          shortLabel: 'Export',      phase: 'Export' },
];
