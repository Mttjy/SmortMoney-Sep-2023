import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../firebaseConfig'
import { addDoc, getDoc, setDoc, deleteDoc, doc, collection } from 'firebase/firestore'
import { async } from '@firebase/util';

const splitUnequally = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { totalAmount, expenseData, selectedFriendNames, splitWith, friendSettleBillAmount, currentUserInfo, isUpdate, expenseId, } = route.params;

  const [friendActualPrice, setFriendActualPrice] = useState({});

  const uuidRandom = require('uuid-random');

  const handleCreateExpense = async () => {

    let combinedData;
    const friendPayments = [];
    const newExpenseId = uuidRandom();

    try {
      const user = FIREBASE_AUTH.currentUser;

      if (user) {
        const userId = user.uid;

        if (splitWith.length > 1) {
          splitWith.forEach((friend) => {
            // get actual prices for each friend
            const friendActualPricePaid = parseFloat(friendActualPrice[friend.uid] || 0);

            // get each amount that each friend settled the bill
            const friendPaidFirst = parseFloat(friendSettleBillAmount[friend.uid] || 0);

            const friendPaymentData = {
              friendUid: friend.uid,
              friendName: friend.name,
              friendPaidFirst: friendPaidFirst,
              friendPaid: friendActualPricePaid,
            };

            // calculate delta to find out if friendIsOwed or friendOwes
            const delta = friendPaidFirst - friendActualPricePaid;

            if (delta > 0) {
              friendPaymentData.friendIsOwed = delta;
            } else if (delta < 0) {
              friendPaymentData.friendOwes = Math.abs(delta);
            } else {
              friendPaymentData.friendIsOwed = 0;
              friendPaymentData.friendOwes = 0;
            }

            friendPayments.push(friendPaymentData);
          });

          const findUser = friendPayments.find((friendPayment) => friendPayment.friendUid === currentUserInfo.uid);

          combinedData = {
            totalAmount,
            ...expenseData,
            userAmountPaid: findUser.friendPaid,
            friendPayments,
            timeCreated: new Date(),
          };

          if (isUpdate) {
            const { expenseId, expenseDataForUpdate } = route.params;

            if (expenseDataForUpdate.friendPayments) {
              const initiallySharedWith = expenseDataForUpdate.friendPayments.map((friend) => friend.friendUid);
              const friendsToBeDeleted = initiallySharedWith.filter((uid) => !splitWith.includes(uid));

              // delete for unselected friend
              for (const friendUid of friendsToBeDeleted) {
                const friendDataToBeDeleted = doc(FIRESTORE_DB, 'Users', friendUid, 'Expenses', expenseId);
                await deleteDoc(friendDataToBeDeleted);
              }
            }

            splitWith.forEach(async (friend) => {
              const existingExpenseRef = doc(FIRESTORE_DB, 'Users', friend.uid, 'Expenses', expenseId);
              await deleteDoc(existingExpenseRef);
            });

          }

          splitWith.forEach(async (friend) => {
            const addDocRef = await addDoc(collection(FIRESTORE_DB, 'Users', friend.uid, 'Expenses'), combinedData);
            const fbDocumentId = addDocRef.id;

            const oldDocumentRef = doc(FIRESTORE_DB, 'Users', friend.uid, 'Expenses', fbDocumentId);
            const newDocumentRef = doc(FIRESTORE_DB, 'Users', friend.uid, 'Expenses', newExpenseId);

            const oldDocumentSnapshot = await getDoc(oldDocumentRef);
            if (oldDocumentSnapshot.exists()) {
              const data = oldDocumentSnapshot.data();

              // in respective friend collection, userAmountPaid would display their respective amount paid
              data.userAmountPaid = data.friendPayments.find((payment) => payment.friendUid === friend.uid).friendPaid;

              await setDoc(newDocumentRef, data);
            }
            await deleteDoc(oldDocumentRef);
          });

        }
        console.log("Expense Created");

        alert('Expense successfully created/updated');
        navigation.navigate('expense');
      }
      else {
        console.log("No user authenticated");
      }
    } catch (error) {
      console.log("Error logging expense data", error);
    }
  };

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
      <View style={styles.container}>
        <Text style={styles.totalAmountText}>Total Amount: ${totalAmount}</Text>

        <Text style={styles.label}>Enter how much each friend paid for their items:</Text>
        {splitWith.map((friend) => (
          <View key={friend.uid}>
            <Text style={styles.friendName}>{friend.name}'s Actual Price:</Text>
            <TextInput
              value={friendActualPrice[friend.uid]}
              onChangeText={(value) => setFriendActualPrice((prev) => ({ ...prev, [friend.uid]: value }))}
              keyboardType="numeric"
              style={styles.input}
              placeholder={`Amount paid by ${friend.name}`}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={handleCreateExpense}>
          <Text style={styles.buttonText}>{isUpdate ? 'Update Expense' : 'Create New Expense'}</Text>
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

export default splitUnequally;
