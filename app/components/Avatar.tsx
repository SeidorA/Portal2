import React from 'react';
import { CaralIcon } from "iconcaral2";

export type AvatarType = 'image' | 'initials' | 'illustration' | 'default';

export interface AvatarProps {
  type?: AvatarType;
  src?: string; // URL for image or illustration
  initials?: string; // e.g., "JD"
  backgroundColor?: string; // background color class or hex for initials/illustration
  textColor?: string; // text color for initials
  size?: 'sm' | 'md' | 'lg' | 'xl'; // predefined sizes
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export default function Avatar({
  type = 'default',
  src,
  initials,
  backgroundColor = 'bg-neutral-200 dark:bg-neutral-800',
  textColor = 'text-neutral-700 dark:text-neutral-300',
  size = 'md',
  className = '',
  onClick,
}: AvatarProps) {
  const baseClasses = "rounded-full flex items-center justify-center shrink-0 overflow-hidden font-medium";
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const interactiveClasses = onClick ? "cursor-pointer" : "";

  // Handle Image or Illustration
  if ((type === 'image' || type === 'illustration') && src) {
    return (
      <div 
        className={`${baseClasses} ${sizeClass} ${interactiveClasses} border border-neutral-300 dark:border-neutral-700 ${className}`}
        onClick={onClick}
      >
        <img 
          src={src} 
          alt="Avatar" 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Handle Initials
  if (type === 'initials' && initials) {
    return (
      <div 
        className={`${baseClasses} ${sizeClass} ${interactiveClasses} ${backgroundColor} ${textColor} border border-neutral-300 dark:border-neutral-700 ${className}`}
        onClick={onClick}
      >
        {initials.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  // Default fallback (Icon)
  return (
    <div 
      className={`${baseClasses} ${sizeClass} ${interactiveClasses} ${backgroundColor} border border-neutral-300 dark:border-neutral-700 ${className}`}
      onClick={onClick}
    >
      <CaralIcon name="user" size={size === 'sm' ? 's' : size === 'xl' ? 'l' : 'm'} />
    </div>
  );
}
