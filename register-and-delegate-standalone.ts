import { PierTwoStakingApi } from "@pier_two/staking-ts";
import * as CSL from "@emurgo/cardano-serialization-lib-nodejs";
import * as bip39 from "bip39";
import { Buffer } from "buffer";
import { blake2b } from "blakejs";

// Configuration - Replace these with your actual values
const API_KEY = "yourPierTwoApiKey";
const CARDANO_MNEMONIC =
  "pier two pier two pier two pier two pier two pier two pier two pier";
const API_BASE_URL = "https://gw-1.api.piertwo.io";
const ADDRESS_INDEX = 0;

/**
 * Helper function to harden a derivation index
 */
function harden(num: number): number {
  return num | 0x80000000;
}

/**
 * Main function that orchestrates the complete register and delegate workflow
 */
async function main() {
  try {
    const api = new PierTwoStakingApi({
      baseUrl: API_BASE_URL,
      apiKey: API_KEY,
    });

    const { data: networkConfig } = await api.public.networkConfig();

    const networkId = networkConfig.cardano.network === "mainnet" ? 1 : 0;

    const entropy = await bip39.mnemonicToEntropy(CARDANO_MNEMONIC);
    const rootKey = CSL.Bip32PrivateKey.from_bip39_entropy(
      Buffer.from(entropy, "hex"),
      Buffer.alloc(0),
    );

    const accountIndex = 0;
    const role = 0;

    // Derive payment key: m/1852'/1815'/accountIndex'/role/addressIndex
    const paymentKeyPath = rootKey
      .derive(harden(1852))
      .derive(harden(1815))
      .derive(harden(accountIndex))
      .derive(role)
      .derive(ADDRESS_INDEX);

    // Derive stake key: m/1852'/1815'/accountIndex'/2/0
    const stakeKeyPath = rootKey
      .derive(harden(1852))
      .derive(harden(1815))
      .derive(harden(accountIndex))
      .derive(2)
      .derive(0);

    // Convert to PrivateKey for signing
    const paymentKey = paymentKeyPath.to_raw_key();
    const stakeKey = stakeKeyPath.to_raw_key();

    // Get public keys
    const paymentPublicKey = paymentKeyPath.to_public().to_raw_key();
    const stakePublicKey = stakeKeyPath.to_public().to_raw_key();

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

    const txCraftingResponse =
      await api.cardano.craftCardanoRegisterAndDelegateTx(
        {
          stakeAddress: stakeAddress,
          utxoAddress: paymentAddress,
          reference: "Test Fund",
          label: "Test Stake",
        },
        {},
      );

    // Deserialize the unsigned transaction
    const tx = CSL.Transaction.from_bytes(
      Buffer.from(txCraftingResponse.data.unsignedTx, "hex"),
    );

    // Create witness set
    const txBodyBytes = tx.body().to_bytes();

    // Hash the transaction body before signing
    const txBodyHashBytes = blake2b(txBodyBytes, undefined, 32);
    const txBodyHash = CSL.TransactionHash.from_bytes(txBodyHashBytes);

    // Create witness set with vkeys
    const witnessSet = CSL.TransactionWitnessSet.new();
    const vkeys = CSL.Vkeywitnesses.new();

    // Add payment key witness
    const paymentKeyWitness = CSL.make_vkey_witness(txBodyHash, paymentKey);
    vkeys.add(paymentKeyWitness);

    // Add stake key witness
    const stakeKeyWitness = CSL.make_vkey_witness(txBodyHash, stakeKey);
    vkeys.add(stakeKeyWitness);

    witnessSet.set_vkeys(vkeys);

    // Create signed transaction
    const signedTx = CSL.Transaction.new(
      tx.body(),
      witnessSet,
      tx.auxiliary_data(),
    );

    // Serialize to hex
    const signedTxHex = Buffer.from(signedTx.to_bytes()).toString("hex");

    // Submit via Pier Two API
    try {
      const { data } = await api.cardano.submitCardanoTransaction({
        signedTx: signedTxHex,
      });

      console.log(`✅ Transaction submitted via Pier Two API: ${data.txHash}`);
      console.log(`   Transaction Hash: ${data.txHash}`);
    } catch (error) {
      console.error("❌ Failed to submit transaction via Pier Two API:", error);
      throw error;
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();
