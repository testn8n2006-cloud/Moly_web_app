import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>((
  { label, error, hint, className, ...props },
  ref
) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {props.required && <span className="text-red-500 mx-1">*</span>}
      </label>
    )}
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-royal/40 focus:border-royal transition-colors',
        error && 'border-red-400 focus:ring-red-400/40 focus:border-red-400',
        className
      )}
      {...props}
    />
    {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, {
  label?: string; error?: string; className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>>((
  { label, error, className, ...props }, ref
) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {props.required && <span className="text-red-500 mx-1">*</span>}
      </label>
    )}
    <textarea
      ref={ref}
      rows={3}
      className={cn(
        'w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-royal/40 focus:border-royal transition-colors resize-none',
        error && 'border-red-400',
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'
