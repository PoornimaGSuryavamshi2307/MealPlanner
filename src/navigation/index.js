import { View, Text } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Recipescreen from '../screens/recipe'
import Authscreen from '../screens/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'

const Stack = createNativeStackNavigator()

const Navigation = () => {
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSignInStatus = async () => {
      const token = await AsyncStorage.getItem('access_token');
      
      setSignedIn(!!token);
      setLoading(false);
    };

    checkSignInStatus();
  }, []);

  if (loading) {
    // You can return a loading spinner or some placeholder here
    return null;
  }
  return (
    <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
        {signedIn ? (
          <>
          <Stack.Screen name="Recipe" component={Recipescreen} />
          </>
        ) : (
          <>
          <Stack.Screen name="Auth" component={Authscreen} />
          </>
        )}
        </Stack.Navigator>
      
    </NavigationContainer>
  )
}

export default Navigation