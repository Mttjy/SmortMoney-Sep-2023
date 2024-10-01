import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, } from 'react-native';
import { doc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';

const readExpenseDoc = () => {

    const navigation = useNavigation();
    const route = useRoute();

    const { expenseId } = route.params;
    const [expenseData, setExpenseData] = useState(null);
    const [currentUserInfo, setCurrentUserInfo] = useState([]);

    const fetchExpenseDoc = async () => {
        try {
            const user = FIREBASE_AUTH.currentUser;

            if (user) {
                const userId = user.uid;

                const expenseRef = doc(FIRESTORE_DB, 'Users', userId, 'Expenses', expenseId);
                const expenseSnapshot = await getDoc(expenseRef);

                if (expenseSnapshot.exists()) {
                    const data = expenseSnapshot.data();
                    setExpenseData(data);
                } else {
                    console.log('Expense not found');
                }
            } else {
                console.log("No authenticated user found");
            }
        } catch (error) {
            console.error('Error fetching expense data', error);
        }
    };

    const fetchCurrentUserDetails = async () => {
        try {
            const user = FIREBASE_AUTH.currentUser;

            if (user) {
                const userId = user.uid;
                const userDetailsRef = collection(FIRESTORE_DB, 'Users', userId, 'UserDetails');
                const userDetailsSnapshot = await getDocs(userDetailsRef);

                if (!userDetailsSnapshot.empty) {
                    const userDetailsDoc = userDetailsSnapshot.docs[0];
                    const userDetails = userDetailsDoc.data();
                    const currentUserInfo = {
                        uid: userId,
                        email: userDetails.email,
                        name: `${userDetails.firstname} ${userDetails.lastname}`,
                        phone: userDetails.number,
                    };
                    setCurrentUserInfo(currentUserInfo);
                    console.log(currentUserInfo);
                } else {
                    console.log("User details not found");
                }
            }
        } catch (error) {
            console.error('Error fetching current user details:', error);
        }
    }

    const handleDeleteButton = () => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this expense?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    onPress: () => handleDeleteExpense(),
                },
            ],
            { cancelable: false }
        );
    };

    const handleDeleteExpense = async () => {
        try {
            const user = FIREBASE_AUTH.currentUser;

            if (user) {
                const userId = user.uid;

                if (expenseData.friendPayments) {
                    for (const friend of expenseData.friendPayments) {
                        const friendExpenseRef = doc(FIRESTORE_DB, 'Users', friend.friendUid, 'Expenses', expenseId);
                        await deleteDoc(friendExpenseRef);
                    }
                } else {
                    const userExpenseRef = doc(FIRESTORE_DB, 'Users', currentUserInfo.uid, 'Expenses', expenseId);
                    await deleteDoc(userExpenseRef);
                }
                alert('Expense successfully deleted');
                navigation.navigate('expense');
            } else {
                console.log("No authenticated user found");
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    useEffect(() => {
        fetchExpenseDoc();
        fetchCurrentUserDetails();
    }, []);

    return (
        <View style={styles.container}>
            {expenseData ? (
                <View>
                    <Text style={{ fontWeight: 'bold' }}>
                        Expense ID: {expenseId} {'\n'}
                        Category: {expenseData.category} {'\n'}
                        Description: {expenseData.description} {'\n'}
                        Total Amount: ${expenseData.totalAmount} {'\n'}
                        {'\n'}
                    </Text>

                    {expenseData.friendPayments ? (
                        expenseData.friendPayments.map((friend, index) => (
                            <View key={index} style={styles.borderForFriendDisplay}>
                                <Text>Name: {friend.friendName}</Text>
                                <Text>Phone: {friend.friendPhone}</Text>
                                <Text>Paid For Bill: {friend.friendPaidFirst}</Text>
                                <Text>Actual Share: {friend.friendPaid}</Text>
                                <Text>{'\n'}</Text>
                            </View>
                        ))

                    ) : (
                        <View style={styles.borderForFriendDisplay}>
                            <Text>Name: {currentUserInfo.name}</Text>
                            <Text>Phone: {currentUserInfo.phone}</Text>
                            <Text>Paid For Bill: {expenseData.totalAmount}</Text>
                            <Text>Actual Share: {expenseData.userAmountPaid}</Text>
                            <Text>{'\n'}</Text>
                        </View>
                    )}

                    <Button
                        title="See More Details"
                        onPress={() => {
                            navigation.navigate('seeMoreExpenseDetails', { expenseId, expenseData, currentUserInfo });
                        }}
                        color="green"
                    />

                    <Button
                        title="Edit Expense"
                        onPress={() => {
                            navigation.navigate('editExpense', { expenseId, expenseData, currentUserInfo });
                        }}
                    />

                    <Button
                        title="Delete Expense"
                        onPress={handleDeleteButton}
                        color="red"
                    />
                </View>
            ) : (
                <Text>Loading...</Text>
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

export default readExpenseDoc;
