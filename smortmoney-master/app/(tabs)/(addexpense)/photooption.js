import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import React from 'react'
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function PhotoOptionPage()  { 
    const selectPicture = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status === 'granted') {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
            if (!result.canceled) {
                const uri = result.assets[0].uri;
                router.push({ pathname: '/receiptprocessone', params: { photo: uri }});
            }
        }
    };
    
    const openCamera = async () => {
        router.push('/camera');
    }
    
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Select a method</Text>
            <TouchableOpacity style={styles.button} onPress={openCamera}>
                <Text style={styles.buttonText}>Use Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={selectPicture}>
                <Text style={styles.buttonText}>Select Picture</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#0088cc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
    },
});