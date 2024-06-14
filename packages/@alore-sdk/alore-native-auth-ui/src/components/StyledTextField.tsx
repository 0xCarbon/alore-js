import { Colors } from '../constants/Colors';
import { StyleSheet } from 'react-native';
import { TextField, TextFieldProps, View } from 'react-native-ui-lib';

interface StyledTextField {
  icon?: React.ReactNode;
  styles?: Partial<typeof defaultStyles>;
}

const defaultStyles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[900],
  },
  iconContainer: {
    paddingHorizontal: 10,
  },
  textFieldContainer: { flexGrow: 1, flex: 1 },
  textField: {
    color: Colors.gray[900],
    fontSize: 16,
    fontWeight: '400',
  },
});

const StyledTextField = ({
  icon,
  styles,
  ...props
}: StyledTextField & TextFieldProps) => {
  const mergedStyles = StyleSheet.flatten([defaultStyles, styles || {}]);

  return (
    <View style={mergedStyles.container}>
      <View style={mergedStyles.iconContainer}>
        {icon && <View>{icon}</View>}
      </View>
      <View style={mergedStyles.textFieldContainer}>
        <TextField {...props} style={mergedStyles.textField} />
      </View>
    </View>
  );
};

export default StyledTextField;