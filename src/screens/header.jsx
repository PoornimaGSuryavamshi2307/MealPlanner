import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = () => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>Find Your Recipe</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 4, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    alignItems: 'center',
  }
});

export default Header;