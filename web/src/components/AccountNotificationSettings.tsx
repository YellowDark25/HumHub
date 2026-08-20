"use client";

import { NOTIFICATION_SETTING_CATEGORIES } from "@/shared/accountProfileFields";
import { useState } from "react";

type ChannelState = Record<string, { desktop: boolean; email: boolean }>;

function initialChannels(): ChannelState {
  return Object.fromEntries(
    NOTIFICATION_SETTING_CATEGORIES.map((category) => [
      category,
      { desktop: true, email: true },
    ]),
  );
}

export function AccountNotificationSettings() {
  const [desktopWhenOnline, setDesktopWhenOnline] = useState(true);
  const [channels, setChannels] = useState<ChannelState>(initialChannels);

  function toggle(category: string, channel: "desktop" | "email") {
    setChannels((current) => ({
      ...current,
      [category]: {
        ...current[category],
        [channel]: !current[category][channel],
      },
    }));
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={desktopWhenOnline}
          onChange={() => setDesktopWhenOnline((value) => !value)}
        />
        Notificações da área de trabalho quando estiver online
      </label>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 font-medium">Tipo</th>
              <th className="py-2 font-medium">Área de trabalho</th>
              <th className="py-2 font-medium">E-mail</th>
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_SETTING_CATEGORIES.map((category) => (
              <tr key={category} className="border-b border-zinc-100">
                <td className="py-3 text-zinc-800">{category}</td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={channels[category].desktop}
                    onChange={() => toggle(category, "desktop")}
                    aria-label={`${category} na área de trabalho`}
                  />
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={channels[category].email}
                    onChange={() => toggle(category, "email")}
                    aria-label={`${category} por e-mail`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
