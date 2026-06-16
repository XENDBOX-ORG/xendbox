import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-dark dark:focus:ring-offset-gray-50 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.97]':
              variant === 'primary',
            'bg-white text-dark hover:bg-gray-100 shadow-lg active:scale-[0.97] dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700':
              variant === 'secondary',
            'border border-white/20 text-white hover:bg-white/10 active:scale-[0.97] dark:border-gray-300 dark:text-gray-900 dark:hover:bg-gray-100':
              variant === 'outline',
            'text-gray-400 hover:text-white hover:bg-white/5 dark:text-gray-500 dark:hover:text-gray-900 dark:hover:bg-gray-100':
              variant === 'ghost',
          },
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
export { Button, type ButtonProps }
