import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../config/colors';

const CustomButton = ({ text, onPress, style, disabled }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style, disabled && styles.buttonDisabled]} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
});

export default CustomButton;

