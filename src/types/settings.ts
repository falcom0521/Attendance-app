export interface AttendanceSettings {
  lateGracePeriodMinutes: number;
  earlyOutThresholdMinutes: number;
  minimumWorkingHours: string; // "HH:mm"
  overtimeThresholdMinutes: number;
  overtimeEnabled: boolean;
  autoAbsent: boolean;
}
