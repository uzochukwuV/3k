import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ContractFactory, FetchRequest, JsonRpcProvider, Wallet, parseUnits } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Artifact = {
  abi: unknown[];
  bytecode: string;
};

async function compileArtifacts(): Promise<Record<string, Artifact>> {
  const solcPkg = await import("solc");
  const solc: any = (solcPkg as any).default ?? solcPkg;

  const projectRoot = path.resolve(__dirname, "..");
  const required: Record<string, string> = {
    "contracts/mocks/MockERC20.sol": "MockERC20",
    "contracts/mocks/MockCToken.sol": "MockCToken",
    "contracts/QIELendERC4626Adapter.sol": "QIELendERC4626Adapter",
    "contracts/SmartRouter.sol": "SmartRouter",
    "contracts/RouterFactory.sol": "RouterFactory",
    "contracts/SocialJackpot.sol": "SocialJackpot",
  };

  const sources: Record<string, { content: string }> = {};
  for (const sourceName of Object.keys(required)) {
    const p = path.resolve(projectRoot, sourceName);
    sources[sourceName] = { content: readFileSync(p, "utf8") };
  }

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  function findImports(importPath: string): { contents?: string; error?: string } {
    const candidates = [
      path.resolve(projectRoot, importPath),
      path.resolve(projectRoot, "node_modules", importPath),
    ];

    for (const p of candidates) {
      try {
        return { contents: readFileSync(p, "utf8") };
      } catch {}
    }

    return { error: `File not found: ${importPath}` };
  }

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  const errors: Array<{ severity?: string; formattedMessage?: string }> = output.errors ?? [];
  const fatal = errors.filter((e) => e.severity === "error");
  if (fatal.length > 0) {
    throw new Error(fatal.map((e) => e.formattedMessage).join("\n"));
  }

  const artifacts: Record<string, Artifact> = {};
  for (const [sourceName, contractName] of Object.entries(required)) {
    const c = output.contracts?.[sourceName]?.[contractName];
    if (c?.evm?.bytecode?.object == null || c.abi == null) {
      throw new Error(`Missing compilation output for ${contractName} (${sourceName})`);
    }
    artifacts[contractName] = {
      abi: c.abi,
      bytecode: `0x${c.evm.bytecode.object}`,
    };
  }

  return artifacts;
}

function getFallbackPrivateKeyFromConfig(): string | undefined {
  const configPath = path.resolve(__dirname, "..", "hardhat.config.ts");
  const text = readFileSync(configPath, "utf8");
  const m = text.match(/qietestnet[\s\S]*?accounts[\s\S]*?\[\s*["'](0x[a-fA-F0-9]{64})["']\s*\]/);
  return m?.[1];
}

async function main() {
  const rpcUrl = process.env.RPC_URL ?? "https://rpc1testnet.qie.digital";
  const privateKey = process.env.PRIVATE_KEY ?? getFallbackPrivateKeyFromConfig();

  if (privateKey === undefined) {
    throw new Error("Missing PRIVATE_KEY (set it in the environment).");
  }

  const req = new FetchRequest(rpcUrl);
  req.timeout = 900_000;
  req.getUrlFunc = async (r) => {
    const controller = new AbortController();
    const headers = { ...r.headers, "accept-encoding": "identity" };
    const resp = await fetch(r.url, {
      method: r.method,
      headers,
      body: r.body ? Buffer.from(r.body) : undefined,
      signal: controller.signal,
    });

    const body = new Uint8Array(await resp.arrayBuffer());
    const respHeaders: Record<string, string> = {};
    for (const [k, v] of resp.headers.entries()) {
      respHeaders[k.toLowerCase()] = v;
    }

    return {
      statusCode: resp.status,
      statusMessage: resp.statusText,
      headers: respHeaders,
      body: body.length === 0 ? null : body,
    };
  };
  const provider = new JsonRpcProvider(req);
  provider.pollingInterval = 10_000;
  const wallet = new Wallet(privateKey, provider);

  const network = await provider.getNetwork();
  const balance = await provider.getBalance(wallet.address);

  if (balance === 0n) {
    throw new Error(`Deployer ${wallet.address} has 0 balance on chainId ${network.chainId}. Fund it and retry.`);
  }

  const feeRecipient = process.env.FEE_RECIPIENT ?? wallet.address;

  const compiled = await compileArtifacts();

  const MockERC20 = new ContractFactory(compiled.MockERC20.abi, compiled.MockERC20.bytecode, wallet);
  const MockCToken = new ContractFactory(compiled.MockCToken.abi, compiled.MockCToken.bytecode, wallet);
  const Adapter = new ContractFactory(compiled.QIELendERC4626Adapter.abi, compiled.QIELendERC4626Adapter.bytecode, wallet);
  const SmartRouter = new ContractFactory(compiled.SmartRouter.abi, compiled.SmartRouter.bytecode, wallet);
  const RouterFactory = new ContractFactory(compiled.RouterFactory.abi, compiled.RouterFactory.bytecode, wallet);
  const SocialJackpot = new ContractFactory(compiled.SocialJackpot.abi, compiled.SocialJackpot.bytecode, wallet);

  const mockQusdc = await MockERC20.deploy("Mock QUSDC", "mQUSDC");
  await mockQusdc.waitForDeployment();

  const mockCToken = await MockCToken.deploy(await mockQusdc.getAddress());
  await mockCToken.waitForDeployment();

  const qusdcAdapter = await Adapter.deploy(
    await mockQusdc.getAddress(),
    await mockCToken.getAddress(),
    "Mock QIE Lend QUSDC Vault",
    "ymQUSDC",
  );
  await qusdcAdapter.waitForDeployment();

  const smartRouterImpl = await SmartRouter.deploy();
  await smartRouterImpl.waitForDeployment();

  const routerFactory = await RouterFactory.deploy(await smartRouterImpl.getAddress());
  await routerFactory.waitForDeployment();

  const whitelistTx = await routerFactory.whitelistVault(await mockQusdc.getAddress(), await qusdcAdapter.getAddress());
  await whitelistTx.wait();

  const initialMint = process.env.INITIAL_MOCK_QUSDC_MINT
    ? BigInt(process.env.INITIAL_MOCK_QUSDC_MINT)
    : parseUnits("1000000", 18);

  const mintTx = await mockQusdc.mint(wallet.address, initialMint);
  await mintTx.wait();

  const jackpot = await SocialJackpot.deploy(feeRecipient);
  await jackpot.waitForDeployment();

  const deployed = {
    chainId: Number(network.chainId),
    rpcUrl,
    deployer: wallet.address,
    contracts: {
      mockQusdc: await mockQusdc.getAddress(),
      mockCToken: await mockCToken.getAddress(),
      qusdcAdapter: await qusdcAdapter.getAddress(),
      smartRouterImpl: await smartRouterImpl.getAddress(),
      routerFactory: await routerFactory.getAddress(),
      jackpot: await jackpot.getAddress(),
    },
    txs: {
      whitelistVault: whitelistTx.hash,
      mintMockQusdc: mintTx.hash,
    },
  };

  const outDir = path.resolve(__dirname, "..", "deployments");
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `qietestnet-mock-${deployed.chainId}.json`);
  writeFileSync(outFile, JSON.stringify(deployed, null, 2));

  console.log(JSON.stringify(deployed, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
