import { Text, TextField, TextFieldProps, View } from "react-native-ui-lib";
import { stepStyles } from "./Steps/styles";
import { RecursivePartial } from "../types";

interface StyledTextField {
  Icon?: React.ComponentType<{ color?: string; size?: number; style?: any }>;
  styles?: RecursivePartial<typeof stepStyles>;
  errorMessage?: string;
}

const StyledTextField = ({
  Icon,
  styles,
  errorMessage,
  ...props
}: StyledTextField & TextFieldProps) => {
  return (
    <View style={styles?.common?.inputContainer}>
      {Icon && (
        <View style={styles?.common?.inputIconContainer}>
          <Icon style={styles?.common?.inputIcon} size={16} />
        </View>
      )}
      <TextField
        {...props}
        style={styles?.common?.inputField}
        labelStyle={styles?.common?.inputField}
        placeholderTextColor={styles?.common?.inputFieldPlaceholderColor?.color}
      />
      {errorMessage && (
        <Text style={styles?.common?.inputErrorMessage}>{errorMessage}</Text>
      )}
    </View>
  );
};

export default StyledTextField;
