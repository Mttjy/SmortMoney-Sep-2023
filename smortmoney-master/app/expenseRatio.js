import React, { useState } from 'react';
import { View, Text, TextInput, Button, Slider, Alert, StyleSheet, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import CheckBox from 'expo-checkbox';
import { addDoc, getDoc, setDoc, deleteDoc, collection, doc } from 'firebase/firestore'
import { FIRESTORE_DB, FIREBASE_AUTH } from '../firebaseConfig'
import { useNavigation, useRoute } from '@react-navigation/native';
import { async } from '@firebase/util';

const expenseRatio = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [userAmountPaid, setUserAmountPaid] = useState('');
  const [friendAmountPaid, setFriendAmountPaid] = useState({});
  const [splitEqually, setSplitEqually] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedFriendUIDs, setSelectedFriendUIDs] = useState([]);

  const { totalAmount, expenseData, currentUserInfo, isUpdate, expenseId } = route.params;
  let { splitWith } = route.params;
  
  const user = FIREBASE_AUTH.currentUser;
  const userId = user.uid;
  
  // generate expenseId to be added in the document itself
  const uuidRandom = require('uuid-random');  

  const handleCreateExpense = async () => {

    try {
      const user = FIREBASE_AUTH.currentUser;

      if (user) {
        const userId = user.uid;
        const newExpenseId = uuidRandom();

        let combinedData;
        let friendPayments = [];
        let userAmountPaidFloat = 0;

        if (splitWith.length > 1) {
          // if split equally
          if (splitEqually) {

            // noOfPeople to be split
            const noOfPeople = splitWith.length;

            // calculate how much each person has to pay
            const amountToBePaidPerPerson = totalAmount / noOfPeople;

            // set totalFriendPaidAmount to 0
            let totalFriendPaidAmount = 0;

            friendPayments = splitWith.map((friend) => {
              // get total amount paid by friends
              totalFriendPaidAmount += parseFloat(friendAmountPaid[friend.uid] || 0);
              const oweAmount = amountToBePaidPerPerson - parseFloat(friendAmountPaid[friend.uid] || 0)

              // friend payment data with name and friend paid amount
              const friendPaymentData = {
                friendUid: friend.uid,
                friendName: friend.name,
                friendPhone: friend.phone,
                friendPaidFirst: parseFloat(friendAmountPaid[friend.uid] || 0),
                friendPaid: parseFloat(amountToBePaidPerPerson),
              }

              // if owe amount is > 0, friend owes user
              if (oweAmount > 0) {
                friendPaymentData.friendOwes = oweAmount;
              }

              // if owe amount is < 0, user owes friend
              else {
                // Math.abs changes negative value to positive
                friendPaymentData.friendIsOwed = Math.abs(oweAmount);
              }

              if (friend.uid === userId) {
                userAmountPaidFloat = parseFloat(amountToBePaidPerPerson);
              }

              return friendPaymentData

            });

            combinedData = {
              totalAmount,
              ...expenseData,
              userAmountPaid: userAmountPaidFloat,
              friendPayments,
              timeCreated: new Date(),
            };
          }

        } else {
          userAmountPaidFloat = parseFloat(userAmountPaid);
          combinedData = {
            totalAmount,
            ...expenseData,
            userAmountPaid: userAmountPaidFloat,
            timeCreated: new Date(),
          };
        }

        // update doc is delete then add approach
        if (isUpdate) {

          const { expenseDataForUpdate } = route.params;

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

        // add to each friend database
        splitWith.forEach(async (friend) => {
          const addDocRef = await addDoc(collection(FIRESTORE_DB, 'Users', friend.uid, 'Expenses'), combinedData);
          const fbDocumentId = addDocRef.id;

          const oldDocumentRef = doc(FIRESTORE_DB, 'Users', friend.uid, 'Expenses', fbDocumentId);
          const newDocumentRef = doc(FIRESTORE_DB, 'Users', friend.uid, 'Expenses', newExpenseId);

          const oldDocumentSnapshot = await getDoc(oldDocumentRef);
          if (oldDocumentSnapshot.exists()) {
            const data = oldDocumentSnapshot.data();
            await setDoc(newDocumentRef, data);
          }
          await deleteDoc(oldDocumentRef);
        });

        // clear input fields
        setUserAmountPaid('');
        setFriendAmountPaid({});

        console.log("Expense Data successfully added to user and friends")

        alert('Expense successfully created/updated');
        navigation.navigate('expense');
      } else {
        console.log("No user authenticated")
      }
    } catch (error) {
      console.log("Error logging expense data", error);
    }

  };

  // next button for split unequally
  const handleNextButton = () => {
    if (!splitEqually && selectedFriendUIDs.length > 0) {

      const selectedFriendNames = splitWith
      .filter((friend) => selectedFriendUIDs.includes(friend.uid))
      .map((friend) => ({
        uid: friend.uid,
        name: friend.name,
        phone: friend.phone,
      }));

      const { expenseDataForUpdate } = route.params;
      if (expenseDataForUpdate) {
        navigation.navigate('friendSettledFirst', { totalAmount, expenseData, selectedFriendNames, splitWith, currentUserInfo, expenseId: route.params.expenseId, isUpdate, expenseDataForUpdate });
      } else {
        // navigate to the friendSettledFirst and pass the following as parameters.
        navigation.navigate('friendSettledFirst', { totalAmount, expenseData, selectedFriendNames, splitWith, currentUserInfo, expenseId: route.params.expenseId, isUpdate });
      }
    }
  };

  const handleFriendAmountChange = (friendUid, amount) => {
    setFriendAmountPaid((prevFriendAmounts) => ({
      ...prevFriendAmounts,
      [friendUid]: amount,
    }));
  };

  const toggleFriendSelection = (friend) => {
    if (selectedFriendUIDs.includes(friend.uid)) {
      setSelectedFriendUIDs(selectedFriendUIDs.filter((item) => item !== friend.uid));
    } else {
      setSelectedFriendUIDs([...selectedFriendUIDs, friend.uid]);
    }
  };

  // to dismiss keyboard
  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
      <View style={styles.container}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, splitEqually ? styles.selectedButton : null]}
            onPress={() => setSplitEqually(true)}
          >
            <Text style={styles.buttonText}>Split Equally</Text>
          </TouchableOpacity>
          <View style={styles.buttonGap} />
          <TouchableOpacity
            style={[styles.button, !splitEqually ? styles.selectedButton : null]}
            onPress={() => setSplitEqually(false)}
          >
            <Text style={styles.buttonText}>Split Unequally</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.totalAmountText}>Total Amount: ${totalAmount}</Text>

        {/* render split unequally */}
        {splitWith.length > 1 && !splitEqually && (
          <View>
            <Text>Select friends who paid for the bill:</Text>
            {splitWith.map((friend) => (
              <View key={friend.uid} style={styles.checkboxContainer}>
                <CheckBox
                  value={selectedFriendUIDs.includes(friend.uid)}
                  onValueChange={() => toggleFriendSelection(friend)}
                />
                <Text style={{ marginLeft: 8 }}>
                  {friend.name} {'\n'}Phone: {friend.phone}
                </Text>
              </View>
            ))}

<TouchableOpacity
              style={[styles.button, styles.greenButton]}
              onPress={handleNextButton}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>

          </View>
        )}

        {/* render if there is a friend selected and split equally selected */}
        {/* if it is only user */}
        {splitWith.length === 1 && splitEqually ? (
          <>
            <View>
              <View style={styles.inputContainer}>
                <Text>{currentUserInfo.name}  {'\n'}Phone: {currentUserInfo.phone} {'\n'}Paid:</Text>
                <TextInput
                  value={userAmountPaid}
                  onChangeText={(text) => setUserAmountPaid(text)}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="Enter Amount"
                  required
                />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.greenButton]}
                onPress={handleCreateExpense}
              >
                <Text style={styles.buttonText}>{isUpdate ? 'Update Expense' : 'Create New Expense'}</Text>
              </TouchableOpacity>
            </View>
          </>
          // if there are friends
        ) : splitWith.length > 1 && splitEqually ? (
          <>
            {splitWith.map((friend) => (
              <View key={friend.uid}>
                {/* check if friend is currentUser */}
                <Text>{friend.name}  {'\n'}Phone: {friend.phone} {'\n'}Paid:</Text>
                <TextInput
                  value={friendAmountPaid[friend.uid]}
                  onChangeText={(value) => handleFriendAmountChange(friend.uid, value)}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="Enter Amount"
                />
              </View>
            ))}

<TouchableOpacity
              style={[styles.button, styles.greenButton]}
              onPress={handleCreateExpense}
            >
              <Text style={styles.buttonText}>{isUpdate ? 'Update Expense' : 'Create New Expense'}</Text>
            </TouchableOpacity>
          </>
        ) : null}

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
    marginBottom: 10,
  },

  buttonGap: {
    height: 10,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  selectedButton: {
    backgroundColor: 'blue',
    borderRadius: 20,
  },

  button: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'gray',
  },

  greenButton: {
    backgroundColor: 'green',
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  inputContainer: {
    marginBottom: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 5,
    padding: 5,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',  // white with 70% opacity
  },
});

export default expenseRatio;