"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import CurrencyInputField from "react-currency-input-field";

import { Input } from "@/components/ui/input";

// CurrencyInput shares KES formatting and submits raw decimals so grouped values
// never reach the existing money validators. Forms still own business rules.
export function CurrencyInput({
  name,
  value,
  defaultValue = "",
  disabled,
  onValueChange,
  ...props
}: Omit<ComponentProps<typeof Input>, "onChange" | "value" | "defaultValue" | "type" | "min" | "max" | "step"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}) {
  const [raw, setRaw] = useState(defaultValue);
  const hidden = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) return;
    const form = hidden.current?.form;
    // React form actions reset uncontrolled fields after submission.
    const reset = () => setRaw(defaultValue);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue, value]);

  return (
    <>
      <CurrencyInputField
        {...props}
        customInput={Input}
        disabled={disabled}
        value={value ?? raw}
        decimalsLimit={2}
        allowNegativeValue={false}
        disableAbbreviations
        decimalSeparator="."
        groupSeparator=","
        onValueChange={(next) => {
          const amount = next ?? "";
          if (value === undefined) setRaw(amount);
          onValueChange?.(amount);
        }}
      />
      <input ref={hidden} type="hidden" name={name} value={value ?? raw} disabled={disabled} form={props.form} />
    </>
  );
}
