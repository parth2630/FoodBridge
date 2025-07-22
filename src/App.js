import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AuthPage from './pages/AuthPage';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';
import FoodListing from './pages/FoodListing';
import DonateMoney from './pages/DonateMoney';
import ChatSystem from './components/chat/ChatSystem';
import RatingSystem from './components/feedback/RatingSystem';
import AdvancedAnalytics from './components/analytics/AdvancedAnalytics';
import SocialShare from './components/sharing/SocialShare';
import ImpactTracker from './components/impact/ImpactTracker';
import VolunteerManagement from './components/volunteer/VolunteerManagement';
import FoodSafetyGuidelines from './components/safety/FoodSafetyGuidelines';
import SmartMatchingDashboard from './components/matching/SmartMatchingDashboard';
import AchievementSystem from './components/gamification/AchievementSystem';
import ImpactVisualizer from './components/impact/ImpactVisualizer';
import Profile from './components/profile/Profile';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function PrivateRoute({ children, allowedUserType }) {
  const { currentUser, userType } = useAuth();

  if (!currentUser) {
    return <Navigate to="/auth" />;
  }

  if (allowedUserType && userType !== allowedUserType) {
    return <Navigate to="/auth" />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/donor-dashboard/*" element={
                <PrivateRoute allowedUserType="donor">
                  <DonorDashboard />
                </PrivateRoute>
            } />
            <Route path="/ngo-dashboard/*" element={
                <PrivateRoute allowedUserType="ngo">
                  <NGODashboard />
                </PrivateRoute>
            } />
            <Route path="/create-food-listing" element={
                <PrivateRoute allowedUserType="donor">
                  <FoodListing />
                </PrivateRoute>
            } />
            <Route path="/donate-money" element={
                <PrivateRoute allowedUserType="donor">
                  <DonateMoney />
                </PrivateRoute>
            } />
            <Route path="/chat/:donationId" element={
                <PrivateRoute>
                  <ChatSystem />
                </PrivateRoute>
            } />
            <Route path="/rating/:donationId" element={
                <PrivateRoute>
                  <RatingSystem />
                </PrivateRoute>
            } />
            <Route path="/analytics" element={
                <PrivateRoute>
                  <AdvancedAnalytics />
                </PrivateRoute>
            } />
            <Route path="/share/:donationId" element={
              <PrivateRoute>
                <SocialShare />
              </PrivateRoute>
            } />
            <Route path="/impact" element={
                <PrivateRoute>
                  <ImpactTracker />
                </PrivateRoute>
            } />
            <Route path="/impact-visualizer" element={
              <PrivateRoute>
                <ImpactVisualizer />
              </PrivateRoute>
            } />
            <Route path="/volunteers" element={
                <PrivateRoute allowedUserType="ngo">
                  <VolunteerManagement />
                </PrivateRoute>
            } />
            <Route path="/safety-guidelines" element={
                <PrivateRoute>
                  <FoodSafetyGuidelines />
                </PrivateRoute>
            } />
            <Route path="/smart-matching" element={
              <PrivateRoute allowedUserType="ngo">
                <SmartMatchingDashboard />
              </PrivateRoute>
            } />
            <Route path="/achievements" element={
              <PrivateRoute>
                <AchievementSystem />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/auth" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 