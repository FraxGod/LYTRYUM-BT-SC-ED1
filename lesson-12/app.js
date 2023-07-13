"use strict";
const env = require("./env.json");
Object.assign(process.env, env);

const ethers = require("ethers");
const retry = require("async-retry");
const tokens = require("./tokens.js");
const pcsAbi = new ethers.utils.Interface(require("./abi.json")); // pancakeswap v2 abi same as uniswap v2 abi
const tokenAbi = new ethers.utils.Interface(require("./tokenABI.json")); // erc20 abi
const EXPECTED_PONG_BACK = 30000;
const KEEP_ALIVE_CHECK_INTERVAL = 15000;
let pingTimeout = null;
let keepAliveInterval = null;
// ethers
let provider;
let wallet;
let account;
let router; // uniswap v2 router
let grasshopper;
let swapEth;
let purchaseAmount;

async function Wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

const startConnection = () => {
  provider = new ethers.providers.WebSocketProvider(process.env.BSC_NODE_WSS);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  account = wallet.connect(provider);
  router = new ethers.Contract(tokens.router, pcsAbi, account); // uniswap v2 router contract connection
  
  // hello world message
  grasshopper = 0;
  provider._websocket.on("open", async () => {
    console.log(
      "🏗️  txPool sniping has begun...patience is a virtue, my grasshopper..."
    );
    keepAliveInterval = setInterval(() => {
      provider._websocket.ping();
      pingTimeout = setTimeout(() => {
        provider._websocket.terminate();
      }, EXPECTED_PONG_BACK);
    }, KEEP_ALIVE_CHECK_INTERVAL);
    const WETH = await router.WETH();
    // wether swap from erc20 is weth from uniswap v2 router contract
    if (ethers.utils.getAddress(tokens.pair[0]) === ethers.utils.getAddress(WETH)) {
      // if yes, use native currency of the chain, so in goerli it is ETH, in bincance testnet -> BNB, etc.
      swapEth = 1;
      purchaseAmount = ethers.utils.parseUnits(tokens.purchaseAmount, "ether"); // transfer 0.0001 -> 1 * 10^14 wei
    } else {
      await Approve();
    }
  });

  // mempool side
  provider.on("pending", async (txHash) => {
    provider
      .getTransaction(txHash)
      .then(async (tx) => {
        if (grasshopper === 0) {
          // showing hello world message
          console.log("🚧  And, Yes..I am actually working...trust me...");
          grasshopper = 1;
        }
        if (tx && tx.to) {
          if (ethers.utils.getAddress(tx.to) === 
              ethers.utils.getAddress(tokens.router)){
            // Function: addLiquidityETH
            const re1 = new RegExp("^0xf305d719");
            // Function: addLiquidity
            const re2 = new RegExp("^0xe8e33700");
            if (re1.test(tx.data) || re2.test(tx.data)) {
              console.log(`Some Liquidity Hash: ${tx.hash}`);
              const decodedInput = pcsAbi.parseTransaction({ // decoding tx input data through pancakeswap v2 router abi
                data: tx.data,
                value: tx.value,
              });
              // ToDo:: optimize this part of searching swap to erc20 token
              if (
                ethers.utils.getAddress(tokens.pair[1]) === // swap to erc20 address
                ethers.utils.getAddress(decodedInput.args[0]) ||
                ethers.utils.getAddress(tokens.pair[1]) === // swap to erc20 address
                ethers.utils.getAddress(decodedInput.args[1])
              ) {
                provider.off("pending");
                if (tokens.buyDelay > 0) {
                  await Wait(tokens.buyDelay);
                }
                await BuyToken(tx);
              }
            }
          }
        }
      })
      .catch(() => {});
  });

  provider._websocket.on("close", () => {
    console.log("☢️ WebSocket Closed...Reconnecting...");
    clearInterval(keepAliveInterval);
    clearTimeout(pingTimeout);
    startConnection();
  });

  provider._websocket.on("error", () => {
    console.log("☢️ Error. Attemptiing to Reconnect...");
    clearInterval(keepAliveInterval);
    clearTimeout(pingTimeout);
    startConnection();
  });

  provider._websocket.on("pong", () => {
    clearInterval(pingTimeout);
  });
};

const Approve = async () => {
  const contract = new ethers.Contract(
    tokens.pair[0], // swap from erc20 token address
    tokenAbi, // erc20 contract abi
    account
  );

  const tokenName = await contract.name();
  const tokenDecimals = await contract.decimals(); // 18 is not mandatory, it can be even 4, 8, 10, 14, etc.
  purchaseAmount = ethers.utils.parseUnits(tokens.purchaseAmount, tokenDecimals);
  const allowance = await contract.allowance(process.env.RECIPIENT, tokens.router); // wether recipient has allowed to uniswap v2 router to use any amount 
  // ToDo:: check it in optimal way
  if(allowance._hex === "0x00") {
    const tx = await contract.approve(tokens.router, ethers.constants.MaxUint256); // it can be equal or more than `purchaseAmount`
    const recipient = await tx.wait();
    console.log(`Approved ${tokenName} for swapping tx hash ${recipient.transactionHash}`);
  }
};

const BuyToken = async (txLP) => {
  const tx = await retry(
    async () => {
      const amountOutMin = 0;
      if(swapEth) { // if we are swapping from native tokens of the chain
        const recipient = await router.swapExactETHForTokens(
          amountOutMin,
          tokens.pair,
          process.env.RECIPIENT,
          Date.now() + 1000 * tokens.deadline, 
          {
            value: purchaseAmount,
            gasLimit: tokens.gasLimit,
            gasPrice: txLP.gasPrice,
          }
        );
        return recipient;
      } else { // swap from is erc20 token
        const recipient = await router.swapExactTokensForTokens(
          purchaseAmount,
          amountOutMin,
          tokens.pair,
          process.env.RECIPIENT,
          Date.now() + 1000 * tokens.deadline,
          {
            gasLimit: tokens.gasLimit,
            gasPrice: txLP.gasPrice + 1,
          }
        );
        return recipient;
      }
    },
    {
      retries: tokens.buyRetries,
      minTimeout: tokens.retryMinTimeout,
      maxTimeout: tokens.retryMaxTimeout,
      onRetry: (err, number) => {
        console.log(`Buy failed - Retrying ${number}`);
        console.log(err);
        if(number === tokens.buyRetries) {
          console.log("Reentarancy failed...");
          process.exit();
        }
      }
    }
  );
  console.log(`Transaction of adding Liquidity tx: ${txLP.hash}`);
  console.log(`Front run tx: ${tx.hash}`);
  process.exit();
};
startConnection();
