//imports
import React, { useEffect, useState } from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import {Alert,View,Text,FlatList,Modal,TextInput,Button,Image,StyleSheet,TouchableOpacity,ActivityIndicator,Linking, ScrollView,} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';
import { FIREBASE_STORAGE } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { Platform, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
const cardModalHeight = Platform.OS === 'android' ? height * 0.6 : height * 0.5; // currently made this more suited for android, will change to ios if display still f*cked up
import { collectionGroup, collection, getDocs, addDoc, deleteDoc, doc, query, where, updateDoc, docRef } from 'firebase/firestore';

//States
const FriendPage = () => {
const [isLoading, setIsLoading] = useState(true);
const [userDetails, setUserDetails] = useState([]);
const [filteredDetails, setFilteredDetails] = useState([]);
const [searchText, setSearchText] = useState('');
const [modalVisible, setModalVisible] = useState(false);
const [emailToSearch, setEmailToSearch] = useState('');
const [searchNameResult, setSearchNameResult] = useState('');
const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);
const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
const [isCreditCardModalVisible, setCreditCardModalVisible] = useState(false);
const [cardType, setCardType] = useState('Mastercard');
const [cardNumber, setCardNumber] = useState('');
const [expiryDate, setExpiryDate] = useState('');
const [cvv, setCvv] = useState('');
const [amount, setAmount] = useState('');
const [currentUserDetails, setCurrentUserDetails] = useState(null);
const [isNotificationModalVisible, setNotificationModalVisible] = useState(false);
const [notifications, setNotifications] = useState([]);
const [paymentCategory, setPaymentCategory] = useState('food');
const [paymentDescription, setPaymentDescription] = useState('');
const [categories, setCategories] = useState(["Food", "Travel", "Shopping", "Transport"]);
const [currentOwedAmount, setCurrentOwedAmount] = useState("");
const [numberToSearch, setNumberToSearch] = useState('');
const [incomingFriendRequests, setIncomingFriendRequests] = useState([]);
  
//states for credit card chip and notification bell
const CreditCardChip = () => (
  <Svg width="50" height="32" viewBox="0 0 50 32" fill="none">
    <Rect x="1" y="1" width="48" height="30" rx="4" fill="#D6D6D6"/>
    <Circle cx="8" cy="8" r="2" fill="#333333"/>
    <Circle cx="42" cy="8" r="2" fill="#333333"/>
    <Circle cx="8" cy="24" r="2" fill="#333333"/>
    <Circle cx="42" cy="24" r="2" fill="#333333"/>
  </Svg>
);
const NotificationBellIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path fill="#000" d="M12 22c1.104 0 2-.896 2-2H10c0 1.104.896 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 10-3 0v.68C7.63 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z"/>
  </Svg>
);

//For fetching all user details minus current logged in user, if AddedFriends Subc is populated, fetch nothing if is empty
const fetchAddedFriends = async () => {
  try {
    const auth = getAuth();
    const currentUserEmail = auth.currentUser?.email;
    const currentUserId = auth.currentUser?.uid;
    const addedFriendsCollection = collection(FIRESTORE_DB, `Users/${currentUserId}/AddedFriends`);
    const q = query(addedFriendsCollection, where("addedBy", "==", currentUserEmail));
    const friendsSnapshot = await getDocs(q);
    const friendsArray = await Promise.all(friendsSnapshot.docs.map(async doc => {
      const data = doc.data();
      data.profileImage = await fetchProfileImage(data.uid);  // fetching the profile image
      return data;
    }));

    setUserDetails(friendsArray);
    setFilteredDetails(friendsArray);
  } catch (error) {
    console.error('Error fetching added friends: ', error);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  fetchAddedFriends();
}, []);

const fetchProfileImage = async (userId) => {
  const imageRef = ref(FIREBASE_STORAGE, `profile_pic/${userId}.jpg`);
  try {
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.log('Profile image not found for userId:', userId, error);
    return 'https://png.pngtree.com/png-clipart/20210129/ourmid/pngtree-default-male-avatar-png-image_2811083.jpg'; // default image URL
  }
};

