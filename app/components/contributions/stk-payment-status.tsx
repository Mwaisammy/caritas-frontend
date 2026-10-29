import {
  AlertCircle,
  Check,
  LoaderCircle,
  Phone,
  TriangleAlert,
} from "lucide-react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";

// STKPaymentStatus gives each authoritative payment outcome one clear explanation.
export function STKPaymentStatus({
  title,
  description,
  status,
  checking,
}: {
  title: string;
  description: string;
  status:
    | "sending"
    | "awaiting"
    | "verifying"
    | "processing"
    | "completed"
    | "failed"
    | "unconfirmed"
    | "review";
  checking: boolean;
}) {
  const completed = status === "completed";
  const failed = status === "failed";
  const review = status === "review";
  const working =
    status === "sending" ||
    status === "verifying" ||
    status === "processing" ||
    (status === "unconfirmed" && checking);
  return (
    <div
      key={status}
      className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none"
      aria-live="polite"
    >
      <Alert
        variant={failed ? "destructive" : "default"}
        className={
          review
            ? "border-amber-500 bg-amber-50 text-amber-950 [&_[data-slot=alert-description]]:text-amber-900"
            : undefined
        }
      >
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300 motion-reduce:transition-none ${
            completed
              ? "bg-emerald-100 text-emerald-700"
              : failed
                ? "bg-destructive/10 text-destructive"
                : review
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {completed ? (
            <Check className="size-5 animate-in zoom-in-75 duration-300 motion-reduce:animate-none" aria-hidden="true" />
          ) : failed ? (
            <AlertCircle className="size-5" aria-hidden="true" />
          ) : review ? (
            <TriangleAlert className="size-5" aria-hidden="true" />
          ) : working ? (
            <LoaderCircle className="size-5 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Phone className="size-5 motion-safe:animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          )}
        </span>
        <p className="text-sm font-medium">
          {working
            ? title
            : completed
              ? "Payment and contribution confirmed"
              : failed
                ? "No new payment prompt will be sent automatically."
                : review
                  ? "Do not request another payment until this is reconciled."
                  : checking
                    ? "Checking payment status…"
                    : status === "awaiting"
                      ? "Enter the M-Pesa PIN on the phone receiving the prompt."
                      : "The saved request is safe. Check again when ready."}
        </p>
      </div>
    </div>
  );
}
