import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker'
import { useNavigation } from '@react-navigation/native';
import { settleDebts } from './settleDebts';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../firebaseConfig';
import { getDocs, updateDoc, doc, collection, getDoc } from 'firebase/firestore';

const SettleDebtsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('');
  const [categoriesAndDescriptions, setCategoriesAndDescriptions] = useState({});
  const [payments, setPayments] = useState([]);
  const [expenseId, setExpenseId] = useState(null);

  const navigation = useNavigation();

  const fetchPaymentsForCategoryAndDescription = async (category, description) => {
    try {
      console.log("fetchPaymentsForCategoryAndDescription");

      const user = FIREBASE_AUTH.currentUser;
  
      if (user) {
        const userId = user.uid;
        const expensesReference = collection(FIRESTORE_DB, 'Users', userId, 'Expenses');
        const querySnapshot = await getDocs(expensesReference);
  
        const payments = [];
  
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const docCategory = data.category;
          const docDescription = data.description;
  
          if (docCategory === selectedCategory && docDescription === selectedDescription) {
            console.log("Matching Category and Description found");
            setExpenseId(doc.id);
            console.log(doc.id);
  
            if (data.friendPayments && Array.isArray(data.friendPayments)) {
              data.friendPayments.forEach((friendPayment) => {
                payments.push({
                  friendUid: friendPayment.friendUid,
                  friendName: friendPayment.friendName,
                  friendPaid: friendPayment.friendPaid,
                  friendIsOwed: friendPayment.friendIsOwed !== undefined ? friendPayment.friendIsOwed : 0,
                  friendOwes: friendPayment.friendOwes !== undefined ? friendPayment.friendOwes : 0,
                });
              });
            }
          }
        });
  
        return payments;
      } else {
        console.log("No user authenticated");
        return [];
      }
    } catch (error) {
      console.log('Error fetching payments for category and description', error);
      return [];
    }
  };

  const handleSettleDebts = async () => {
    try {
      const selectedCategory = selectedCategory;
      const selectedDescription = selectedDescription;
      
      const payments = await fetchPaymentsForCategoryAndDescription(selectedCategory, selectedDescription);
      const user = FIREBASE_AUTH.currentUser;

      if (user) {
        const userId = user.uid;

        if (expenseId) {
          const settledTransactions = settleDebts(payments);
          console.log(settledTransactions);
          console.log(payments);
  
          const expenseRef = doc(FIRESTORE_DB, 'Users', userId, 'Expenses', expenseId);

          const expenseSnapshot = await getDoc(expenseRef);
          // this is to know which friend is in the expense and add settled transactions in their database as well
          const friendPayments = expenseSnapshot.data().friendPayments;
  
          // await updateDoc(expenseRef, {
          //   transactions: settledTransactions,
          // });
          
          // settle debt transaction to user and friend's database
          friendPayments.forEach(async (friend) => {
            const friendExpenseRef = doc(FIRESTORE_DB, 'Users', friend.friendUid, 'Expenses', expenseId);
  
            await updateDoc(friendExpenseRef, {
              transactions: settledTransactions,
            });
          });

          console.log('Settle debt transaction added for friends and user');

          navigation.navigate('expense');
  
        } else {
          console.log('Expense not found');
        }

      } else {
        console.log("No user authenticated");
      }

    } catch (error) {
      console.log('Error fetching payments and settling debts', error);
    }
  };
  

  useEffect(() => {

    console.log("fetchCategoryAndDescription");

    const fetchCategoryAndDescription = async () => {
      try {
        const user = FIREBASE_AUTH.currentUser;

        if (user) {
          const userId = user.uid;
          const expensesReference = collection(FIRESTORE_DB, 'Users', userId, 'Expenses');
          const querySnapshot = await getDocs(expensesReference);

          const paymentsData = querySnapshot.docs.map((doc) => doc.data());
          setPayments(paymentsData);

          const categoriesAndDescriptions = {};

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const category = data.category;
            const description = data.description;

            if (!(category in categoriesAndDescriptions)) {
              categoriesAndDescriptions[category] = [];
            }

            if (!categoriesAndDescriptions[category].includes(description)) {
              categoriesAndDescriptions[category].push(description);
            }
          });

          setCategoriesAndDescriptions(categoriesAndDescriptions);

          if (selectedCategory && categoriesAndDescriptions[selectedCategory]) {
            setSelectedDescription(categoriesAndDescriptions[selectedCategory][0]);
          }

        } else {
          console.log("No user authenticated");
        }
      } catch (error) {
        console.log('Error fetching categories and description', error);
      }
    };

    fetchCategoryAndDescription();
    console.log(categoriesAndDescriptions);
  }, []);

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={selectedCategory}
        onValueChange={(itemValue) => setSelectedCategory(itemValue)}
        style={styles.picker}
      >
        <Picker.Item key="default" label="Select Category" value="" />

        {Object.keys(categoriesAndDescriptions).map((category) => (
          <Picker.Item key={category} label={category} value={category} />
        ))}
      </Picker>

      <Picker
        selectedValue={selectedDescription}
        onValueChange={(itemValue) => setSelectedDescription(itemValue)}
        style={styles.picker}
      >
        <Picker.Item key="default" label="Select Description" value="" />

        {categoriesAndDescriptions[selectedCategory]?.map((description) => (
          <Picker.Item key={description} label={description} value={description} />
        ))}
      </Picker>

      <TouchableOpacity style={styles.button} onPress={handleSettleDebts}>
        <Text style={styles.buttonText}>Settle Debt</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  picker: {
    marginTop: 5,
    marginBottom: 10,
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

export default SettleDebtsPage;