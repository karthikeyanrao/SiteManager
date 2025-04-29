import { auth, db } from './firebase';
import { setDoc, doc, getDoc } from 'firebase/firestore';

// Function to create a new user document with default role
export const createUserDocument = async (user) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  
  try {
    await setDoc(userRef, {
      email: user.email,
      roles: {
        user: true,  // Default role
        admin: false,
        accounts: false
      },
      createdAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error creating user document:', error);
  }
};

// Function to check if user has required role
export const checkUserRole = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const roles = userDoc.data().roles;
      return roles?.admin === true || roles?.accounts === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}; 