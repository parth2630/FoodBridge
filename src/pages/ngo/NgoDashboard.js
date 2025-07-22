import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Restaurant as FoodIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { backgroundStyles } from '../../styles/commonStyles';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: 19.0760, // Mumbai coordinates
  lng: 72.8777,
};

export default function NgoDashboard() {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [donations, setDonations] = useState({
    requests: [],
    pending: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          setError('User data not found');
          return;
        }
        setUserData(userDoc.data());
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data');
      }
    };

    loadUserData();
  }, [currentUser]);

  useEffect(() => {
    if (userData?.city) {
      fetchDonations();
    }
  }, [userData]);

  const fetchDonations = async () => {
    try {
      if (!userData?.city) {
        console.error('User city data not available');
        return;
      }

      const donationsRef = collection(db, 'donations');
      
      // Fetch new requests
      const requestsQuery = query(
        donationsRef,
        where('status', '==', 'pending'),
        where('city', '==', userData.city),
        orderBy('createdAt', 'desc')
      );
      
      // Fetch accepted/in-progress donations
      const pendingQuery = query(
        donationsRef,
        where('ngoId', '==', currentUser.uid),
        where('status', 'in', ['accepted', 'pickedup']),
        orderBy('updatedAt', 'desc')
      );
      
      // Fetch completed donations
      const completedQuery = query(
        donationsRef,
        where('ngoId', '==', currentUser.uid),
        where('status', '==', 'delivered'),
        orderBy('updatedAt', 'desc')
      );

      const [requestsSnap, pendingSnap, completedSnap] = await Promise.all([
        getDocs(requestsQuery),
        getDocs(pendingQuery),
        getDocs(completedQuery)
      ]);

      setDonations({
        requests: requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        pending: pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        completed: completedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
    } catch (error) {
      console.error('Error fetching donations:', error);
      setError('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (donationId, newStatus) => {
    try {
      const donationRef = doc(db, 'donations', donationId);
      await updateDoc(donationRef, {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'accepted' ? { ngoId: currentUser.uid } : {})
      });
      
      // Refresh donations
      await fetchDonations();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error updating donation status:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderDonationCard = (donation) => (
    <Card key={donation.id} sx={{ ...backgroundStyles.donationCard, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6">{donation.foodName}</Typography>
          <Chip
            label={donation.status.toUpperCase()}
            color={
              donation.status === 'pending' ? 'warning' :
              donation.status === 'accepted' ? 'info' :
              donation.status === 'pickedup' ? 'primary' :
              'success'
            }
            size="small"
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FoodIcon color="primary" />
              <Typography variant="body2">
                Category: {donation.category}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PeopleIcon color="primary" />
              <Typography variant="body2">
                Serves: {donation.quantity}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationIcon color="primary" />
              <Typography variant="body2">
                {donation.pickupLocation}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TimeIcon color="primary" />
              <Typography variant="body2">
                Pickup: {new Date(donation.pickupDate).toLocaleString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        {donation.status === 'pending' && (
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => handleStatusUpdate(donation.id, 'accepted')}
          >
            Accept Donation
          </Button>
        )}
        {donation.status === 'accepted' && (
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => handleStatusUpdate(donation.id, 'pickedup')}
          >
            Mark as Picked Up
          </Button>
        )}
        {donation.status === 'pickedup' && (
          <Button 
            size="small" 
            variant="contained" 
            onClick={() => handleStatusUpdate(donation.id, 'delivered')}
          >
            Complete Delivery
          </Button>
        )}
        <Button 
          size="small"
          onClick={() => {
            setSelectedDonation(donation);
            setOpenDialog(true);
          }}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={backgroundStyles.sectionTitle}>
        Donation Management
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {donations.requests.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New Requests
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {donations.pending.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {donations.completed.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>

        {/* Map */}
        <Grid item xs={12}>
          <Paper sx={backgroundStyles.mapContainer}>
            <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={12}
              >
                {donations.requests.map((donation) => (
                  <Marker
                    key={donation.id}
                    position={{
                      lat: parseFloat(donation.pickupLocation.split(',')[0]),
                      lng: parseFloat(donation.pickupLocation.split(',')[1])
                    }}
                    onClick={() => {
                      setSelectedDonation(donation);
                      setOpenDialog(true);
                    }}
                  />
                ))}
              </GoogleMap>
            </LoadScript>
          </Paper>
        </Grid>

        {/* Donation Lists */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%', mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label={`New Requests (${donations.requests.length})`} />
              <Tab label={`In Progress (${donations.pending.length})`} />
              <Tab label={`Completed (${donations.completed.length})`} />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {donations.requests.map(renderDonationCard)}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {donations.pending.map(renderDonationCard)}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {donations.completed.map(renderDonationCard)}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Donation Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md">
        {selectedDonation && (
          <>
            <DialogTitle>
              Donation Details
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedDonation.foodName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDonation.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Donor Information</Typography>
                  <Typography variant="body2">
                    Contact: {selectedDonation.donorContact}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Pickup Details</Typography>
                  <Typography variant="body2">
                    Location: {selectedDonation.pickupLocation}
                  </Typography>
                  <Typography variant="body2">
                    Time: {new Date(selectedDonation.pickupDate).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Close</Button>
              {selectedDonation.status === 'pending' && (
                <Button 
                  variant="contained" 
                  onClick={() => handleStatusUpdate(selectedDonation.id, 'accepted')}
                >
                  Accept Donation
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 