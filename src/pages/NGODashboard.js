import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Badge,
  Tab,
  Tabs
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
  Chat as ChatIcon,
  Star as StarIcon,
  Share as ShareIcon,
  EmojiEvents as TrophyIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import SmartMatchingDashboard from '../components/matching/SmartMatchingDashboard';
import AchievementSystem from '../components/gamification/AchievementSystem';
import NotificationList from '../components/notifications/NotificationList';
import ChatSystem from '../components/chat/ChatSystem';
import RatingSystem from '../components/feedback/RatingSystem';
import SocialShare from '../components/sharing/SocialShare';
import VolunteerManagement from '../components/volunteer/VolunteerManagement';
import { createTestUserData, createTestDonations } from '../services/achievementService';

const drawerWidth = 240;

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 20.5937,
  lng: 78.9629
};

const MapView = ({ donations }) => {
  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
      >
        {donations.map((donation) => {
          // Ensure location is properly formatted
          const position = typeof donation.location === 'string' 
            ? {
                lat: parseFloat(donation.location.split(',')[0]),
                lng: parseFloat(donation.location.split(',')[1])
              }
            : (donation.location && typeof donation.location === 'object' && donation.location.lat && donation.location.lng)
              ? donation.location
              : center;

          return (
            <Marker
              key={donation.id}
              position={position}
              title={donation.foodType}
            />
          );
        })}
      </GoogleMap>
    </LoadScript>
  );
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

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, value: 'dashboard' },
  { text: 'Smart Matching', icon: <LocalShippingIcon />, value: 'smart-matching' },
  { text: 'Achievements', icon: <TrophyIcon />, value: 'achievements' },
  { text: 'Chat', icon: <ChatIcon />, value: 'chat' },
  { text: 'Feedback', icon: <StarIcon />, value: 'feedback' },
  { text: 'Share Impact', icon: <ShareIcon />, value: 'share' },
  { text: 'Volunteers', icon: <PeopleIcon />, value: 'volunteers' },
  { text: 'Analytics', icon: <AnalyticsIcon />, value: 'analytics' },
  { text: 'Profile', icon: <PersonIcon />, value: 'profile' }
];

export default function NGODashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const donationsRef = collection(db, 'donations');
      const q = query(donationsRef, where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      const donationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDonations(donationsData);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleDonationClick = (donation) => {
    setSelectedDonation(donation);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDonation(null);
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const donationRef = doc(db, 'donations', selectedDonation.id);
      await updateDoc(donationRef, {
        status: newStatus,
        ngoId: currentUser.uid,
        updatedAt: new Date().toISOString()
      });
      fetchDonations();
      handleDialogClose();
    } catch (error) {
      console.error('Error updating donation status:', error);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          NGO Dashboard
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.value} onClick={() => handleTabChange(item.value)}>
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress />
        </Box>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">NGO Dashboard Overview</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={async () => {
                        try {
                          await createTestUserData(currentUser.uid);
                          await createTestDonations(currentUser.uid);
                          alert('Test data created successfully!');
                          fetchDonations(); // Refresh donations list
                        } catch (error) {
                          console.error('Error creating test data:', error);
                          alert('Failed to create test data');
                        }
                      }}
                    >
                      Create Test Data
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Donation Requests
                  </Typography>
                  {donations.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="text.secondary">
                        No available donations at the moment
                      </Typography>
                    </Box>
                  ) :
                    donations.map(donation => (
                      <Card key={donation.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6">{donation.foodName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {donation.description}
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Chip
                              label={donation.donationType}
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={`Feeds ${donation.quantity}`}
                              color="secondary"
                            />
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Location: {formatLocation(donation.location)}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Pickup: {new Date(donation.pickupDate).toLocaleDateString()} at {donation.pickupTime}
                          </Typography>
                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleDonationClick(donation)}
                            >
                              View Details
                            </Button>
                            <Button
                              size="small"
                              startIcon={<ChatIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDonation(donation);
                                setActiveTab('chat');
                              }}
                            >
                              Chat
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  }
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Map View
                  </Typography>
                  <MapView donations={donations} />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
      case 'smart-matching':
        return <SmartMatchingDashboard />;
      case 'achievements':
        return <AchievementSystem />;
      case 'chat':
        return selectedDonation ? (
          <ChatSystem donationId={selectedDonation.id} />
        ) : (
          <Typography>Select a donation to start chatting</Typography>
        );
      case 'feedback':
        return selectedDonation ? (
          <RatingSystem donationId={selectedDonation.id} />
        ) : (
          <Typography>Select a donation to view or leave feedback</Typography>
        );
      case 'share':
        return selectedDonation ? (
          <SocialShare donationId={selectedDonation.id} />
        ) : (
          <Typography>Select a donation to share its impact</Typography>
        );
      case 'volunteers':
        return <VolunteerManagement />;
      case 'analytics':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Analytics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">Total Pickups</Typography>
                  <Typography variant="h3">
                    {donations.filter(d => d.status === 'picked_up' || d.status === 'delivered').length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">Active Requests</Typography>
                  <Typography variant="h3">
                    {donations.filter(d => d.status === 'active').length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">People Fed</Typography>
                  <Typography variant="h3">
                    {donations
                      .filter(d => d.status === 'delivered')
                      .reduce((acc, curr) => acc + parseInt(curr.quantity), 0)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
      case 'profile':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              NGO Profile
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{currentUser.email}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Organization Type
                  </Typography>
                  <Typography variant="body1">NGO</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" color="primary">
                    Edit Profile
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        {renderContent()}
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Donation Details</DialogTitle>
        <DialogContent>
          {selectedDonation && (
            <>
              <Typography variant="h6">{selectedDonation.foodName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDonation.description}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Type:</strong> {selectedDonation.donationType}
                </Typography>
                <Typography variant="body2">
                  <strong>Quantity:</strong> Feeds {selectedDonation.quantity}
                </Typography>
                <Typography variant="body2">
                  <strong>Pickup Date:</strong> {new Date(selectedDonation.pickupDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Pickup Time:</strong> {selectedDonation.pickupTime}
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong> {formatLocation(selectedDonation.location)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleStatusUpdate('accepted')}
          >
            Accept Donation
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleStatusUpdate('picked_up')}
          >
            Mark as Picked Up
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleStatusUpdate('delivered')}
          >
            Mark as Delivered
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 