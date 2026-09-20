export type ReportType = 'DAILY' | 'MONTHLY' | 'EMPLOYEE' | 'MULTI_EMPLOYEE';
export type ExportFormat = 'EXCEL' | 'PDF' | 'CSV';

export interface ReportFilters {
  type: ReportType;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  employeeIds?: string[];
  departmentId?: string;
  shiftId?: string;
  subCompanyId?: string;
  format?: ExportFormat;
}

export interface ReportGenerationResult {
  success: boolean;
  fileName: string;
  message: string;
}
