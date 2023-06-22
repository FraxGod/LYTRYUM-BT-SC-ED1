# Uniswap v3


## Installation
Clone the repository using the following command:
```
git clone https://github.com/FraxGod/LYTRYUM-BT-SC-ED1.git
cd LYTRYUM-BT-SC-ED1/lesson-9
```

Install the dependencies using the following command:
```
npm i
```

## Deployment

Fill in all the required environment variables(copy .env-example to .env and fill it). 

Deploy contract to the chain (mumbai testnet):
```
npx hardhat run scripts/deploy.ts --network polygon-mumbai
```

## Verification
Verify the installation by running the following command:
```
npx hardhat verify --network polygon-mumbai {CONTRACT_ADDRESS}
```
Note: Replace {CONTRACT_ADDRESS} with the address of the contract