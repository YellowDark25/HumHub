"use client";

import { useRouter } from "next/navigation";
import {
  ALL_NOTIFICATION_CATEGORY_IDS,
  NOTIFICATION_CATEGORIES,
} from "@/domain/NotificationCategory";
import {
  buildNotificationFilterHref,
  type NotificationFilterState,
} from "@/shared/notificationFilter";

type NotificationFilterProps = {
  filter: NotificationFilterState;
};

export function NotificationFilter({ filter }: NotificationFilterProps) {
  const router = useRouter();
  const allSelected =
    filter.selectedCategoryIds.length === NOTIFICATION_CATEGORIES.length;

  function apply(next: NotificationFilterState) {
    router.push(buildNotificationFilterHref(next));
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Filtro</h2>
      <div className="mt-3 grid grid-cols-2 divide-x divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
        <SeenToggle
          label="Não visto"
          pressed={filter.includeUnseen}
          onClick={() =>
            apply({ ...filter, includeUnseen: !filter.includeUnseen })
          }
        />
        <SeenToggle
          label="Visto"
          pressed={filter.includeSeen}
          onClick={() => apply({ ...filter, includeSeen: !filter.includeSeen })}
        />
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        <li>
          <CategoryCheckbox
            label="Todos"
            checked={allSelected}
            onChange={() =>
              apply({
                ...filter,
                selectedCategoryIds: allSelected
                  ? []
                  : [...ALL_NOTIFICATION_CATEGORY_IDS],
              })
            }
          />
        </li>
        {NOTIFICATION_CATEGORIES.map((category) => (
          <li key={category.id}>
            <CategoryCheckbox
              label={category.label}
              checked={filter.selectedCategoryIds.includes(category.id)}
              onChange={() =>
                apply({
                  ...filter,
                  selectedCategoryIds: toggleCategory(
                    filter.selectedCategoryIds,
                    category.id,
                  ),
                })
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function toggleCategory(selectedIds: string[], categoryId: string): string[] {
  if (selectedIds.includes(categoryId)) {
    return selectedIds.filter((id) => id !== categoryId);
  }

  return [...selectedIds, categoryId];
}

function SeenToggle({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium ${
        pressed
          ? "bg-teal-50 text-teal-800"
          : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
      }`}
    >
      {label}
    </button>
  );
}

function CategoryCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-zinc-300 accent-teal-700"
      />
      {label}
    </label>
  );
}
