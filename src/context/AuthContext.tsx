import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface AuthContextValue {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
  isLawyer: boolean;
  loginWithPhone: (phoneNumber: string) => Promise<FirebaseAuthTypes.ConfirmationResult>;
  confirmCode: (code: string) => Promise<FirebaseAuthTypes.UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  initializing: true,
  isLawyer: false,
  loginWithPhone: async () => {
    throw new Error('Not implemented');
  },
  confirmCode: async () => {
    throw new Error('Not implemented');
  },
  logout: async () => {},
});

export const AuthProvider = ({children}: {children: ReactNode}) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isLawyer, setIsLawyer] = useState(false);
  const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

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

  const loginWithPhone = async (phoneNumber: string) => {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    setConfirm(confirmation);
    return confirmation;
  };

  const confirmCode = async (code: string) => {
    if (!confirm) {
      throw new Error('No confirmation in progress');
    }
    const result = await confirm.confirm(code);
    setUser(result.user);
    return result;
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
