import * as React from 'react'
import { Input as ShadcnInput } from './Input'

interface InputProps extends React.ComponentProps<typeof ShadcnInput> {
  label?: string
  error?: string
}

function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <ShadcnInput
        id={inputId}
        data-invalid={error ? '' : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={className}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export { Input }
