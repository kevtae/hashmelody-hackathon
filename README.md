# Full-Stack Solana Project

This repository contains a complete Solana-based application with frontend, API integration, and smart contracts.

## Repository Structure

- **client/** - Frontend application and API integration
- **contract/** - Solana smart contracts

## Client

The `client/` directory contains all frontend code and API integrations for interacting with the Solana blockchain.

### Features

- Complete frontend user interface
- Solana wallet integration
- API services for data fetching and blockchain interactions
- State management

### Setup and Installation

```bash
cd client
npm install
```

### Configuration

All configuration is set up for the Solana devnet. No changes are needed for development purposes.

```bash
# Start the development server
npm run dev
```

### API Endpoints

The client interacts with the following APIs:

- Solana RPC endpoints (Devnet)
- Internal API services for data processing

## Contract

The `contract/` directory contains all Solana smart contracts for the application.

### Smart Contracts

- Main program logic
- Account structures
- Instructions and state management

### Development and Deployment

```bash
cd contract
npm install
```

### Build and Deploy

```bash
# Build the program
npm run build

# Deploy to devnet
npm run deploy
```

### Testing

```bash
# Run contract tests
npm test
```

## Important Notes

- **All keys and configurations are for Solana devnet only**
- Do not use real funds with this application
- For mainnet deployment, additional security reviews and configuration changes would be required

## Development Workflow

1. Run the contract tests to ensure proper functionality
2. Deploy contracts to devnet
3. Start the client application
4. Connect your development wallet (configured for devnet)

## Troubleshooting

If you encounter issues:

- Ensure you have the Solana CLI tools installed
- Verify your wallet is connected to devnet
- Check that you have sufficient devnet SOL (use the devnet faucet if needed)

## Contributing

Please see CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
