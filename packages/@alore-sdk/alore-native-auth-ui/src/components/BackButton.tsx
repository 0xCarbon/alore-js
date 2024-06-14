import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { ArrowLeftCircleIcon } from "react-native-heroicons/solid";
import { Colors } from "react-native-ui-lib";

interface Props {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

const BackButton = ({
  onClick,
  disabled = false,
  label = "Voltar",
  ...props
}: Props) => (
  <TouchableOpacity
    {...props}
    onPress={!disabled ? onClick : undefined}
    style={[styles.button]}
    disabled={disabled}
  >
    <ArrowLeftCircleIcon style={styles.icon} />
    <Text style={[styles.label]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
  },
  label: {
    color: "black",
  },
  icon: {
    height: 16,
    width: 16,
    color: Colors.grey10,
  },
});

export default BackButton;
