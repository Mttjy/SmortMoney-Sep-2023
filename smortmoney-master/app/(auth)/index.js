import React, { useEffect, useState } from 'react'
import { Text, TextInput, View, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/auth';
import { Link } from 'expo-router';
import smortMoneyLogo from '../../assets/RectangleLogo.png';

export default function SignIn() {
  const [email,setEmail] = useState('test@test.com')
  const [password,setPassword] = useState('tester')
  const { signIn } = useAuth();

  const onSignInTapped = async () => {
    try {
      await signIn(email, password);
    } catch (error) {
      console.log(error);
    } 
    
  };

  return (
    
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={smortMoneyLogo}
        style={{ width: '75%', height: '20%', borderRadius: 0, alignSelf: 'center' }}
      />
      <Text style={{ fontSize: 16, textDecorationLine: 'underline', marginBottom: '2.5%' }}>Email</Text>
      <TextInput
        style={{ borderWidth: 1, width: '50%', height: 40, borderColor: 'gray', marginBottom: '2.5%', borderRadius: 5 }}
        placeholder=" Email"
        value={email}
        onChangeText={setEmail}
      />
      <Text style={{ fontSize: 16, textDecorationLine: 'underline', marginBottom: '2.5%' }}>Password</Text>

      <TextInput
        style={{ borderWidth: 1, width: '50%', height: 40, borderColor: 'gray', marginBottom: '2.5%', borderRadius: 5 }}
        placeholder=" Password"
        secureTextEntry = {true}
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity onPress={() => onSignInTapped()}>
      <Text 
      style={{ borderWidth: 1, borderColor: 'gray', marginBottom: '2.5%',
      fontSize: 16, fontWeight:'bold', borderRadius: 5, paddingVertical: 5, paddingHorizontal: 10}}
       >Sign In</Text>
      </TouchableOpacity>
      <Link href={'/register'} asChild>
        <TouchableOpacity>
          <Text style={{ borderWidth: 1, borderColor: 'gray', marginBottom: '2.5%',
      fontSize: 16, fontWeight:'bold', borderRadius: 5, paddingVertical: 5, paddingHorizontal: 10}}>Register</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
