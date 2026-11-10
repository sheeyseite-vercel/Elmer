import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  name: string;
  hint?: string;
  error?: string[];
};

function Wrapper({ label, name, hint, error, children }: FieldProps & { children: React.ReactNode }) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errId = error?.length ? `${name}-err` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error?.length ? (
        <p id={errId} role="alert" className="text-xs text-danger">
          {error.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text placeholder:text-muted/70";

export function TextField(props: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const { label, hint, error, className, ...input } = props;
  return (
    <Wrapper label={label} name={props.name} hint={hint} error={error}>
      <input
        id={props.name}
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={[hint ? `${props.name}-hint` : "", error?.length ? `${props.name}-err` : ""].join(" ").trim() || undefined}
        {...input}
        className={cn(controlClass, className)}
      />
    </Wrapper>
  );
}

export function SelectField(
  props: FieldProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] },
) {
  const { label, hint, error, options, className, ...select } = props;
  return (
    <Wrapper label={label} name={props.name} hint={hint} error={error}>
      <select id={props.name} {...select} className={cn(controlClass, className)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}
