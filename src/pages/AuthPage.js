import React, { useState } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Typography,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AuthPage() {
  const [tabValue, setTabValue] = useState(0);
  const [userType, setUserType] = useState('donor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, login, updateSessionActivity } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [donorSignupData, setDonorSignupData] = useState({
    name: '',
    email: '',
    contact: '',
    password: '',
    confirmPassword: ''
  });

  const [ngoSignupData, setNgoSignupData] = useState({
    name: '',
    owner: '',
    email: '',
    location: '',
    contact: '',
    password: '',
    confirmPassword: ''
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    updateSessionActivity('Changed auth tab');
  };

  const handleDonorSignupChange = (e) => {
    setDonorSignupData({
      ...donorSignupData,
      [e.target.name]: e.target.value
    });
  };

  const handleNgoSignupChange = (e) => {
    setNgoSignupData({
      ...ngoSignupData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleDonorSignup = async (e) => {
    e.preventDefault();
    if (donorSignupData.password !== donorSignupData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(donorSignupData.email, donorSignupData.password, {
        ...donorSignupData,
        userType: 'donor'
      });
      updateSessionActivity('Donor signup successful');
      navigate('/donor-dashboard');
    } catch (error) {
      setError(error.message || 'Failed to create an account');
      updateSessionActivity('Donor signup failed');
    }
    setLoading(false);
  };

  const handleNgoSignup = async (e) => {
    e.preventDefault();
    if (ngoSignupData.password !== ngoSignupData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(ngoSignupData.email, ngoSignupData.password, {
        ...ngoSignupData,
        userType: 'ngo'
      });
      updateSessionActivity('NGO signup successful');
      navigate('/ngo-dashboard');
    } catch (error) {
      setError(error.message || 'Failed to create an account');
      updateSessionActivity('NGO signup failed');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const userCredential = await login(loginData.email, loginData.password);
      updateSessionActivity('Login successful');
      
      // Get user type from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.userType === 'donor') {
          navigate('/donor-dashboard');
        } else if (userData.userType === 'ngo') {
          navigate('/ngo-dashboard');
        } else {
          setError('Invalid user type');
        }
      } else {
        setError('User data not found');
      }
    } catch (error) {
      setError(error.message || 'Failed to sign in');
      updateSessionActivity('Login failed');
    }
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Food Waste Donation Platform
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Sign Up" />
          <Tab label="Sign In" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Button
              fullWidth
              variant={userType === 'donor' ? 'contained' : 'outlined'}
              onClick={() => {
                setUserType('donor');
                updateSessionActivity('Selected donor signup');
              }}
              sx={{ mb: 1 }}
            >
              Sign up as Donor
            </Button>
            <Button
              fullWidth
              variant={userType === 'ngo' ? 'contained' : 'outlined'}
              onClick={() => {
                setUserType('ngo');
                updateSessionActivity('Selected NGO signup');
              }}
            >
              Sign up as NGO
            </Button>
          </Box>

          {userType === 'donor' ? (
            <form onSubmit={handleDonorSignup}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={donorSignupData.name}
                onChange={handleDonorSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={donorSignupData.email}
                onChange={handleDonorSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Contact"
                name="contact"
                value={donorSignupData.contact}
                onChange={handleDonorSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={donorSignupData.password}
                onChange={handleDonorSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={donorSignupData.confirmPassword}
                onChange={handleDonorSignupChange}
                margin="normal"
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                Sign Up
              </Button>
            </form>
          ) : (
            <form onSubmit={handleNgoSignup}>
              <TextField
                fullWidth
                label="NGO Name"
                name="name"
                value={ngoSignupData.name}
                onChange={handleNgoSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Owner Name"
                name="owner"
                value={ngoSignupData.owner}
                onChange={handleNgoSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={ngoSignupData.email}
                onChange={handleNgoSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={ngoSignupData.location}
                onChange={handleNgoSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Contact"
                name="contact"
                value={ngoSignupData.contact}
                onChange={handleNgoSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={ngoSignupData.password}
                onChange={handleNgoSignupChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={ngoSignupData.confirmPassword}
                onChange={handleNgoSignupChange}
                margin="normal"
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                Sign Up
              </Button>
            </form>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={loginData.email}
              onChange={handleLoginChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={loginData.password}
              onChange={handleLoginChange}
              margin="normal"
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Sign In
            </Button>
          </form>
        </TabPanel>
      </Paper>
    </Container>
  );
} 