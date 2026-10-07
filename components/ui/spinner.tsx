import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

// Spinner provides the shared accessible loading indicator used inside action buttons.
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      data-slot="spinner"
      role="status"
      {...props}
    />
  )
}

export { Spinner }
