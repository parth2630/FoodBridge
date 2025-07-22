import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 20.5937, // Default to India's center
  lng: 78.9629
};

const formatLocation = (location) => {
  if (typeof location === 'string') {
    return location;
  }
  if (location && typeof location === 'object') {
    if (location.address) {
      return location.address;
    }
    if (location.lat && location.lng) {
      return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    }
  }
  return 'Location not available';
};

export default function FoodListing() {
  const [donationType, setDonationType] = useState('');
  const [formData, setFormData] = useState({
    foodName: '',
    description: '',
    quantity: '',
    pickupLocation: '',
    pickupDate: new Date(),
    category: ''
  });
  const [location, setLocation] = useState(defaultCenter);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleDonationTypeChange = (event) => {
    setDonationType(event.target.value);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLocationSelect = (event) => {
    if (event.latLng) {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setLocation(newLocation);
      setFormData(prev => ({
        ...prev,
        pickupLocation: formatLocation(newLocation)
      }));
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(newLocation);
          setFormData(prev => ({
            ...prev,
            pickupLocation: formatLocation(newLocation)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!donationType) {
      return setError('Please select a donation type');
    }
    if (!location) {
      return setError('Please select a pickup location');
    }

    try {
      setError('');
      setLoading(true);

      const donationData = {
        ...formData,
        donationType,
        location,
        donorId: currentUser.uid,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'donations'), donationData);
      navigate('/donor-dashboard');
    } catch (error) {
      setError('Failed to create food listing');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create Food Listing
        </Typography>

        {donationType === 'hotel' || donationType === 'event' ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            This food will be distributed to needy people through our NGO partners.
          </Alert>
        ) : donationType === 'home' ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            This food waste will be used to create pure soil manure, helping our environment and farmers.
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Donation Type</InputLabel>
                <Select
                  value={donationType}
                  onChange={handleDonationTypeChange}
                  label="Donation Type"
                  required
                >
                  <MenuItem value="hotel">Hotel Leftover Food</MenuItem>
                  <MenuItem value="event">Event Leftover Food</MenuItem>
                  <MenuItem value="home">Home Food Waste</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Food Name"
                name="foodName"
                value={formData.foodName}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={2}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Quantity (Feeds how many people?)</InputLabel>
                <Select
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  label="Quantity (Feeds how many people?)"
                  required
                >
                  <MenuItem value="1-5">1-5 people</MenuItem>
                  <MenuItem value="6-10">6-10 people</MenuItem>
                  <MenuItem value="11-20">11-20 people</MenuItem>
                  <MenuItem value="21-50">21-50 people</MenuItem>
                  <MenuItem value="50+">50+ people</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pickup Date"
                name="pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pickup Time"
                name="pickupTime"
                type="time"
                value={formData.pickupTime}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Pickup Location
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={getCurrentLocation}
                  sx={{ mr: 2 }}
                >
                  Use Current Location
                </Button>
                <TextField
                  fullWidth
                  label="Manual Address"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  required
                />
              </Box>
              <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={location || defaultCenter}
                  zoom={10}
                  onClick={handleLocationSelect}
                >
                  {location && <Marker position={location} />}
                </GoogleMap>
              </LoadScript>
            </Grid>

            <Grid item xs={12}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
              >
                Create Food Listing
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
} 