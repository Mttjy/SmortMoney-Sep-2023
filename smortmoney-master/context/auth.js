import { router, useSegments } from 'expo-router';
import React from 'react';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../firebaseConfig';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword, signOut, updatePhoneNumber} from 'firebase/auth'
import { addDoc, setDoc, collection } from 'firebase/firestore';
const AuthContext = React.createContext(null);

// This hook can be used to access the user info.
export function useAuth() {
  return React.useContext(AuthContext);
}

// This hook will protect the route access based on user authentication.
function useProtectedRoute(user) {
  const segments = useSegments();
  
  React.useEffect(() => {
    const delayNavigation = () => {
      // true if route is in (auth)
      const inAuthGroup = segments[0] === '(auth)';

      if (
        // If the user is not signed in and the initial segment is not anything in the auth group.
        !user &&
        !inAuthGroup
      ) {
        // Redirect to the sign-in page.
        router.replace('(auth)');
      } else if (user && inAuthGroup) {
        // Redirect away from the sign-in page.
        router.replace('(tabs)');
      }
    };

    // Introduce a delay of 1000ms (1 second) before executing the navigation logic
    const timerId = setTimeout(delayNavigation, 1000);

    // Cleanup function to clear the timeout if the component is unmounted
    return () => clearTimeout(timerId);
  }, [user, segments]);
}

export function Provider(props) {
  const [user, setAuth] = React.useState(null);

  const signIn = async (email,password)  => {
    console.log('sign in clicked');
    try {
      const response = await signInWithEmailAndPassword(FIREBASE_AUTH,email,password)
      setAuth(response)
    } catch (error) {
      console.log(error)
    }
  }

  const signedOut = async () => {
    try {
      const response = await signOut(FIREBASE_AUTH);
      setAuth(null)
    } catch (error) {
      console.log(error);
    }
  }
 

  const register = async ( email, password , userData, phoneNum) => {

    try {
      const response = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      console.log(response.user.uid)

      try {
        await addDoc(collection(FIRESTORE_DB,'Users',response.user.uid,"UserDetails"),{
          uid: response.user.uid,
          email: email,
          firstname: userData.firstname,
          lastname: userData.lastname,
          number: phoneNum
        })
        console.log("added data")
        await sendEmailVerification(response.user);
        await updateProfile(response.user, { phoneNumber: phoneNum });
        
      } catch (error) {
        console.log(error)
      }

    } catch (error) {
      console.log(error);
    }
  }


  useProtectedRoute(user)

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signedOut,
        register,
        user,
      }}>
      {props.children}
    </AuthContext.Provider>
  );
}
