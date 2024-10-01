  import { View, Text, SafeAreaView, Pressable, Image, TouchableOpacity, TextInput } from 'react-native'
  import { Link, useRouter } from 'expo-router'

  import { FIRESTORE_DB , FIREBASE_STORAGE } from '../../firebaseConfig';
  import { useAuth } from '../../context/auth';
  import * as ImagePicker from 'expo-image-picker';
  import React, { useEffect, useState } from 'react';
  import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
  import { updateDoc, collection, getDocs, doc   } from 'firebase/firestore';
  // images
  import VerifiedTickImage from '../../assets/VerifiedTick.png';
  import UnVerifiedTickImage from '../../assets/UnVerifiedTick.png';
  import defaultDP from '../../assets/defaultProfileDP.jpeg';
  
  const ProfilePage = () => {
      
      const router = useRouter();
      const { signedOut, user } = useAuth();
      const [profileImage, setProfileImage] = useState(null);
      const [ name, setName ] = useState('');
      const [newFirstName, setNewFirstName] = useState(null);
      const [newLastName, setNewLastName] = useState(null);
      const [editing, setEditing] = useState(false);
      const [userEmail, setUserEmail] = useState('');
      const uriToBlob = (uri) => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.onload = function () {
            // return the blob
            resolve(xhr.response)
          }
          xhr.onerror = function () {
            reject(new Error('uriToBlob failed'))
          }
          xhr.responseType = 'blob'
          xhr.open('GET', uri, true)
      
          xhr.send(null)})
        }

      const pickImage = async () => {
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          });
      
          if (!result.canceled) {
          
          const selectedAsset = result.assets[0];
          const imageRef = ref(FIREBASE_STORAGE, `profile_pic/${user.user.uid}.jpg`);

          const blobFile = await uriToBlob(selectedAsset.uri);

          await uploadBytes(imageRef, blobFile);

          const downloadURL = await getDownloadURL(imageRef);

          // Update the profileImage state with the new download URL
          setProfileImage(downloadURL);

          }
        } catch (error) {
          console.error(error);
        }
      };

      useEffect(() => {
          (async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              alert('Sorry, we need camera roll permissions to make this work!');
            }
          })();
        }, []);
      
      const handleEditPress = () => {
        setEditing(true);
      }

      const submitEditPress = async () => {
        setEditing(false);
        try {
          const userDetailCollection = collection(FIRESTORE_DB, 'Users', user.user.uid, 'UserDetails');
          const querySnapshot = await getDocs(userDetailCollection);
      
          if (!querySnapshot.empty) {
            const documentId = querySnapshot.docs[0].id;
            const userDetailsDocRef = doc(FIRESTORE_DB, 'Users', user.user.uid, 'UserDetails', documentId);
            await updateDoc(userDetailsDocRef, {firstname : newFirstName, lastname : newLastName});

            getName();
          } else {
            console.log('No documents found in UserDetails');
          }
        } catch (error) {
          console.error('Error getting user details:', error);
        }
      }

      const getName = async () => {
        try {
          const userDetailCollection = collection(FIRESTORE_DB, 'Users', user.user.uid, 'UserDetails');
          const querySnapshot = await getDocs(userDetailCollection);
      
          if (!querySnapshot.empty) {
        
            const firstName = querySnapshot.docs[0].get('firstname'); 
            const lastName = querySnapshot.docs[0].get('lastname');    
            setName(firstName+ ' ' + lastName);
          } else {
            console.log('No documents found in UserDetails');
          }
        } catch (error) {
          console.error('Error getting user details:', error);
        }
      }

      useEffect(() => {
        const startingDP = async () => {
          const imageRef = ref(FIREBASE_STORAGE, `profile_pic/${user.user.uid}.jpg`);
      
          try {
            const downloadURL = await getDownloadURL(imageRef);
            setProfileImage(downloadURL);
          } catch (error) {
            // Handle the case where the object doesn't exist
            console.log('Profile image not found:', error);
          }
        }
        if(user !== null){
          setUserEmail(user.user.email);
          startingDP();
          getName();
        }
  
      }, []);

      return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center'}}>
          <View>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{ width: 120, height: 120, borderRadius: 60, alignSelf: 'center' }}
              />
            ) : (
              <Image
                source={defaultDP}
                style={{ width: 120, height: 120, borderRadius: 60, alignSelf: 'center' }}
              />
            )}
              <View style={{ marginTop:'5%', marginBottom: '5%', alignSelf: 'center' }}>
                  <TouchableOpacity style={{ borderWidth: 1, borderColor: 'gray', marginBottom: '2.5%',
                     borderRadius: 5, paddingVertical: 5, paddingHorizontal: 10}} onPress={pickImage}>
                      <Text style={{fontSize: 14,}}>Change Photo</Text>
                  </TouchableOpacity>
              </View>
              <View style = {{marginLeft: '10%'}}>
                  {/* ---------------------------------- Name ---------------------------------- */}
                  <Text style={{ fontSize: 16, textDecorationLine: 'underline' }}>Name:</Text>
                 
                    
                    {!editing ? (
                       <View style={{flexDirection: 'row'}}>
                      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{name}</Text>
                      <TouchableOpacity style={{ backgroundColor: '#0088cc', padding: 5, borderRadius: 5, marginLeft: '5%' }} onPressIn={handleEditPress}>
                        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>Edit</Text>
                      </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{name}</Text>
                        <TextInput
                        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, width: '50%', borderRadius: 5, }}
                        placeholder="New First Name"
                        value={newFirstName}
                        onChangeText={(text) => setNewFirstName(text)}
                        />
                        <View style={{flexDirection: 'row'}}>
                          <TextInput
                          style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, width: '50%', borderRadius: 5, }}
                          placeholder="New Last Name"
                          value={newLastName}
                          onChangeText={(text) => setNewLastName(text)}
                          />
                          <TouchableOpacity style={{ height: 40, backgroundColor: '#0088cc', padding: 5, borderRadius: 5, marginLeft: '5%' }} onPressIn={submitEditPress}>
                          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>Submit</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    
                  
                  {/* ---------------------------------- Email address ---------------------------------- */}
                  <Text style={{ fontSize: 16, textDecorationLine: 'underline' }}>Email Address</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{userEmail}</Text>
                    {user !== null && (
                      user.user.emailVerified ? (
                        <Image source={VerifiedTickImage} style={{ width: 20, height: 20, marginLeft: 2 }} />
                      ) : (
                        <Image source={UnVerifiedTickImage} style={{ width: 20, height: 20, marginLeft: 2 }} />
                      )
                    )}
                  </View>
              </View>
          </View>
          <Pressable onPress={() => signedOut()}>
              <Text style={{ marginTop: '10%', alignSelf: 'center', borderColor: 'gray', borderWidth: 1, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10}}>Sign Out</Text>
          </Pressable>
      </SafeAreaView>
      )
  }

  export default ProfilePage