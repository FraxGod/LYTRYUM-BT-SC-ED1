# Sample flashloan project

This project demonstrates a basic flashloan use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Here we will implement the logic for arbitrage two DeX pools on UniswapV3(difference in fee) via flashloan. Flashloan based on Aave's implementation of FlashLoanProvider.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.tokens.ts
```
