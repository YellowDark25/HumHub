export type AdminSettings = {
  name: string;
  baseUrl: string;
  defaultLanguage: string;
  timeZone: string;
  maintenanceMode: boolean;
  languages: AdminSelectOption[];
  timeZones: AdminSelectOption[];
};

export type AdminSelectOption = {
  value: string;
  label: string;
};

export type AdminSettingsPatch = {
  name: string;
  baseUrl: string;
  defaultLanguage: string;
  timeZone: string;
  maintenanceMode: boolean;
};