//For removing an added friend
const removeFriend = async (friend) => {
  try {
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
    const addedFriendsCollection = collection(FIRESTORE_DB, `Users/${currentUserId}/AddedFriends`);
    const q = query(addedFriendsCollection, where("email", "==", friend.email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const friendDoc = querySnapshot.docs[0];
      await deleteDoc(doc(FIRESTORE_DB, `Users/${currentUserId}/AddedFriends`, friendDoc.id));
      setUserDetails(prevDetails => prevDetails.filter(user => user.email !== friend.email));
    }
  } catch (error) {
    console.error('Error removing friend: ', error);
  }
};

//For fetching all incoming friend requests, will not display if there are none
useEffect(() => {
  const fetchIncomingFriendRequests = async () => {
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
    const incomingFriendRequestsCollection = collection(FIRESTORE_DB, `Users/${currentUserId}/IncomingFriendRequests`);
    const snapshot = await getDocs(incomingFriendRequestsCollection);
    const requestsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setIncomingFriendRequests(requestsArray);

    if (requestsArray.length) {
      const requesterEmail = requestsArray[0].requesterEmail;
      Alert.alert(
        "Friend Request",
        `You have a friend request from ${requesterEmail}`,
        [
          {
            text: "Accept",
            onPress: () => handleAcceptFriendRequest(requestsArray[0]),
          },
          {
            text: "Decline",
            onPress: () => handleDeclineFriendRequest(requestsArray[0].id),
          },
        ],
          { cancelable: false }
        );
    }
  };
  fetchIncomingFriendRequests();
}, []);

//For handling accepting of friend requests
const handleAcceptFriendRequest = async (request) => {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  const currentUserEmail = auth.currentUser?.email;
  const requesterDetailsSnapshot = await getDocs(query(collectionGroup(FIRESTORE_DB, 'UserDetails'), where("email", "==", request.requesterEmail)));
  const requesterDetails = requesterDetailsSnapshot.docs[0]?.data();
  const recipientDetailsSnapshot = await getDocs(query(collectionGroup(FIRESTORE_DB, 'UserDetails'), where("email", "==", currentUserEmail)));
  const recipientDetails = recipientDetailsSnapshot.docs[0]?.data();

  if (requesterDetails && recipientDetails) {
    await addDoc(collection(FIRESTORE_DB, `Users/${currentUserId}/AddedFriends`), {
    ...requesterDetails,
    addedBy: currentUserEmail
    });
    await addDoc(collection(FIRESTORE_DB, `Users/${request.requesterId}/AddedFriends`), {
    ...recipientDetails,
    addedBy: request.requesterEmail
    });
    await deleteDoc(doc(FIRESTORE_DB, `Users/${currentUserId}/IncomingFriendRequests`, request.id));
    fetchAddedFriends();
  } else {
    console.error("Error fetching UserDetails for requester or recipient.");
  }
};

//For handling declining of friend requests
const handleDeclineFriendRequest = async (requestId) => {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  await deleteDoc(doc(FIRESTORE_DB, `Users/${currentUserId}/IncomingFriendRequests`, requestId));
};

//For retrieving current logged in user's details, for display and payment sending
const getCurrentUserDetails = async () => {
  const auth = getAuth();
  const userEmail = auth.currentUser?.email;

  if (userEmail) {
    try {
      const userDetailsCollectionGroup = collectionGroup(FIRESTORE_DB, 'UserDetails');
      const q = query(userDetailsCollectionGroup, where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setCurrentUserDetails(userData);
        } else {
          console.error("User's email exists in Authentication but not in Firestore UserDetails");
        }
      } catch (error) {
        console.error('Error fetching current user details: ', error);
    }
  }
};

useEffect(() => {
  getCurrentUserDetails();
}, []);

//Effect for search bar, finding user via firstname and lastname (no longer email)
useEffect(() => {
  if (searchText) {
    const results = userDetails.filter(user => {
      const name = `${user.firstname} ${user.lastname}`.toLowerCase();
      return name.includes(searchText.toLowerCase());
    });
    setFilteredDetails(results);
  } else {
    setFilteredDetails(userDetails);
  }
}, [searchText, userDetails]);

// State for Add Friend via email or number
const findUserByEmailOrNumber = async () => {
  setSearchNameResult('');
    
  const auth = getAuth();
  const currentUserEmail = auth.currentUser?.email;
  const currentUserId = auth.currentUser?.uid;

  if (currentUserEmail === emailToSearch.trim()) {
    setSearchNameResult("You cannot add yourself dummy!");
    return; 
  }
  let q;
  const userDetailsCollectionGroup = collectionGroup(FIRESTORE_DB, 'UserDetails');

  if (emailToSearch) {
    q = query(userDetailsCollectionGroup, where("email", "==", emailToSearch));
  } else if (numberToSearch) {
    q = query(userDetailsCollectionGroup, where("number", "==", numberToSearch));
  } else {
    setSearchNameResult("Please input either an email or number.");
    return;
  }
  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      const isUserAlreadyInList = userDetails.some(user => user.email === userData.email);
      if (!isUserAlreadyInList) {
        const incomingFriendRequestsCollection = collection(FIRESTORE_DB, `Users/${userData.uid}/IncomingFriendRequests`);
        await addDoc(incomingFriendRequestsCollection, {
          requesterEmail: currentUserEmail,
          requesterId: currentUserId
        });
        const newNotification = {
          message: `You have sent a friend request to: ${userData.firstname} ${userData.lastname}`,
          timestamp: new Date()
        };
          addNotificationToFirebase(newNotification.message);
        } else {
          setSearchNameResult(`You have already sent a friend request to: ${userData.firstname} ${userData.lastname}`);
        }
          setModalVisible(false);
      } else {
        setSearchNameResult("User not found");
      }
  } catch (error) {
    console.error('Error fetching user by email or number: ', error);
  }
};

