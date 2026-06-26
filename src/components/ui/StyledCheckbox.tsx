"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxVariant = "chip" | "inline" | "row" | "card";

function CheckboxControl({
  fieldId,
  checked,
  disabled,
  onChange,
  title,
}: {
  fieldId: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  title?: string;
}) {
  return (
    <>
      <input
        id={fieldId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        title={title}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          "checkbox-chip-box",
          checked && "checkbox-chip-box-checked",
          disabled && "opacity-50",
        )}
        aria-hidden
      >
        {checked ? <Check className="h-3 w-3 stroke-[3]" /> : null}
      </span>
    </>
  );
}

export function StyledCheckbox({
  label,
  description,
  checked,
  onChange,
  id,
  className,
  disabled,
  title,
  variant = "chip",
  boxOnly = false,
}: {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
  variant?: CheckboxVariant;
  boxOnly?: boolean;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  if (boxOnly) {
    return (
      <label
        htmlFor={fieldId}
        className={cn(
          "inline-flex cursor-pointer",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <CheckboxControl
          fieldId={fieldId}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          title={title}
        />
      </label>
    );
  }

  if (variant === "inline") {
    return (
      <label
        htmlFor={fieldId}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2.5 text-sm text-slate-700",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <CheckboxControl
          fieldId={fieldId}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          title={title}
        />
        {label ? <span className="select-none">{label}</span> : null}
      </label>
    );
  }

  if (variant === "row") {
    return (
      <label
        htmlFor={fieldId}
        className={cn(
          "flex cursor-pointer items-center justify-between gap-3 text-sm",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        {label ? (
          <span className="select-none font-medium text-slate-800">{label}</span>
        ) : null}
        <CheckboxControl
          fieldId={fieldId}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          title={title}
        />
      </label>
    );
  }

  if (variant === "card") {
    return (
      <label
        htmlFor={fieldId}
        className={cn(
          "checkbox-chip w-full items-start",
          checked && "checkbox-chip-checked",
          disabled && "cursor-not-allowed opacity-60",
          className,
        )}
      >
        <CheckboxControl
          fieldId={fieldId}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          title={title}
        />
        <span className="min-w-0">
          {label ? (
            <span className="block select-none text-sm font-medium">{label}</span>
          ) : null}
          {description ? (
            <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
          ) : null}
        </span>
      </label>
    );
  }

  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "checkbox-chip",
        checked && "checkbox-chip-checked",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <CheckboxControl
        fieldId={fieldId}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        title={title}
      />
      {label ? <span className="select-none">{label}</span> : null}
    </label>
  );
}

export function StyledCheckboxGroup<T extends string>({
  items,
  values,
  onChange,
  className,
  variant = "chip",
}: {
  items: { key: T; label: string; description?: string }[];
  values: Record<T, boolean>;
  onChange: (key: T, checked: boolean) => void;
  className?: string;
  variant?: Extract<CheckboxVariant, "chip" | "card">;
}) {
  return (
    <div
      className={cn(
        variant === "card" ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2",
        className,
      )}
    >
      {items.map(({ key, label, description }) => (
        <StyledCheckbox
          key={key}
          label={label}
          description={description}
          variant={variant}
          checked={Boolean(values[key])}
          onChange={(checked) => onChange(key, checked)}
        />
      ))}
    </div>
  );
}
