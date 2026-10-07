import { BanknoteIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { CashMutationState } from "@/app/dashboard/contributions/actions"

// OpenTillStep makes cash custody explicit before any member or amount is entered.
export function OpenTillStep({ action, pending, state }: {action: () => void; pending: boolean; state: CashMutationState}) {
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Open your cashier till</CardTitle>
        <CardDescription>Every cash receipt must belong to your open till. An existing open till will be resumed.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Start here before accepting cash from a member.</p>
        {state?.ok === false ? <p className="mt-3 text-sm text-destructive" role="alert">{state.message}</p> : null}
      </CardContent>
      <CardFooter>
        <form action={action}>
          <Button disabled={pending} type="submit">
            {pending ? <Spinner data-icon="inline-start" /> : <BanknoteIcon data-icon="inline-start" />}
            {pending ? "Opening till..." : "Open or resume till"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
