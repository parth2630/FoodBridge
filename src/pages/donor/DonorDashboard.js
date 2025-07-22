import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  Divider
} from '@mui/material';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

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

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'accepted':
      return 'info';
    case 'pickedup':
      return 'primary';
    case 'delivered':
      return 'success';
    default:
      return 'default';
  }
};

export default function DonorDashboard() {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [activeDonations, setActiveDonations] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const donationsRef = collection(db, 'donations');
        const activeQuery = query(
          donationsRef,
          where('donorId', '==', currentUser.uid),
          where('status', 'in', ['pending', 'accepted', 'pickedup']),
          orderBy('createdAt', 'desc')
        );
        
        const historyQuery = query(
          donationsRef,
          where('donorId', '==', currentUser.uid),
          where('status', '==', 'delivered'),
          orderBy('createdAt', 'desc')
        );

        const [activeSnapshot, historySnapshot] = await Promise.all([
          getDocs(activeQuery),
          getDocs(historyQuery)
        ]);

        setActiveDonations(
          activeSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }))
        );

        setDonationHistory(
          historySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }))
        );
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchDonations();
    }
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderDonationList = (donations) => (
    <List>
      {donations.map((donation, index) => (
        <React.Fragment key={donation.id}>
          {index > 0 && <Divider />}
          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">
                    {donation.foodName}
                  </Typography>
                  <Chip 
                    label={donation.status.toUpperCase()} 
                    color={getStatusColor(donation.status)}
                    size="small"
                  />
                </Box>
              }
              secondary={
                <>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {donation.quantity} servings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pickup: {donation.pickupDate?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Location: {donation.pickupLocation}
                  </Typography>
                </>
              }
            />
          </ListItem>
        </React.Fragment>
      ))}
      {donations.length === 0 && (
        <ListItem>
          <ListItemText 
            primary="No donations found"
            secondary="Create a new donation to get started"
          />
        </ListItem>
      )}
    </List>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Donations
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Active Donations" />
          <Tab label="Donation History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderDonationList(activeDonations)}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderDonationList(donationHistory)}
        </TabPanel>
      </Paper>
    </Box>
  );
} 