// Updated State for CC payment logic
const addExpenseToFirebase = async () => {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  if (!currentUserId) {
    console.error("User is not authenticated!");
    return;
  }

  const timeCreated = new Date().toLocaleString();
  const expenseData = {
    amount: amount,
    category: paymentCategory,
    description: paymentDescription,
    timeCreated: timeCreated,
  };

  try {
    const userExpenseRef = collection(FIRESTORE_DB, `Users/${currentUserId}/Payments`);
    await addDoc(userExpenseRef, expenseData);
    console.log("Expense added successfully for the sender!");

    if (selectedUser) {
      const newNotification = {
        message: `You have paid ${selectedUser.firstname} ${selectedUser.lastname} $${amount}!`,
        timestamp: new Date(),
      };
      addNotificationToFirebase(newNotification.message);
      await updateFriendOwedAndPaid(paymentCategory, parseFloat(amount));
    }
  } catch (error) {
    console.error("Error adding expense:", error);
  }
};

//for updating the amount that the current user still owes for a specific receipt
const updateOwedAmount = async (selectedDescription) => {
  if (!selectedUser || !selectedDescription) {
    console.log("Missing selectedUser or selectedDescription");
    return;
  }

  const [descriptionPart, toPart] = selectedDescription.split(', ');

  console.log(`Selected description: ${descriptionPart}`);
  console.log(`Selected to: ${toPart}`);

  const payeeExpenseRef = collection(FIRESTORE_DB, `Users/${selectedUser.uid}/Expenses`);
  const q = query(payeeExpenseRef);
  const querySnapshot = await getDocs(q);

  for (let doc of querySnapshot.docs) {
    const expenseData = doc.data();
    const transactions = expenseData.transactions || [];
    console.log(`Checking expense with description: ${expenseData.description}`);

    if (expenseData.description !== descriptionPart) continue;

    for (let i = 0; i < transactions.length; i++) {
      console.log(`Checking transaction from user: ${transactions[i].fromUid}`);
      if (transactions[i].fromUid === currentUserDetails.uid) {
        console.log(`Setting currentOwedAmount to: ${transactions[i].transferAmount}`);
        setCurrentOwedAmount(transactions[i].transferAmount);
        return;
      }
    }
  }
};

