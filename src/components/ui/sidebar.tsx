import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"

const sidebarVariants = cva(
  "group z-10 flex h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground data-[collapsed=true]:w-14",
  {
    variants: {
      orientation: {
        vertical: "w-56",
        horizontal: "h-16 flex-row",
      },
      variant: {
        default: "border-r",
        ghost: "",
      },
    },
    defaultVariants: {
      orientation: "vertical",
      variant: "default",
    },
  }
)

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  collapsed?: boolean
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, orientation, variant, collapsed, ...props }, ref) => (
    <div
      ref={ref}
      data-collapsed={collapsed}
      className={cn(sidebarVariants({ orientation, variant, className }))}
      {...props}
    />
  )
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-16 shrink-0 items-center justify-center gap-3 border-b px-4 text-xl font-semibold [&>svg]:size-6",
      className
    )}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 overflow-auto", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-auto flex h-16 shrink-0 items-center p-4", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-1 p-2 group-data-[collapsed=true]:px-2",
      className
    )}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("relative w-full", className)} {...props} />
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"

const buttonVariants = cva(
  "inline-flex items-center justify-start gap-3 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        primary:
          "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
      },
      size: {
        default: "h-10 px-3",
        icon: "h-10 w-10",
      },
      isActive: {
        true: "bg-sidebar-accent text-sidebar-accent-foreground",
      },
      isCollapsed: {
        true: "[&>span]:hidden",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  tooltip?: string
}

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    {
      className,
      variant,
      size,
      isActive,
      isCollapsed,
      asChild = false,
      tooltip,
      ...props
    },
    ref
  ) => {
    const Comp = "button"
    const button = (
      <Comp
        className={cn("w-full", buttonVariants({ variant, size, className }))}
        data-active={isActive}
        ref={ref}
        {...props}
      />
    )

    if (tooltip) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-sidebar-accent text-sidebar-accent-foreground"
            >
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return button
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
}
