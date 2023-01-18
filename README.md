# DAO for Art Smart Contracts

This repo contains all smart contracts code for project DAO for Art(D4A in
brief), which runs
on Ethereum.

## Basic for Dev

In D4A, a user may create a `project`, thus we call the user `project owner`.
A user can also create a `canvas`, thus we call the user `canvas owner`.
And a user may mint a NFT by paying ETH to the D4A protocol, thus we can the user
`buyer`. The D4A protocol will split the ETH to the project owner and the
canvas owner. Besides, the D4A protocol will charge some fees.

Each project will has own ERC20 and ERC721 token for possible upgrades. The
ERC721 is for the NFT. And the ERC20 token is for governance.

This project used OpenZeppelin(4.x) heavily, including the upgradeable parts.

## Build, Test and Deploy


### Build
```
cd DAO4ART-CONTRACT
npm install
ln -snf truffle-config.ganache.js truffle-config.js
truffle compile
```

### Test
Make sure you have ganache launched already, and the port is 7545.

```
cd DAO4ART-CONTRACT
ln -snf truffle-config.ganache.js truffle-config.js
truffle test
```

### Deploy
Make sure you have a `.env` file in the `d4a-contract` folder.

For ropsten:
```
cd d4a-contract
ln -snf truffle-config.ropsten.js truffle-config.js
truffle migrate --reset --network ropsten
```

For mainnet:
```
cd d4a-contract
ln -snf truffle-config.main.js truffle-config.js
truffle migrate --reset --network main
```

After the deployment, you may find a file named `network`-d4a.json, which
include the necessory deployed address.

### Verify the contract on EtherScan

Make sure you have valid etherscan API key in the `.env` file.

For ropsten:
```
cd DAO4ART-CONTRACT
ln -snf truffle-config.ropsten.js truffle-config.js
truffle run verify D4ASetting --network ropsten
```


### Linting the Code

Make sure you have `solhint` installed.
```
cd d4a-contract
solhint 'contracts/**/*.sol'
```



