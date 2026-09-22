"use client";

import React, { forwardRef } from 'react';
import { CaralIcon, Icons } from 'iconcaral2';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: string;
  rows?: number;
  cols?: number;
  label?: React.ReactNode;
  helperText?: string;
  error?: string;
  leftIcon?: Icons;
  rightIcon?: Icons;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      type = 'text',
      rows = 3,
      cols,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      rightElement,
      containerClassName = '',
      className = '',
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    // Generate fallback id if not provided but label exists
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isTextarea = type === 'textarea';

    const baseInputClasses = `w-full rounded-md border text-sm transition-colors px-3 py-2 bg-container text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none ${
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
        : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
    } ${leftIcon ? 'pl-9' : ''} ${rightIcon || rightElement ? 'pr-9' : ''} ${
      disabled ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800' : ''
    } ${className}`;

    return (
      <div className={`flex flex-col w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300 select-none"
          >
            {label}
            {required && <span className="text-red-500 ml-1 font-semibold">*</span>}
          </label>
        )}

        <div className={`relative flex w-full ${isTextarea ? 'items-start' : 'items-center'}`}>
          {leftIcon && (
            <div className={`absolute left-3 text-neutral-400 dark:text-neutral-500 pointer-events-none flex items-center justify-center ${isTextarea ? 'top-2.5' : ''}`}>
              <CaralIcon name={leftIcon} size={18} />
            </div>
          )}

          {isTextarea ? (
            <textarea
              ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
              id={inputId}
              rows={rows}
              cols={cols}
              required={required}
              disabled={disabled}
              className={`${baseInputClasses} resize-y font-sans`}
              {...(props as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.ForwardedRef<HTMLInputElement>}
              id={inputId}
              type={type}
              required={required}
              disabled={disabled}
              className={baseInputClasses}
              {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}

          {rightIcon && !rightElement && (
            <div className={`absolute right-3 text-neutral-400 dark:text-neutral-500 pointer-events-none flex items-center justify-center ${isTextarea ? 'top-2.5' : ''}`}>
              <CaralIcon name={rightIcon} size={18} />
            </div>
          )}

          {rightElement && (
            <div className={`absolute right-2.5 flex items-center justify-center ${isTextarea ? 'top-2' : ''}`}>
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
