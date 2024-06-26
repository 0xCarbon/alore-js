<a name="readme-top"></a>

<br />
<div align="center">
  <h3 align="center">Alore JS SDKs</h3>

  <p align="center">
    A React Login as a Service for Alore + all crypto functions you'll need
    <br />
    <a href="https://github.com/0xCarbon/alore-js/tree/main/example"><strong>Docs(coming soon!)</strong></a>
    <br />
    <br />
    <a href="https://github.com/0xCarbon/alore-js/tree/main/example">See an example</a>
    <br />
  </p>
</div>

## About The Project

This repo is a package of three main packages that will empower you to build with alore. All you need to use our Login as a Service you find here. Other crypto functions that aren't used in authentication but you might need can be found here too.

So, the packages are:

- <a href="https://github.com/0xCarbon/alore-js/tree/main/alore-auth-ui">alore-auth-ui</a>
- <a href="https://github.com/0xCarbon/alore-js/tree/main/alore-auth-sdk">alore-auth-sdk</a>
- <a href="https://github.com/0xCarbon/alore-js/tree/main/alore-crypto-sdk">alore-crypto-sdk</a>

`alore-auth-ui` is our React component that you can easily call in you application. This is all you need to have a functional authentication that works simple as Web2 but with the power of Web3.

`alore-auth-sdk` is the package that will help you to authenticate your users. Don't worry, you just plug it to alore-auth-ui and that's all you need to do.

`alore-crypto-sdk` groups some helper functions that aren't necessarily to authentication but you might need to use in your application. If you'll use only Web2 features, like authentication, you can ignore it. If you want to use Alore Web3 features, like create an Alore wallet for you user, you'll need to call functions found in `alore-crypto-sdk`. These functions are simple and ready to use, so you don't need to deal with some complexity from the protocol implementation.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

Heres how to start using Alore Login as a Service:

- To use all Alore features:

  ```sh
  npm install @0xcarbon/alore-auth-ui &&
  npm install @0xcarbon/alore-auth-sdk &&
  npm install @0xcarbon/alore-crypto-sdk &&
  npm install @0xcarbon/dkls23-wasm
  ```

- If you only want authentication and nothing else from Alore API:
  ```sh
  npm install @0xcarbon/alore-auth-ui &&
  npm install @0xcarbon/alore-auth-sdk &&
  ```

DISCLAIMER: package @0xcarbon/dkls23-wasm is not described in this repo but needed to use some crypto functions for specific Alore features.

### Installation

1. Get a free API Key at [https://alpha.bealore.com](https://alpha.bealore.com)

2. Install Alore packages (please check section above)

3. Call our Auth component

   ```js
   import Auth, { useAuthService } from "@0xcarbon/alore-auth-ui";
   import { useContext } from "react";
   import { KeyshareWorkerContext } from "./KeyshareWorker";
   import { hashUserInfo, generateSecureHash } from "@0xcarbon/alore-auth-sdk";

   export default function AuthComponent() {
     const keyshareWorker: null | Worker = useContext(KeyshareWorkerContext);
     const [state, actor] = useAuthService();

     console.log(state, actor);

     return (
       <Auth
         locale="pt"
         googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ""}
         cryptoUtils={{ hashUserInfo, generateSecureHash }}
         keyshareWorker={keyshareWorker}
         onSuccess={(user) => {
           console.log("User logged in:", user);
         }}
       />
     );
   }
   ```

4. Call our Login component wrapped in our Providers (Keyshare worker and the complete implementation you can find at [https://beta.bealore.com](https://beta.bealore.com))

   ```js
   "use client";

   import { aloreAuth } from "@/config/authInstance";
   import KeyshareWorkerProvider from "../components/KeyshareWorker";
   import { AuthProvider } from "@0xcarbon/alore-auth-ui";

   import AuthComponent from "@/components/AuthComponent";

   export default function Home() {
     return (
       <main>
         <KeyshareWorkerProvider>
           <AuthProvider machineServices={aloreAuth.services}>
             <AuthComponent />
           </AuthProvider>
         </KeyshareWorkerProvider>
       </main>
     );
   }
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>
