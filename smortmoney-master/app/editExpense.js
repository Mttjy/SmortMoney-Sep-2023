import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import CheckBox from 'expo-checkbox';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../firebaseConfig'
import { getDocs, collection } from 'firebase/firestore'

const EditExpense = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { expenseData, expenseId, currentUserInfo } = route.params;

  const [updatedData, setUpdatedData] = useState(expenseData);
  const [sharedWith, setSharedWith] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (expenseData.friendPayments) {
      const initialSharedWith = expenseData.friendPayments.map((friend) => friend.friendUid);
      setSharedWith(initialSharedWith);
    }
    loadFriendList();
  }, []);

  const loadFriendList = async () => {
    try {
      const user = FIREBASE_AUTH.currentUser;

      if (user) {
        const userId = user.uid;
        const friendReference = collection(FIRESTORE_DB, 'Users', userId, 'AddedFriends');

        const friendsSnapshot = await getDocs(friendReference);

        const friendsData = [];

        friendsSnapshot.forEach((doc) => {
          const friendInfo = doc.data();
          friendsData.push({
            uid: friendInfo.uid,
            email: friendInfo.email,
            phone: friendInfo.number,
            name: `${friendInfo.firstname} ${friendInfo.lastname}`,
          });
        });

        friendsData.push(currentUserInfo);

        setFriends(friendsData);
      } else {
        console.log("No user authenticated");
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleNextButtonForUpdate = async () => {
    try {
      if (currentUserInfo) {
        const splitWith = friends
          .filter((friend) => sharedWith.includes(friend.uid))
          .map((friend) => ({
            uid: friend.uid,
            name: `${friend.name}`,
            phone: friend.phone,
          }));

        navigation.navigate('expenseRatio', {
          totalAmount: updatedData.totalAmount,
          expenseData: { category: updatedData.category, description: updatedData.description, },
          splitWith: splitWith,
          currentUserInfo,
          isUpdate: "true",
          expenseId: expenseId,
          expenseDataForUpdate: expenseData,
        });
      }
    } catch (error) {
      console.log("Error going into the next page for update", error);
    }
  };

  const handleFriendSelection = (friend) => {
    if (sharedWith.includes(friend.uid)) {
      // Remove the friend if already shared
      setSharedWith(sharedWith.filter((uid) => uid !== friend.uid));
    } else {
      // Add the friend if not shared
      setSharedWith([...sharedWith, friend.uid]);
    }
  };

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
      <View style={styles.container}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          value={updatedData.category}
          onChangeText={(text) => setUpdatedData({ ...updatedData, category: text })}
          placeholder="Enter Category"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={updatedData.description}
          onChangeText={(text) => setUpdatedData({ ...updatedData, description: text })}
          placeholder="Enter Description"
        />

        <Text style={styles.label}>Total Amount</Text>
        <TextInput
          style={styles.input}
          value={updatedData.totalAmount}
          onChangeText={(text) => setUpdatedData({ ...updatedData, totalAmount: text })}
          placeholder="Enter Total Amount"
        />

        <Text style={styles.label}>Shared With</Text>
        {friends.map((friend) => (
          <View key={friend.uid} style={styles.sharedWithContainer}>
            <CheckBox
              value={sharedWith.includes(friend.uid)}
              onValueChange={() => handleFriendSelection(friend)}
            />
            <Text style={{ marginLeft: 5 }}>
              {friend.name} {'\n'}Phone: {friend.phone}
            </Text>
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={handleNextButtonForUpdate}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 8,
    marginVertical: 8,
    width: '100%',
  },
  sharedWithContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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

export default EditExpense;
