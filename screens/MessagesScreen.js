import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../config/colors';
import fonts from '../config/fonts';

const MessagesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },
});

export default MessagesScreen;

