"use client";

import { useMemo, useState } from "react";
import type { Person } from "@/domain/Person";
import {
  EMPTY_PEOPLE_FILTER,
  filterPeople,
  peopleGroupOptions,
} from "@/shared/peopleFilter";
import { PeopleFilters } from "./PeopleFilters";
import { PersonCard } from "./PersonCard";

type PeopleDirectoryProps = {
  people: Person[];
};

export function PeopleDirectory({ people }: PeopleDirectoryProps) {
  const [filter, setFilter] = useState(EMPTY_PEOPLE_FILTER);
  const groups = useMemo(() => peopleGroupOptions(people), [people]);
  const visible = useMemo(() => filterPeople(people, filter), [people, filter]);
  const incoming = visible.filter((person) => person.friendship === "incoming");
  const others = visible.filter((person) => person.friendship !== "incoming");

  return (
    <div className="flex flex-col">
      <PeopleFilters filter={filter} groups={groups} onChange={setFilter} />
      {visible.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nenhuma pessoa encontrada com esses filtros.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {incoming.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-zinc-700">
                Pedidos de amizade
              </h2>
              <PeopleGrid people={incoming} />
            </section>
          ) : null}
          <PeopleGrid people={others} />
        </div>
      )}
    </div>
  );
}

function PeopleGrid({ people }: { people: Person[] }) {
  if (people.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((person) => (
        <li key={person.id}>
          <PersonCard person={person} />
        </li>
      ))}
    </ul>
  );
}
