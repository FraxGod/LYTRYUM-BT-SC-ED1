# NFT(ERC721) contract

## Installation
Clone the repository using the following command:
```
git clone https://github.com/FraxGod/LYTRYUM-BT-SC-ED1.git
cd LYTRYUM-BT-SC-ED1/lesson-3
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

Running a task(example):
```
npx hardhat mint --nft 0xF4a01b611bEA991cBa7F7158869D11d571ce4eff --uri "https://ipfs.io/ipfs/QmSgsMgakC143p9PfNuagHkp9dULJKJ9v4ULqDEwCZojzx" --network polygon-mumbai
```

## Verification
Verify the installation by running the following command:
```
npx hardhat verify --network polygon-mumbai {CONTRACT_ADDRESS}
```
Note: Replace {CONTRACT_ADDRESS} with the address of the contract