/* eslint-disable class-methods-use-this */
import init, { sign_phase1, sign_phase2, sign_phase3, sign_phase4 } from '@0xcarbon/dkls23-wasm';
import { Signature, Transaction } from 'ethers';

import { AloreCrypto } from '../core/AloreCrypto';
import {
  Broadcast3to4,
  generateUUID,
  hexStringToBytes,
  Keyshare,
  SignData,
  SingleOfHashmapKeep1to2,
  SingleOfHashmapKeep2to3,
  SingleVecTransmit1to2,
  SingleVecTransmit2to3,
  UniqueKeep1to2,
  UniqueKeep2to3,
} from '../utils';

export class SignerModule {
  // eslint-disable-next-line no-useless-constructor, no-unused-vars, no-empty-function
  constructor(protected sdk: AloreCrypto) {}

  /**
   * Signs a transaction using a shared key (keyshare) and performs the necessary communication phases to generate the final signature.
   *
   * @param tx - The transaction to be signed.
   * @param keyshare - The shared key used for signing.
   * @param walletId - The ID of the wallet.
   * @param shareBeingDerivedIndex - The index of the share being derived.
   * @param isForImportedAccount - Indicates whether the signing is for an imported account.
   * @param accountId - The ID of the account (only required for imported accounts).
   * @returns An object containing the signed transaction and the signature.
   */
  public async signTransaction(
    tx: Transaction,
    keyshare: Keyshare,
    walletId: string,
    shareBeingDerivedIndex: number,
    isForImportedAccount: boolean,
    accountId?: string,
  ) {
    await init();

    const signId = generateUUID();

    const signData: SignData = {
      sign_id: Array.from(signId),
      counterparties: [2],
      message_hash: hexStringToBytes(tx.unsignedHash),
    };

    const mulSendersMap = new Map(keyshare.mul_senders);
    const mulReceiversMap = new Map(keyshare.mul_receivers);
    keyshare.mul_senders = mulSendersMap;
    keyshare.mul_receivers = mulReceiversMap;

    const clientPhase1 = this.phase1(keyshare, signData);

    const clientUniqueKeep1to2 = clientPhase1[0];
    const clientHashmapKeep1to2 = clientPhase1[1];
    const clientVecTransmit1to2 = clientPhase1[2];

    const serverVecTransmit1to2 = isForImportedAccount
      ? await this.communicationPhase1(
          signData,
          clientVecTransmit1to2,
          shareBeingDerivedIndex,
          walletId,
          accountId,
          true,
        )
      : await this.communicationPhase1(
          signData,
          clientVecTransmit1to2,
          shareBeingDerivedIndex,
          walletId,
        );

    const clientPhase2 = this.phase2(
      keyshare,
      signData,
      clientUniqueKeep1to2,
      clientHashmapKeep1to2,
      serverVecTransmit1to2,
    );

    const clientUniqueKeep2to3 = clientPhase2[0];
    const clientHashmapKeep2to3 = clientPhase2[1];
    const clientVecTransmit2to3 = clientPhase2[2];

    const serverVecTransmit2to3 = isForImportedAccount
      ? await this.communicationPhase2(
          signData,
          clientVecTransmit2to3,
          walletId,
          shareBeingDerivedIndex,
          accountId,
          true,
        )
      : await this.communicationPhase2(
          signData,
          clientVecTransmit2to3,
          walletId,
          shareBeingDerivedIndex,
        );

    const clientPhase3 = this.phase3(
      keyshare,
      signData,
      clientUniqueKeep2to3,
      clientHashmapKeep2to3,
      serverVecTransmit2to3,
    );

    const XCoord = clientPhase3[0];
    const clientBroadcast3to4 = clientPhase3[1];

    const serverBroadcast3to4 = isForImportedAccount
      ? await this.communicationPhase3(
          signData,
          clientBroadcast3to4,
          walletId,
          shareBeingDerivedIndex,
          accountId,
          true,
        )
      : await this.communicationPhase3(
          signData,
          clientBroadcast3to4,
          walletId,
          shareBeingDerivedIndex,
        );

    const clientPhase4 = this.phase4(
      keyshare,
      signData,
      XCoord,
      clientBroadcast3to4,
      serverBroadcast3to4,
    );

    if (isForImportedAccount) {
      await this.communicationPhase4(signData, walletId, shareBeingDerivedIndex, accountId, true);
    } else {
      await this.communicationPhase4(signData, walletId, shareBeingDerivedIndex);
    }

    const sigR = `0x${XCoord}`;
    const sigS = `0x${clientPhase4[0]}`;
    const recoveryId = clientPhase4[1];

    tx.signature = Signature.from({
      r: sigR,
      s: sigS,
      v: 35 + Number(tx.chainId) * 2 + recoveryId, // calculating `v` for eip1559
    });

    return {
      signedTransaction: tx,
      signature: tx.signature,
    };
  }

