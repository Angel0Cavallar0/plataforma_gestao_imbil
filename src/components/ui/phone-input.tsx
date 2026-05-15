"use client";

import * as React from "react";
import { formatBrazilPhone } from "@/lib/utils/phone";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "defaultValue"
> {
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, onPaste, ...props }, ref) => {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      onChange(formatBrazilPhone(e.target.value));
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text");
      onChange(formatBrazilPhone(pasted));
      onPaste?.(e);
    }

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder="(00) 00000-0000"
        maxLength={16}
        className={cn(className)}
        {...props}
      />
    );
  },
);
PhoneInput.displayName = "PhoneInput";
