import type { Department } from '@/types/department';

function dept(
  id: string,
  name: string,
  companyId: string,
  description?: string
): Department {
  return {
    id,
    name,
    description,
    status: 'ACTIVE',
    companyId,
    createdAt: '2022-04-01T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  };
}

export const mockDepartments: Department[] = [
  // ── Nexus Technologies (company-001) ──────────────────────────────
  dept('dept-001-01', 'Engineering',     'company-001', 'Software development and architecture'),
  dept('dept-001-02', 'Product',         'company-001', 'Product management and roadmap'),
  dept('dept-001-03', 'QA',              'company-001', 'Quality assurance and testing'),
  dept('dept-001-04', 'Data Science',    'company-001', 'Machine learning and analytics'),
  dept('dept-001-05', 'HR',             'company-001', 'Human resources and talent'),
  dept('dept-001-06', 'Finance',         'company-001', 'Finance, accounting and payroll'),
  dept('dept-001-07', 'Marketing',       'company-001', 'Brand, campaigns and digital marketing'),
  dept('dept-001-08', 'Sales',           'company-001', 'Enterprise and SMB sales'),
  dept('dept-001-09', 'Operations',      'company-001', 'Business operations and facilities'),
  dept('dept-001-10', 'Administration',  'company-001', 'Office administration and compliance'),

  // ── Vertex Solutions (company-002) ───────────────────────────────
  dept('dept-002-01', 'Engineering',    'company-002', 'Software development'),
  dept('dept-002-02', 'Product',        'company-002', 'Product management'),
  dept('dept-002-03', 'QA',             'company-002', 'Quality assurance'),
  dept('dept-002-04', 'HR',             'company-002', 'Human resources'),
  dept('dept-002-05', 'Finance',        'company-002', 'Finance and accounting'),
  dept('dept-002-06', 'Operations',     'company-002', 'Business operations'),
  dept('dept-002-07', 'Sales',          'company-002', 'Sales and business development'),
  dept('dept-002-08', 'Marketing',      'company-002', 'Marketing and communications'),

  // ── Orbis Global (company-003) ───────────────────────────────────
  dept('dept-003-01', 'Engineering',    'company-003', 'Software engineering'),
  dept('dept-003-02', 'HR',             'company-003', 'Human resources'),
  dept('dept-003-03', 'Finance',        'company-003', 'Finance'),
  dept('dept-003-04', 'Operations',     'company-003', 'Operations'),
  dept('dept-003-05', 'Sales',          'company-003', 'Sales'),

  // ── Pinnacle Workforce (company-004) ────────────────────────────
  dept('dept-004-01', 'Engineering',    'company-004', 'Software development'),
  dept('dept-004-02', 'HR',             'company-004', 'Human resources'),
  dept('dept-004-03', 'Finance',        'company-004', 'Finance'),
  dept('dept-004-04', 'Operations',     'company-004', 'Operations'),

  // ── Stratos Digital (company-005) ───────────────────────────────
  dept('dept-005-01', 'Engineering',    'company-005', 'Software development'),
  dept('dept-005-02', 'HR',             'company-005', 'Human resources'),
  dept('dept-005-03', 'Operations',     'company-005', 'Operations'),
];
