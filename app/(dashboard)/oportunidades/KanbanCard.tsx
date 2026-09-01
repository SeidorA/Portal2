"use client";

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Opportunity } from './mockData';

interface KanbanCardProps {
  opportunity: Opportunity;
  index: number;
  onClick?: (opportunity: Opportunity) => void;
}

export default function KanbanCard({ opportunity, index, onClick }: KanbanCardProps) {
  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick && onClick(opportunity)}
          className={`
            bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm select-none
            hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer
            ${snapshot.isDragging ? 'shadow-lg border-info-main dark:border-info-main scale-105 z-50 opacity-90' : ''}
          `}
          style={provided.draggableProps.style}
        >
          <div className="flex flex-col gap-2 relative">
            {(opportunity.requiresIntervention || opportunity.missingRequirements) && (
              <div className={`absolute -top-1 -right-1 flex h-3 w-3 ${opportunity.requiresIntervention ? 'z-20' : 'z-10'}`}>
                {opportunity.requiresIntervention ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-main opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-danger-main"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-main opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success-main"></span>
                  </>
                )}
              </div>
            )}
            <span className="text-xs font-semibold text-info-main uppercase tracking-wider pr-4">
              {opportunity.productName}
            </span>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
              {opportunity.clientName}
            </h4>
          </div>
        </div>
      )}
    </Draggable>
  );
}
