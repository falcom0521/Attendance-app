import type { Holiday } from '@/types/holiday';

export const mockHolidays: Holiday[] = [
  // Nexus Kochi 2026
  { id: 'hol-001', name: "New Year's Day", date: '2026-01-01', description: 'New Year celebration', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-002', name: 'Republic Day', date: '2026-01-26', description: 'National holiday', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-003', name: 'Holi', date: '2026-03-21', description: 'Festival of Colors', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-004', name: 'Vishu', date: '2026-04-14', description: 'Kerala New Year', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-005', name: 'Eid ul-Fitr', date: '2026-03-31', description: 'End of Ramadan', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-006', name: 'Labour Day', date: '2026-05-01', description: 'International Workers Day', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-007', name: 'Onam', date: '2026-08-22', description: 'Kerala harvest festival', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-008', name: 'Independence Day', date: '2026-08-15', description: 'National holiday', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-009', name: 'Gandhi Jayanti', date: '2026-10-02', description: 'Birth anniversary of Mahatma Gandhi', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-010', name: 'Diwali', date: '2026-10-20', description: 'Festival of Lights', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-011', name: 'Christmas Day', date: '2026-12-25', description: 'Christmas celebration', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-001', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  // Nexus Bangalore (sub-002) - same national + Kannada Rajyotsava
  { id: 'hol-020', name: "New Year's Day", date: '2026-01-01', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-002', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-021', name: 'Republic Day', date: '2026-01-26', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-002', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-022', name: 'Independence Day', date: '2026-08-15', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-002', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-023', name: 'Kannada Rajyotsava', date: '2026-11-01', description: 'Karnataka state formation day', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-002', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-024', name: 'Diwali', date: '2026-10-20', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-002', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-025', name: 'Christmas Day', date: '2026-12-25', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-002', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  // Chennai (sub-003)
  { id: 'hol-030', name: 'Pongal', date: '2026-01-14', description: 'Tamil harvest festival', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-003', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-031', name: "New Year's Day", date: '2026-01-01', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-003', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-032', name: 'Republic Day', date: '2026-01-26', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-003', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 'hol-033', name: 'Independence Day', date: '2026-08-15', status: 'ACTIVE', companyId: 'company-001', subCompanyId: 'sub-003', year: 2026, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
];
