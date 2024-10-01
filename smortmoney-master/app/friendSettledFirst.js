import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const friendSettledFirst = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { totalAmount, expenseData, selectedFriendNames, splitWith, currentUserInfo, expenseId, isUpdate, expenseDataForUpdate } = route.params;

  const [friendSettleBillAmount, setFriendSettleBillAmount] = useState({});

  const handleNextButton = () => {
    // pass parameters to splitUnequally
    navigation.navigate('splitUnequally', {
      friendSettleBillAmount,
      totalAmount,
      expenseData,
      selectedFriendNames,
      splitWith,
      currentUserInfo,
      expenseId,
      isUpdate,
      expenseDataForUpdate,
    });
  };

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
      <View style={styles.container}>
        <Text style={styles.totalAmountText}>Total Amount: ${totalAmount}</Text>

        <Text style={styles.label}>Enter the amount the friend paid when settling the bill:</Text>
        {selectedFriendNames.map((friend) => (
          <View key={friend.uid}>
            <Text style={styles.friendName}>{friend.name}</Text>
            <Text style={styles.friendDetails}>Phone: {friend.phone}</Text>
            <TextInput
              value={friendSettleBillAmount[friend.uid]}
              onChangeText={(value) => setFriendSettleBillAmount((prev) => ({ ...prev, [friend.uid]: value }))}
              keyboardType="numeric"
              style={styles.input}
              placeholder={`Amount paid by ${friend.name}`}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={handleNextButton}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  totalAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    marginBottom: 8,
  },

  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  friendDetails: {
    fontSize: 14,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    padding: 5,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',  // white with 70% opacity
  },

  button: {
    backgroundColor: 'green',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default friendSettledFirst;