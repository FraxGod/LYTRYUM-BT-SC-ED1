# Lending-protocols
Sample project to show how to work with contracts of Aave lending protocol and give little practice with uniswapV3 either.

Flow of this task can be described as:

1. We supply aave pool and earn interest.
2. At some point one of the DAO's started the proposal that we want to participate in(here we have to deploy DAO from one of our previous task and token which will be used to buy votes. After it start test proposal, that we want participate in.)
3. We have no value to get vote tokens, so we decided to borrow USDC on aave, while we are still earning the interest.
4. Now we need swap USDC to our tokenToBuyVotes. For that create the pool on uniswapV3 and provide liquidity to it.
5. Swap tokens in that pool and deposit it to DAO to get votes.
6. Enter proposal.
7. Great, You are super!

Most of this flow implemented in tests(on forked mainnet) and should provide You basic knowledge of how to work with Aave lending protocol.

There are two contracts that we want You to implement:

1. Router that can execute basic aave's pool functionality such as: supply, borrow, repay and withdraw.
2. BorrowManager contract that will help us to make some actions with borrow in future, such as: execute swap on borrowed value and interact with DAO.

Also here is the test with whole flow. Since it works on fork, first execution can take some time.

## Installation
Clone the repository using the following command:
```
git clone https://github.com/FraxGod/LYTRYUM-BT-SC-ED1.git
cd LYTRYUM-BT-SC-ED1/lesson-10
```

Install the dependencies using the following command:
```
yarn
```

## Deployment

Fill in all the required environment variables(copy .env-example to .env and fill it). 

Deploy contract to the chain (mumbai testnet):
```
npx hardhat run scripts/deploy.ts --network polygon_mumbai
```

## Verification
Verify the installation by running the following command:
```
npx hardhat verify --network polygon_mumbai {CONTRACT_ADDRESS}
```
Note: Replace {CONTRACT_ADDRESS} with the address of the contract


Contracts deployed and verifyed in mumbai testnet at addresses:

# Token deployed to 
TEST_TOKEN_ADDRESS=0x7bBDbBd3Fac12C6ec9eBA40cBb65BD34B4Ad5B19

# DAO deployed to 
DAO_ADDRESS=0xa48A9Dce0A324Cc569Ab6bf4f8Cb6b0e18B67e83

# Router deployed to 
AAVE_ROUTER_ADDRESS=0x41a92dB1Ce868886aF8E48bCa58c10A0BfA902cC

# Borrow manager deployed to 
BORROW_MANAGER_ADDRESS=0x30024ABed8ab32e3bA889C02B01133b47668B542

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
