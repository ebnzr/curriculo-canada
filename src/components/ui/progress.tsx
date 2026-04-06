import * as React from "react"
import * as RadixProgress from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof RadixProgress.Root>,
  React.ComponentPropsWithoutRef<typeof RadixProgress.Root>
>(({ className, ...props }, ref) => (
  <RadixProgress.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    {...props}
  />
))
Progress.displayName = RadixProgress.Root.displayName

const ProgressIndicator = React.forwardRef<
  React.ElementRef<typeof RadixProgress.Indicator>,
  React.ComponentPropsWithoutRef<typeof RadixProgress.Indicator>
>(({ className, ...props }, ref) => (
  <RadixProgress.Indicator
    ref={ref}
    className={cn("h-full w-full bg-primary transition-all", className)}
    {...props}
  />
))
ProgressIndicator.displayName = RadixProgress.Indicator.displayName

export { Progress, ProgressIndicator }
