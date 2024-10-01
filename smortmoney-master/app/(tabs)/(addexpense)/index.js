import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function AddExpensePage()  { 
    const useManual = async () => {
        router.push('/manuallyAdd');
    }
    
    const usePhoto = async () => {
        router.push('/photooption');
    }
    
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.header}>Add Expense</Text>
        <TouchableOpacity style={styles.button} onPress={useManual}>
            <Text style={styles.buttonText}>Add Manually</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={usePhoto}>
            <Text style={styles.buttonText}>Use Pictures</Text>
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