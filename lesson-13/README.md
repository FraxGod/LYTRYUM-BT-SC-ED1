# ERC4626

Sample project to show how ERC4626 work.

In this task we want You to implement ERC4626 token that wrapps AaveV3Pool.
This contract should receive tokens and then supply it to AaveV3, wrap with 
aTokens and accumulate it as 'asset'. That means, that this contract will 
receive interest of all deposited aTokens. Any user can claim his percent of 
totalAssets based on shares that he holds.

Contract deployed and verifiyed on polygon mumbai at:
https://mumbai.polygonscan.com/address/0xb5EFD36e4e73A7979994dae363aD2f62a6916681#code

Try running some of the following tasks:

```shell
yarn
yarn hardhat test
```
