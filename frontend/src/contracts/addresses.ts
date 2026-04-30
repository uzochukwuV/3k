export type ContractAddresses = {
  routerFactory: string;
  jackpot?: string;
  mockQusdc?: string;
  qusdcAdapter?: string;
};

function env(name: string): string | undefined {
  const v = (import.meta as any).env?.[name] as string | undefined;
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export function getContractAddresses(chainId: number): ContractAddresses | null {
  if (chainId === 1983) {
    return {
      routerFactory: "0x46F5081a54AbB286E2da52483B53135c74b9BE3a",
      jackpot: "0xda46Af69C4d450a20560De1462285A15Ed398a6A",
      mockQusdc: "0x717238893Fc75d263322694201940Da27064d565",
      qusdcAdapter: "0x4Cb724434430e5B8a484088021570e64CB7315e6",
    };
  }

  const routerFactory = env("VITE_ROUTER_FACTORY_ADDRESS");
  if (!routerFactory) return null;

  return {
    routerFactory,
    jackpot: env("VITE_SOCIAL_JACKPOT_ADDRESS"),
    mockQusdc: env("VITE_TOKEN_ADDRESS"),
    qusdcAdapter: env("VITE_VAULT_ADDRESS"),
  };
}

