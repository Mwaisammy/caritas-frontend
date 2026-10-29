import { Loader, LoaderCircle } from "lucide-react";

// LoadingMessage pairs skeletons with a brief, screen-specific update.
export function LoadingMessage({
  message,
  overlay = false,
}: {
  message: string;
  overlay?: boolean;
}) {
  return (
    <div
      className={
        overlay
          ? "pointer-events-none absolute inset-0 z-20 grid place-items-center"
          : undefined
      }
    >
      <p
        className={
          overlay
            ? "mx-4 max-w-sm flex items-center gap-2 rounded-xl  bg-background/95 px-4 py-3 text-sm text-foreground shadow-md backdrop-blur-sm"
            : "flex items-center gap-4 text-sm text-muted-foreground"
        }
        role="status"
      >
        <Loader
          aria-hidden="true"
          className="size-4 shrink-0 text-rose-700 motion-safe:animate-spin motion-reduce:animate-none"
        />
        {message}
      </p>
    </div>
  );
}
