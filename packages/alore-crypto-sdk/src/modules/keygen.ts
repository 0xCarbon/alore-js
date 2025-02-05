/* eslint-disable class-methods-use-this */
import init, {
  phase1_wasm_binding,
  phase2_wasm_binding,
  phase3_wasm_binding,
  phase4_wasm_binding,
  re_key_wasm_binding,
} from '@0xcarbon/dkls23-wasm';

import { AloreCrypto } from '../core/AloreCrypto';
import {
  BroadcastDerive2to4,
  BroadcastDerive3to4,
  generateUUID,
  KeepDerive2to3,
  KeepZeroShare2to3,
  Keyshare,
  ProofCommitment,
  SessionData,
  SingleMulKept,
  SingleTransmitMul3to4,
  SingleTransmitZeroShare2to4,
  SingleTransmitZeroShare3to4,
} from '../utils';

export class KeygenModule {
  // eslint-disable-next-line no-useless-constructor, no-unused-vars, no-empty-function
  constructor(protected sdk: AloreCrypto) {}

  /**
   * Generates a new key share for the specified DKG ID.
   *
   * This method performs the full key generation process, including the following steps:
   * 1. Initializes the WASM bindings for the key generation operations.
   * 2. Generates a new session ID and session data.
   * 3. Executes phase 1 of the key generation protocol, generating a polynomial fragment to keep and a polynomial fragment to send.
   * 4. Communicates the sent polynomial fragment to the server and receives the server's polynomial fragment.
   * 5. Executes phase 2 of the key generation protocol, generating the final key share components.
   * 6. Communicates the necessary components to the server and receives the server's responses.
   * 7. Executes phase 3 of the key generation protocol, generating the final key share.
   * 8. Communicates the necessary components to the server and receives the server's responses.
   * 9. Executes phase 4 of the key generation protocol, finalizing the key share.
   * 10. Communicates the final key share to the server and returns the generated key share.
   *
   * @param dkgId - The ID of the Distributed Key Generation (DKG) process.
   * @returns The generated key share.
   */
  public async generateKeyshare(dkgId: string) {
    await init();
    const sessionId = generateUUID();
    const sessionData = {
      parameters: {
        threshold: 2,
        share_count: 2,
      },
      party_index: 1,
      session_id: Array.from(sessionId),
    };

    const clientPhase1: Array<BigInt> = await this.phase1(sessionData);
    const polyFragToKeep = clientPhase1[0];
    const polyFragToSend = clientPhase1[1];

    const serverPolyFrag = await this.communicationPhase1(sessionData, polyFragToSend);

    const {
      polyPoint,
      proofCommitment,
      keepZeroShare2to3,
      transmitZeroShare2to4,
      keepDerive2to3,
      broadcastDerive2to4,
    } = await this.phase2(sessionData, [polyFragToKeep, serverPolyFrag]);

    const { serverCommitment, serverBroadcastDerive2to4, serverTransmitZeroShare2to4 } =
      await this.communicationPhase2(
        sessionData,
        proofCommitment.commitment,
        transmitZeroShare2to4,
        broadcastDerive2to4,
      );

    const {
      keepZeroShare3to4,
      transmitZeroShare3to4,
      keepMul3to4,
      transmitMul3to4,
      broadcastDerive3to4,
    } = await this.phase3(sessionData, keepZeroShare2to3, keepDerive2to3);

    const {
      serverTransmitZeroShare3to4,
      serverTransmitMul3to4,
      serverBroadcastDerive3to4,
      serverProofCommitment,
    } = await this.communicationPhase3(
      sessionData,
      transmitZeroShare3to4,
      transmitMul3to4,
      broadcastDerive3to4,
      proofCommitment,
    );

    const serveProofCommitmentWithOldCommitment = serverProofCommitment;
    serveProofCommitmentWithOldCommitment.commitment = serverCommitment;

    const proofsCommitments = [proofCommitment, serveProofCommitmentWithOldCommitment];
    const partiesDerive2to4: Map<number, BroadcastDerive2to4> = new Map();
    partiesDerive2to4.set(1, broadcastDerive2to4);
    partiesDerive2to4.set(2, serverBroadcastDerive2to4);

    const partiesDerive3to4 = new Map();
    partiesDerive3to4.set(1, broadcastDerive3to4);
    partiesDerive3to4.set(2, serverBroadcastDerive3to4);

    const clientPhase4 = await this.phase4(
      sessionData,
      polyPoint,
      proofsCommitments,
      keepZeroShare3to4,
      serverTransmitZeroShare2to4,
      serverTransmitZeroShare3to4,
      keepMul3to4,
      serverTransmitMul3to4,
      partiesDerive2to4,
      partiesDerive3to4,
    );

    if (clientPhase4.index) {
      throw new Error(clientPhase4.description);
    }

    const serverFinalResponse = await this.communicationPhase4(sessionData, dkgId);

    if (!serverFinalResponse.ok) {
      throw new Error(`Server communication phase 4 failed: ${serverFinalResponse.toString()}`);
    }

    return clientPhase4[Object.keys(clientPhase4)[0]] as Keyshare;
  }

  public rekey(privateKey: string) {
    const sessionId = Array.from(generateUUID());
    const sessionData = {
      threshold: 2,
      share_count: 2,
    };
    const result = re_key_wasm_binding(sessionData, sessionId, privateKey.slice(-64));
    return result;
  }

