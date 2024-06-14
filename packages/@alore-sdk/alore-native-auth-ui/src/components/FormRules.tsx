import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FieldValues } from "react-hook-form";
import useDictionary from "../hooks/useDictionary";
import { Locale } from "../helpers/get-dictionary";
import { CheckIcon, XMarkIcon } from "react-native-heroicons/solid";
import { passwordRules, ruleValidation } from "../helpers";

interface FormRulesProps {
  locale: Locale;
  passwordValues: FieldValues;
  userValues?: { email: string; nickname: string };
  className?: string;
}

const FormRules = ({ locale, passwordValues, userValues }: FormRulesProps) => {
  const dictionary = useDictionary(locale);

  return (
    <View style={[styles.container]}>
      {passwordRules.map((rule) => (
        <View key={rule.name} style={styles.ruleContainer}>
          {ruleValidation(rule, passwordValues, userValues) ? (
            <CheckIcon style={styles.icon} />
          ) : (
            <XMarkIcon style={styles.icon} />
          )}
          <Text style={styles.ruleText}>
            {
              dictionary?.passwordRules[
                rule.key as keyof (typeof dictionary)["passwordRules"]
              ]
            }
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    flexDirection: "column",
    gap: 8,
  },
  ruleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    height: 12,
    width: 12,
    color: "#10B981", // Equivalent to text-green-400 in Tailwind
  },
  ruleText: {
    fontSize: 11,
    color: "#6B7280", // Equivalent to text-gray-500 in Tailwind
  },
});

export default FormRules;
