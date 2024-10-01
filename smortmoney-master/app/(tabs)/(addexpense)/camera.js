import React, { useRef } from "react";
import { Camera } from "expo-camera";
import { Text, View, TouchableOpacity, Button, StyleSheet, Dimensions } from "react-native";
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function CameraPage() {

    const cameraRef = useRef(null);
    
    const takePicture = async () => {
        if (cameraRef.current) {
            const { uri } = await cameraRef.current.takePictureAsync();
            console.log('Photo taken:', uri);
            router.push({ pathname: '/receiptprocessone', params: { photo: uri }});
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Camera style={{ flex: 1 }} type={Camera.Constants.Type.back}  ref={cameraRef} />
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={takePicture}>
                    <Text style={styles.buttonText}>Capture</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#0088cc',
        padding: 20,
        borderRadius: 5,
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
    },
});