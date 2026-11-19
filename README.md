<a name="readme-top"></a>

<br />
<div align="start">
<img src="https://storage.googleapis.com/alore_assets/auth-react-native-banner.png" alt="Alore Logo"/>

## Alore SDKS

A React Login as a Service for Alore + all crypto functions you'll need

<div align="start">
  <h2>Links:</h2>
  <ul>
    <li><a href="https://github.com/0xCarbon/alore-js/tree/main/example">Docs (coming soon)</strong></a></li>
    <li><a href="https://github.com/0xCarbon/alore-js/tree/main/example">Example</a></li>
  </ul>
</div>

## About The Project

This repo holds the two packages you need to use Alore's Login as a Service:

- <a href="https://github.com/0xCarbon/alore-js/tree/main/packages/alore-auth-ui">alore-auth-ui</a>
- <a href="https://github.com/0xCarbon/alore-js/tree/main/packages/alore-auth-sdk">alore-auth-sdk</a>

`alore-auth-react-ui` is our React component that you can easily call in you application. This is all you need to have a functional authentication that works simple as Web2 but with the power of Web3.

`alore-auth-react-sdk` is the package that will help you to authenticate your users. Don't worry, you just plug it to alore-auth-ui and that's all you need to do.

## Getting Started

Heres how to start using Alore Login as a Service:

```sh
npm install @alore/auth-react-ui @alore/auth-react-sdk
```

### Installation

1. Get a free API Key at [https://alpha.bealore.com](https://alpha.bealore.com)

2. Install Alore packages (please check section above)

3. Call our Auth component

   ```js
   import { generateSecureHash, hashUserInfo } from '@alore/auth-react-sdk';
   import Auth, { useAuthService } from '@alore/auth-react-ui';

   export default function AuthComponent() {
     const [state, actor] = useAuthService();

     console.log(state, actor);

     return (
       <Auth
         locale="pt"
         googleId={process.env.NEXT_PUBLIC_GOOGLE_ID || ''}
         cryptoUtils={{ hashUserInfo, generateSecureHash }}
         onSuccess={(user) => {
           console.log('User logged in:', user);
         }}
       />
     );
   }
   ```

4. Call our Login component wrapped in our provider

   ```js
   'use client';

   import { AuthProvider } from '@alore/auth-react-ui';

   import AuthComponent from '@/components/AuthComponent';
   import { aloreAuth } from '@/config/authInstance';

   export default function Home() {
     return (
       <main>
         <AuthProvider machineServices={aloreAuth.services}>
           <AuthComponent />
         </AuthProvider>
       </main>
     );
   }
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>
