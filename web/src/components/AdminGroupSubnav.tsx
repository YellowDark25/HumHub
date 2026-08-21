import Link from "next/link";

type GroupSubnavId = "edit" | "members";

type AdminGroupSubnavProps = {
  groupId: number;
  active: GroupSubnavId;
};

export function AdminGroupSubnav({ groupId, active }: AdminGroupSubnavProps) {
  return (
    <nav
      aria-label="Abas do grupo"
      className="mb-6 flex border-b border-zinc-200"
    >
      <SubnavLink
        href={`/administracao/usuarios/grupos/${groupId}`}
        active={active === "edit"}
        label="Editar"
      />
      <SubnavLink
        href={`/administracao/usuarios/grupos/${groupId}/membros`}
        active={active === "members"}
        label="Membros"
      />
    </nav>
  );
}

function SubnavLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
        active
          ? "border-teal-700 text-teal-800"
          : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
      }`}
    >
      {label}
    </Link>
  );
}
