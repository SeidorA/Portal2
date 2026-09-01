import React from 'react';
import { Button } from 'caralstable';
import { CaralIcon, Brand } from 'iconcaral2';

interface ManagementItemProps {
  id: string;
  title: string;
  subtitle?: string;
  iconName?: string;
  useBrand?: boolean;
  isHidden?: boolean;
  isActive?: boolean;
  onEdit?: () => void;
  onToggleHide?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  dragHandleProps?: any; // For dnd-kit or react-beautiful-dnd
}

export default function ManagementItem({
  id,
  title,
  subtitle,
  iconName,
  useBrand = false,
  isHidden = false,
  isActive = false,
  onEdit,
  onToggleHide,
  onDelete,
  onClick,
  dragHandleProps
}: ManagementItemProps) {
  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${isHidden
        ? 'bg-warning-main/10 border-warning-main/50'
        : isActive
          ? 'bg-info-main/10 border-info-hard/20'
          : 'bg-container border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800'
        }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Drag Handle */}
        <div
          className="text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          {...dragHandleProps}
          onClick={(e) => e.stopPropagation()}
        >
          <CaralIcon name="menu" size={20} />
        </div>

        {/* Main Content */}
        <div className={`flex items-center gap-3 ${isHidden ? 'opacity-50' : 'opacity-100'}`}>
          {iconName && (
            <div className={`w-8 h-8 rounded bg-neutral-100 flex items-center justify-center shrink-0 ${isActive ? 'text-info-main' : 'text-neutral-600 dark:text-neutral-400'}`}>
              {useBrand ? (
                <Brand name={iconName as any} size={20} />
              ) : (
                <CaralIcon name={iconName as any} size={20} />
              )}
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span className={`font-medium text-sm truncate ${isActive ? 'text-info-main' : 'text-neutral-900 '}`}>
              {title}
            </span>
            {subtitle && (
              <span className="text-xs text-neutral-600 truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1 transition-opacity ${isActive || isHidden ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`} onClick={(e) => e.stopPropagation()}>
        {onEdit && (
          <Button
            isIconButton
            variant="ghost"
            iconName="edit"
            onClick={onEdit}
          />
        )}
        {onToggleHide && (
          <Button
            isIconButton
            variant="ghost"
            iconName={isHidden ? "eye" : "eyeSlash"}
            size="sm"
            onClick={onToggleHide}
          />
        )}
        {onDelete && (
          <Button
            isIconButton
            variant="ghost"
            iconName="trash"
            className="text-danger-main hover:bg-danger-main/10 hover:text-danger-hard!"
            size="sm"
            onClick={onDelete}
          />
        )}
      </div>
    </div>
  );
}
