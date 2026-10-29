import {AlertCircle, Check, LoaderCircle, TriangleAlert} from "lucide-react";

// STKProgress shows the four safe user-facing steps and their backend-derived state.
export function STKProgress({
  step,
  state,
  label,
  detail,
}: {
  step: 1 | 2 | 3 | 4;
  state: "active" | "completed" | "failed" | "review";
  label: string;
  detail: string;
}) {
  const steps = ["Find member", "Review contribution", "M-Pesa", "Receipt"];

  return (
    <nav
      aria-label={`Contribution progress: ${label}`}
      className="mx-auto w-full max-w-2xl rounded-xl border bg-card p-4 print:hidden sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">M-Pesa contribution</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Step {step} of 4
        </span>
      </div>
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((name, index) => {
          const number = index + 1;
          const current = number === step;
          const complete = number < step || (current && state === "completed");
          const failed = current && state === "failed";
          const review = current && state === "review";
          return (
            <li
              key={name}
              aria-current={current ? "step" : undefined}
              className="flex min-w-0 flex-col items-center gap-2 text-center"
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full border transition-colors duration-300 motion-reduce:transition-none ${
                  complete
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : failed
                      ? "border-destructive bg-destructive text-white"
                      : review
                        ? "border-amber-500 bg-amber-100 text-amber-800"
                        : current
                          ? "border-emerald-700 text-emerald-700"
                          : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {complete ? (
                  <Check className="size-4 animate-in zoom-in-75 duration-300 motion-reduce:animate-none" aria-hidden="true" />
                ) : failed ? (
                  <AlertCircle className="size-4" aria-hidden="true" />
                ) : review ? (
                  <TriangleAlert className="size-4" aria-hidden="true" />
                ) : current && state === "active" ? (
                  <LoaderCircle className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <span className="text-xs">{number}</span>
                )}
              </span>
              <span
                className={`text-[10px] leading-tight sm:text-xs ${
                  current ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {name}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
