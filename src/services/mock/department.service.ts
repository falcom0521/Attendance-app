import type { Department, CreateDepartmentPayload } from '@/types/department';
import { mockDepartments } from '@/mocks/data/departments';
import { sleep } from '@/lib/utils';
import { logActivity } from './activityLog.service';

// eslint-disable-next-line prefer-const
let departments: Department[] = [...mockDepartments];

export const departmentService = {
  async getDepartments(companyId?: string): Promise<Department[]> {
    await sleep(300);
    if (companyId) return departments.filter((d) => d.companyId === companyId);
    return departments;
  },

  async getDepartmentById(id: string): Promise<Department> {
    await sleep(150);
    const dept = departments.find((d) => d.id === id);
    if (!dept) throw new Error('Department not found');
    return dept;
  },

  async createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
    await sleep(500);
    // Prevent duplicate names within the same company
    const exists = departments.some(
      (d) =>
        d.companyId === payload.companyId &&
        d.name.toLowerCase() === payload.name.toLowerCase()
    );
    if (exists) throw new Error(`A department named "${payload.name}" already exists.`);

    const newDept: Department = {
      ...payload,
      id: `dept-${payload.companyId}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    departments.push(newDept);
    logActivity({ action: 'CREATED', module: 'Configuration', target: `Department: ${newDept.name}`, targetId: newDept.id, companyId: newDept.companyId });
    return newDept;
  },

  async updateDepartment(
    id: string,
    payload: Partial<CreateDepartmentPayload>
  ): Promise<Department> {
    await sleep(400);
    const idx = departments.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Department not found');

    // Prevent duplicate name on update (allow same name for same record)
    if (payload.name) {
      const duplicate = departments.some(
        (d) =>
          d.id !== id &&
          d.companyId === departments[idx].companyId &&
          d.name.toLowerCase() === payload.name!.toLowerCase()
      );
      if (duplicate)
        throw new Error(`A department named "${payload.name}" already exists.`);
    }

    departments[idx] = {
      ...departments[idx],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    logActivity({ action: 'UPDATED', module: 'Configuration', target: `Department: ${departments[idx].name}`, targetId: id, companyId: departments[idx].companyId });
    return departments[idx];
  },

  async deleteDepartment(id: string): Promise<void> {
    await sleep(300);
    const idx = departments.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Department not found');
    const [removed] = departments.splice(idx, 1);
    logActivity({ action: 'DELETED', module: 'Configuration', target: `Department: ${removed.name}`, targetId: id, companyId: removed.companyId });
  },

  async toggleDepartmentStatus(id: string): Promise<Department> {
    await sleep(300);
    const idx = departments.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Department not found');
    departments[idx].status =
      departments[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    departments[idx].updatedAt = new Date().toISOString();
    logActivity({ action: departments[idx].status === 'ACTIVE' ? 'ACTIVATED' : 'DEACTIVATED', module: 'Configuration', target: `Department: ${departments[idx].name}`, targetId: id, companyId: departments[idx].companyId });
    return departments[idx];
  },
};
