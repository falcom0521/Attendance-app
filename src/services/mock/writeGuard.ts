import { getActivityActorRole } from './activityLog.service';

/**
 * Mock-layer stand-in for the server rule: a SUPER_ADMIN_VIEWER may read but never write.
 * The real API returns `403 READ_ONLY_ACCOUNT` for every non-GET request from that role.
 */
export function assertWritable(): void {
  if (getActivityActorRole() === 'SUPER_ADMIN_VIEWER') {
    throw new Error('Your account is read-only. You cannot make changes.');
  }
}
