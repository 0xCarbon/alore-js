import React from "react";
import { View, Text, StyleSheet } from "react-native";
import useDictionary from "../hooks/useDictionary";
import { Locale } from "../helpers/get-dictionary";
import { CheckIcon, XMarkIcon } from "react-native-heroicons/solid";
import { passwordRules, ruleValidation } from "../helpers";
import { stepStyles } from "./Steps/styles";
import { RecursivePartial } from "../types";

interface FormRulesProps {
  styles: RecursivePartial<typeof stepStyles>;
  locale: Locale;
  passwordValues: { password: string; confirmPassword: string };
  userValues?: { email: string; nickname: string };
  className?: string;
}

const FormRules = ({
  styles,
  locale,
  passwordValues,
  userValues,
}: FormRulesProps) => {
  const dictionary = useDictionary(locale);

  return (
    <View style={[styles.passwordStep?.formRulesContainer]}>
      {passwordRules.map((rule) => (
        <View
          key={rule.name}
          style={styles.passwordStep?.formRulesRuleContainer}
        >
          {ruleValidation(rule, passwordValues, userValues) ? (
            <CheckIcon
              style={styles.passwordStep?.formRulesIcon}
              color="#10B981"
            />
          ) : (
            <XMarkIcon
              style={styles.passwordStep?.formRulesIcon}
              color="#EF4444"
            />
          )}
          <Text style={styles.passwordStep?.formRulesRuleText}>
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

export default FormRules;
