import { useState, useMemo } from 'react';
import { Download, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useMonthlyAttendance } from '../hooks/useAttendance';
import { useAuthStore } from '@/store/authStore';
import { useSubCompanyScope } from '@/hooks/useSubCompanyScope';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import {
  formatDate,
  formatTime,
  minutesToDisplay,
  MONTH_OPTIONS,
  YEAR_OPTIONS,
  currentMonthYear,
  formatMonthYear,
} from '@/utils/date';
import { reportService } from '@/services/mock';
import { useToast } from '@/components/feedback/ToastContext';
import { summarizeMonthlyAttendance } from '@/utils/attendance';
import type { ExportFormat } from '@/types/report';

const PAGE_SIZE = 15;

export function MonthlyAttendancePage() {
  const toast = useToast();
  const { user } = useAuthStore();
  const scope = useSubCompanyScope();
  const { month: curMonth, year: curYear } = currentMonthYear();

  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [employeeId, setEmployeeId] = useState('');
  const [generating, setGenerating] = useState('');
  const [page, setPage] = useState(1);

  const { data: employees } = useEmployees({
    page: 1, pageSize: 200,
    subCompanyId: scope.subCompanyId,
    companyId: scope.companyId,
    status: 'ACTIVE',
  });

  const { data: records = [], isLoading } = useMonthlyAttendance({
    month,
    year,
    companyId: scope.companyId,
    subCompanyId: scope.subCompanyId,
    employeeId: employeeId || undefined,
  });

  // ── Pagination ──────────────────────────────────────────────────
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pagedRecords = useMemo(
    () => records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [records, page]
  );

  // Reset to page 1 whenever filters change
  function changeMonth(v: number) { setMonth(v); setPage(1); }
  function changeYear(v: number)  { setYear(v);  setPage(1); }
  function changeEmployee(v: string) { setEmployeeId(v); setPage(1); }

  // ── Summary ─────────────────────────────────────────────────────
  const summary = useMemo(
    () => (records.length > 0 ? summarizeMonthlyAttendance(records) : null),
    [records]
  );

  // ── Navigate months ─────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else             { setMonth((m) => m - 1); }
    setPage(1);
  }
  function nextMonth() {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else              { setMonth((m) => m + 1); }
    setPage(1);
  }
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  // ── Export ──────────────────────────────────────────────────────
  async function handleExport(fmt: ExportFormat) {
    setGenerating(fmt);
    try {
      await reportService.exportMonthlyReport(
        month, year,
        { employeeIds: employeeId ? [employeeId] : [] },
        fmt
      );
      toast.success(`${fmt} exported`, formatMonthYear(month, year));
    } catch {
      toast.error('Export failed');
    } finally {
      setGenerating('');
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Monthly Attendance"
        subtitle="Review and export monthly attendance records"
        breadcrumbs={[
          { label: user?.role === 'ADMIN' ? 'Admin' : 'HR' },
          { label: 'Attendance' },
          { label: 'Monthly' },
        ]}
      />

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Month navigator */}
        <div>
          <p className="form-label">Period</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-surface-300 text-surface-500 hover:bg-surface-50 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1.5">
              <Select
                options={MONTH_OPTIONS}
                value={String(month)}
                onChange={(e) => changeMonth(Number(e.target.value))}
                className="w-32"
              />
              <Select
                options={YEAR_OPTIONS}
                value={String(year)}
                onChange={(e) => changeYear(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-surface-300 text-surface-500 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Employee selector */}
        <div className="w-64">
          <Select
            label="Employee"
            options={[
              { label: 'All Employees', value: '' },
              ...(employees?.data ?? []).map((e) => ({
                label: `${e.fullName} (${e.employeeCode})`,
                value: e.id,
              })),
            ]}
            value={employeeId}
            onChange={(e) => changeEmployee(e.target.value)}
          />
        </div>

        {/* Export buttons */}
        <div className="flex gap-2 items-end pb-0.5 ml-auto">
          {(['EXCEL', 'PDF', 'CSV'] as const).map((fmt) => (
            <Button
              key={fmt}
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              loading={generating === fmt}
              onClick={() => handleExport(fmt)}
            >
              {fmt}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Summary ─────────────────────────────────────────────── */}
      {summary && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Present',   value: summary.present,  unit: 'days', color: 'bg-success-50 text-success-800 ring-1 ring-success-200' },
            { label: 'Absent',    value: summary.absent,   unit: 'days', color: 'bg-danger-50  text-danger-800  ring-1 ring-danger-200'  },
            { label: 'Late',      value: summary.late,     unit: 'days', color: 'bg-warning-50 text-warning-800 ring-1 ring-warning-200' },
            { label: 'Early Out', value: summary.earlyOut, unit: 'days', color: 'bg-orange-50  text-orange-800  ring-1 ring-orange-200'  },
            { label: 'Overtime',  value: minutesToDisplay(summary.overtimeMinutes), unit: 'total', color: 'bg-brand-50 text-brand-800 ring-1 ring-brand-200' },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">{item.label}</p>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs opacity-50 mt-0.5">{item.unit}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title={formatMonthYear(month, year)}
          subtitle={
            isLoading
              ? 'Loading…'
              : `${records.length} record${records.length !== 1 ? 's' : ''}${records.length > PAGE_SIZE ? ` · page ${page} of ${totalPages}` : ''}`
          }
        />
        <CardBody className="p-0">
          {isLoading ? (
            <TableSkeleton rows={PAGE_SIZE} columns={10} />
          ) : records.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="h-8 w-8 text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-500 font-medium">
                No records for {formatMonthYear(month, year)}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                Try selecting a different month or employee
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-th">Date</th>
                      <th className="table-th">Employee</th>
                      <th className="table-th">Shift</th>
                      <th className="table-th">Punch In</th>
                      <th className="table-th">Punch Out</th>
                      <th className="table-th">Working</th>
                      <th className="table-th">Late</th>
                      <th className="table-th">Early Out</th>
                      <th className="table-th">OT</th>
                      <th className="table-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRecords.map((r) => (
                      <tr key={r.id} className="table-tr">
                        <td className="table-td font-medium whitespace-nowrap">
                          {formatDate(r.date, 'dd MMM (EEE)')}
                        </td>
                        <td className="table-td">
                          <p className="font-medium text-surface-900">{r.employeeName}</p>
                          <p className="text-xs text-surface-400">
                            {r.employeeCode}{scope.showSubCompany && r.subCompanyName ? ` · ${r.subCompanyName}` : ''}
                          </p>
                        </td>
                        <td className="table-td text-surface-600 whitespace-nowrap">
                          {r.shiftName}
                        </td>
                        <td className="table-td">
                          {r.firstPunchIn ? (
                            <span className="font-mono text-xs">{formatTime(r.firstPunchIn)}</span>
                          ) : (
                            <span className="text-surface-300">—</span>
                          )}
                        </td>
                        <td className="table-td">
                          {r.lastPunchOut ? (
                            <span className="font-mono text-xs">{formatTime(r.lastPunchOut)}</span>
                          ) : (
                            <span className="text-surface-300">—</span>
                          )}
                        </td>
                        <td className="table-td font-mono text-xs">
                          {r.workingMinutes > 0 ? minutesToDisplay(r.workingMinutes) : (
                            <span className="text-surface-300">—</span>
                          )}
                        </td>
                        <td className="table-td">
                          {r.lateMinutes > 0 ? (
                            <span className="text-xs text-warning-600 font-medium">
                              {minutesToDisplay(r.lateMinutes)}
                            </span>
                          ) : (
                            <span className="text-surface-300">—</span>
                          )}
                        </td>
                        <td className="table-td">
                          {r.earlyOutMinutes > 0 ? (
                            <span className="text-xs text-orange-600 font-medium">
                              {minutesToDisplay(r.earlyOutMinutes)}
                            </span>
                          ) : (
                            <span className="text-surface-300">—</span>
                          )}
                        </td>
                        <td className="table-td">
                          {r.overtimeMinutes > 0 ? (
                            <span className="text-xs text-brand-600 font-medium">
                              {minutesToDisplay(r.overtimeMinutes)}
                            </span>
                          ) : (
                            <span className="text-surface-300">—</span>
                          )}
                        </td>
                        <td className="table-td">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {records.length > PAGE_SIZE && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={records.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
