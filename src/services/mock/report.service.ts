import type { ReportFilters, ExportFormat, ReportGenerationResult } from '@/types/report';
import { sleep } from '@/lib/utils';
import { format } from 'date-fns';

export const reportService = {
  async generateReport(filters: ReportFilters): Promise<ReportGenerationResult> {
    await sleep(1500); // Simulate generation time

    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const type = filters.type.toLowerCase();
    const formatExt = (filters.format ?? 'EXCEL').toLowerCase() === 'excel' ? 'xlsx'
      : (filters.format ?? 'EXCEL').toLowerCase();

    const fileName = `attendance_${type}_report_${timestamp}.${formatExt}`;

    return {
      success: true,
      fileName,
      message: `Report generated successfully: ${fileName}`,
    };
  },

  async exportDailyReport(
    date: string,
    _filters: Partial<ReportFilters>,
    format: ExportFormat
  ): Promise<ReportGenerationResult> {
    await sleep(1200);
    const ext = format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase();
    return {
      success: true,
      fileName: `daily_attendance_${date.replace(/-/g, '')}.${ext}`,
      message: 'Daily report exported successfully',
    };
  },

  async exportMonthlyReport(
    month: number,
    year: number,
    _filters: Partial<ReportFilters>,
    fmt: ExportFormat
  ): Promise<ReportGenerationResult> {
    await sleep(1500);
    const ext = fmt.toLowerCase() === 'excel' ? 'xlsx' : fmt.toLowerCase();
    return {
      success: true,
      fileName: `monthly_attendance_${year}_${String(month).padStart(2, '0')}.${ext}`,
      message: 'Monthly report exported successfully',
    };
  },
};
