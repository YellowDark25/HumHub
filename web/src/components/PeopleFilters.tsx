import {
  PEOPLE_SORTS,
  PEOPLE_STATUS_FILTERS,
  type PeopleFilter,
} from "@/shared/peopleFilter";

type PeopleFiltersProps = {
  filter: PeopleFilter;
  groups: { id: number; name: string }[];
  onChange: (filter: PeopleFilter) => void;
};

const FIELD_CLASS =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-teal-600";

export function PeopleFilters({ filter, groups, onChange }: PeopleFiltersProps) {
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="min-w-0">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Busca
        </span>
        <span className="relative block">
          <input
            type="search"
            value={filter.query}
            onChange={(event) =>
              onChange({ ...filter, query: event.target.value })
            }
            placeholder="Nome, descrição, tags..."
            className={`${FIELD_CLASS} pr-11`}
          />
          <SearchIcon />
        </span>
      </label>
      <FilterSelect
        label="Grupo de usuário"
        value={filter.groupId ? String(filter.groupId) : ""}
        options={[
          { value: "", label: "Selecione" },
          ...groups.map((group) => ({
            value: String(group.id),
            label: group.name,
          })),
        ]}
        onChange={(value) =>
          onChange({ ...filter, groupId: Number(value) || 0 })
        }
      />
      <FilterSelect
        label="Classificação"
        value={filter.sort}
        options={PEOPLE_SORTS.map((option) => ({
          value: option.id,
          label: option.label,
        }))}
        onChange={(value) =>
          onChange({
            ...filter,
            sort: value === "name" ? "name" : "lastAccess",
          })
        }
      />
      <FilterSelect
        label="Status"
        value={filter.status}
        options={PEOPLE_STATUS_FILTERS.map((option) => ({
          value: option.id,
          label: option.label,
        }))}
        onChange={(value) =>
          onChange({
            ...filter,
            status: readStatus(value),
          })
        }
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_CLASS}
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

function readStatus(value: string): PeopleFilter["status"] {
  return PEOPLE_STATUS_FILTERS.some((option) => option.id === value)
    ? (value as PeopleFilter["status"])
    : "all";
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}
