"use client"

import { useState } from "react"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { CashMemberState } from "@/app/dashboard/contributions/actions"

// MemberLookupStep searches one exact member identifier before financial data is shown.
export function MemberLookupStep({ action, onCloseTill, pending, state }: {action: (data: FormData) => void; onCloseTill: () => void; pending: boolean; state: CashMemberState}) {
  const [lookupBy, setLookupBy] = useState("memberNumber")
  const error = state?.ok === false ? state.fieldErrors?.lookup?.[0] : undefined
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Find a member</CardTitle>
        <CardDescription>Search using one exact member number or national ID.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action}>
          <input name="lookupBy" type="hidden" value={lookupBy} />
          <FieldGroup>
            <Field orientation="responsive">
              <FieldTitle id="lookup-type">Search by</FieldTitle>
              <ToggleGroup aria-labelledby="lookup-type" onValueChange={(values) => values[0] && setLookupBy(values[0])} spacing={1} value={[lookupBy]} variant="outline">
                <ToggleGroupItem value="memberNumber">Member number</ToggleGroupItem>
                <ToggleGroupItem value="nationalId">National ID</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="lookup">{lookupBy === "memberNumber" ? "Member number" : "National ID"}</FieldLabel>
              <Input aria-invalid={Boolean(error)} autoFocus disabled={pending} id="lookup" inputMode={lookupBy === "memberNumber" ? "numeric" : "text"} name="lookup" required />
              <FieldError>{error}</FieldError>
            </Field>
            {state?.ok === false ? <p className="text-sm text-destructive" role="alert">{state.message}</p> : null}
            <Button disabled={pending} type="submit">
              {pending ? <Spinner data-icon="inline-start" /> : <SearchIcon data-icon="inline-start" />}
              {pending ? "Finding member..." : "Find member"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onCloseTill} type="button" variant="ghost">Close till</Button>
      </CardFooter>
    </Card>
  )
}
