import { type InputHTMLAttributes, type TextareaHTMLAttributes, useState, useId } from 'react';

interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: { current: number; max: number };
}

type InputProps = BaseInputProps &
  InputHTMLAttributes<HTMLInputElement> & { as?: 'input' };
type TextareaProps = BaseInputProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' };

type Props = InputProps | TextareaProps;

export default function Input(props: Props) {
  const {
    label,
    error,
    hint,
    charCount,
    as,
    className = '',
    id: externalId,
    ...rest
  } = props;
  const generatedId = useId();
  const id = externalId || generatedId;
  const [focused, setFocused] = useState(false);

  const baseClass =
    'w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors duration-150 outline-none';
  const stateClass = error
    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
    : focused
      ? 'border-primary-500 ring-2 ring-primary-50'
      : 'border-gray-200 hover:border-gray-300';
  const inputClass = `${baseClass} ${stateClass} ${className}`;

  const Tag = as === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-900">
          {label}
        </label>
      )}
      <Tag
        id={id}
        className={inputClass}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...(rest as any)}
      />
      <div className="flex items-center justify-between">
        <div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
        {charCount && (
          <p
            className={`text-xs ${charCount.current > charCount.max ? 'text-red-500' : 'text-gray-400'}`}
          >
            {charCount.current}/{charCount.max}
          </p>
        )}
      </div>
    </div>
  );
}
