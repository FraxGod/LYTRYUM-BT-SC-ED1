# Bridge

## Step-by-step deployment and interaction:
1. Deploy your token and contract to the chain (lets use polygon-mumbai as the first chain) by calling `scripts/deploy.ts`(check Deployment section below). Provide right 	`srcChainId` and	`dstChainId`. 
    *Note:* polygon-mumbai chainId = 80001, so `srcChainId` for polygon-mumbai will be `80001` and `dstChainId` is `97`.
 **Note:* check `RPC_URL` to point right network rpc.
 ***Note:* Custom token mints to the deployer 1000 ethers by default. Minter and burner addresses have been set to the bridge address in the deployment.ts. *
2. Call `swap` task from tasks(check Tasks section below). Provide right 	`srcChainId` and	`dstChainId`.
*Note:* polygon-mumbai chainId = 80001, so `srcChainId` for polygon-mumbai will be `80001` and `dstChainId` is `97`.
 **Note:* check `RPC_URL` to point right network rpc.
3. Deploy your token and contract to the chain (lets use bsc testnet as the second chain) by calling `scripts/deploy.ts`(check Deployment section below). Provide right 	`srcChainId` and	`dstChainId`. 
    *Note:* bsc testnet chainId = 97, so `srcChainId` for polygon-mumbai will be `97` and `dstChainId` is `80001`.
 **Note:* check `RPC_URL` to point right network rpc.
 ***Note:* Custom token mints to the deployer 1000 ethers by default. Minter and burner addresses have been set to the bridge address in the deployment.ts. *
4. Call `redeem` task from tasks(check Tasks section below). Provide right 	`srcChainId` and	`dstChainId`.
*Note:* bsc testnet chainId = 97, so `srcChainId` for bsc testnet in redeem will be `80001` and `dstChainId` is `97` (because we are redeem some swap transaction from polygon-mumbai and need to use the same credentials as `swap`).
 **Note:* check `RPC_URL` to point right network rpc.

## Explanation
1. The Bridge contract requires the CustomToken contract to be deployed first.
2. Deploy the CustomToken contract, which will mint 1000 ethers to the deployer.
3. Once the CustomToken contract is deployed, deploy the Bridge contract on the Polygon Mumbai chain. Provide the following arguments:
- Validator address (in the example above, we are using the deployer's address as the validator).
- Token address (address of the CustomToken contract).
- Source chain ID.
- Destination chain ID.
4. Set the minter and burner in the CustomToken contract as the address of the Bridge contract.
5. Use the `swap` function of the Bridge contract and provide the necessary arguments.
6. Deploy the CustomToken and Bridge contracts on the Binance Testnet.
7. Define the minter and burner in the CustomToken contract as the address of the Bridge contract on the Binance Testnet.
8. Before `redeem`, sign the message with the validator address and provide the v, r, and s signature along with the required arguments when calling the redeem function.

By following the above steps, the desired amount of CustomToken is transferred from the Polygon Mumbai chain (by burning the same amount from the sender address) and received in the Binance Testnet (by minting the same amount to the recipient address).

## Signature specification (v,r,s)
In the context of cryptographic signatures, `v`, `r`, and `s` are components of the signature that help verify the authenticity and integrity of a message. These components are derived from the process of signing a message with a private key.

- `v` represents the recovery id or the parity of the `recovery value`. It is used to recover the public key from the signature. In Ethereum, `v` is usually either 27 or 28, but can also be 0 or 1 for legacy reasons. The value of `v` is typically combined with the chain ID to create a unique value used for signature verification.
- `r` is the first 32 bytes of the signature and represents the x-coordinate of the point generated during the signing process.
- `s` is the second 32 bytes of the signature and represents the calculated "signature parameter". It contains information about the y-coordinate of the signing point and the private key used for signing.

To verify a signature, the `v`, `r`, and `s` components are passed to an elliptic curve recovery function, along with the message that was signed. The recovery function uses these components to reconstruct the public key associated with the private key used for signing. Once the public key is obtained, it can be used to verify the signature against the original message.

In the context of the code provided, the `v`, `r`, and `s` parameters are used in the `redeem` function of the Bridge contract to validate the signature provided by the validator. The `ECDSA.recover` function is used to recover the validator's address from the signature components, and it is compared against the expected validator address to ensure that the redemption is being performed by the authorized party.

## Installation
Clone the repository using the following command:
```
git clone https://github.com/FraxGod/LYTRYUM-BT-SC-ED1.git
cd LYTRYUM-BT-SC-ED1/lesson-5
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

swap (in polygon-mumbai):
```
npx hardhat swap --network polygon-mumbai --bridge 0xb3cb5cCdCeC06e9139CC1a0a5B722720aA25FC06 --recepient 0x3E2eB003abB4B3FAc844DF3123433564D734bb77 --amount 1000000000000000 --nonce 1
```
redeem(bsc-testnet):
```
npx hardhat redeem --network bsc --bridge 0xde37d31e2a14671448385d4d36e8e6bc17d3d8aa --sender 0x3e2eb003abb4b3fac844df3123433564d734bb77 --recepient 0x3e2eb003abb4b3fac844df3123433564d734bb77 --amount 1000000000000000 --nonce 1 
```

## Verification
Verify the installation by running the following command:
```
npx hardhat verify --network polygon-mumbai {CONTRACT_ADDRESS}
```
Note: Replace {CONTRACT_ADDRESS} with the address of the contract