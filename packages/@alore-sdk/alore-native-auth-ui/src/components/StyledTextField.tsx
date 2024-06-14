import { Colors } from "../constants/Colors";
import { StyleSheet } from "react-native";
import { TextField, TextFieldProps, View } from "react-native-ui-lib";

interface StyledTextField {
  icon?: React.ReactNode;
  styles?: Partial<typeof defaultStyles>;
}

const StyledTextField = ({
  icon,
  styles,
  ...props
}: StyledTextField & TextFieldProps) => {
  const mergedStyles = StyleSheet.flatten([defaultStyles, styles || {}]);

  return (
    <View style={mergedStyles.container}>
      {icon && (
        <View style={mergedStyles.iconContainer}>
          <View>{icon}</View>
        </View>
      )}
      <View style={mergedStyles.textFieldContainer}>
        <TextField {...props} style={mergedStyles.textField} />
      </View>
    </View>
  );
};

const defaultStyles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    paddingBottom: 12,
    borderRadius: 8,
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  iconContainer: {
    paddingHorizontal: 10,
  },
  textFieldContainer: { flexGrow: 1, flex: 1 },
  textField: {
    color: Colors.gray[900],
    fontSize: 16,
    fontWeight: "400",
  },
});

export default StyledTextField;
