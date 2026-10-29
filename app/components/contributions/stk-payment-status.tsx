import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Keep the current payment outcome and its next step together in one live message.
export function STKPaymentStatus({
  title,
  description,
  status,
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
}) {
  const failed = status === "failed";
  const review = status === "review";

  return (
    <div
      key={status}
      className="animate-in fade-in duration-200 motion-reduce:animate-none"
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
    </div>
  );
}