  private phase1(sessionData: SessionData) {
    const result = phase1_wasm_binding(sessionData);

    return result;
  }

  private async communicationPhase1(sessionData: SessionData, polyFragToSend: BigInt) {
    const serverPolyFrag = await this.sdk
      .fetchWithProgressiveBackoff(`/dkls23/keygen/phase-1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          poly_fragment: polyFragToSend,
        }),
      })
      .then((res) => res.json());

    return serverPolyFrag;
  }

  private phase2(sessionData: SessionData, polyFragments: Array<BigInt>) {
    const clientPhase2 = phase2_wasm_binding(sessionData, polyFragments);

    const polyPoint = clientPhase2[0];
    const proofCommitment = clientPhase2[1];
    const keepZeroShare2to3 = clientPhase2[2];
    const transmitZeroShare2to4 = clientPhase2[3];
    const keepDerive2to3 = clientPhase2[4];
    const broadcastDerive2to4 = clientPhase2[5];

    return {
      polyPoint,
      proofCommitment,
      keepZeroShare2to3,
      transmitZeroShare2to4,
      keepDerive2to3,
      broadcastDerive2to4,
    };
  }

  private async communicationPhase2(
    sessionData: SessionData,
    commitment: number[],
    transmitZeroShare2to4: SingleTransmitZeroShare2to4[],
    broadcastDerive2to4: BroadcastDerive2to4,
  ) {
    const phase2Response = await this.sdk
      .fetchWithProgressiveBackoff(`/dkls23/keygen/phase-2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: Array.from(sessionData.session_id),
          client_commitment: commitment,
          client_transmited_zero_share_2_to_4: transmitZeroShare2to4,
          client_transmited_derive_2_to_4: broadcastDerive2to4,
        }),
      })
      .then((res) => res.json());

    const { serverCommitment, serverTransmitZeroShare2to4, serverBroadcastDerive2to4 } =
      phase2Response;

    if (!serverCommitment) {
      throw new Error('Server did not send commitment');
    }

    return {
      serverCommitment,
      serverTransmitZeroShare2to4,
      serverBroadcastDerive2to4,
    };
  }

  private phase3(
    sessionData: SessionData,
    zeroKept: Map<number, KeepZeroShare2to3>,
    bipKept: KeepDerive2to3,
  ) {
    const result = phase3_wasm_binding(sessionData, zeroKept, bipKept);

    const keepZeroShare3to4 = result[0];
    const transmitZeroShare3to4 = result[1];
    const keepMul3to4 = result[2];
    const transmitMul3to4 = result[3];
    const broadcastDerive3to4 = result[4];

    return {
      keepZeroShare3to4,
      transmitZeroShare3to4,
      keepMul3to4,
      transmitMul3to4,
      broadcastDerive3to4,
    };
  }

  private async communicationPhase3(
    sessionData: SessionData,
    transmitZeroShare3to4: SingleTransmitZeroShare3to4[],
    transmitMul3to4: SingleTransmitMul3to4[],
    broadcastDerive3to4: BroadcastDerive3to4,
    proofCommitment: ProofCommitment,
  ) {
    const phase3Response = await this.sdk
      .fetchWithProgressiveBackoff(`/dkls23/keygen/phase-3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          client_transmited_zero_share_3_to_4: transmitZeroShare3to4,
          client_transmited_mul_3_to_4: transmitMul3to4,
          client_transmited_derive_3_to_4: broadcastDerive3to4,
          client_proof_commitment: proofCommitment,
        }),
      })
      .then((res) => res.json());

    const {
      serverProofCommitment,
      serverTransmitZeroShare3to4,
      serverTransmitMul3to4,
      serverBroadcastDerive3to4,
    } = phase3Response;

    return {
      serverProofCommitment,
      serverTransmitZeroShare3to4,
      serverTransmitMul3to4,
      serverBroadcastDerive3to4,
    };
  }

  private phase4(
    sessionData: SessionData,
    polyPoint: string,
    proofsCommitments: ProofCommitment[],
    zeroKept3: Map<number, { seed: number[] }>,
    zeroReceived2: SingleTransmitZeroShare2to4[],
    zeroReceived3: SingleTransmitZeroShare3to4[],
    mulKept: Map<number, SingleMulKept>,
    mulReceived: SingleTransmitMul3to4[],
    bipReceived2: Map<number, BroadcastDerive2to4>,
    bipReceived3: Map<number, BroadcastDerive3to4>,
  ) {
    const result = phase4_wasm_binding(
      sessionData,
      polyPoint,
      proofsCommitments,
      zeroKept3,
      zeroReceived2,
      zeroReceived3,
      mulKept,
      mulReceived,
      bipReceived2,
      bipReceived3,
    );

    return result;
  }

  private async communicationPhase4(sessionData: SessionData, dkgId?: string) {
    const phase4Response = await this.sdk.fetchWithProgressiveBackoff(`/dkls23/keygen/phase-4`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionData.session_id,
        dkg_id: dkgId,
      }),
    });

    if (phase4Response.status !== 201) {
      throw new Error('Phase 4 failed');
    }

    return phase4Response;
  }
}
