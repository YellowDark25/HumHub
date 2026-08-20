export type AccountProfileModule = {
  id: string;
  name: string;
  version: string;
  description: string;
  imageUrl: string;
  isEnabled: boolean;
  canEnable: boolean;
  canDisable: boolean;
  configUrl: string | null;
};
