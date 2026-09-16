"use client";

import React, { forwardRef } from 'react';
import { CaralIcon, Icons } from 'iconcaral2';

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  options?: SelectOption[];
  helperText?: string;
  error?: string;
  leftIcon?: Icons;
  containerClassName?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      helperText,
      error,
      leftIcon,
      containerClassName = '',
      className = '',
      id,
      required,
      disabled,
      placeholder,
      children,
      ...props
    },
    ref
  ) => {
    // Generate fallback id if not provided but label exists
    const selectId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300 select-none"
          >
            {label}
            {required && <span className="text-red-500 ml-1 font-semibold">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-neutral-400 dark:text-neutral-500 pointer-events-none flex items-center justify-center">
              <CaralIcon name={leftIcon} size={18} />
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            className={`w-full appearance-none rounded-md border text-sm transition-colors px-3 py-2 pr-9 bg-container text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-neutral-300 dark:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              } ${leftIcon ? 'pl-9' : ''} ${disabled ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800' : ''
              } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-neutral-400">
                {placeholder}
              </option>
            )}

            {options
              ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
              : children}
          </select>

          {/* Custom Chevron Up and Chevron Down Arrows */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col justify-center items-center px-3 gap-[3px]">
            <CaralIcon name="chevronDown" />

          </div>
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

Select.displayName = 'Select';

export default Select;
