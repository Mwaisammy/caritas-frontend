import {AlertCircle, Check, LoaderCircle, TriangleAlert} from "lucide-react";

// STKProgress shows the four safe user-facing steps and their backend-derived state.
export function STKProgress({
  step,
  state,
  label,
  detail,
  orientation = "horizontal",
}: {
  step: 1 | 2 | 3 | 4;
  state: "active" | "completed" | "failed" | "review";
  label: string;
  detail: string;
  orientation?: "horizontal" | "vertical";
}) {
  const steps =
    orientation === "vertical"
      ? [
          ["Prompt sent", "Sent to the phone above."],
          ["Confirming M-Pesa", "Enter your PIN on that phone."],
          ["Applying payment", "We’re updating contributions and loans."],
          ["Receipt ready", "Your receipt is ready to print."],
        ]
      : [
          ["Find member", ""],
          ["Review contribution", ""],
          ["M-Pesa", ""],
          ["Receipt", ""],
        ];

  if (orientation === "vertical") {
    return (
      <nav
        aria-label={`Payment progress: ${label}`}
        className="w-full print:hidden"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Payment progress</p>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            Step {step} of 4
          </span>
        </div>
        <ol>
          {steps.map(([name, description], index) => {
            const number = index + 1;
            const currentName =
              number === 1 && state === "active" && step === 1
                ? "Sending prompt"
                : name;
            const currentDescription =
              number === 1 && state === "active" && step === 1
                ? "Sending the request to the phone above."
                : description;
            const current = number === step;
            const complete = number < step || (current && state === "completed");
            const failed = current && state === "failed";
            const review = current && state === "review";
            return (
              <li
                key={name}
                aria-current={current ? "step" : undefined}
                className="relative flex min-h-12 gap-3 last:min-h-0"
              >
                <span
                  className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card transition-colors duration-300 motion-reduce:transition-none ${
                    complete
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : failed
                        ? "border-destructive bg-destructive text-white"
                        : review
                          ? "border-amber-500 bg-amber-100 text-amber-800"
                          : current
                            ? "border-primary text-primary"
                            : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  {complete ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : failed ? (
                    <AlertCircle className="size-4" aria-hidden="true" />
                  ) : review ? (
                    <TriangleAlert className="size-4" aria-hidden="true" />
                  ) : current ? (
                    <LoaderCircle className="size-4 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : (
                    <span className="text-xs">{number}</span>
                  )}
                </span>
                {number < steps.length ? (
                  <span
                    aria-hidden="true"
                    className={`absolute left-4 top-8 h-4 w-px ${
                      number < step || (current && state === "completed")
                        ? "bg-emerald-600"
                        : "bg-border"
                    }`}
                  />
                ) : null}
                <span className="pb-4 pt-1">
                  <span
                    className={`block text-sm ${
                      current ? "font-semibold text-foreground" : complete ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {currentName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {currentDescription}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

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
        {steps.map(([name], index) => {
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
