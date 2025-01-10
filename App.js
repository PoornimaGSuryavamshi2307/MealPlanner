import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation/index';
import 'react-native-gesture-handler';


export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Navigation />

      </SafeAreaView>
    </SafeAreaProvider>
  );
}