//for updating the after payment logics and amounts for the respective payer and payee users
const updateFriendOwedAndPaid = async (selectedDescription, sentAmount) => {
  if (!selectedUser) {
    console.error("No selected user available!");
    return;
  }

  const payeeExpenseRef = collection(FIRESTORE_DB, `Users/${selectedUser.uid}/Expenses`);
  const q = query(payeeExpenseRef);
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach(async (doc) => {
    const expenseData = doc.data();
    const transactions = expenseData.transactions || [];
    const friendPayments = expenseData.friendPayments || [];

    let toUid;

    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i].fromUid === currentUserDetails.uid) {
        const newTransferAmount = parseFloat(transactions[i].transferAmount) - sentAmount;
        transactions[i].transferAmount = newTransferAmount.toString();
        toUid = transactions[i].toUid;

        await updateDoc(doc.ref, {
          transactions: transactions,
        });
        console.log(`Updated transferAmount to: ${newTransferAmount}`);
      }
    }

    for (let i = 0; i < friendPayments.length; i++) {
      if (friendPayments[i].friendUid === currentUserDetails.uid) {
        const newFriendOwes = parseFloat(friendPayments[i].friendOwes) - sentAmount;
        const newFriendPaidFirst = parseFloat(friendPayments[i].friendPaidFirst || "0") + sentAmount;

        friendPayments[i].friendOwes = newFriendOwes.toString();
        friendPayments[i].friendPaidFirst = newFriendPaidFirst.toString();

        await updateDoc(doc.ref, {
          friendPayments: friendPayments,
        });

        console.log(`Updated friendOwes to: ${newFriendOwes}`);
        console.log(`Updated friendPaidFirst to: ${newFriendPaidFirst}`);
      }

      if (toUid && friendPayments[i].friendUid === toUid) {
        const newFriendIsOwed = parseFloat(friendPayments[i].friendIsOwed || "0") - sentAmount;
        const newFriendPaidFirstForPaidUser = parseFloat(friendPayments[i].friendPaidFirst || "0") - sentAmount;

        friendPayments[i].friendIsOwed = newFriendIsOwed.toString();
        friendPayments[i].friendPaidFirst = newFriendPaidFirstForPaidUser.toString();

        await updateDoc(doc.ref, {
          friendPayments: friendPayments,
        });

        console.log(`Updated friendIsOwed for paid user to: ${newFriendIsOwed}`);
        console.log(`Updated friendPaidFirst for paid user to: ${newFriendPaidFirstForPaidUser}`);
      }
    }
  });
};

//For handling notification stuff when bell icon is clicked
const handleNotificationIconClick = async () => {
  await fetchNotificationsFromFirebase();  
  setNotificationModalVisible(true);
};

//For adding notification to firebase
const addNotificationToFirebase = async (message) => {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid; 
  
  if (!currentUserId) {
    console.error("User is not authenticated!");
    return;
  }

  const notificationData = {
    message: message,
    timestamp: new Date()
  };

  try {
    const userNotificationRef = collection(FIRESTORE_DB, `Users/${currentUserId}/Notifications`);
    await addDoc(userNotificationRef, notificationData);
    console.log("Notification added successfully!");
  } catch (error) {
    console.error("Error adding notification:", error);
  }
};