  private phase1(party: Keyshare, signData: SignData) {
    const result = sign_phase1(party, signData);
    return result;
  }

  private async communicationPhase1(
    signData: SignData,
    clientVecTransmit1to2: SingleVecTransmit1to2[],
    shareBeingDerivedIndex: number,
    walletId?: string,
    accountId?: string,
    isForImportedAccount?: boolean,
  ) {
    const uArray = Array.from(clientVecTransmit1to2[0].mul_transmit.u);
    clientVecTransmit1to2[0].mul_transmit.u = uArray;

    const serverPhase1 = await this.sdk
      .fetchWithProgressiveBackoff(`/dkls23/sign/phase-1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sign_id: signData.sign_id,
          wallet_id: walletId,
          account_id: accountId,
          is_for_imported_account: isForImportedAccount,
          child_number: shareBeingDerivedIndex,
          message: signData.message_hash,
          client_vec_transmit_1_to_2: clientVecTransmit1to2,
        }),
      })
      .then((res) => res.json());

    return serverPhase1;
  }

  private phase2(
    party: Keyshare,
    signData: SignData,
    uniqueKeep1to2: UniqueKeep1to2,
    hashmapKeep1to2: Map<number, SingleOfHashmapKeep1to2>,
    serverVecTransmit1to2: SingleVecTransmit1to2[],
  ) {
    const result = sign_phase2(
      party,
      signData,
      uniqueKeep1to2,
      hashmapKeep1to2,
      serverVecTransmit1to2,
    );

    return result.Ok;
  }

  private async communicationPhase2(
    signData: SignData,
    clientVecTransmit2to3: SingleVecTransmit2to3[],
    walletId: string,
    shareBeingDerivedIndex: number,
    accountId?: string,
    isForImportedAccount?: boolean,
  ) {
    const serverPhase2 = await this.sdk
      .fetchWithProgressiveBackoff(`/dkls23/sign/phase-2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sign_id: signData.sign_id,
          wallet_id: walletId,
          account_id: accountId,
          is_for_imported_account: isForImportedAccount,
          child_number: shareBeingDerivedIndex,
          client_vec_transmit_2_to_3: clientVecTransmit2to3,
        }),
      })
      .then((res) => res.json());

    return serverPhase2;
  }

  private phase3(
    party: Keyshare,
    signData: SignData,
    uniqueKeep2to3: UniqueKeep2to3,
    hashmapKeep2to3: Map<number, SingleOfHashmapKeep2to3>,
    serverVecTransmit2to3: SingleVecTransmit2to3[],
  ) {
    const result = sign_phase3(
      party,
      signData,
      uniqueKeep2to3,
      hashmapKeep2to3,
      serverVecTransmit2to3,
    );

    return result.Ok;
  }

  private async communicationPhase3(
    signData: SignData,
    clientBroadcast3to4: Broadcast3to4,
    walletId: string,
    shareBeingDerivedIndex: number,
    accountId?: string,
    isForImportedAccount?: boolean,
  ) {
    const result = await this.sdk
      .fetchWithProgressiveBackoff(`/dkls23/sign/phase-3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sign_id: signData.sign_id,
          wallet_id: walletId,
          account_id: accountId,
          is_for_imported_account: isForImportedAccount,
          child_number: shareBeingDerivedIndex,
          client_broadcast_3_to_4: clientBroadcast3to4,
        }),
      })
      .then((res) => res.json());

    return result;
  }

  private phase4(
    party: Keyshare,
    signData: SignData,
    xCoord: string,
    clientBroadcast3to4: Broadcast3to4,
    serverBroadcast3to4: Broadcast3to4,
  ) {
    const result = sign_phase4(
      party,
      signData,
      xCoord,
      [clientBroadcast3to4, serverBroadcast3to4],
      true,
    );

    return result.Ok;
  }

  private async communicationPhase4(
    signData: SignData,
    walletId: string,
    shareBeingDerivedIndex: number,
    accountId?: string,
    isForImportedAccount?: boolean,
  ) {
    const result = await this.sdk.fetchWithProgressiveBackoff(`/dkls23/sign/phase-4`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sign_id: signData.sign_id,
        wallet_id: walletId,
        account_id: accountId,
        is_for_imported_account: isForImportedAccount,
        child_number: shareBeingDerivedIndex,
      }),
    });

    return result;
  }
}
