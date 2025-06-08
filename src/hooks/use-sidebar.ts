import * as React from "react"
import { SidebarContext } from "@/types/sidebar.ts"

export const useSidebar = () => {
    const context = React.useContext(SidebarContext)

    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider")
    }

    return context
} 