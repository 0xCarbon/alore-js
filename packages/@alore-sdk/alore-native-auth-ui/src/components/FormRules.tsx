import React from "react";
import { View, Text, StyleSheet } from "react-native";
import useDictionary from "../hooks/useDictionary";
import { Locale } from "../helpers/get-dictionary";
import { CheckIcon, XMarkIcon } from "react-native-heroicons/solid";
import { passwordRules, ruleValidation } from "../helpers";
import { stepStyles } from "./Steps/styles";

interface FormRulesProps {
  locale: Locale;
  passwordValues: { password: string; confirmPassword: string };
  userValues?: { email: string; nickname: string };
  className?: string;
}

const FormRules = ({ locale, passwordValues, userValues }: FormRulesProps) => {
  const dictionary = useDictionary(locale);

  return (
    <View style={[stepStyles.passwordStep.formRulesContainer]}>
      {passwordRules.map((rule) => (
        <View
          key={rule.name}
          style={stepStyles.passwordStep.formRulesRuleContainer}
        >
          {ruleValidation(rule, passwordValues, userValues) ? (
            <CheckIcon
              style={stepStyles.passwordStep.formRulesIcon}
              color="#10B981"
            />
          ) : (
            <XMarkIcon
              style={stepStyles.passwordStep.formRulesIcon}
              color="#EF4444"
            />
          )}
          <Text style={stepStyles.passwordStep.formRulesRuleText}>
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
