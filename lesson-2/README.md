# Uniswap v2 interaction contract

## Installation
Clone the repository using the following command:
```
git clone https://github.com/FraxGod/LYTRYUM-BT-SC-ED1.git
cd lesson-2
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

## Tasks
Create new task(s) ans save it(them) in the folder "tasks". Add a new task name in the file "tasks/index.ts".

Running a task:
```
npx hardhat addliquidity --tokena 0xD285F5A0300817Cd5d7e76A049e0703c4E456B25 --tokenb 0xB7D0255C70c4F0dA8159EFdc0ae685F9C644d762 --amounta 100000000000000 --amountb 100000000000000 --contract 0x704F9bD35c060cefEcc02f139291e1068eff2E5d --network polygon-mumbai
```

## Verification
Verify the installation by running the following command:
```
npx hardhat verify --network polygon-mumbai {CONTRACT_ADDRESS}
```
Note: Replace {CONTRACT_ADDRESS} with the address of the contract