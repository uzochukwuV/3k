import type { HardhatUserConfig } from "hardhat/config";
import toolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import path from "node:path";

const SOLCJS_PATH = path.join(process.cwd(), "node_modules/solc/soljson.js");

const config: HardhatUserConfig = {
  paths: {
    cache: "./cache",
    artifacts: "./artifacts"
  },
  compilersCache: "./cache/compilers",
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        path: SOLCJS_PATH,
        preferWasm: true,
        settings: {
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      forking: {
        url: "https://rpc3mainnet.qie.digital/"
      }
    },
    qie: {
      type: "http",
      url: "https://rpc1mainnet.qie.digital/",
      chainId: 1990,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    qietestnet: {
      type  : "http",
      url: "https://rpc1testnet.qie.digital",
      chainId: 1983,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : ["0x953209259aa1397051b3d4601871097a3de8e9f0e64f9c3c4d0200c0f470ccf4"]
    }
  },
  plugins: [toolbox]
};

export default config;
