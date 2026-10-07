import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { CashMutationState } from "@/app/dashboard/contributions/actions";
import { formatMoney } from "./contribution-utils";

// CloseTillStep collects the physical count and shows the backend reconciliation.
export function CloseTillStep({
  action,
  onBack,
  pending,
  sessionId,
  state,
}: {
  action: (data: FormData) => void;
  onBack: () => void;
  pending: boolean;
  sessionId: string;
  state: CashMutationState;
}) {
  const session = state?.ok ? state.session : undefined;
  const error =
    state?.ok === false ? state.fieldErrors?.countedAmount?.[0] : undefined;
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Close cashier till</CardTitle>
        <CardDescription>
          Count the physical cash. The contribution service calculates the final
          variance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {session ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <p>
              <span className="text-muted-foreground">Expected</span>
              <br />
              {formatMoney(session.expectedAmount)}
            </p>
            <p>
              <span className="text-muted-foreground">Counted</span>
              <br />
              {formatMoney(session.countedAmount)}
            </p>
            <p>
              <span className="text-muted-foreground">Variance</span>
              <br />
              {formatMoney(session.variance)}
            </p>
          </div>
        ) : (
          <form action={action}>
            <input name="sessionId" type="hidden" value={sessionId} />
            <FieldGroup>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="countedAmount">
                  Counted cash (KES)
                </FieldLabel>
                <Input
                  aria-invalid={Boolean(error)}
                  disabled={pending}
                  id="countedAmount"
                  inputMode="decimal"
                  name="countedAmount"
                  required
                />
                <FieldError>{error}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="varianceReason">
                  Variance reason
                </FieldLabel>
                <Input
                  disabled={pending}
                  id="varianceReason"
                  maxLength={500}
                  name="varianceReason"
                />
              </Field>
              {state?.ok === false ? (
                <p className="text-sm text-destructive" role="alert">
                  {state.message}
                </p>
              ) : null}
              <Button disabled={pending} type="submit" variant="destructive">
                {pending ? <Spinner data-icon="inline-start" /> : null}
                {pending ? "Closing till..." : "Close till"}
              </Button>
            </FieldGroup>
          </form>
        )}
      </CardContent>
      {!session ? (
        <CardFooter>
          <Button
            disabled={pending}
            onClick={onBack}
            type="button"
            variant="ghost"
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to contributions
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
