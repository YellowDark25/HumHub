import type { Person } from "@/domain/Person";

export const PEOPLE_SORTS = [
  { id: "lastAccess", label: "Último acesso" },
  { id: "name", label: "Nome" },
] as const;

export const PEOPLE_STATUS_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "online", label: "Online" },
  { id: "friends", label: "Amigos" },
  { id: "pending", label: "Pedidos pendentes" },
] as const;

export type PeopleSort = (typeof PEOPLE_SORTS)[number]["id"];
export type PeopleStatusFilter = (typeof PEOPLE_STATUS_FILTERS)[number]["id"];

export type PeopleFilter = {
  query: string;
  groupId: number;
  sort: PeopleSort;
  status: PeopleStatusFilter;
};

export const EMPTY_PEOPLE_FILTER: PeopleFilter = {
  query: "",
  groupId: 0,
  sort: "lastAccess",
  status: "all",
};

export function filterPeople(people: Person[], filter: PeopleFilter): Person[] {
  const query = filter.query.trim().toLowerCase();

  return people
    .filter((person) => matchesQuery(person, query))
    .filter((person) => matchesGroup(person, filter.groupId))
    .filter((person) => matchesStatus(person, filter.status))
    .sort((left, right) => comparePeople(left, right, filter.sort));
}

export function peopleGroupOptions(people: Person[]) {
  const groups = new Map<number, string>();
  for (const person of people) {
    for (const group of person.groups) {
      if (group.id > 0 && group.name.trim()) {
        groups.set(group.id, group.name);
      }
    }
  }

  return [...groups.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

function matchesQuery(person: Person, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    person.name,
    person.username,
    person.title,
    person.about,
    ...person.tags,
    ...person.groups.map((group) => group.name),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesGroup(person: Person, groupId: number) {
  return groupId <= 0 || person.groups.some((group) => group.id === groupId);
}

function matchesStatus(person: Person, status: PeopleStatusFilter) {
  if (status === "online") {
    return person.isOnline;
  }
  if (status === "friends") {
    return person.friendship === "friends";
  }
  if (status === "pending") {
    return person.friendship === "incoming" || person.friendship === "outgoing";
  }

  return true;
}

function comparePeople(left: Person, right: Person, sort: PeopleSort) {
  if (sort === "lastAccess") {
    return lastSeenValue(right) - lastSeenValue(left);
  }

  return left.name.localeCompare(right.name, "pt-BR");
}

function lastSeenValue(person: Person) {
  if (!person.lastSeenAt) {
    return 0;
  }

  const parsed = Date.parse(person.lastSeenAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}
