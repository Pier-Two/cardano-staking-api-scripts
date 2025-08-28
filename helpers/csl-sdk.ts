import * as CSL from "@emurgo/cardano-serialization-lib-nodejs";
import * as bip39 from "bip39";
import { Buffer } from "buffer";
import { getCardanoNetwork } from "./config";
import { blake2b } from "blakejs";

/**
 * Helper function to harden a derivation index
 */
function harden(num: number): number {
  return num | 0x80000000;
}

/**
 * Initialize CSL with network configuration
 */
export async function initializeCSL() {
  const network = await getCardanoNetwork();
  const networkId = network === "mainnet" ? 1 : 0;

  console.log(`Initializing CSL for ${network} network (ID: ${networkId})`);

  return {
    network,
    networkId,
  };
}

/**
 * Derive private key and addresses from mnemonic for a specific address index and role
 */
export async function derivePrivateKeyAndAddressesFromMnemonic(
  mnemonic: string,
  addressIndex: number = 0,
): Promise<{
  privateKey: CSL.PrivateKey;
  paymentAddress: string;
  stakeAddress: string;
  paymentKey: CSL.PrivateKey;
  stakeKey: CSL.PrivateKey;
}> {
  try {
    console.log(
      `Deriving private key and addresses for address index ${addressIndex}...`,
    );

    // Convert mnemonic to root seed
    const entropy = await bip39.mnemonicToEntropy(mnemonic);

    // Create root key from seed
    const rootKey = CSL.Bip32PrivateKey.from_bip39_entropy(
      Buffer.from(entropy, "hex"),
      Buffer.alloc(0),
    );

    const accountIndex = 0;
    const role = 0;

    // Derive payment key: m/1852'/1815'/accountIndex'/role/addressIndex
    const paymentKey = rootKey
      .derive(harden(1852))
      .derive(harden(1815))
      .derive(harden(accountIndex))
      .derive(role)
      .derive(addressIndex);

    // Derive stake key: m/1852'/1815'/accountIndex'/2/0
    const stakeKey = rootKey
      .derive(harden(1852))
      .derive(harden(1815))
      .derive(harden(accountIndex))
      .derive(2)
      .derive(0); // all payment addresses link to same stake address

    // Get public keys
    const paymentPublicKey = paymentKey.to_public().to_raw_key();
    const stakePublicKey = stakeKey.to_public().to_raw_key();

    // Get network info
    const { network } = await initializeCSL();
    const networkId = network === "mainnet" ? 1 : 0;

    // Create payment and stake credentials
    const paymentCredential = CSL.Credential.from_keyhash(
      paymentPublicKey.hash(),
    );
    const stakeCredential = CSL.Credential.from_keyhash(stakePublicKey.hash());

    // Create base address with both payment and stake credentials
    const baseAddress = CSL.BaseAddress.new(
      networkId,
      paymentCredential,
      stakeCredential,
    );
    const paymentAddress = baseAddress.to_address().to_bech32();

    // Create stake address (stake credential only)
    const stakeAddress = CSL.RewardAddress.new(networkId, stakeCredential)
      .to_address()
      .to_bech32();

    console.log(
      `✅ Private key and addresses derived successfully for address index ${addressIndex}`,
    );
    console.log(`   Payment Address: ${paymentAddress}`);
    console.log(`   Stake Address: ${stakeAddress}`);
    console.log(
      `   Payment path: m/1852'/1815'/${accountIndex}'/${role}/${addressIndex}`,
    );
    console.log(`   Stake path: m/1852'/1815'/${accountIndex}'/2/0`);

    return {
      privateKey: paymentKey.to_raw_key(),
      paymentAddress,
      paymentKey: paymentKey.to_raw_key(),
      stakeAddress,
      stakeKey: stakeKey.to_raw_key(),
    };
  } catch (error) {
    throw new Error(`Failed to derive private key and addresses: ${error}`);
  }
}

/**
 * Deserialize transaction CBOR to JSON using CSL
 */
