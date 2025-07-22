import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryQueue, setRetryQueue] = useState([]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Retry mechanism
  const retryOperation = useCallback(async (operation, maxRetries = 3) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (!navigator.onLine) {
          throw new Error('No internet connection');
        }
        return await operation();
      } catch (error) {
        lastError = error;
        if (error.code === 'auth/network-request-failed' || error.message === 'No internet connection') {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000)); // Exponential backoff
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }, []);

  // Create a new session
  const createSession = useCallback(async (userId, email) => {
    try {
      const sessionRef = await retryOperation(async () => {
        const ref = await addDoc(collection(db, 'sessions'), {
          userId,
          email,
          startTime: serverTimestamp(),
          lastActive: serverTimestamp(),
          status: 'active',
          activities: []
        });
        return ref;
      });
      setSessionId(sessionRef.id);
      return sessionRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      if (!isOnline) {
        setRetryQueue(prev => [...prev, { type: 'createSession', data: { userId, email } }]);
      }
      return null;
    }
  }, [retryOperation, isOnline]);

  // Update session activity
  const updateSessionActivity = useCallback(async (action) => {
    if (!sessionId) return;

    try {
      await retryOperation(async () => {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
          lastActive: serverTimestamp(),
          [`activities.${Date.now()}`]: {
            action,
            timestamp: serverTimestamp()
          }
        });
      });
    } catch (error) {
      console.error('Error updating session:', error);
      if (!isOnline) {
        setRetryQueue(prev => [...prev, { type: 'updateActivity', data: { sessionId, action } }]);
      }
    }
  }, [sessionId, retryOperation, isOnline]);

  // End current session
  const endSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      await retryOperation(async () => {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
          endTime: serverTimestamp(),
          status: 'ended'
        });
      });
      setSessionId(null);
    } catch (error) {
      console.error('Error ending session:', error);
      if (!isOnline) {
        setRetryQueue(prev => [...prev, { type: 'endSession', data: { sessionId } }]);
      }
    }
  }, [sessionId, retryOperation, isOnline]);

  const signup = useCallback(async (email, password, userData) => {
    try {
      const userCredential = await retryOperation(async () => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
        ...userData,
        email,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isOnline: true
        });
        return cred;
      });
      
      setUserEmail(email);
      await createSession(userCredential.user.uid, email);
      return userCredential.user;
    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = 'Failed to create an account';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection';
          break;
        default:
          errorMessage = 'Failed to create an account';
          break;
      }
      
      throw new Error(errorMessage);
    }
  }, [createSession, retryOperation]);

  const login = useCallback(async (email, password) => {
    try {
      const userCredential = await retryOperation(async () => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        if (!userDoc.exists()) {
          throw new Error('User data not found');
        }
        const userData = userDoc.data();
        
        // End any existing active sessions
        const sessionsRef = collection(db, 'sessions');
        const activeSessionsQuery = query(
          sessionsRef,
          where('userId', '==', cred.user.uid),
          where('status', '==', 'active')
        );
        const activeSessions = await getDocs(activeSessionsQuery);
        
        const endPromises = activeSessions.docs.map(session => 
          updateDoc(session.ref, {
            status: 'ended',
            endTime: serverTimestamp()
          })
        );
        await Promise.all(endPromises);

        // Update user data
        await setDoc(doc(db, 'users', cred.user.uid), {
          lastLogin: serverTimestamp(),
          isOnline: true
        }, { merge: true });

        // Set user type
        setUserType(userData.userType);

        return cred;
      });

      setUserEmail(email);
      await createSession(userCredential.user.uid, email);
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to sign in';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection';
          break;
        default:
          errorMessage = error.message || 'Failed to sign in';
          break;
      }
      
      throw new Error(errorMessage);
    }
  }, [createSession, retryOperation]);

  const logout = useCallback(async () => {
    try {
      await endSession();
      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          lastSeen: serverTimestamp(),
          isOnline: false
        }, { merge: true });
      }
      setUserEmail(null);
    return signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
  }
  }, [currentUser, endSession]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserType(userData.userType);
            setUserEmail(userData.email);
            
            // Create new session if none exists
            if (!sessionId) {
              await createSession(user.uid, userData.email);
            }
        }
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserType(null);
          setUserEmail(null);
          setSessionId(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (sessionId) {
        endSession();
      }
    };
  }, [sessionId, createSession, endSession]);

  // Process retry queue when coming back online
  useEffect(() => {
    if (isOnline && retryQueue.length > 0) {
      const processQueue = async () => {
        const newQueue = [...retryQueue];
        setRetryQueue([]);

        for (const item of newQueue) {
          try {
            switch (item.type) {
              case 'createSession':
                await createSession(item.data.userId, item.data.email);
                break;
              case 'updateActivity':
                await updateSessionActivity(item.data.action);
                break;
              case 'endSession':
                await endSession();
                break;
              default:
                console.warn('Unknown retry operation:', item.type);
            }
          } catch (error) {
            console.error('Error processing retry queue:', error);
            setRetryQueue(prev => [...prev, item]); // Put failed items back in queue
          }
        }
      };

      processQueue();
    }
  }, [isOnline, retryQueue, createSession, updateSessionActivity, endSession]);

  const value = {
    currentUser,
    userType,
    userEmail,
    sessionId,
    isOnline,
    signup,
    login,
    logout,
    updateSessionActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 