//For fetching notifications from firebase
const fetchNotificationsFromFirebase = async () => {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  
  if (!currentUserId) {
    console.error("User is not authenticated!");
    return;
  }

  try {
    const userNotificationRef = collection(FIRESTORE_DB, `Users/${currentUserId}/Notifications`);
    const querySnapshot = await getDocs(userNotificationRef);
    console.log("Yep notifications");
    
    const fetchedNotifications = querySnapshot.docs.map(doc => {
      return {
        ...doc.data(),
        id: doc.id 
      }
    });
    setNotifications(fetchedNotifications);

  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
  
};
  useEffect(() => {
  fetchNotificationsFromFirebase();
}, []);

//For deleting notifications from firebase
const deleteNotificationFromFirebase = async (notificationId) => {
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  if (!currentUserId) {
    console.error("User is not authenticated!");
    return;
  }

  try {
    const notificationRef = doc(FIRESTORE_DB, `Users/${currentUserId}/Notifications`, notificationId);
    await deleteDoc(notificationRef);
    console.log("Notification deleted successfully!");
    setNotifications(prevNotifications => prevNotifications.filter(notif => notif.id !== notificationId));
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};

//For checking for a match between names to fetch appropriate payments
const matchFriendNameWithFirstName = async () => {
  if (!selectedUser) {
    console.error("No selected user available!");
    return;
  }

  const payeeExpenseRef = collection(FIRESTORE_DB, `Users/${selectedUser.uid}/Expenses`);
  const q = query(payeeExpenseRef);
  const querySnapshot = await getDocs(q);
  const matchedDescriptions = [];

  for (let doc of querySnapshot.docs) {
    const transactions = doc.data().transactions || [];
    for (let transaction of transactions) {
      if (transaction.fromUid === currentUserDetails.uid) {
        matchedDescriptions.push(`${doc.data().description}, ${transaction.to}`);
      }
    }
  }

  if (matchedDescriptions.length) {
    setCategories(matchedDescriptions);
  }
};

useEffect(() => {
  if (isCreditCardModalVisible) {
    matchFriendNameWithFirstName();
  }
}, [isCreditCardModalVisible]);

//Loading circle before page loads, plus page's display and design, and all modals respectively
if (isLoading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0088cc" />
    </View>
  );
}

  //all the modals
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.addFriendButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addFriendText}>Add Friend</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Friends</Text>
      <View style={styles.bellIconContainer}>
      <TouchableOpacity onPress={handleNotificationIconClick}>
        <NotificationBellIcon />
      </TouchableOpacity> 
      </View>
      </View>
      { currentUserDetails && <Text style={styles.welcomeText}>
        Hello there, {currentUserDetails.firstname} {currentUserDetails.lastname}!
      </Text>
      }
      <TextInput style={styles.searchBar} placeholder="Search by name..." value={searchText} onChangeText={setSearchText}/>
      <FlatList data={filteredDetails} keyExtractor={(item, index) => index.toString()} renderItem={({ item: detailItem }) => (
          <View style={styles.userDetailContainer}>
            <Image source={{ uri: detailItem.profileImage || 'https://png.pngtree.com/png-clipart/20210129/ourmid/pngtree-default-male-avatar-png-image_2811083.jpg' }}
              style={styles.avatar}
            />
            <View style={styles.nameEmailContainer}>
              <View style={styles.nameContainer}>
                <Text style={styles.firstname}>{detailItem.firstname}</Text>
                <Text style={styles.lastname}>{detailItem.lastname}</Text>
              </View>
              <Text style={styles.email}>{detailItem.email}</Text>
            </View>
            <View style={styles.actionButtonsContainer}>
  <TouchableOpacity style={styles.sendMoneyButton} onPress={() => {
    setSelectedUser(detailItem);
    setConfirmModalVisible(true);}}
    >   
    <Text style={styles.sendMoneyButtonText}>Send Money</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.removeFriendButton} onPress={() => removeFriend(detailItem)}>
    <Text style={styles.removeFriendButtonText}>Remove Friend</Text>
  </TouchableOpacity>
</View>
          </View>
        )}
      />
<Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => {
  setModalVisible(!modalVisible);
  }}>
    <View style={styles.backdrop}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TextInput style={styles.modalInput} placeholder="Enter friend's email" placeholderTextColor='white' value={emailToSearch} onChangeText={setEmailToSearch}/>
          <TextInput style={styles.modalInput} placeholder="Enter friend's number" placeholderTextColor='white' value={numberToSearch} onChangeText={setNumberToSearch}/>
          <View style={styles.modalButtonContainer}>
          <View style={styles.modalButton}>
          <Button title="Submit" onPress={findUserByEmailOrNumber} />
          </View>
          <View style={styles.modalButton}>
          <Button title="Close" onPress={() => {setModalVisible(false); setSearchNameResult(''); setEmailToSearch(''); setNumberToSearch('');}} />
          </View>
          </View>
          <Text style={styles.searchResultText}>{searchNameResult}</Text>
          </View>
        </View>
    </View>
</Modal>
<Modal animationType="fade" transparent={true} visible={isConfirmModalVisible} onRequestClose={() => {
  setConfirmModalVisible(false);
  }}>
  <View style={styles.backdrop}>
  <View style={styles.centeredView}>
  <View style={styles.modalView}>
    {selectedUser && (<><Text style={styles.confirmationUserText}>{`Name: ${selectedUser.firstname} ${selectedUser.lastname}`}</Text>
      <Text style={styles.confirmationUserText}>{`Email: ${selectedUser.email}`}</Text></>
    )}
      <Text style={styles.confirmationText}>Are you sure you want to send money to the above user?</Text>
      <View style={styles.modalButtonContainer}>
      <View style={styles.modalButton}>
      <Button title="Yes" onPress={() => {
      setConfirmModalVisible(false);
      setPaymentModalVisible(true);  
    }} />
  </View>
  <View style={styles.modalButton}>
    <Button title="No" onPress={() => {
      setSelectedUser(null);
      setConfirmModalVisible(false);
    }} />
  </View>
</View>
</View>
</View>
</View>
</Modal>

