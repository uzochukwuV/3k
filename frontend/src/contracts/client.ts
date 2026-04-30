import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { erc20Abi, erc4626Abi, routerFactoryAbi, smartRouterAbi, socialJackpotAbi } from "./abis";

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function getBrowserProvider(): BrowserProvider {
  const eth = (window as any).ethereum as Eip1193Provider | undefined;
  if (!eth) {
    throw new Error("Missing window.ethereum");
  }
  return new BrowserProvider(eth);
}

export function getReadonlyProvider(rpcUrl: string): JsonRpcProvider {
  return new JsonRpcProvider(rpcUrl);
}

export async function getSigner() {
  const provider = getBrowserProvider();
  return await provider.getSigner();
}

export function getErc20(address: string, runner: any) {
  return new Contract(address, erc20Abi, runner);
}

export function getErc4626(address: string, runner: any) {
  return new Contract(address, erc4626Abi, runner);
}

export function getRouterFactory(address: string, runner: any) {
  return new Contract(address, routerFactoryAbi, runner);
}

export function getSmartRouter(address: string, runner: any) {
  return new Contract(address, smartRouterAbi, runner);
}

export function getSocialJackpot(address: string, runner: any) {
  return new Contract(address, socialJackpotAbi, runner);
}

