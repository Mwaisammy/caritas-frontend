import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const contributionSteps = [
  { value: "till", label: "Open till" },
  { value: "member", label: "Find member" },
  { value: "entry", label: "Contribution" },
  { value: "review", label: "Review" },
  { value: "receipt", label: "Receipt" },
] as const;

// ContributionProgress shows the current member workflow stage without controlling navigation.
export function ContributionProgress({
  step,
}: {
  step: "till" | "member" | "entry" | "review" | "receipt" | "close";
}) {
  if (step === "close") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 print:hidden">
        <div className="flex flex-col gap-1">
          <p className="font-medium">Closing till</p>
          <p className="text-sm text-muted-foreground">
            Reconcile the cashier session before leaving the workspace.
          </p>
        </div>
        <Badge className="bg-rose-800 text-white">Session</Badge>
      </div>
    );
  }

  const currentIndex = contributionSteps.findIndex(
    (item) => item.value === step,
  );
  const current = contributionSteps[currentIndex];
  const value = ((currentIndex + 1) / contributionSteps.length) * 100;

  return (
    <nav
      aria-label="Contribution progress"
      className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 print:hidden sm:p-5"
    >
      <Progress className="sm:hidden z-10" value={value}>
        <ProgressLabel>
          Step {currentIndex + 1} of {contributionSteps.length} ·{" "}
          {current.label}
        </ProgressLabel>
        <ProgressValue />
      </Progress>
      <ol className="hidden grid-cols-5 sm:grid">
        {contributionSteps.map((item, index) => {
          const completed = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li
              aria-current={active ? "step" : undefined}
              className="relative flex flex-col items-center gap-2 text-center"
              key={item.value}
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-[calc(1rem-1px)] right-[calc(50%+1rem)] left-[calc(-50%+1rem)] h-0.5 transition-colors duration-500 ease-out motion-reduce:transition-none",
                    completed || active ? "bg-rose-800" : "bg-muted",
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-medium ring-4 ring-card transition-[background-color,color,transform] duration-300 ease-out motion-reduce:transition-none",
                  completed || active
                    ? "bg-rose-800 text-white"
                    : "bg-muted text-muted-foreground",
                  active && "scale-105",
                )}
              >
                {completed ? (
                  <CheckIcon
                    aria-hidden="true"
                    className="size-4 animate-in fade-in zoom-in-75 duration-300 motion-reduce:animate-none"
                  />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "text-xs transition-colors duration-300 motion-reduce:transition-none",
                  active
                    ? "font-medium text-rose-800"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
