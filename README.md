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
- Cardano wallet with stake addresses
- Blockfrost API key (for transaction submission)
- Cardano private key (for transaction signing)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
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

Create a `.env` file in the project root with your configuration:
```env
# Required
API_KEY=your_pier_two_api_key_here
BLOCKFROST_API_KEY=your_blockfrost_api_key_here
CARDANO_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about

# Optional
API_BASE_URL=https://api.piertwo.com
CARDANO_NETWORK=mainnet
PIER_TWO_POOL_ID=pool1mhww3q6d7qssj5j2add05r7cyr7znyswe2g6vd23anpx5sh6z8d
```

**Note**: There is no `.env.example` file in this repository. You must create the `.env` file manually with the variables above.

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

With pagination:
```bash
pnpm list-stakes --page-number 1 --page-size 20
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

### Register a Stake Address

Craft a transaction to register a new stake address:

```bash
pnpm register-stake-address --address-index 0
```

With custom pool:
```bash
pnpm register-stake-address --address-index 0 --pool-id pool1abc123...
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

### Delegate Stake

Craft a transaction to delegate stake to a pool:

```bash
pnpm delegate-stake --address-index 0
```

Sign and submit automatically:
```bash
pnpm delegate-stake --address-index 0 --sign-and-submit
```

### Register and Delegate

Perform both registration and delegation in a single transaction:

```bash
pnpm register-and-delegate --address-index 0
```

Sign and submit automatically:
```bash
pnpm register-and-delegate --address-index 0 --sign-and-submit
```



## Transaction Workflow

### Manual Workflow
1. **Craft Transaction**: Use the scripts to create unsigned transactions
2. **Sign Transaction**: Use your Cardano wallet to sign the CBOR transaction
3. **Submit Transaction**: Broadcast the signed transaction to the Cardano network
4. **Monitor**: Track transaction confirmation and delegation status

### Automated Workflow (Recommended)
1. **Craft, Sign & Submit**: Use the `--sign-and-submit` flag to automatically handle the entire process
2. **Wait for Confirmation**: Use the `--wait-confirmation` flag to wait for transaction confirmation
3. **Monitor**: The script will display transaction status and confirmation details

## Wallet Integration

This project now includes proper transaction signing using the Mesh SDK with mnemonic/seed phrase support. The wallet integration provides:

### Features
- **Automatic Transaction Signing**: Sign transactions using your Cardano mnemonic/seed phrase
- **Direct Network Submission**: Submit signed transactions directly to the Cardano network
- **Transaction Status Monitoring**: Check transaction confirmation status
- **Multi-Network Support**: Works with mainnet, preview, and preprod networks
- **Backward Compatibility**: Legacy private key support is still available

### Setup
1. **Mnemonic/Seed Phrase**: Set your Cardano mnemonic in the `CARDANO_MNEMONIC` environment variable
2. **Blockfrost API**: Ensure your `BLOCKFROST_API_KEY` is configured for network access
3. **Network Configuration**: The network is automatically fetched from the Pier Two API. You can set `CARDANO_NETWORK` as a fallback if the API is unavailable

### Testing
Test your wallet configuration by running any of the scripts with the `--help` flag to verify your setup:

```bash
pnpm list-addresses --help
```

### Mnemonic Format
Your mnemonic should be a space-separated list of words (typically 12, 15, 18, 21, or 24 words). For example:
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

**Important**: Keep your mnemonic secure and never share it with anyone. Anyone with access to your mnemonic can control your wallet.

### Security
- **Mnemonic Storage**: Store your mnemonic securely in environment variables
- **Never Commit**: Never commit mnemonics to version control
- **Network Validation**: Always verify you're using the correct network (mainnet vs testnet)

## Address Index Parameter

All scripts now use an `--address-index` parameter instead of requiring you to specify stake and payment addresses manually. This parameter determines which addresses to derive from your mnemonic:

### How It Works
- **Address Index**: A numeric value (0, 1, 2, etc.) that specifies which set of addresses to use
- **Automatic Derivation**: The script automatically derives both payment and stake addresses from your mnemonic
- **BIP44 Path**: Uses the standard Cardano derivation path: `m/1852'/1815'/0'/0/{addressIndex}` for payment and `m/1852'/1815'/0'/2/0` for stake

### Examples
```bash
# Use the first set of addresses (index 0)
pnpm delegate-stake --address-index 0

# Use the second set of addresses (index 1)  
pnpm register-stake-address --address-index 1

# Use the tenth set of addresses (index 9)
pnpm register-and-delegate --address-index 9
```

### Benefits
- **Simplified Usage**: No need to manually copy/paste addresses
- **Reduced Errors**: Eliminates typos in address input
- **Consistent**: Ensures payment and stake addresses are always from the same wallet
- **Secure**: Addresses are derived locally from your mnemonic

## Configuration

### Environment Variables

#### Required
- `API_KEY`: Your Pier Two API key
- `BLOCKFROST_API_KEY`: Your Blockfrost API key for submitting transactions to the network and checking tx status
- `CARDANO_MNEMONIC`: Your Cardano mnemonic/seed phrase for wallet creation
- `API_BASE_URL`: API base URL (mainnet: https://gw-1.api.piertwo.io)

### Network Support

The network configuration is automatically fetched from the Pier Two API to ensure you're always using the correct network for your environment.

- **Mainnet**: Production Cardano network
- **Preprod**: Pre-production test network

## API Endpoints

The scripts interact with the following Pier Two API endpoints:

- `GET /cardano/stakes` - List stake accounts
- `POST /cardano/stake/account` - Add stake account
- `POST /cardano/txcrafting/registerStakeAddress` - Craft registration transaction
- `POST /cardano/txcrafting/deregisterStakeAddress` - Craft deregistration transaction
- `POST /cardano/txcrafting/stakingRewardsWithdrawal` - Craft rewards withdrawal transaction
- `POST /cardano/txcrafting/delegateStake` - Craft delegation transaction
- `POST /cardano/txcrafting/registerAndDelegate` - Craft combined transaction

## Development

### Generate API Types

Update the generated API types from the OpenAPI specification:

```bash
pnpm generate-api
```

### Linting and Formatting

```bash
pnpm lint
pnpm lint:fix
pnpm format
```

### Check Dependencies

```bash
pnpm lint:deps
pnpm check:missing
```

## Security Notes

- Keep your API keys secure and never commit them to version control
- Use environment variables for sensitive configuration
- Validate all addresses and pool IDs before submitting transactions
- Always review transaction details before signing

## Support

For issues and questions:

1. Check the [Pier Two documentation](https://docs.piertwo.com)
2. Review the API error messages for troubleshooting
3. Contact Pier Two support for API-related issues
