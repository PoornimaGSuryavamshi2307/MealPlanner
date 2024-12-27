import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation/index';
import 'react-native-gesture-handler';


export default function App() {
  // const [initializing, setInitializing] = useState(true);
  // const [user, setUser] = useState(null);

  // // Handle user state changes
  // function onAuthStateChanged(user) {
  //   setUser(user);
  //   if (initializing) setInitializing(false);
  // }

  // useEffect(() => {
  //   // Subscribe to auth state changes
  //   // const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
  //   // return subscriber; // Unsubscribe on unmount
  // }, []);

  // // Show loading indicator while initializing
  // if (initializing) {
  //   return null; // Or return a loading spinner
  // }

  return (
    // <NavigationContainer>
    //    <Stack.Navigator>

    
    //   </Stack.Navigator>
    // // </NavigationContainer>
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Navigation />

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

//   initialRouteName='Recipe'
    //     screenOptions={{
    //       headerShown: false,
    //     }}
    // >
    {/* //     <Stack.Screen name="Recipe" component={Recipe} /> */}
    //     {/* {user ? (
    //       // User is signed in - show Recipe screen
    //     ) : ( */}
    {/* //       // No user - show auth screen */}
    //       {/* <Stack.Screen name="Auth" component={authscreen} /> */}
    //     {/* )} */}