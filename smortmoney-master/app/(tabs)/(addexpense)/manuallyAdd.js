import { View, Text, TextInput, Button, StyleSheet, Keyboard, TouchableWithoutFeedback, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import CheckBox from 'expo-checkbox';
import React, { useState, useEffect } from 'react'
import { addDoc, getDocs, collection, query, where } from 'firebase/firestore'
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../../firebaseConfig'
import { useNavigation } from '@react-navigation/native';

export default function ManuallyAddPage () {
    const navigation = useNavigation();

    const [isNewCategory, setIsNewCategory] = useState(true);
    const [category, setCategory] = useState('');
    const [existingCategories, setExistingCategories] = useState([]);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [sharedWith, setSharedWith] = useState('');
    const [sharedWithInfo, setSharedWithInfo] = useState([]);
    const [friends, setFriends] = useState([]);
    const [isFormValid, setIsFormValid] = useState(false);
    const [searchText, setSearchText] = useState('');
    

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
          // clear input fields after submitting in expense ratio page
          setCategory('');
          setAmount('');
          setDescription('');
          setSharedWith('');
          setSharedWithInfo('');
          loadFriendList();
        });
    
        // cleanup the subscription when the component is unmounted
        return unsubscribe;
      }, [navigation]);

    useEffect(() => {
        const fetchCategory = async () => {
          try {
            const user = FIREBASE_AUTH.currentUser;
      
            if (user) {
              const userId = user.uid;
              const categoryReference = collection(FIRESTORE_DB, 'Users', userId, 'Expenses');
      
              const query = await getDocs(categoryReference);
              // use Set here to ensure category is unique and no duplicate will be displayed
              const categorySet = new Set();
      
              query.docs.forEach((doc) => {
                categorySet.add(doc.data().category);
              });
      
              const uniqueCategory = Array.from(categorySet);
              setExistingCategories(uniqueCategory);
            }
      
            else {
              console.log("No user authenticated");
            }
      
          } catch (error) {
            console.log('Error fetching category');
          }
        }
      
        fetchCategory();
      }, []);



    const validateForm = () => {
      return !!category && !!amount && !!description;
    };

    useEffect(() => {
      setIsFormValid(validateForm());
    }, [category, amount, description]);

    const handleSettleDebt = () => {
        // navigate back to settle debts page
        navigation.navigate('settleDebtsPage');
    };
    
    // to dismiss keyboard
    const handleDismissKeyboard = () => {
        Keyboard.dismiss();
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
            return currentUserInfo;
            } else {
            console.log("User details not found");
            }
        }
        } catch (error) {
        console.error('Error fetching current user details:', error);
        }
    }

    const handleExpenseRatioSubmit = async () => {
        try {
        const currentUserInfo = await fetchCurrentUserDetails();
    
        if(currentUserInfo) {
            const sharedWithInfoAndUserInfo = [...sharedWithInfo, currentUserInfo];
    
          if (isFormValid) {
            navigation.navigate('expenseRatio', {
              totalAmount: amount,
              splitWith: sharedWithInfoAndUserInfo,
              expenseData: {
                category,
                description,
              },
              currentUserInfo,
            });
          } else {
            alert('Please input all text input correctly')
          }
        }
        } catch (error) {
        console.error('Error handling expense ratio submit:', error);
        }
        
    };
    

    const loadFriendList = async (searchText = '') => {
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
                firstName: friendInfo.firstname,
                lastName: friendInfo.lastname,
            });
            });

          const filteredFriends = searchText
            ? friendsData.filter((friend) =>
              `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(searchText.toLowerCase())
            )
            : friendsData;
    
          setFriends(filteredFriends);
    
        } else {
            console.log("No user authenticated");
        }
        } catch (error) {
        console.error('Error fetching friends:', error);
        }
    };

    const handleFriendSelection = (friend) => {
        if (sharedWith.includes(friend.uid)) {
            setSharedWith(sharedWith.filter((item) => item !== friend.uid));
            setSharedWithInfo(sharedWithInfo.filter((item) => item.uid !== friend.uid));
        }
        if (sharedWith.includes(friend.uid)) {
            setSharedWith(sharedWith.filter((item) => item !== friend.uid));
            setSharedWithInfo(sharedWithInfo.filter((item) => item.uid !== friend.uid));
        }
        else {
            setSharedWith([...sharedWith, friend.uid]);
            setSharedWithInfo([...sharedWithInfo,
              {
                uid: friend.uid,
                email: friend.email,
                name: `${friend.firstName} ${friend.lastName}`,
                phone: friend.phone,
              },
            ]);
        }
    }
    
    

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <ScrollView>
    <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
      <View style={styles.container}>
        <Text style={styles.header}>Add Expense</Text>
  
        <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.customButton, isNewCategory ? styles.activeButton : {}]} onPress={() => setIsNewCategory(true)}>
          <Text style={styles.buttonText}>New Category</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.customButton, !isNewCategory ? styles.activeButton : {}]} onPress={() => setIsNewCategory(false)}>
          <Text style={styles.buttonText}>Existing Category</Text>
        </TouchableOpacity>
        </View>
          
        {isNewCategory ? (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Create New Category:</Text>
            <TextInput
              value={category}
              onChangeText={(text) => setCategory(text)}
              placeholder="Enter Category"
              style={styles.input}
              required
            />
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Existing Category:</Text>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={styles.picker}
            >
              <Picker.Item key="default" label="Select Category" value="" />
              {existingCategories.map((existingCategory) => (
                <Picker.Item key={existingCategory} label={existingCategory} value={existingCategory} />
              ))}
            </Picker>
          </View>
        )}
  
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount:</Text>
          <TextInput
            value={amount}
            onChangeText={(text) => setAmount(text)}
            placeholder="Enter Amount"
            keyboardType="numeric"
            style={styles.input}
            required
          />
        </View>
  
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description:</Text>
          <TextInput
            value={description}
            onChangeText={(text) => setDescription(text)}
            placeholder="Enter Description"
            multiline={true}
            numberOfLines={3}
            style={styles.descInput}
            required
          />
        </View>
  
        <TextInput
          placeholder="Search friends"
          style={styles.searchInput}
          value={searchText}
          onChangeText={(text) => {
          setSearchText(text);
          loadFriendList(text);
          }}
        />
        <Text style={styles.label}>Shared With:</Text>
        <ScrollView style={styles.scrollView}>
          {friends.map((friend) => (
            <View key={friend.uid} style={styles.sharedWithContainer}>
              <CheckBox
                value={sharedWith.includes(friend.uid)}
                onValueChange={() => handleFriendSelection(friend)}
              />
              <Text style={styles.friendText}>
                {friend.firstName} {friend.lastName} {'\n'}Phone: {friend.phone}
              </Text>
            </View>
          ))}
        </ScrollView>
  
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.customButton, styles.greenButton]} onPress={handleExpenseRatioSubmit}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.customButton, styles.redButton]} onPress={handleSettleDebt}>
            <Text style={styles.buttonText}>Settle Debt</Text>
          </TouchableOpacity>
        </View>
  
      </View>
    </TouchableWithoutFeedback>
    </ScrollView>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      backgroundColor: '#f5f5f5',
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#0088cc',
      marginVertical: 20,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center', // Center the buttons in the container
      alignItems: 'center',
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 15,
    },
    label: {
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
    descInput: {
      borderWidth: 1,
      borderColor: '#CCCCCC',
      borderRadius: 5,
      padding: 5,
      marginBottom: 10,
      height: 80,
      textAlignVertical: 'top',
      backgroundColor: 'rgba(255, 255, 255, 0.7)',  // white with 70% opacity
    },
    picker: {
      backgroundColor: 'white',
      marginBottom: 15,
    },
    scrollView: {
      flex: 1,
      marginBottom: 20,
    },
    sharedWithList: {
      marginBottom: 20,
    },
    sharedWithContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderBottomWidth: 1,
      borderColor: '#e0e0e0',
    },
    friendText: {
      marginLeft: 10,
      fontSize: 16,
    },
    actionButtons: {
      marginVertical: 10,
    },
    customButton: {
      flex: 1,  // Allow the buttons to take up equal space
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      margin: 5,  // Adjusted margin to ensure space between the buttons
      borderWidth: 1,
      borderColor: '#CCCCCC',
      backgroundColor: '#CCCCCC',
    },
    activeButton: {
      backgroundColor: '#007BFF',
    },
    greenButton: {
      backgroundColor: 'green',
    },
    redButton: {
      backgroundColor: '#ff3300',
    },
    bluishButton: {
      backgroundColor: '#0088cc',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    searchInput: {
      borderWidth: 1,
      borderColor: '#CCCCCC',
      borderRadius: 5,
      padding: 5,
      marginBottom: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
  });
  