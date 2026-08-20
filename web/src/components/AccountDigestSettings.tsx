"use client";

import {
  MAIL_SUMMARY_ACTIVITIES,
  MAIL_SUMMARY_INTERVALS,
} from "@/shared/accountProfileFields";
import { useState } from "react";
import { AccountSelect } from "./AccountField";

export function AccountDigestSettings() {
  const [interval, setInterval] = useState("2");
  const [spaceMode, setSpaceMode] = useState("exclude");
  const [activities, setActivities] = useState<string[]>([
    ...MAIL_SUMMARY_ACTIVITIES,
  ]);

  function toggleActivity(label: string) {
    setActivities((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <AccountSelect
        label="Intervalo"
        name="interval"
        value={interval}
        options={MAIL_SUMMARY_INTERVALS}
        onChange={setInterval}
      />
      <p className="-mt-3 text-xs text-zinc-500">
        Você só receberá um e-mail se houver algo novo.
      </p>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-700">Espaços</legend>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="radio"
            name="spaceMode"
            checked={spaceMode === "exclude"}
            onChange={() => setSpaceMode("exclude")}
          />
          Excluir os espaços abaixo do e-mail de resumo
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="radio"
            name="spaceMode"
            checked={spaceMode === "include"}
            onChange={() => setSpaceMode("include")}
          />
          Incluir somente os espaços abaixo no e-mail de resumo
        </label>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-700">Atividades</legend>
        {MAIL_SUMMARY_ACTIVITIES.map((activity) => (
          <label key={activity} className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={activities.includes(activity)}
              onChange={() => toggleActivity(activity)}
            />
            {activity}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
