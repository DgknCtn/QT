"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { Toaster as Sonner } from "sonner"

import { useTheme } from "@/components/theme-provider"

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Toast host. Reads the app's own ThemeProvider -- the generated shadcn version
 * pulled `useTheme` from next-themes, whose provider this app never mounts, so
 * toasts silently fell back to "system" and ignored the user's theme choice.
 * Colors are bound to the globals.css design tokens for the same reason: the
 * stock `bg-background`/`text-foreground` classes don't exist in this project.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--color-bg-elevated)",
          "--normal-text": "var(--color-text-primary)",
          "--normal-border": "var(--color-bg-border)",
          "--success-bg": "var(--color-bg-elevated)",
          "--success-text": "var(--color-success)",
          "--error-bg": "var(--color-bg-elevated)",
          "--error-text": "var(--color-danger)",
        } as React.CSSProperties
      }
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
