import { MeshWallet, BlockfrostProvider } from "@meshsdk/core";
import { csl } from "@meshsdk/core-csl";

import { getCardanoNetwork } from "./config";
/**
 * Initialize Mesh SDK with Blockfrost provider
 */
export async function initializeMesh(blockfrostApiKey: string) {
  const network = await getCardanoNetwork();
  const networkId = (network === "mainnet" ? 1 : 0) as 0 | 1;

  console.log(
    `Initializing for ${network} network with Blockfrost API key: ${blockfrostApiKey.substring(0, 8)}...`,
  );

  return {
    network,
    networkId,
    blockfrostApiKey,
  };
}

/**
 * Create a Mesh wallet instance with mnemonic/seed phrase
 */
export async function createWallet(
  mnemonic: string,
  blockfrostApiKey: string,
): Promise<MeshWallet> {
  const { networkId } = await initializeMesh(blockfrostApiKey);

  // Create Blockfrost provider
  const provider = new BlockfrostProvider(blockfrostApiKey, networkId);

  // Create wallet with mnemonic
  const wallet = new MeshWallet({
    networkId,
    fetcher: provider,
    submitter: provider,
    key: {
      type: "mnemonic",
      words: mnemonic.split(" "),
    },
    // accountIndex: 0,
  });

  return wallet;
}

/**
 * Create a Mesh wallet instance with private key (legacy support)
 */
export async function createWalletWithPrivateKey(
  privateKey: string,
  blockfrostApiKey: string,
): Promise<MeshWallet> {
  const { networkId } = await initializeMesh(blockfrostApiKey);

  // Create Blockfrost provider
  const provider = new BlockfrostProvider(blockfrostApiKey, networkId);

  // Create wallet with private key
  const wallet = new MeshWallet({
    networkId,
    fetcher: provider,
    submitter: provider,
    key: {
      type: "root",
      bech32: privateKey,
    },
  });

  return wallet;
}

/**
 * Sign and submit a Cardano transaction using Mesh SDK
 */
export async function signAndSubmitTransaction(
  unsignedTxCbor: string,
  mnemonic: string,
  blockfrostApiKey: string,
): Promise<string> {
  try {
    console.log(`Signing and submitting transaction...`);
    console.log(`Mnemonic: ${mnemonic.substring(0, 8)}...`);

    // Debug: Inspect the transaction structure
    // debugTransactionStructure(unsignedTxCbor);

    // Debug: Deserialize transaction CBOR to JSON
    deserializeAndLogTransactionCbor(unsignedTxCbor);

    // Create wallet instance
    const wallet = await createWallet(mnemonic, blockfrostApiKey);

    console.log(
      `🔍 DEBUG: About to sign transaction from ${wallet.addresses.baseAddressBech32}...`,
    );

    // Sign the transaction
    const signedTx = await wallet.signTx(unsignedTxCbor);

    console.log(
      `🔍 DEBUG: Transaction signed successfully. Signed CBOR length: ${signedTx.length}`,
    );
    console.log(
      `🔍 DEBUG: Signed CBOR (first 100 chars): ${signedTx.substring(0, 100)}...`,
    );

    console.log("🔍 DEBUG: About to submit signed transaction...");

    // Submit the signed transaction
    const txHash = await wallet.submitTx(signedTx);

    console.log(`Transaction submitted successfully: ${txHash}`);
    return txHash;
  } catch (error) {
    console.error("🔍 DEBUG: Error details:", error);
    throw new Error(`Failed to sign and submit transaction: ${error}`);
  }
}

/**
 * Sign and submit a Cardano transaction using private key (legacy support)
 */
export async function signAndSubmitTransactionWithPrivateKey(
  unsignedTxCbor: string,
  privateKey: string,
  blockfrostApiKey: string,
): Promise<string> {
  try {
    console.log(`Signing and submitting transaction with private key...`);
    console.log(`Private key: ${privateKey.substring(0, 8)}...`);
    console.log(
      `Unsigned transaction CBOR: ${unsignedTxCbor.substring(0, 50)}...`,
    );

    // Create wallet instance
    const wallet = await createWalletWithPrivateKey(
      privateKey,
      blockfrostApiKey,
    );

    // Sign the transaction
    const signedTx = await wallet.signTx(unsignedTxCbor, true);

    // Submit the signed transaction
    const txHash = await wallet.submitTx(signedTx);

    console.log(`Transaction submitted successfully: ${txHash}`);
    return txHash;
  } catch (error) {
    throw new Error(`Failed to sign and submit transaction: ${error}`);
  }
}

