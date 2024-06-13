import './shim';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import crypto from 'crypto';
import { registerRootComponent } from 'expo';
import argon2 from 'react-native-argon2';
import { useEffect } from 'react';
import {
  AloreCrypto,
  deriveAccountKeyshareFromWalletKeyshare,
  Keyshare,
} from './src';
import {
  AeadId,
  CipherSuite,
  KdfId,
  KemId,
} from './node_modules/hpke-js/esm/mod';
import { DhkemP256HkdfSha256 } from './node_modules/hpke-js/esm/src/kems/dhkemP256';

async function encryptServerKeyshare(keyshare: string) {
  const keyshareStringBuffer = new TextEncoder().encode(keyshare);
  const kem = new DhkemP256HkdfSha256();
  const suite = new CipherSuite({
    kem,
    kdf: KdfId.HkdfSha256,
    aead: AeadId.Aes256Gcm,
  });

  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);

  // const recipientPublicKey = await kem.importKey('raw', salt, true);

  // console.log(recipientPublicKey);

  const recipientPublicKey = await crypto.subtle.importKey(
    'raw',
    salt,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );

  console.log(recipientPublicKey);

  const clientHpkeSenderContext = await suite.createSenderContext({
    recipientPublicKey,
    info: new Uint8Array([0]),
  });

  console.log(clientHpkeSenderContext);

  // const ciphertext = await clientHpkeSenderContext.seal(
  //   keyshareStringBuffer,
  //   new Uint8Array([0])
  // );

  // console.log(clientHpkeSenderContext.enc);
  // console.log(ciphertext);

  // return { enc: clientHpkeSenderContext.enc, ciphertext };
}

function App() {
  useEffect(() => {
    const fetch = async () => {
      const a = await encryptServerKeyshare(
        'dasjdikhasijo aiosudhoai qoiuhnv  iojuaml,vouiju1  1 23lk1kl vpw[123 1johjdoij sd;lkc -90ji@ ASDs sazsodjn12938er1W$'
      );
    };

    const b = fetch();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style='auto' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default registerRootComponent(App);
