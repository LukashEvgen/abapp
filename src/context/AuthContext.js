import React, {createContext, useContext, useState, useEffect} from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AuthContext = createContext({
  user: null,
  initializing: true,
  isLawyer: false,
  loginWithPhone: async () => {},
  confirmCode: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [isLawyer, setIsLawyer] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async u => {
      setUser(u);
      if (u) {
        try {
          const doc = await firestore().collection('lawyers').doc(u.uid).get();
          setIsLawyer(doc.exists);
        } catch (e) {
          setIsLawyer(false);
        }
      } else {
        setIsLawyer(false);
      }
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const loginWithPhone = async phoneNumber => {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    setConfirm(confirmation);
    return confirmation;
  };

  const confirmCode = async code => {
    if (!confirm) {
      throw new Error('No confirmation in progress');
    }
    const result = await confirm.confirm(code);
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    await auth().signOut();
    setUser(null);
    setIsLawyer(false);
    setConfirm(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        isLawyer,
        loginWithPhone,
        confirmCode,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
