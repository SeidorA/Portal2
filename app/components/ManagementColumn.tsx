import React from 'react';
import { Button } from 'caralstable';

interface ManagementColumnProps {
  title: React.ReactNode;
  onAdd?: () => void;
  actionElement?: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
}

export default function ManagementColumn({
  title,
  onAdd,
  actionElement,
  children,
  isOpen
}: ManagementColumnProps) {
  if (!isOpen) return null;

  return (
    <div className="flex flex-col bg-container border-r border-neutral-200 dark:border-neutral-800 w-80 shrink-0 h-full animate-fade-in animate-duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0 h-[72px]">
        <h2 className="text-lg font-poppins font-semibold text-neutral-900 dark:text-white">
          {title}
        </h2>
        <div className="flex items-center gap-1">
          {actionElement}
          {onAdd && !actionElement && (
            <Button
              isIconButton
              variant="ghost"
              iconName="plus"
              onClick={onAdd}
              className="text-neutral-500 hover:text-info-main"
            />
          )}
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
