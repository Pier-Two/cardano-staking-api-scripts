# Cardano Staking Scripts

This repository contains scripts for interacting with the Pier Two Cardano staking API. These scripts provide a command-line interface for managing Cardano staking operations.

## Features

- **Add Stake Accounts**: Add known Cardano stake accounts to your Pier Two account
- **List Stakes**: View and manage your Cardano staking positions
- **Register Stake Address**: Craft transactions to register new stake addresses
- **Delegate Stake**: Craft transactions to delegate stake to pools
- **Register and Delegate**: Perform both operations in a single transaction

## Prerequisites

- Node.js (v18 or higher)
- pnpm package manager
- Valid Pier Two API key
- Cardano wallet with stake addresses

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cardano-staking-scripts
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
API_KEY=your_pier_two_api_key_here
API_BASE_URL=https://api.piertwo.com
CARDANO_NETWORK=mainnet
PIER_TWO_POOL_ID=pool1mhww3q6d7qssj5j2add05r7cyr7znyswe2g6vd23anpx5sh6z8d
```

## Usage

### Add a Stake Account

Add a known Cardano stake account to your Pier Two account:

```bash
pnpm add-stake-account --stake-address stake1u9klnfr0v4f2k3v2c0t4d0h3l2p8x9q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f --reference "My Fund" --label "Balance Sheet Stake"
```

### List Your Stakes

View all your Cardano staking positions:

```bash
pnpm list-stakes
```

With pagination:
```bash
pnpm list-stakes --page-number 1 --page-size 20
```

### Register a Stake Address

Craft a transaction to register a new stake address:

```bash
pnpm register-stake-address --stake-address stake1u9klnfr0v4f2k3v2c0t4d0h3l2p8x9q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f
```

With custom pool:
```bash
pnpm register-stake-address --stake-address stake1u9klnfr0v4f2k3v2c0t4d0h3l2p8x9q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f --pool-id pool1abc123...
```

### Delegate Stake

Craft a transaction to delegate stake to a pool:

```bash
pnpm delegate-stake --stake-address stake1u9klnfr0v4f2k3v2c0t4d0h3l2p8x9q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f
```

### Register and Delegate

Perform both registration and delegation in a single transaction:

```bash
pnpm register-and-delegate --stake-address stake1u9klnfr0v4f2k3v2c0t4d0h3l2p8x9q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f
```

## Transaction Workflow

1. **Craft Transaction**: Use the scripts to create unsigned transactions
2. **Sign Transaction**: Use your Cardano wallet to sign the CBOR transaction
3. **Submit Transaction**: Broadcast the signed transaction to the Cardano network
4. **Monitor**: Track transaction confirmation and delegation status

## Configuration

### Environment Variables

- `API_KEY`: Your Pier Two API key (required)
- `API_BASE_URL`: API base URL (default: http://localhost:3000)
- `CARDANO_NETWORK`: Network to use (mainnet, preview, preprod)
- `PIER_TWO_POOL_ID`: Default pool ID for delegation

### Network Support

- **Mainnet**: Production Cardano network
- **Preview**: Test network for development
- **Preprod**: Pre-production test network

## API Endpoints

The scripts interact with the following Pier Two API endpoints:

- `GET /cardano/stakes` - List stake accounts
- `POST /cardano/stake/account` - Add stake account
- `POST /cardano/txcrafting/registerStakeAddress` - Craft registration transaction
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

## License

This project is licensed under the ISC License.
