const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 outline-none focus:border-teal-600";

type AccountFieldProps = {
  label: string;
  name: string;
  value: string;
  required?: boolean;
  type?: "text" | "password" | "email" | "date";
  autoComplete?: string;
  onChange: (value: string) => void;
};

export function AccountField({
  label,
  name,
  value,
  required,
  type = "text",
  autoComplete,
  onChange,
}: AccountFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
      {label}
      {required ? <span className="sr-only"> obrigatório</span> : null}
      <input
        name={name}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      />
    </label>
  );
}

export function AccountSelect({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AccountTextarea({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
      {label}
      <textarea
        name={name}
        value={value}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="resize-none rounded-xl border border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 outline-none focus:border-teal-600"
      />
    </label>
  );
}

export function AccountFeedback({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
        {success}
      </p>
    );
  }

  return null;
}

export function AccountSubmit({
  disabled,
  label,
  pendingLabel,
  tone = "primary",
}: {
  disabled: boolean;
  label: string;
  pendingLabel: string;
  tone?: "primary" | "danger";
}) {
  const color = tone === "danger" ? "bg-red-700" : "bg-teal-700";

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`h-11 self-start rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-60 ${color}`}
    >
      {disabled ? pendingLabel : label}
    </button>
  );
}
