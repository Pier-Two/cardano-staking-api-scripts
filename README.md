# Cardano Staking Scripts

This repository contains scripts for interacting with the Pier Two Cardano staking API. These scripts provide a command-line interface for managing Cardano staking operations.

## Features

- **Add Stake Accounts**: Add known Cardano stake accounts to your Pier Two account
- **List Stakes**: View and manage your Cardano staking positions
- **List Addresses**: View payment and stake addresses for a specific index
- **Register Stake Address**: Craft transactions to register new stake addresses
- **Deregister Stake Address**: Craft transactions to deregister stake addresses
- **Delegate Stake**: Craft transactions to delegate stake to pools
- **Register and Delegate**: Perform both operations in a single transaction
- **Withdraw Stake Rewards**: Craft transactions to withdraw staking rewards

## Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Valid Pier Two API key
- Cardano private key (for transaction signing)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Pier-Two/cardano-staking-api-scripts.git
cd cardano-staking-api-scripts
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Create .env file manually with the following variables:
```

copy the `.env.example` contents into a `.env` file in the project root with your configuration:
```env
# Required
API_KEY=your_pier_two_api_key_here
CARDANO_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
API_BASE_URL=https://gw-1.api.test.piertwo.io
```

To create your `.env` file, copy the template above and replace the placeholder values with your actual configuration.

## Usage

### Add a Stake Account

Add a known Cardano stake account to your Pier Two account:

```bash
pnpm add-stake-account --stake-address stake1ux... --reference "My Fund" --label "Balance Sheet Stake"
```

**Note**: This script currently requires the full stake address. For automatic address derivation, use `list-addresses` first to get the stake address for your desired index.

### List Your Stakes

View all your Cardano staking positions:

```bash
pnpm list-stakes
```

### List Addresses

View the payment and stake addresses for a specific address index:

```bash
pnpm list-addresses --address-index 0
```

This is useful for:
- Verifying which addresses you're working with
- Checking derivation paths
- Getting usage examples for other commands


### Register and Delegate

Perform both registration and delegation in a single transaction:

```bash
pnpm register-and-delegate --address-index 0
```

Sign and submit automatically:
```bash
pnpm register-and-delegate --address-index 0 --sign-and-submit
```

### Withdraw Stake Rewards

Craft a transaction to withdraw stake rewards:

```bash
pnpm withdraw-stake-rewards --address-index 0 --amount 1000000
```

Sign and submit automatically:
```bash
pnpm withdraw-stake-rewards --address-index 0 --amount 1000000 --sign-and-submit
```

With confirmation waiting:
```bash
pnpm withdraw-stake-rewards --address-index 0 --amount 1000000 --sign-and-submit --wait-confirmation
```

### Register a Stake Address

Craft a transaction to register a new stake address:

```bash
pnpm register-stake-address --address-index 0
```

With custom pool:
```bash
pnpm register-stake-address --address-index 0
```

Sign and submit automatically:
```bash
pnpm register-stake-address --address-index 0 --sign-and-submit
```

With confirmation waiting:
```bash
pnpm register-stake-address --address-index 0 --sign-and-submit --wait-confirmation
```

### Deregister a Stake Address

Craft a transaction to deregister a stake address:

```bash
pnpm deregister-stake-address --address-index 0
```

Sign and submit automatically:
```bash
pnpm deregister-stake-address --address-index 0 --sign-and-submit
```

With confirmation waiting:
```bash
pnpm deregister-stake-address --address-index 0 --sign-and-submit --wait-confirmation
```

### Delegate Stake

Craft a transaction to delegate stake to a pool:

```bash
pnpm delegate-stake --address-index 0
```

Sign and submit automatically:
```bash
pnpm delegate-stake --address-index 0 --sign-and-submit
```
