import LoginSteps from "./Steps/LoginSteps";
import { useActor } from "@xstate/react";
import React, { useEffect } from "react";
import InitialStep from "./Steps/InitialStep";
import { SessionUser } from "../machine/types";
import RegistrationSteps from "./Steps/RegistrationSteps";
import useAuthServiceInstance from "../hooks/useAuthServiceInstance";
import { stepStyles } from "./Steps/styles";
import { RecursivePartial } from "../types";
import { mergeStyles } from "../helpers";

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

  const mergedStyles = mergeStyles(stepStyles, styles || {});

  return (
    <>
      {authState.matches("active.initial") && (
        <InitialStep styles={mergedStyles} />
      )}
      {authState.matches("active.register") && (
        <RegistrationSteps styles={mergedStyles} cryptoUtils={cryptoUtils} />
      )}
      {authState.matches("active.login") && (
        <LoginSteps styles={mergedStyles} cryptoUtils={cryptoUtils} />
      )}
    </>
  );
};

export default Auth;