export function deserializeAndLogTransactionCbor(cborHex: string) {
  try {
    console.log("\n🔍 DEBUG: Deserializing transaction CBOR using CSL...");
    console.log(`Input CBOR length: ${cborHex.length} characters`);
    console.log(
      `Input CBOR (first 100 chars): ${cborHex.substring(0, 100)}...`,
    );
    console.log(
      `Input CBOR (last 100 chars): ...${cborHex.substring(cborHex.length - 100)}`,
    );

    // Validate hex string
    if (!/^[0-9a-fA-F]+$/.test(cborHex)) {
      throw new Error("Invalid hex string format");
    }

    // Check if length is even (hex strings should have even length)
    if (cborHex.length % 2 !== 0) {
      throw new Error(
        `Invalid hex string length: ${cborHex.length} (must be even)`,
      );
    }

    // Convert hex to buffer
    const cborBuffer = Buffer.from(cborHex, "hex");
    console.log(`CBOR buffer length: ${cborBuffer.length} bytes`);

    // Deserialize transaction using CSL
    const tx = CSL.Transaction.from_bytes(cborBuffer);
    const body = tx.body();

    // Extract basic transaction components
    const deserialized: {
      fee: string;
      ttl: number | null | undefined;
      inputs: { transactionId: string; index: number }[];
      outputs: { address: string; amount: string; multiAsset: string | null }[];
      certificates: { type: string }[];
      withdrawals: { address: string; amount: string }[];
      auxiliaryData: string | null;
      witnessSet: string | null;
    } = {
      fee: body.fee().to_str(),
      ttl: body.ttl() ? body.ttl() : null,
      inputs: [],
      outputs: [],
      certificates: [],
      withdrawals: [],
      auxiliaryData: tx.auxiliary_data() ? "present" : null,
      witnessSet: tx.witness_set() ? "present" : null,
    };

    // Extract inputs
    const inputs = body.inputs();
    for (let i = 0; i < inputs.len(); i++) {
      const input = inputs.get(i);
      deserialized.inputs.push({
        transactionId: Buffer.from(input.transaction_id().to_bytes()).toString(
          "hex",
        ),
        index: input.index(),
      });
    }

    // Extract outputs
    const outputs = body.outputs();
    for (let i = 0; i < outputs.len(); i++) {
      const output = outputs.get(i);
      deserialized.outputs.push({
        address: output.address().to_bech32(),
        amount: output.amount().coin().to_str(),
        multiAsset: output.amount().multiasset() ? "present" : null,
      });
    }

    // Extract certificates
    const certs = body.certs();
    if (certs) {
      for (let i = 0; i < certs.len(); i++) {
        const cert = certs.get(i);
        deserialized.certificates.push({
          type: cert.kind().toString(),
        });
      }
    }

    console.log("✅ Transaction deserialized successfully using CSL!");
    console.log("📋 Deserialized transaction structure:");
    console.log(JSON.stringify(deserialized, null, 2));

    return deserialized;
  } catch (error) {
    console.error("❌ Error deserializing transaction CBOR with CSL:", error);
    console.error("🔍 CBOR hex string details:");
    console.error(`  Length: ${cborHex.length} characters`);
    console.error(`  First 200 chars: ${cborHex.substring(0, 200)}`);
    console.error(
      `  Last 200 chars: ${cborHex.substring(Math.max(0, cborHex.length - 200))}`,
    );

    // Try to identify common issues
    if (cborHex.length === 0) {
      console.error("  Issue: CBOR string is empty");
    } else if (cborHex.length < 100) {
      console.error(
        "  Issue: CBOR string seems too short for a valid transaction",
      );
    } else if (!/^[0-9a-fA-F]+$/.test(cborHex)) {
      console.error("  Issue: CBOR string contains non-hex characters");
    }

    throw new Error(`Failed to deserialize transaction CBOR: ${error}`);
  }
}

/**
 * Sign a Cardano transaction using CSL (new implementation)
 */
export async function signTransactionWithKeysCSL(
  unsignedTxCbor: string,
  signingKeys: CSL.PrivateKey[],
): Promise<string> {
  try {
    console.log(`Signing transaction with CSL...`);

    // Deserialize transaction
    const tx = CSL.Transaction.from_bytes(Buffer.from(unsignedTxCbor, "hex"));

    // Create witness set
    const txBodyBytes = tx.body().to_bytes();

    // Hash the transaction body before signing
    const txBodyHashBytes = blake2b(txBodyBytes, undefined, 32);
    const txBodyHash = CSL.TransactionHash.from_bytes(txBodyHashBytes);

    // Use the CSL make_vkey_witness function which properly handles the transaction body hash
    const witnessSet = CSL.TransactionWitnessSet.new();
    const vkeys = CSL.Vkeywitnesses.new();

    for (const signer of signingKeys) {
      const vkeyWitness = CSL.make_vkey_witness(txBodyHash, signer);
      vkeys.add(vkeyWitness);
    }

    witnessSet.set_vkeys(vkeys);

    // Build signed transaction
    const signedTx = CSL.Transaction.new(
      tx.body(),
      witnessSet,
      tx.auxiliary_data(),
    );

    // Serialize to hex
    const signedTxHex = Buffer.from(signedTx.to_bytes()).toString("hex");
    console.log(
      `✅ Transaction signed successfully. Signed CBOR length: ${signedTxHex.length}`,
    );

    return signedTxHex;
  } catch (error) {
    console.error("🔍 DEBUG: Error details:", error);
    throw new Error(`Failed to sign transaction: ${error}`);
  }
}
