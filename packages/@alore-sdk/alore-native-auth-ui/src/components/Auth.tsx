import LoginSteps from "./Steps/LoginSteps";
import { useActor } from "@xstate/react";
import React, { useEffect } from "react";
import InitialStep from "./Steps/InitialStep";
import { SessionUser } from "../machine/types";
import RegistrationSteps from "./Steps/RegistrationSteps";
import useAuthServiceInstance from "../hooks/useAuthServiceInstance";
import { stepStyles } from "./Steps/styles";

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};



export interface AuthProps {
  styles?: RecursivePartial<typeof stepStyles>;
  onSuccess?: (sessionUser: SessionUser) => void;
  cryptoUtils: {
    hashUserInfo: (userInfo: string) => string;
    generateSecureHash: (
      data: string,
      salt: string,
      keyDerivationFunction: "argon2d" | "pbkdf2",
    ) => Promise<string>;
  };
}

const Auth = ({ styles, onSuccess, cryptoUtils }: AuthProps) => {
  const authServiceInstance = useAuthServiceInstance();
  const [authState, sendAuth] = useActor(authServiceInstance);
  const { sessionUser } = authState.context;

  useEffect(() => {
    sendAuth([{ type: "INITIALIZE" }]);

    return () => {
      sendAuth("RESET");
    };
  }, []);

  useEffect(() => {
    if (
      (authState.matches("active.login.successfulLogin") ||
        authState.matches("active.register.userCreated")) &&
      sessionUser
    ) {
      onSuccess?.(sessionUser);
    }
  }, [sessionUser]);

  return (
    <>
      {authState.matches("active.initial") && <InitialStep styles={styles?.["initialStep"]} />}
      {authState.matches("active.register") && (
        <RegistrationSteps styles={styles} cryptoUtils={cryptoUtils} />
      )}
      {authState.matches("active.login") && (
        <LoginSteps styles={styles} cryptoUtils={cryptoUtils} />
      )}
    </>
  );
};

export default Auth;
