---
'@alore/auth-react-ui': minor
'@alore/auth-react-sdk': minor
---

Remove the NFT forge-claim flow

The flow called Alore routes that no longer exist: `/forges/{id}`, `/auth/v1/email-eligibility-verification` and `/auth/v1/eligible-email-code-verification` went with Alore's web3 module (owner decision 2026-11-18). Removed:

- **SDK:** the `fetchForgeData`, `verifyEmailEligibility` and `verifyClaimNftEmail2fa` services, the `ForgeData` type, `forgeData` in the machine context, and the unused `isForgeClaim` payload field.
- **UI:**
  - the `forgeId` prop on `Auth`, `Login`, `Register` and `ForgotPassword`;
  - the event headers and the Metamask/WalletConnect button shown with it;
  - the machine's `web3Connector` region and `login.fetchingForgeData`;
  - the dictionary keys `web3Connector`, `poweredBy`, `login.forgeLogin`, `login.metamaskWalletConnect` and `register.forgeTitle`.

`INITIALIZE` now always enters the login screen. Apps that never passed `forgeId` (Joori) see no change.
