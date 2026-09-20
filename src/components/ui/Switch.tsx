import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Switch({ checked, onChange, label, disabled, size = 'md' }: SwitchProps) {
  const trackSize = size === 'sm' ? 'h-4 w-7' : 'h-5 w-9';
  const thumbSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const thumbTranslate = size === 'sm' ? 'translate-x-3.5' : 'translate-x-4';

  return (
    <label className={cn('inline-flex items-center gap-2.5', disabled && 'opacity-50 cursor-not-allowed', !disabled && 'cursor-pointer')}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
          trackSize,
          checked ? 'bg-brand-600' : 'bg-surface-200'
        )}
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200',
            'absolute top-0.5 left-0.5',
            thumbSize,
            checked ? thumbTranslate : 'translate-x-0'
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-surface-700">{label}</span>}
    </label>
  );
}
