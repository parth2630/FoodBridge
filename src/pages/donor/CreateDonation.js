import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  IconButton
} from '@mui/material';
import {
  Home as HomeIcon,
  Restaurant as RestaurantIcon,
  Event as EventIcon,
  MyLocation as LocationIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const steps = ['Select Source', 'Enter Details'];

const sourceTypes = [
  {
    id: 'home',
    title: 'Home',
    icon: <HomeIcon sx={{ fontSize: 40 }} />,
    description: 'Donate food from your home. NGOs will use this to create soil manure.'
  },
  {
    id: 'restaurant',
    title: 'Restaurant/Hotel',
    icon: <RestaurantIcon sx={{ fontSize: 40 }} />,
    description: 'Donate excess food from your restaurant. Will be distributed to those in need.'
  },
  {
    id: 'event',
    title: 'Event',
    icon: <EventIcon sx={{ fontSize: 40 }} />,
    description: 'Donate leftover food from events. Will be distributed to those in need.'
  }
];

const servingOptions = [
  { value: '10-20', label: '10-20 people' },
  { value: '20-50', label: '20-50 people' },
  { value: '50-100', label: '50-100 people' },
  { value: '100+', label: 'More than 100 people' }
];

export default function CreateDonation() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSource, setSelectedSource] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    foodName: '',
    description: '',
    quantity: '',
    pickupLocation: '',
    pickupDate: new Date(),
    category: ''
  });

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    setActiveStep(1);
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (newValue) => {
    setFormData(prev => ({
      ...prev,
      pickupDate: newValue
    }));
  };

  const handleLocationFetch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            pickupLocation: `${latitude}, ${longitude}`
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Failed to fetch location. Please enter manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate form
      if (!formData.foodName || !formData.quantity || !formData.pickupLocation || !formData.pickupDate) {
        setError('Please fill in all required fields');
        return;
      }

      // Create donation document
      const donationRef = await addDoc(collection(db, 'donations'), {
        ...formData,
        source: selectedSource,
        status: 'pending',
        donorId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Navigate to dashboard
      navigate('/donor-dashboard');
    } catch (error) {
      console.error('Error creating donation:', error);
      setError('Failed to create donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create Donation
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 ? (
          <>
            <Typography variant="h6" gutterBottom>
              Select Donation Source
            </Typography>
            <Grid container spacing={3}>
              {sourceTypes.map((source) => (
                <Grid item xs={12} md={4} key={source.id}>
                  <Card>
                    <CardActionArea onClick={() => handleSourceSelect(source.id)}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        {source.icon}
                        <Typography variant="h6" sx={{ mt: 2 }}>
                          {source.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {source.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Box component="form" noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Food Name"
                  name="foodName"
                  value={formData.foodName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Quantity (Servings)</InputLabel>
                  <Select
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    label="Quantity (Servings)"
                  >
                    {servingOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Food Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Food Category"
                  >
                    <MenuItem value="cooked">Cooked Food</MenuItem>
                    <MenuItem value="raw">Raw Food</MenuItem>
                    <MenuItem value="packaged">Packaged Food</MenuItem>
                    <MenuItem value="beverages">Beverages</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    required
                    fullWidth
                    label="Pickup Location"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleInputChange}
                  />
                  <IconButton 
                    onClick={handleLocationFetch}
                    color="primary"
                    sx={{ border: 1, borderColor: 'divider' }}
                  >
                    <LocationIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Pickup Date & Time"
                    value={formData.pickupDate}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDateTime={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
              >
                Create Donation
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
} 