export const ACTION_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'surface' | 'brand'> = {
  CREATED: 'success', UPDATED: 'info', ACTIVATED: 'success', APPROVED: 'success',
  ALLOCATED: 'brand', DEALLOCATED: 'warning', DEACTIVATED: 'danger', DELETED: 'danger',
  REJECTED: 'danger', CANCELLED: 'surface',
};
