export interface AttendanceSettings {
  lateGracePeriodMinutes: number;
  earlyOutThresholdMinutes: number;
  /**
   * Optional "flexible timing" rule. When off, attendance status is decided purely by shift start/end
   * (late arrival / early departure). When on, arrival and departure times no longer matter for shifts
   * that have a minimum set — an employee is PRESENT as soon as they complete that shift's
   * `minimumWorkingHours`, and EARLY_OUT (shown as hours short) if they don't. The minimum itself is
   * configured per shift (Configuration → Shifts), not here — this only turns the rule on or off.
   */
  minimumWorkingHoursEnabled: boolean;
  overtimeThresholdMinutes: number;
  overtimeEnabled: boolean;
  autoAbsent: boolean;
}
