import { View, Text, TextInput, KeyboardAvoidingView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from 'react-native';
import { useAuth } from '../../context/auth';
import { router } from 'expo-router';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNum, setPhoneNum] = useState(null);
  const [userData, setUserData] = useState({
    firstname: '',
    lastname: '',
  });
  const { register } = useAuth();

  const setName = (firstName, lastName) => {
    setUserData((prevUserData) => ({
      ...prevUserData,
      firstname: firstName,
      lastname: lastName,
    }));
  };

  const onRegisterTapped = async () => {
    try {
      await register(email,password,userData, phoneNum);
      router.push('/')
    } catch (error) {
      console.log(error);
    }
  }

  const actionCodeSettings = {
    // URL you want to redirect back to after the user completes the action
    url: 'http://localhost:8081/', // Replace with your app's URL
  
    // This must be true for phone number link sign-in
    handleCodeInApp: true,
  
    // iOS: Specify the custom scheme used for deep linking on iOS
    iOS: {
      bundleId: 'com.yourcompany.yourapp', // Replace with your app's bundle identifier
    },
  
    // Android: Specify the custom scheme used for deep linking on Android
    android: {
      packageName: 'com.yourcompany.yourapp', // Replace with your app's package name
      installApp: true,
      minimumVersion: '12', // Replace with the minimum Android version supported by your app
    },
  
    // Dynamic link domain (required for Android and iOS deep linking)
    dynamicLinkDomain: 'yourapp.page.link', // Replace with your Firebase Dynamic Links domain
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' , alignItems: 'center'}}>
      <KeyboardAvoidingView behavior='padding'>
      <Text style={{ fontSize: 16, textDecorationLine: 'underline', marginBottom: '2.5%' }}>First Name</Text>
      <TextInput
            style={{ borderWidth: 1, height: 40, borderColor: 'gray', marginBottom: '2.5%', borderRadius: 5 }}
        placeholder=" First Name"
        value={userData.firstname}
        onChangeText={(text) => setName(text, userData.lastname)}
      />
      <Text style={{ fontSize: 16, textDecorationLine: 'underline', marginBottom: '2.5%' }}>Last Name</Text>
      <TextInput
      style={{ borderWidth: 1, height: 40, borderColor: 'gray', marginBottom: '2.5%', borderRadius: 5 }}
        placeholder=" Last Name"
        value={userData.lastname}
        onChangeText={(text) => setName(userData.firstname, text)}
      />
      <Text style={{ fontSize: 16, textDecorationLine: 'underline', marginBottom: '2.5%' }}>Email</Text>
      <TextInput
      style={{ borderWidth: 1, height: 40, borderColor: 'gray', marginBottom: '2.5%', borderRadius: 5 }}
        placeholder=" Email"
        value={email}
        onChangeText={setEmail}
      />
      <Text style={{ fontSize: 16, textDecorationLine: 'underline', marginBottom: '2.5%' }}>Password</Text>
      <TextInput
      style={{ borderWidth: 1, height: 40, borderColor: 'gray', marginBottom: '2.5%', borderRadius: 5 }}
        placeholder=" Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Text style={{ fontSize: 16, textDecorationLine: 'underline', marginBottom: '2.5%' }}>Phone Number</Text>
      <TextInput
      style={{ borderWidth: 1, height: 40, borderColor: 'gray', marginBottom: '2.5%', borderRadius: 5 }}
        placeholder=" Phone Number"
        keyboardType="numeric"
        value={phoneNum}
        onChangeText={setPhoneNum}
      />
      </KeyboardAvoidingView>

      <Button color={'#0088cc'} borderRadius={10} title="Register" onPress={onRegisterTapped}/>

    </SafeAreaView>
  )
}

export default RegisterPage