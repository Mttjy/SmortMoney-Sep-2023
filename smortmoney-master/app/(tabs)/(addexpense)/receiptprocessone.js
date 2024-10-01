import { View, Text, Button, TouchableOpacity, Image, TextInput, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../firebaseConfig';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { Dropdown, MultiSelect  } from 'react-native-element-dropdown';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const AddExpensePage = () => {
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState(null);
  const [friendData, setFriendData] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState([]);


  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTotalBill, setSelectedTotalBill] = useState(null);
  const [description, setDescription] = useState('');

  const { photo } = useLocalSearchParams();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const user = FIREBASE_AUTH.currentUser;
  
        if (user) {
          const userId = user.uid;
          const categoryReference = collection(FIRESTORE_DB, 'Users', userId, 'Expenses');
          const profileReference = collection(FIRESTORE_DB, 'Users', userId, 'UserDetails');

          const query = await getDocs(categoryReference);
          const profileQuery = await getDocs(profileReference);
          const categorySet = new Set();
  
          query.docs.forEach((doc) => {
            categorySet.add(doc.data().category);
          });

          profileQuery.docs.forEach((doc) => {
            setUser(doc.data());
          });
  
          const uniqueCategory = Array.from(categorySet);
          setCategories(uniqueCategory);
        } else {
          console.log("No user authenticated");
        }
      } catch (error) {
        console.log(error);
      }
    };
  
    fetchCategory();
  }, []);

  useEffect(() => {
    async function fetchData() {
        try {
            const uid = await fetchID();
            await fetchUserData(uid);
            await processImage(photo);
            setIsLoading(false); 
        } catch (error) {
            console.log(error);
        }
    }
    fetchData();
}, []);


async function fetchID() {
    const user = FIREBASE_AUTH.currentUser;
    const uid = user.uid;
    setUserId(uid);
    return uid; // Return the uid
}

async function fetchUserData(uid) {
    try {
        const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'Users', uid, 'AddedFriends'));
        const fetchedFriendData = [];

        querySnapshot.forEach((doc) => {
            fetchedFriendData.push(doc.data());
        });

        setFriendData(fetchedFriendData);
    } catch (error) {
        console.log(error);
    }
}

  async function processImage(imagelink) {
    const apiKey = 'AIzaSyBtRbf1jTp91uY2GAOmabR0aEKdTQzsZNQ';
    const imageUrl = imagelink;
    console.log('Processing image:', imageUrl);
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const base64Image = await FileSystem.readAsStringAsync(imageUrl, {
        encoding: FileSystem.EncodingType.Base64,
    });

    const requestData = {
    requests: [
        {
        image: {
            content: base64Image,
        },
        features: [
            {
            type: 'TEXT_DETECTION',
            },
        ],
        },
    ],
    };

    try {
    const response = await axios.post(apiUrl, requestData);
    const result = response.data.responses[0];
    const textAnnotations = result.textAnnotations;
    const descriptions = textAnnotations.slice(1).map((annotation) => annotation.description);
    const boundingPolys = textAnnotations.slice(1).map((annotation) => annotation.boundingPoly);
    const rows = [];
    let currentRow = [];
    let previousY = boundingPolys[0].vertices[0].y;
  
    for (let i = 0; i < descriptions.length; i++) {
      const y = boundingPolys[i].vertices[0].y;
  
      if (Math.abs(y - previousY) < 10) {
        currentRow.push(descriptions[i]);
      } else {
        rows.push(currentRow.join(' ')); // Join the descriptions in the current row
        currentRow = [descriptions[i]];
      }
      previousY = y;
    }
  
    rows.push(currentRow.join(' ')); 
    setRows(rows); 
  } catch (error) {
      console.error('Error:', error.message);
  }}

  const receiptProcessOneSubmit = async () => {

    const userPaymentData = {
      friendIsOwed: selectedTotalBill,
      friendPhone: user.number,
      friendName: user.firstname + " " + user.lastname,
      friendOwes: 0,
      friendPaid: 0,
      friendPaidFirst: selectedTotalBill,
      friendUid: userId,
    }


    navigation.navigate('receiptprocesstwo', {
      selectedCategory: selectedCategory,
      selectedTotalBill: selectedTotalBill,
      rows: rows,
      description: description,
      selectedFriends: selectedFriend,
      userPaymentData: userPaymentData,
    });
  }

  const renderItem = item => {
    return (
    <View style={styles.item}>
        <Text style={styles.selectedTextStyle}>{item.label}</Text>
    </View>
    );
  };  

  return (
    <SafeAreaView style={styles.container}>
      { isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" /> 
      ) : (
        <ScrollView>
          <View>
          <Text>Select a category</Text>
          <Dropdown 
            style={styles.dropdown}
            data={categories.map((category) => ({ label: category, value: category }))}
            search
            labelField="label"
            valueField="value"
            placeholder="Select a category"
            searchPlaceholder="Search..."
            value={selectedCategory}
            onChange={(selectedCategory) => setSelectedCategory(selectedCategory.value)}
            />
          </View>

        <View>
        <Text>Select Total Bill Amount</Text>
        <Dropdown 
          style={styles.dropdown}
          data={rows.map((row) => ({ label: row, value: row }))}
          search
          labelField="label"
          valueField="value"
          placeholder="Select a category"
          searchPlaceholder="Search..."
          value={selectedTotalBill}
          onChange={(selectedTotalBill) => setSelectedTotalBill(selectedTotalBill.value)}
          />
        </View>


        <Text style={{ marginTop: 50 }}> Description</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="Description" style={{borderWidth: 1, borderColor: 'black', height: 100, width: 200}}/>

        <View style={{ marginTop: 50 }}>
        <Text>Shared With Friends</Text>
        <MultiSelect
          style={styles.multiselectdropdown}
          data={friendData.map((friend) => ({ label: `${friend.firstname} ${friend.lastname}`, value: friend }))}
          onChange={(selectedFriend) => setSelectedFriend(selectedFriend, ...selectedFriend)}
          search
          labelField="label"
          valueField="value"
          placeholder="Select Friends"
          searchPlaceholder="Search..."
          value={selectedFriend}
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



        <Button title="Next" onPress={receiptProcessOneSubmit} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default AddExpensePage


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
});



// return (
//   <SafeAreaView style={{ justifyContent: 'center', alignItems: 'center' }}>
//     { isLoading ? (
//       <ActivityIndicator size="large" color="#0000ff" /> 
//     ) : (
//       <View>
//         <Text>Test</Text>
//       </View>
//     )}

//   </SafeAreaView>
// )




