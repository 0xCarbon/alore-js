import { StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";

export const stepStyles = {
  emailStep: StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignContent: "center",
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
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: Colors.gray[900],
    },
    googleButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 20,
      marginTop: 30,
      borderColor: Colors.gray[900],
      borderWidth: 1,
    },
    nextButton: {
      backgroundColor: "#E64848",
      height: 48,
      paddingHorizontal: 20,
    },
    nextButtonLabel: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
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
      flex: 1,
      justifyContent: "center",
      alignContent: "center",
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
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: Colors.gray[900],
    },
    backButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 0,
      marginRight: "auto",
    },
    backButtonLabel: {
      color: Colors.gray[900],
      fontSize: 16,
      fontWeight: "600",
    },
    googleButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 20,
      marginTop: 30,
      borderColor: Colors.gray[900],
      borderWidth: 1,
    },
    nextButton: {
      backgroundColor: "#E64848",
      height: 48,
      paddingHorizontal: 20,
    },
    nextButtonLabel: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
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
      flex: 1,
      justifyContent: "center",
      alignContent: "center",
    },
    card: {
      width: "100%",
      backgroundColor: "transparent",
      borderWidth: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    cardContainer: {
      marginLeft: 30,
      marginRight: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: Colors.gray[900],
    },
    backButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 0,
      marginRight: "auto",
      marginTop: 20,
    },
    backButtonLabel: {
      color: Colors.gray[900],
      fontSize: 16,
      fontWeight: "600",
    },
    finishButton: {
      backgroundColor: "#E64848",
      height: 48,
      marginHorizontal: "auto",
      marginTop: 30,
      width: "100%",
    },
    finishButtonLabel: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  }),
  verifyEmailStep: StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
    },
    cardContainer: {
      marginLeft: 30,
      marginRight: 30,
    },
    backButton: {
      backgroundColor: "transparent",
      height: 48,
      paddingHorizontal: 0,
      marginRight: "auto",
      marginBottom: 20,
    },
    backButtonLabel: {
      color: Colors.gray[900],
      fontSize: 16,
      fontWeight: "600",
    },
    title: {
      marginBottom: 20,
      fontSize: 28,
      fontWeight: "bold",
      color: Colors.gray[900],
    },
    subtitle: {
      fontSize: 16,
      color: Colors.gray[900],
    },
    inputContainer: {
      marginBottom: 24,
    },
    submitButton: {
      marginBottom: 24,
      backgroundColor: Colors.red[600],
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
  }),
};
