import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { ArrowLeftCircleIcon } from "react-native-heroicons/solid";
import { stepStyles } from "./Steps/styles";
import { RecursivePartial } from "../types";

interface Props {
  onClick: () => void;
  styles?: RecursivePartial<typeof stepStyles>;
  disabled?: boolean;
  label?: string;
}

const BackButton = ({
  onClick,
  styles,
  disabled = false,
  label = "Voltar",
  ...props
}: Props) => (
  <TouchableOpacity
    {...props}
    onPress={!disabled ? onClick : undefined}
    style={styles?.common?.backButton}
    disabled={disabled}
  >
    <ArrowLeftCircleIcon style={styles?.common?.backButtonIcon} />
    <Text style={styles?.common?.backButtonLabel}>{label}</Text>
  </TouchableOpacity>
);

export default BackButton;
