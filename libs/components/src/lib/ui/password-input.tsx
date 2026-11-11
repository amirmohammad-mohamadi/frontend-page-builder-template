"use client";

import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { cn } from "@utils";

import { Input } from "./input";

export type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  /** Toggle label while the value is masked (defaults to "Show password"). */
  showLabel?: string;
  /** Toggle label while the value is revealed (defaults to "Hide password"). */
  hideLabel?: string;
};

/**
 * Drop-in for `<Input type="password">` with an eye button that reveals or
 * masks the value. Every input prop, `ref` included, lands on the real
 * `<input>`, so react-hook-form's `register`/`field` and `FormControl` keep
 * working unchanged. Components in this lib never call `t()`, so the toggle's
 * labels arrive as props and default to English.
 */
export function PasswordInput({
  className,
  disabled,
  showLabel = "Show password",
  hideLabel = "Hide password",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  const label = visible ? hideLabel : showLabel;
  const Icon = visible ? EyeOffIcon : EyeIcon;

  return (
    <div data-slot="password-input" className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pe-9", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        // Keep focus and the caret in the field when the eye is clicked.
        onMouseDown={(event) => event.preventDefault()}
        disabled={disabled}
        aria-label={label}
        title={label}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex w-9 items-center justify-center rounded-e-md outline-none transition-colors focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
