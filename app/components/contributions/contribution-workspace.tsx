"use client";

import { useCallback, useState } from "react";
import { Field, FieldTitle } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CashContributionFlow } from "./cash-contribution-flow";
import { CashCustody } from "./cash-custody";
import { STKContributionFlow } from "./stk-contribution-flow";
import { DarajaRecovery } from "./daraja-recovery";
import Image from "next/image";
import mpesa from "@/public/mpesa-logo-2.png"

// ContributionWorkspace keeps both workflows mounted so changing the method
// does not discard an open cash flow or a saved M-Pesa request.
export function ContributionWorkspace() {
  const [method, setMethod] = useState("cash");
  const [stkLocked, setStkLocked] = useState(false);
  // A restored request must become visible, rather than letting staff overlook it in the cash view.
  const handleStkLock = useCallback((locked: boolean) => {
    setStkLocked(locked);
    if (locked) setMethod("mpesa");
  }, []);
  return <div className="flex flex-col gap-6">
    <Field>
      <FieldTitle id="collection-method">Collection method</FieldTitle>
      <ToggleGroup aria-labelledby="collection-method" value={[method]} variant="outline" onValueChange={(values) => { if (values[0]) setMethod(values[0]); }}>
        <ToggleGroupItem  className="cursor-pointer" value="cash" disabled={stkLocked && method === "mpesa"}>Cash</ToggleGroupItem>
        <ToggleGroupItem value="mpesa" className="cursor-pointer">
          <Image src={mpesa} alt="M-Pesa" width={50} height={50} className="mr-2" />
         </ToggleGroupItem>
      </ToggleGroup>
    </Field>
    <div hidden={method !== "cash"}><div className="flex flex-col gap-6"><CashContributionFlow /><CashCustody /></div></div>
    <div hidden={method !== "mpesa"}><div className="flex flex-col gap-6"><STKContributionFlow onLockChange={handleStkLock} /><DarajaRecovery /></div></div>
  </div>;
}
