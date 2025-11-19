import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import colors from '../config/colors';

const CustomTextInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  style,
  keyboardType,
  labelStyle,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      {!!label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
});

export default CustomTextInput;

