export type SpaceMembershipSettings = {
  receivesNotifications: boolean;
  showsOnDashboard: boolean;
  canLeave: boolean;
};

export type SpaceMembershipSettingsPatch = {
  receivesNotifications?: boolean;
  showsOnDashboard?: boolean;
};