<Modal animationType="fade" transparent={true} visible={isPaymentModalVisible} onRequestClose={() => {setPaymentModalVisible(false);}}>
  <View style={styles.backdrop}>
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <Text style={styles.paymentMethodText}>Choose a Payment Method</Text>
        <TouchableOpacity style={styles.paymentMethodButton} onPress={() => {
          Linking.openURL('https://www.paypal.com/signin');
          setPaymentModalVisible(false);
        }}
        >
        <Text style={styles.paymentMethodButtonText}>Paypal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.paymentMethodButton}  onPress={async () => {
          setPaymentModalVisible(false);
          setCreditCardModalVisible(true);
        }}
      >
      <Text style={styles.paymentMethodButtonText}>Credit Card</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelPaymentButton} onPress={() => {
        setPaymentModalVisible(false);
    }}
>
    <Text style={styles.cancelPaymentButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>
</Modal>

<Modal animationType="fade" transparent={true} visible={isCreditCardModalVisible} onRequestClose={() => setCreditCardModalVisible(false)}>
  <ScrollView>
  <View style={styles.creditCardModalView}>
  <View style={styles.topStripe} />
  <View style={styles.cardLogo}>
  <CreditCardChip />
  </View>
  <View style={styles.contentWrapper}>
    <Picker selectedValue={cardType} style={styles.pickerStyle} onValueChange={(itemValue, itemIndex) => setCardType(itemValue)}>
      <Picker.Item label="Mastercard" value="Mastercard" />
      <Picker.Item label="Visa" value="Visa" />
      <Picker.Item label="American Express" value="American Express" />
    </Picker>
    
    <TextInput placeholderTextColor="white" style={styles.inputStyle} placeholder="Card Number" value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad"/>
    <TextInput style={styles.inputStyle} placeholder="Expiry Date (MM/YY)" value={expiryDate} onChangeText={setExpiryDate}/>
    <TextInput style={styles.inputStyle} placeholder="CVV" value={cvv} onChangeText={setCvv} keyboardType="number-pad" maxLength={4}/>
    <TextInput style={styles.inputStyle} placeholder={`Amount (You currently still owe $${currentOwedAmount})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad"/>
    <Picker selectedValue={paymentCategory} style={styles.pickerStyle} onValueChange={async (itemValue, itemIndex) => {
    console.log("Picker selected:", itemValue);
    setPaymentCategory(itemValue);
    await updateOwedAmount(itemValue);
    }}>
    {categories.map((category, index) => <Picker.Item key={index} label={category} value={category} />)}
    </Picker>

  <TextInput style={styles.inputStyle} placeholder="Description" value={paymentDescription} onChangeText={setPaymentDescription}/>
  <View style={styles.modalButtonContainer}>
  <View style={styles.modalButton}>
    <Button title="Send Payment" onPress={async() => {
      await addExpenseToFirebase();
      setCreditCardModalVisible(false);
    }} />
  </View>
  <View style={styles.modalButton}>
    <Button title="Cancel Payment" onPress={() => setCreditCardModalVisible(false)} />
  </View>
  </View>
  </View>
  </View>
</ScrollView>
</Modal>

<Modal animationType="slide" transparent={true} visible={isNotificationModalVisible} onRequestClose={() => setNotificationModalVisible(false)}>
  <View style={styles.notificationModalContainer}>
    <Text style={styles.notificationModalHeader}>Notifications</Text>
    <FlatList data={notifications} keyExtractor={(item, index) => item.id} renderItem={({ item: notification }) => (
        <View style={styles.notificationItem}>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationTimestamp}>
          {notification.timestamp?.toDate().toLocaleString()}
          </Text>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotificationFromFirebase(notification.id)}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    />
    <TouchableOpacity style={styles.closeButton} onPress={() => setNotificationModalVisible(false)}>
      <Text style={styles.closeButtonText}>Close</Text>
    </TouchableOpacity>
  </View>
</Modal>
</View>
  );
};

//stylesheet for respective parts for the page
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
    padding: width * 0.08,  // 2% of screen width
    paddingHorizontal: 4,
  },
  header: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#0088cc'
  },
  searchBar: {
    marginHorizontal: width * 0.02,
    padding: width * 0.03,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    marginBottom: 10
  },
  userDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: width * 0.03,
    marginHorizontal: width * 0.02,
    marginBottom: height * 0.01,
    borderRadius: 10,
    minHeight: height * 0.1,  // 10% of screen height
    flex: 1,
  },
  avatar: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    marginRight: 10,
    overflow: 'hidden'
  },
  nameEmailContainer: {
    flex: 1
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  firstname: {
    marginRight: 5,
    fontWeight: 'bold'
  },
  lastname: {
    fontWeight: 'bold'
  },
  email: {
    color: 'gray',
    fontSize: 12
  },
  addFriendButton: {
    backgroundColor: '#5682A3',
    paddingHorizontal: width * 0.01,
    paddingVertical: 5,
    borderRadius: 5,
  },
  addFriendText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalInput: {
    width: 200,
    borderWidth: 1,
    borderColor: 'gray',
    backgroundColor: 'gray',
    marginBottom: 10,
    borderRadius: 5,
    padding: 5,
    color: 'white'
  },
  searchResultText: {
    margin: 10
  },
  modalButtonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10
  },
  modalButton: {
    margin: 5,  
  },
  searchResultText: {
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
  },
  actionButtonsContainer: {
    marginTop: 10,  // Adds some spacing from the email to the buttons
  },
  sendMoneyButton: {
    backgroundColor: '#50A626',
  paddingVertical: 5,
  paddingHorizontal: 10,
  borderRadius: 8,
  marginBottom: 5, // Adds a gap between the "Send Money" and "Remove Friend" buttons
  },
  sendMoneyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  removeFriendButton: {
    backgroundColor: '#D32F2F',
  paddingVertical: 5,
  paddingHorizontal: 10,
  borderRadius: 8,
  marginTop: 5, // Ensures a gap between the "Send Money" and "Remove Friend" buttons
},
removeFriendButtonText: {
    color: 'white',
    fontWeight: 'bold',
},
  confirmationText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationUserText: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'left',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20
},
paymentMethodButton: {
    backgroundColor: '#4E9F3D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10
},
paymentMethodButtonText: {
    color: 'white',
    fontWeight: 'bold'
},
button: {
  padding: 10,
  borderRadius: 8,
  backgroundColor: '#007AFF',  
  width: '48%', 
  alignItems: 'center'  
},
buttonText: {
  color: 'white',
  fontWeight: 'bold'
},
cancelPaymentButton: {
  backgroundColor: '#FF3B30',  
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center'  
},
cancelPaymentButtonText: {
  color: 'white',
  fontWeight: 'bold'
},
creditCardModalView: {
  backgroundColor: '#292929',  
  borderRadius: 15,
  padding: 20,
  position: 'relative',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
  backgroundImage: 'linear-gradient(to bottom, #4B79A1, #283E51)',
},
pickerStyle: {
  width: '100%',
  marginBottom: 1
},
inputStyle: {
  width: '100%',
  padding: width * 0.02,
  fontSize: width * 0.04,
  color: 'white',
  textShadowColor: 'rgba(0, 0, 0, 0.2)',  
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 1,
},
backdrop: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)' 
},
topStripe: {
  height: 7,
  backgroundColor: '#333',  
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
},
cardLogo: {
  position: 'absolute',
  top: 15,
  left: 15,
  width: 40,
  height: 30,
  backgroundColor: 'white',
  borderRadius: 5,
  justifyContent: 'center',
  alignItems: 'center',
},
logoText: {
  color: '#283E51', 
  fontWeight: 'bold',
},
contentWrapper: {
  marginTop: 50,  
  width: '100%',
  alignItems: 'center',
},
welcomeText: {
  fontSize: 18,
  fontWeight: 'bold',
  marginVertical: 10,
},
headerContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingTop: 10,
  marginLeft: -10,
},
bellIconContainer: {
  padding: 10,
},
notificationModalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.7)', 
},
notificationModalHeader: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#FFF',
  marginBottom: 10,
},
notificationItem: {
  width: '80%',
  backgroundColor: '#FFF',
  padding: 15,
  marginBottom: 10,
  borderRadius: 5,
  shadowColor: "#000",
  shadowOffset: {
      width: 0,
      height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
notificationMessage: {
  fontSize: 16,
  marginBottom: 5,
},
notificationTimestamp: {
  fontSize: 12,
  color: 'gray',
},
closeButton: {
  backgroundColor: '#0088cc',
  padding: 10,
  borderRadius: 5,
  margin: 50,
},
closeButtonText: {
  color: '#FFF',
  fontWeight: 'bold',
},
});

//export the page
export default FriendPage;
