import type { ContractTransactionResponse } from "ethers";
import { Contract } from "ethers";
import { getErc20, getErc4626, getRouterFactory, getSmartRouter, getSocialJackpot } from "./client";

export async function erc20Approve(tokenAddress: string, spender: string, amount: bigint, signer: any) {
  const token = getErc20(tokenAddress, signer);
  const tx = (await token.approve(spender, amount)) as ContractTransactionResponse;
  return await tx.wait();
}

export async function erc20Allowance(tokenAddress: string, owner: string, spender: string, provider: any): Promise<bigint> {
  const token = getErc20(tokenAddress, provider);
  return (await token.allowance(owner, spender)) as bigint;
}

export async function erc20BalanceOf(tokenAddress: string, owner: string, provider: any): Promise<bigint> {
  const token = getErc20(tokenAddress, provider);
  return (await token.balanceOf(owner)) as bigint;
}

export async function routerFactoryGetVault(routerFactoryAddress: string, token: string, provider: any): Promise<string> {
  const factory = getRouterFactory(routerFactoryAddress, provider);
  return (await factory.getVault(token)) as string;
}

export async function routerFactoryDeployRouter(
  routerFactoryAddress: string,
  params: {
    operatingPct: bigint;
    treasuryPct: bigint;
    lockedPct: bigint;
    allowanceAmount: bigint;
    allowancePeriod: bigint;
  },
  signer: any,
): Promise<string> {
  const factory = getRouterFactory(routerFactoryAddress, signer);
  const tx = (await factory.deployRouter(
    params.operatingPct,
    params.treasuryPct,
    params.lockedPct,
    params.allowanceAmount,
    params.allowancePeriod,
  )) as ContractTransactionResponse;

  const receipt = await tx.wait();
  const log = receipt?.logs?.find((l: any) => l?.address?.toLowerCase() === routerFactoryAddress.toLowerCase());
  if (!log) {
    const routers = (await factory.getUserRouters(await signer.getAddress())) as string[];
    if (routers.length === 0) throw new Error("RouterDeployed event not found and user routers empty");
    return routers[routers.length - 1];
  }

  const iface = (factory as any).interface;
  const parsed = iface.parseLog(log);
  if (parsed?.name !== "RouterDeployed") {
    const routers = (await factory.getUserRouters(await signer.getAddress())) as string[];
    if (routers.length === 0) throw new Error("Router deployment not detected");
    return routers[routers.length - 1];
  }
  return parsed.args.router as string;
}

export async function smartRouterProcessPayment(routerAddress: string, token: string, signer: any) {
  const router = getSmartRouter(routerAddress, signer);
  const tx = (await router.processPayment(token)) as ContractTransactionResponse;
  return await tx.wait();
}

export async function smartRouterClaimAllowance(routerAddress: string, token: string, signer: any) {
  const router = getSmartRouter(routerAddress, signer);
  const tx = (await router.claimAllowance(token)) as ContractTransactionResponse;
  return await tx.wait();
}

export async function smartRouterWithdrawTreasury(routerAddress: string, token: string, amount: bigint, signer: any) {
  const router = getSmartRouter(routerAddress, signer);
  const tx = (await router.withdrawTreasury(token, amount)) as ContractTransactionResponse;
  return await tx.wait();
}

export async function smartRouterUpdateSettings(
  routerAddress: string,
  args: {
    operatingPct: bigint;
    treasuryPct: bigint;
    lockedPct: bigint;
    allowanceAmount: bigint;
    allowancePeriod: bigint;
  },
  signer: any,
) {
  const router = getSmartRouter(routerAddress, signer);
  const tx = (await router.updateSettings(
    args.operatingPct,
    args.treasuryPct,
    args.lockedPct,
    args.allowanceAmount,
    args.allowancePeriod,
  )) as ContractTransactionResponse;
  return await tx.wait();
}

export async function smartRouterUpdateSavePct(routerAddress: string, savePctBps: bigint, signer: any) {
  const router = getSmartRouter(routerAddress, signer);
  const tx = (await router.updateSavePct(savePctBps)) as ContractTransactionResponse;
  return await tx.wait();
}

export async function smartRouterPayAndSave(routerAddress: string, token: string, recipient: string, amount: bigint, signer: any) {
  const router = getSmartRouter(routerAddress, signer);
  const tx = (await router.payAndSave(token, recipient, amount)) as ContractTransactionResponse;
  return await tx.wait();
}

