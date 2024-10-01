import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { doc, getDoc, query, where } from 'firebase/firestore';
import { FIRESTORE_DB } from '../firebaseConfig';

const seeMoreExpenseDetails = () => {
  const route = useRoute();
  const { expenseId, expenseData, currentUserInfo } = route.params;

  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
      try {
          const expenseRef = doc(FIRESTORE_DB, 'Users', currentUserInfo.uid, 'Expenses', expenseId);
          const expenseSnapshot = await getDoc(expenseRef);

          if (expenseSnapshot.exists()) {
              const expenseData = expenseSnapshot.data();

              if (expenseData.transactions) {
                  const transactionData = expenseData.transactions;
                  setTransactions(transactionData);
                  console.log(transactionData);
              } else {
                  console.log('No transaction data found in the expense document.');
                  setTransactions([]);
              }
          } else {
              console.log('Expense document does not exist.');
              setTransactions([]);
          }
      } catch (error) {
          console.error('Error fetching transactions:', error);
      }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
      <View style={styles.container}>
          {transactions && transactions.length > 0 ?(
              <View>
                  <Text style={{ fontWeight: 'bold' }}>
                      Expense ID: {expenseId} {'\n'}
                      Category: {expenseData.category} {'\n'}
                      Description: {expenseData.description} {'\n'}
                  </Text>

                  {transactions.map((item, index) => (
                      <View style={styles.borderForFriendDisplay} key={index}>
                        <Text style={{ fontWeight: 'bold' }}>Owe Amount </Text>
                          <Text>From: {item.from}</Text>
                          <Text>To: {item.to}</Text>
                          <Text>Amount: {item.transferAmount}</Text>
                      </View>
                  ))}
              </View>

          ) : (
              <Text>No extra details to show, please use settle debt button in add manually page first!</Text>
          )}

      </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    borderForFriendDisplay: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 10,
        padding: 8,
        marginVertical: 8,
    },
});

export default seeMoreExpenseDetails;
