import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { backgroundStyles } from '../../styles/commonStyles';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#F44336'];

export default function NgoAnalytics() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalDonations: 0,
    totalPeopleServed: 0,
    monthlyDonations: [],
    categoryDistribution: [],
    sourceDistribution: [],
    timeDistribution: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser]);

  const fetchAnalytics = async () => {
    try {
      const donationsRef = collection(db, 'donations');
      const donationsQuery = query(
        donationsRef,
        where('ngoId', '==', currentUser.uid)
      );

      const snapshot = await getDocs(donationsQuery);
      const donations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      // Calculate total donations and people served
      const totalDonations = donations.length;
      const totalPeopleServed = donations.reduce((sum, donation) => {
        const quantity = parseInt(donation.quantity.split('-')[0]) || 0;
        return sum + quantity;
      }, 0);

      // Calculate monthly donations
      const monthlyData = {};
      donations.forEach(donation => {
        const month = donation.createdAt.toLocaleString('default', { month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      const monthlyDonations = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        donations: count
      }));

      // Calculate category distribution
      const categories = {};
      donations.forEach(donation => {
        categories[donation.category] = (categories[donation.category] || 0) + 1;
      });

      const categoryDistribution = Object.entries(categories).map(([name, value]) => ({
        name,
        value
      }));

      // Calculate source distribution
      const sources = {};
      donations.forEach(donation => {
        sources[donation.source] = (sources[donation.source] || 0) + 1;
      });

      const sourceDistribution = Object.entries(sources).map(([name, value]) => ({
        name,
        value
      }));

      // Calculate time distribution
      const timeSlots = {
        'Morning (6-12)': 0,
        'Afternoon (12-17)': 0,
        'Evening (17-22)': 0,
        'Night (22-6)': 0
      };

      donations.forEach(donation => {
        const hour = donation.createdAt.getHours();
        if (hour >= 6 && hour < 12) timeSlots['Morning (6-12)']++;
        else if (hour >= 12 && hour < 17) timeSlots['Afternoon (12-17)']++;
        else if (hour >= 17 && hour < 22) timeSlots['Evening (17-22)']++;
        else timeSlots['Night (22-6)']++;
      });

      const timeDistribution = Object.entries(timeSlots).map(([name, value]) => ({
        name,
        value
      }));

      setAnalytics({
        totalDonations,
        totalPeopleServed,
        monthlyDonations,
        categoryDistribution,
        sourceDistribution,
        timeDistribution
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

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
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={6}>
          <Card sx={backgroundStyles.analyticsCard}>
            <CardContent>
              <Typography variant="h3" color="primary">
                {analytics.totalDonations}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Total Donations Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={backgroundStyles.analyticsCard}>
            <CardContent>
              <Typography variant="h3" color="primary">
                {analytics.totalPeopleServed}+
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                People Served
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Donation Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyDonations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="donations"
                  stroke="#4CAF50"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Food Category Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analytics.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Source Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Donation Source Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.sourceDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analytics.sourceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Time Distribution */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Donation Time Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#4CAF50" name="Number of Donations" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 