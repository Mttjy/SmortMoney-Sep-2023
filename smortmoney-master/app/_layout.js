import { View, Text } from 'react-native'
import React from 'react'
import { Slot, Stack } from 'expo-router'
import { Provider } from '../context/auth';

export default function StackLayout() {

  return (  
    <Provider>
      <Stack initialRouteName='(auth)'>
        <Stack.Screen name='(auth)' options={{ headerShown: false}} />
        <Stack.Screen name='(tabs)' options={{ headerShown: false}} />
      </Stack>
    </Provider>
  )
}