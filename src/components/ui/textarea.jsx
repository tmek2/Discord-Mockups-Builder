import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-[10px] border border-[var(--gator-border-strong)] bg-[var(--gator-surface)] px-3 py-2 text-base text-[var(--gator-text)] placeholder:text-[var(--gator-muted)] transition-colors hover:border-white/20 focus-visible:border-[var(--gator-accent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
