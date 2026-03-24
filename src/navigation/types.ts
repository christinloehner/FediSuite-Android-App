export type AuthStackParamList = {
  Instance: undefined;
  Login: undefined;
};

export type DashboardStackParamList = {
  Home: undefined;
  AccountDashboard: {
    accountId?: number;
  };
};

export type AppTabsParamList = {
  DashboardTab: undefined;
  Composer: undefined;
  Queue: undefined;
  Accounts: undefined;
  Settings: undefined;
  Admin: undefined;
};
