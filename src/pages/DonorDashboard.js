import React, { useState, useEffect, useCallback } from 'react';
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
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  History as HistoryIcon,
  LocalDining,
  AccessTime,
  LocationOn,
  People,
  Chat as ChatIcon,
  Star as StarIcon,
  Share as ShareIcon,
  EmojiEvents as TrophyIcon,
  LocalShipping as LocalShippingIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import BlockchainVerification from '../components/blockchain/BlockchainVerification';
import AchievementSystem from '../components/gamification/AchievementSystem';
import NotificationList from '../components/notifications/NotificationList';
import ChatSystem from '../components/chat/ChatSystem';
import RatingSystem from '../components/feedback/RatingSystem';
import SocialShare from '../components/sharing/SocialShare';
import Profile from '../components/profile/Profile';
import { blockchainService } from '../services/blockchainService';

const drawerWidth = 240;

const DonationHistory = ({ donations }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Donation History
    </Typography>
    <List>
      {donations.map((donation) => (
        <ListItem key={donation.id}>
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText
            primary={donation.foodType}
            secondary={`Status: ${donation.status} | Date: ${new Date(donation.createdAt).toLocaleDateString()}`}
          />
          <LocalShippingIcon color={donation.status === 'completed' ? 'success' : 'action'} />
        </ListItem>
      ))}
    </List>
  </Paper>
);

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

const DonorDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [walletConnected, setWalletConnected] = useState(false);

  const fetchDonations = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'donations'),
        where('donorId', '==', currentUser.uid)
      );
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
  }, [currentUser.uid]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    if (tab === 'create') {
      navigate('/create-food-listing');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleConnectWallet = async () => {
    const connected = await blockchainService.connectWallet();
    setWalletConnected(connected);
  };

  const handleRecordOnBlockchain = async (donation) => {
    try {
      const result = await blockchainService.recordDonation({
        donorId: currentUser.uid,
        donationId: donation.id,
        quantity: donation.quantity,
        foodType: donation.foodType
      });

      if (result.success) {
        fetchDonations();
      } else {
        console.error('Failed to record on blockchain:', result.error);
      }
    } catch (error) {
      console.error('Error recording on blockchain:', error);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Food Waste Donation
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => setSelectedTab('dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => navigate('/create-food-listing')}>
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="Create Donation" />
        </ListItem>
        <ListItem button onClick={() => navigate('/donate-money')}>
          <ListItemIcon>
            <AccountBalanceIcon />
          </ListItemIcon>
          <ListItemText primary="Donate Money" />
        </ListItem>
        <ListItem button onClick={() => setSelectedTab('achievements')}>
          <ListItemIcon>
            <TrophyIcon />
          </ListItemIcon>
          <ListItemText primary="Achievements" />
        </ListItem>
        <ListItem button onClick={() => setSelectedTab('chat')}>
          <ListItemIcon>
            <ChatIcon />
          </ListItemIcon>
          <ListItemText primary="Chat" />
        </ListItem>
        <ListItem button onClick={() => setSelectedTab('feedback')}>
          <ListItemIcon>
            <StarIcon />
          </ListItemIcon>
          <ListItemText primary="Feedback" />
        </ListItem>
        <ListItem button onClick={() => setSelectedTab('share')}>
          <ListItemIcon>
            <ShareIcon />
          </ListItemIcon>
          <ListItemText primary="Share Impact" />
        </ListItem>
        <ListItem button onClick={() => setSelectedTab('notifications')}>
          <ListItemIcon>
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Notifications" />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => setSelectedTab('profile')}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
      </List>
    </div>
  );

  const renderDashboardContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">My Donations</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!walletConnected && (
              <Button
                variant="outlined"
                onClick={handleConnectWallet}
                startIcon={<AccountBalanceWalletIcon />}
              >
                Connect Wallet
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-food-listing')}
            >
              Create New Donation
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Dashboard Overview</Typography>
            </Paper>
          </Grid>
          {donations.map((donation) => (
            <Grid item xs={12} md={6} key={donation.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedDonation?.id === donation.id ? '2px solid primary.main' : 'none'
                }}
                onClick={() => setSelectedDonation(donation)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">{donation.foodType}</Typography>
                    <Chip
                      label={donation.status}
                      color={getStatusColor(donation.status)}
                      size="small"
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocalDining sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Quantity: {donation.quantity} {donation.unit}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Pickup by: {new Date(donation.pickupTime).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOn sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {formatLocation(donation.location)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <People sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          Serves: {donation.servings} people
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {donation.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Notes: {donation.notes}
                    </Typography>
                  )}

                  {donation.status === 'completed' && (
                    <Box sx={{ mt: 2 }}>
                      <BlockchainVerification donation={donation} />
                      {!donation.blockchainId && walletConnected && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecordOnBlockchain(donation);
                          }}
                          sx={{ mt: 1 }}
                        >
                          Record on Blockchain
                        </Button>
                      )}
                    </Box>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<ChatIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDonation(donation);
                        setSelectedTab('chat');
                      }}
                    >
                      Chat
                    </Button>
                    <Button
                      size="small"
                      startIcon={<StarIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDonation(donation);
                        setSelectedTab('feedback');
                      }}
                    >
                      Feedback
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ShareIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDonation(donation);
                        setSelectedTab('share');
                      }}
                    >
                      Share
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {donations.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No donations yet
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/create-food-listing')}
                  sx={{ mt: 2 }}
                >
                  Create Your First Donation
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'dashboard':
        return renderDashboardContent();
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
          <Typography>Select a donation to share</Typography>
        );
      case 'notifications':
        return <NotificationList />;
      case 'profile':
        return <Profile />;
      default:
        return renderDashboardContent();
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
            {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
          </Typography>
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
            keepMounted: true, // Better open performance on mobile.
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
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default DonorDashboard; 