export async function smartRouterWithdrawSavings(routerAddress: string, token: string, amount: bigint, signer: any) {
  const router = getSmartRouter(routerAddress, signer);
  const tx = (await router.withdrawSavings(token, amount)) as ContractTransactionResponse;
  return await tx.wait();
}

export async function smartRouterGetValues(routerAddress: string, token: string, provider: any) {
  const router = getSmartRouter(routerAddress, provider);
  const [savings, treasuryValue, lockedValue] = await Promise.all([
    router.getSavingsValue(token) as Promise<[bigint, bigint, bigint]>,
    router.getTreasuryValue(token) as Promise<bigint>,
    router.getLockedValue(token) as Promise<bigint>,
  ]);

  return {
    savingsPrincipal: savings[0],
    savingsTotalValue: savings[1],
    savingsYieldEarned: savings[2],
    treasuryValue,
    lockedValue,
  };
}

export async function vaultDeposit(vaultAddress: string, assets: bigint, signer: any) {
  const vault = getErc4626(vaultAddress, signer);
  const tx = (await vault.deposit(assets, await signer.getAddress())) as ContractTransactionResponse;
  return await tx.wait();
}

export async function vaultWithdraw(vaultAddress: string, assets: bigint, signer: any) {
  const vault = getErc4626(vaultAddress, signer);
  const tx = (await vault.withdraw(assets, await signer.getAddress(), await signer.getAddress())) as ContractTransactionResponse;
  return await tx.wait();
}

export async function socialJackpotCreateRoom(
  jackpotAddress: string,
  args: {
    token: string;
    entryFee: bigint;
    maxParticipants: bigint;
    numWinners: bigint;
  },
  signer: any,
): Promise<bigint> {
  const jackpot = getSocialJackpot(jackpotAddress, signer);
  const tx = (await jackpot.createRoom(args.token, args.entryFee, args.maxParticipants, args.numWinners)) as ContractTransactionResponse;
  const receipt = await tx.wait();

  const log = receipt?.logs?.find((l: any) => l?.address?.toLowerCase() === jackpotAddress.toLowerCase());
  if (!log) {
    const next = (await jackpot.nextRoomId()) as bigint;
    return next - 1n;
  }

  const iface = (jackpot as any).interface;
  const parsed = iface.parseLog(log);
  if (parsed?.name !== "RoomCreated") {
    const next = (await jackpot.nextRoomId()) as bigint;
    return next - 1n;
  }

  return parsed.args.roomId as bigint;
}

export async function socialJackpotEnterRoom(jackpotAddress: string, roomId: bigint, pitch: string, signer: any) {
  const jackpot = getSocialJackpot(jackpotAddress, signer);
  const tx = (await jackpot.enterRoom(roomId, pitch)) as ContractTransactionResponse;
  return await tx.wait();
}

export async function socialJackpotVote(jackpotAddress: string, roomId: bigint, candidate: string, signer: any) {
  const jackpot = getSocialJackpot(jackpotAddress, signer);
  const tx = (await jackpot.vote(roomId, candidate)) as ContractTransactionResponse;
  return await tx.wait();
}

export async function socialJackpotGetRoom(jackpotAddress: string, roomId: bigint, provider: any) {
  const jackpot = getSocialJackpot(jackpotAddress, provider);
  return (await jackpot.rooms(roomId)) as {
    id: bigint;
    creator: string;
    token: string;
    entryFee: bigint;
    maxParticipants: bigint;
    numWinners: bigint;
    state: number;
    totalVotesCast: bigint;
  };
}

export async function socialJackpotGetParticipantsFromLogs(
  jackpotAddress: string,
  roomId: bigint,
  provider: any,
  fromBlock: number | bigint = 0,
  toBlock: number | bigint = "latest" as any,
): Promise<string[]> {
  const jackpot = getSocialJackpot(jackpotAddress, provider);
  const filter = (jackpot as Contract).filters.UserEntered(roomId);
  const logs = await (jackpot as Contract).queryFilter(filter, fromBlock as any, toBlock as any);
  const users = logs.map((l: any) => l.args.user as string);
  return Array.from(new Set(users.map((u) => u.toLowerCase()))).map((u) => users.find((x) => x.toLowerCase() === u) as string);
}

