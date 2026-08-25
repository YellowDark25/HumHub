export type ChatMutualServer = {
  id: number;
  name: string;
  imageUrl: string;
};

export function mutualServerCountLabel(count: number) {
  if (!Number.isFinite(count) || count <= 0) {
    return "";
  }

  if (count === 1) {
    return "1 servidor mútuo";
  }

  return `${count} servidores mútuos`;
}