/**
 * Sign a transaction without submitting it
 */
export async function signTransaction(
  unsignedTxCbor: string,
  mnemonic: string,
  blockfrostApiKey: string,
): Promise<string> {
  try {
    console.log("Signing transaction with mnemonic...");

    // Create wallet instance
    const wallet = await createWallet(mnemonic, blockfrostApiKey);

    // Sign the transaction without submitting
    const signedTx = await wallet.signTx(unsignedTxCbor, false);

    console.log("Transaction signed successfully");
    return signedTx;
  } catch (error) {
    throw new Error(`Failed to sign transaction: ${error}`);
  }
}

/**
 * Submit a signed transaction to the network
 */
export async function submitSignedTransaction(
  signedTxCbor: string,
  mnemonic: string,
  blockfrostApiKey: string,
): Promise<string> {
  try {
    const { network } = await initializeMesh(blockfrostApiKey);

    console.log(`Submitting signed transaction to ${network} network...`);
    console.log(`Signed transaction CBOR: ${signedTxCbor.substring(0, 50)}...`);

    // Create wallet instance
    const wallet = await createWallet(mnemonic, blockfrostApiKey);

    // Submit the signed transaction
    const txHash = await wallet.submitTx(signedTxCbor);

    console.log(`Transaction submitted successfully: ${txHash}`);
    return txHash;
  } catch (error) {
    throw new Error(`Failed to submit transaction: ${error}`);
  }
}

/**
 * Get transaction status from Blockfrost
 */
export async function getTransactionStatus(
  txHash: string,
  blockfrostApiKey: string,
): Promise<{ confirmed: boolean; blockHeight?: number }> {
  try {
    console.log(`Checking transaction status for: ${txHash}`);

    // Simulate checking transaction status
    // In production, you would make a direct API call to Blockfrost
    const network = await getCardanoNetwork();
    const response = await fetch(
      `https://cardano-${network === "mainnet" ? "mainnet" : "preprod"}.blockfrost.io/api/v0/txs/${txHash}`,
      {
        headers: {
          project_id: blockfrostApiKey,
        },
      },
    );

    if (response.ok) {
      const txDetails = await response.json();
      if (txDetails.block) {
        return {
          confirmed: true,
          blockHeight: txDetails.block,
        };
      } else {
        return {
          confirmed: false,
          blockHeight: undefined,
        };
      }
    } else {
      return {
        confirmed: false,
        blockHeight: undefined,
      };
    }
  } catch (error) {
    // If transaction not found, it might still be in mempool
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      return {
        confirmed: false,
        blockHeight: undefined,
      };
    }
    throw new Error(`Failed to get transaction status: ${errorMessage}`);
  }
}

/**
 * Deserialize transaction CBOR to JSON using Mesh SDK's deserializeDatum
 */
export function deserializeAndLogTransactionCbor(cborHex: string) {
  try {
    console.log("\n🔍 DEBUG: Deserializing transaction CBOR to JSON...");
    console.log(`Input CBOR (first 50 chars): ${cborHex.substring(0, 50)}...`);

    // const txBuilder = new MeshTxBuilder({
    //     fetcher: blockchainProvider,
    //     submitter: blockchainProvider,
    //     params: DEFAULT_PROTOCOL_PARAMETERS,
    // });

    // const deserialized = txBuilder.serializer.deserializer

    // Use Mesh SDK's deserializeDatum function
    // const deserialized = deserializeDatum(cborHex);

    const deserialized = csl.Transaction.from_hex(cborHex);

    const json = deserialized.to_json();

    console.log("JSON Transaction:", json);
    console.log("✅ Transaction deserialized successfully!");
    console.log("📋 Deserialized transaction structure:");
    console.log(JSON.stringify(deserialized, null, 2));

    return deserialized;
  } catch (error) {
    console.error("❌ Error deserializing transaction CBOR:", error);
    throw new Error(`Failed to deserialize transaction CBOR: ${error}`);
  }
}
