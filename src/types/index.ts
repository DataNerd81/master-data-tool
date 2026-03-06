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

export type WizardStep = 'upload' | 'mapping' | 'analysis' | 'fixes' | 'execute';

export const WIZARD_STEPS: { id: WizardStep; label: string; path: string }[] = [
  { id: 'upload', label: 'Upload', path: '/' },
  { id: 'mapping', label: 'Map Columns', path: '/mapping' },
  { id: 'analysis', label: 'Analysis', path: '/analysis' },
  { id: 'fixes', label: 'Fix Recommendations', path: '/fixes' },
  { id: 'execute', label: 'Execute & Export', path: '/execute' },
];
