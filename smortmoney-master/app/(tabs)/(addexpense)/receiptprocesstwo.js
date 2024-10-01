import { View, Text, TextInput, Button, Image, FlatList, TouchableOpacity , SafeAreaView, ScrollView, StyleSheet} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { router, useLocalSearchParams} from 'expo-router';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../firebaseConfig';
import { getDoc, collection, doc, addDoc, setDoc, deleteDoc} from 'firebase/firestore';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function ReceiptProcessPage() {
    const route = useRoute();

    const { selectedCategory, selectedTotalBill, rows, description, selectedFriends, userPaymentData } = route.params;
    const [billData, setBillData] = useState([]);
    const [friendData, setFriendData] = useState(selectedFriends);

    const [selectedItems, setSelectedItems] = useState([]);
    const [yourSelectedItems, setYourSelectedItems] = useState([]);

    const [selectedFriend, setSelectedFriend] = useState([]);
    const uuidRandom = require('uuid-random');  

    
    const handleCreateExpense = async () => {

        let combinedData;
        const friendPayments = [];
        const newExpenseId = uuidRandom();

        try {
            const user = FIREBASE_AUTH.currentUser;

            if (user) {
                const userId = user.uid;

                if (billData.length > 1) {
                    const cleanedSelectedItems = yourSelectedItems.map(item => parseFloat(item.replace(/[$\s]/g, '')));
                    const newAmount = cleanedSelectedItems.reduce((sum, value) => sum + value);
                    userPaymentData.friendPaid = newAmount;
                    userPaymentData.friendIsOwed = parseFloat(userPaymentData.friendIsOwed.replace(/[$\s]/g, ''));
                    userPaymentData.friendPaidFirst = parseFloat(userPaymentData.friendPaidFirst.replace(/[$\s]/g, ''));

                    friendPayments.push(userPaymentData);

                    billData.forEach((bill) => {
                        // get actual prices for each friend
                        const total = bill[1].reduce((sum, value) => sum + value, 0);

                        // get each amount that each friend settled the bill
                        const friendName = bill[0].firstname + " " + bill[0].lastname;

                        const friendPaymentData = {
                            friendUid: bill[0].uid,
                            friendPhone: bill[0].number,
                            friendName: friendName,
                            friendOwes: total,
                            friendPaid: total,
                            friendPaidFirst: 0,
                        };

                        friendPayments.push(friendPaymentData);
                    });

                    combinedData = {
                      category: selectedCategory,
                      description,
                      friendPayments,
                      userAmountPaid: parseFloat(selectedTotalBill.replace(/[$\s]/g, '')),
                      totalAmount: selectedTotalBill.replace(/[$\s]/g, ''),
                      timeCreated: new Date(),
                    };
                    // const response = await addDoc(collection(FIRESTORE_DB, 'Users', userId, 'Expenses'), combinedData, newExpenseId);
                    friendPayments.forEach(async (friend) => {
                        const addDocRef = await addDoc(collection(FIRESTORE_DB, 'Users', friend.friendUid, 'Expenses'), combinedData);
                        const fbDocumentId = addDocRef.id;

                        const oldDocumentRef = doc(FIRESTORE_DB, 'Users', friend.friendUid , 'Expenses', fbDocumentId);
                        const newDocumentRef = doc(FIRESTORE_DB, 'Users', friend.friendUid, 'Expenses', newExpenseId);

                        const oldDocumentSnapshot = await getDoc(oldDocumentRef);
                        if (oldDocumentSnapshot.exists()) {
                            const data = oldDocumentSnapshot.data();

                            await setDoc(newDocumentRef, data);
                        }
                        await deleteDoc(oldDocumentRef);
                    });

                }
                console.log("Expense Created");
                setBillData([]);
                setSelectedItems([]);
                setSelectedFriend([]);
                setYourSelectedItems([]);
                router.push({ pathname: '(tabs)' });
            }
            else {
                console.log("No user authenticated");
            }
        } catch (error) {
            console.log("Error logging expense data", error);
        }
    };

    const renderItem = item => {
        return (
        <View style={styles.item}>
            <Text style={styles.selectedTextStyle}>{item.label}</Text>
        </View>
        );
    };

    function goToNextFriend() {

        const filteredItems = selectedItems.map((item) => {
            const modifiedItem = item.replace(/[$\s]|\.00$/g, ''); // Remove $, space, and .00
            const parsedItem = parseFloat(modifiedItem); // Convert to float
            return isNaN(parsedItem) ? item : parsedItem; // Return the parsed item if it's a valid number, otherwise return the original item
          });
        
        const filterSelected = selectedFriend.value;

        // Save the selected data for the current friend
        setBillData([...billData, [filterSelected, filteredItems]]);

        // Clear the selected data for the next friend
        setSelectedItems([]);
        setSelectedFriend([]);
    }

    const deleteBill = (index) => {
        const updatedBillData = [...billData];
        updatedBillData.splice(index, 1);
        setBillData(updatedBillData);
    };

    return (
        <SafeAreaView style={{ flex: 1}}>
          <ScrollView style={{ paddingTop:50 }}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ marginBottom: 20}}>Select your bill</Text>
              <MultiSelect
              style={styles.multiselectdropdown}
              data={rows.map((row) => ({ label: row, value: row }))}
              onChange={(yourSelectedItems) => setYourSelectedItems(yourSelectedItems, ...yourSelectedItems)}
              search
              labelField="label"
              valueField="value"
              placeholder="Select a item"
              value={yourSelectedItems}
              renderItem={renderItem}
              renderSelectedItem={(item, unSelect) => (
                  <TouchableOpacity onPress={() => unSelect && unSelect(item)}>
                  <View style={styles.selectedStyle}>
                      <Text style={styles.textSelectedStyle}>{item.label}</Text>
                  </View>
                  </TouchableOpacity>
              )}
              />
            </View>
            
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
            <Text>Select your friend</Text>
            <Dropdown
                style={styles.dropdown}
                data={friendData.map((friend) => ({ label: `${friend.firstname} ${friend.lastname}`, value: friend }))}
                onChange={(selectedFriend) => setSelectedFriend(selectedFriend)}
                search
                labelField="label"
                valueField="value"
                placeholder="Select a Friend"
                searchPlaceholder="Search..."
                value={selectedFriend}
            />
            <Text style={{ marginBottom: 20}}>Select your friend's bill:</Text>
            <MultiSelect
            style={styles.multiselectdropdown}
            data={rows.map((row) => ({ label: row, value: row }))}
            onChange={(selectedItems) => setSelectedItems(selectedItems, ...selectedItems)}
            search
            labelField="label"
            valueField="value"
            placeholder="Select friends bill"
            value={selectedItems}
            renderItem={renderItem}
            renderSelectedItem={(item, unSelect) => (
                <TouchableOpacity onPress={() => unSelect && unSelect(item)}>
                <View style={styles.selectedStyle}>
                    <Text style={styles.textSelectedStyle}>{item.label}</Text>
                </View>
                </TouchableOpacity>
            )}
            />
           <Button title="Add Friend Bill" onPress={goToNextFriend} />
           <Button title="Submit" onPress={handleCreateExpense}/>


           <ScrollView>
            <View style={billData.length > 0 ? styles.card : null}>
                {billData.length > 0 && (
                billData.map((bill, index) => (
                    <TouchableOpacity key={index}  onPress={() => deleteBill(index)}>
                    <Text>Bill {index + 1}:</Text>
                    <Text>Friend: {bill[0].firstname}</Text>
                    <Text>Items: {bill[1].join(', ')}</Text>
                    </TouchableOpacity>
                ))
                )}
            </View>
           </ScrollView>

        </View>
        </ScrollView>
        </SafeAreaView>
    )
}


const styles = StyleSheet.create({
    dropdown: {
      margin: 16,
      height: 50,
      width: 200,
      borderBottomColor: 'gray',
      borderBottomWidth: 0.5,
    },
    multiselectdropdown: {
        height: 50,
        width: 200,


        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
  
        elevation: 2,
      },
      placeholderStyle: {
        fontSize: 16,
      },
      selectedTextStyle: {
        fontSize: 14,
      },
      iconStyle: {
        width: 20,
        height: 20,
      },
      inputSearchStyle: {
        height: 40,
        fontSize: 16,
      },
      icon: {
        marginRight: 5,
      },
      item: {
        padding: 17,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      selectedStyle: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: 'white',
        shadowColor: '#000',
        marginTop: 8,
        marginRight: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
  
        elevation: 2,
      },
      textSelectedStyle: {
        marginRight: 5,
        fontSize: 16,
      },
      card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,

        elevation: 2,
        },
  });