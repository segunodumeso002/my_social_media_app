import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signIn, signUp, signOut, confirmSignUp } from 'aws-amplify/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const { isSignedIn } = await signIn({ username, password });
      if (isSignedIn) {
        await checkUser();
        toast.success('Login successful! Welcome back!');
        return true;
      }
    } catch (error) {
      if (error.name === 'UserNotConfirmedException') {
        toast.error('Please verify your email before logging in');
      } else if (error.name === 'NotAuthorizedException') {
        toast.error('Incorrect username or password');
      } else {
        toast.error(error.message || 'Login failed');
      }
      throw error;
    }
  };

  const register = async (username, password, email) => {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({ 
        username, 
        password, 
        options: { 
          userAttributes: { email }
        } 
      });
      
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        toast.success('Registration successful! Please check your email to verify your account.');
      } else if (isSignUpComplete) {
        toast.success('Registration successful! You can now login.');
      }
      return { userId, nextStep };
    } catch (error) {
      if (error.name === 'UsernameExistsException') {
        toast.error('Username already exists');
      } else if (error.name === 'InvalidPasswordException') {
        toast.error('Password must be at least 8 characters');
      } else {
        toast.error(error.message || 'Registration failed');
      }
      throw error;
    }
  };

  const confirmSignUpCode = async (username, code) => {
    try {
      await confirmSignUp({ username, confirmationCode: code });
      toast.success('Email verified successfully! You can now login.');
      return true;
    } catch (error) {
      toast.error(error.message || 'Verification failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, confirmSignUpCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
