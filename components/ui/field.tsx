import * as React from "react"

import { cn } from "@/lib/utils"

// FieldGroup keeps related controls on the spacing contract used by shadcn forms.
function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("flex w-full flex-col gap-5", className)} {...props} />
}

// Field connects a label, control, description, and error without repeating layout markup.
function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div role="group" data-slot="field" className={cn("flex w-full flex-col gap-2 data-[invalid=true]:text-destructive", className)} {...props} />
}

// FieldLabel gives every form control an accessible, consistently styled label.
function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="field-label" className={cn("text-sm font-medium leading-none", className)} {...props} />
}

// FieldDescription presents supporting text separately from validation feedback.
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

// FieldError gives invalid controls one accessible message location.
function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  if (!props.children) return null
  return <p role="alert" data-slot="field-error" className={cn("text-sm text-destructive", className)} {...props} />
}

// FieldSet preserves native grouping semantics for the contribution allocation inputs.
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return <fieldset data-slot="field-set" className={cn("flex flex-col gap-4", className)} {...props} />
}

// FieldLegend names a grouped set of controls for sighted and assistive-technology users.
function FieldLegend({ className, ...props }: React.ComponentProps<"legend">) {
  return <legend data-slot="field-legend" className={cn("text-base font-medium", className)} {...props} />
}

export { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet }
