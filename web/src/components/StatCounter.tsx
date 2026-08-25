type StatCounterProps = {
  value: number;
  label: string;
};

export function StatCounter({ value, label }: StatCounterProps) {
  return (
    <p className="text-center">
      <span className="block text-base font-semibold text-teal-700">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </p>
  );
}
