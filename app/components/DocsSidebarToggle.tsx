"use client";

import React from "react";
import { Button } from "caralstable";
import { useSidebar } from "@/app/components/SidebarProvider";

export default function DocsSidebarToggle() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="mr-4 pr-4 border-r border-neutral-300 dark:border-neutral-700">
      <Button
        variant={isSidebarOpen ? "ghost" : "info"}
        isIconButton
        iconName="closeSidebarRigt"
        onClick={toggleSidebar}
      />
    </div>
  );
}
