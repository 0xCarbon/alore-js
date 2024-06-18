import { StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";

export const stepStyles = {
  common: StyleSheet.create({
    stepTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: Colors.gray[900],
    },
    inputContainer: {
      backgroundColor: "transparent",
      paddingBottom: 12,
      flexDirection: "row",
      width: "100%",
      alignItems: "center",
      borderBottomWidth: 1,
    },
    inputIconContainer: {
      paddingHorizontal: 10,
    },
    inputIcon: {
      color: "rgb(107 114 128)",
    },
    inputField: {
      color: "white",
      fontSize: 16,
      fontWeight: "400",
    },
    inputFieldPlaceholderColor: {
      color: "rgb(107 114 128)",
    },
    inputErrorMessage: {
      marginTop: 12,
      marginLeft: 4,
      color: Colors.red[500],
    },
    nextButton: {
      backgroundColor: "#E64848",
      height: 48,
      paddingHorizontal: 20,
    },
    nextButtonLabel: {
      color: "#fff",
      fontFamily: "Inter-SemiBold",
      fontSize: 16,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 20,
    },
    backButtonLabel: {
      color: "black",
    },
    backButtonIcon: {
      height: 16,
      width: 16,
      color: "black",
    },
  }),
  initialStep: StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
      alignContent: "center",
    },
    card: {
      paddingVertical: 40,
      minHeight: 100,
      width: "100%",
    },
    cardContainer: {
      gap: 16,
      marginLeft: 24,
      marginRight: 24,
    },
    text: {
      textAlign: "center",
      fontWeight: "600",
      fontSize: 16,
      lineHeight: 24,
      color: Colors.gray[900],
      marginTop: 4,
    },
    createAccountButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 20,
      borderColor: Colors.gray[900],
      borderWidth: 1,
    },
    createAccountButtonLabel: {
      color: Colors.gray[900],
      fontSize: 16,
      fontFamily: "Inter-SemiBold",
    },
  }),
  emailStep: StyleSheet.create({
    container: {
      justifyContent: "center",
      alignContent: "center",
      width: "100%",
    },
    card: {
      width: "100%",
      backgroundColor: "transparent",
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    cardContainer: {
      gap: 20,
      marginLeft: 30,
      marginRight: 30,
    },
    googleButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 20,
      marginTop: 30,
      borderColor: Colors.gray[900],
      borderWidth: 1,
    },
    createAccountButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 20,
      borderColor: Colors.gray[900],
      borderWidth: 1,
    },
    createAccountButtonLabel: {
      color: Colors.gray[900],
      fontSize: 16,
      fontWeight: "600",
    },
  }),
  passwordStep: StyleSheet.create({
    container: {
      justifyContent: "center",
      alignContent: "center",
      width: "100%",
    },
    card: {
      width: "100%",
      backgroundColor: "transparent",
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    cardContainer: {
      gap: 20,
      marginLeft: 30,
      marginRight: 30,
    },
    googleButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 20,
      marginTop: 30,
      borderColor: Colors.gray[900],
      borderWidth: 1,
    },
    createAccountButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 20,
      borderColor: Colors.gray[900],
      borderWidth: 1,
    },
    createAccountButtonLabel: {
      color: Colors.gray[900],
      fontSize: 16,
      fontWeight: "600",
    },
  }),
  usernameStep: StyleSheet.create({
    container: {
      justifyContent: "center",
      alignContent: "center",
      width: "100%",
    },
    card: {
      width: "100%",
      backgroundColor: "transparent",
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    cardContainer: {
      gap: 20,
      marginLeft: 30,
      marginRight: 30,
    },
  }),
  verifyEmailStep: StyleSheet.create({
    container: {
      justifyContent: "center",
      alignContent: "center",
      width: "100%",
    },
    cardContainer: {
      marginLeft: 30,
      marginRight: 30,
    },
    subtitle: {
      marginTop: 8,
      marginBottom: 12,
      fontSize: 16,
      color: Colors.gray[900],
    },
    inputContainer: {
      marginBottom: 24,
    },
    spinner: {
      marginRight: 10,
    },
    resendText: {
      fontSize: 16,
      fontWeight: "500",
    },
    disabledText: {
      opacity: 0.5,
    },
    enabledText: {
      opacity: 1,
      color: Colors.red[600],
    },
    resendEmailButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 20,
      marginTop: 20,
    },
    resendEmailButtonLabel: {
      color: Colors.gray[900],
      fontSize: 16,
      fontWeight: "600",
    },
  }),
};
