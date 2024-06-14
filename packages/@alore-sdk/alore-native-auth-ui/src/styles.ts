import { TextFieldProps, ThemeManager } from "react-native-ui-lib";

ThemeManager.setComponentTheme("TextField", (props: TextFieldProps) => {
  return {
    placeholderTextColor: "#9ca3af",
    labelStyle: {
      alignSelf: "stretch",
      fontSize: 14,
      lineHeight: 21,
      fontFamily: "Inter-Medium",
      color: "black",
      textAlign: "left",
    },
    style: {
      fontSize: 20,
      alignSelf: "stretch",
      borderStyle: "solid",
      color: props.editable === false ? "#9ca3af" : "black",
      borderColor: props.editable === false ? "#9ca3af" : "#979ca5",
      borderBottomWidth: 1,
      width: "100%",
      height: 52,
    },
  };
});
