import { cn } from '@/lib/utils';
import { WEEKDAYS } from '@/lib/weekdays';

interface WeekdayPickerProps {
  value: string[];
  onChange: (days: string[]) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

/** Toggle buttons for the days of the week. */
export function WeekdayPicker({ value, onChange, label = 'Working Days', required, error }: WeekdayPickerProps) {
  function toggle(day: string) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);
  }

  return (
    <div>
      <label className="form-label">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {WEEKDAYS.map((d) => {
          const on = value.includes(d.value);
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              aria-pressed={on}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-card border-surface-300 text-surface-600 hover:bg-surface-50'
              )}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="form-error mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
