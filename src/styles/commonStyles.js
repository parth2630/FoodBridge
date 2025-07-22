export const backgroundStyles = {
  mainBackground: {
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)),
      url('/images/food-pattern.png')
    `,
    backgroundRepeat: 'repeat',
    minHeight: '100vh',
  },
  dashboardBackground: {
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)),
      url('/images/dashboard-pattern.png')
    `,
    backgroundRepeat: 'repeat',
    minHeight: '100vh',
  },
  cardHover: {
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  gradientText: {
    background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 'bold',
  },
  pageContainer: {
    padding: 3,
    maxWidth: 1200,
    margin: '0 auto',
  },
  sectionTitle: {
    position: 'relative',
    marginBottom: 4,
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -8,
      left: 0,
      width: 60,
      height: 4,
      backgroundColor: '#4CAF50',
      borderRadius: 2,
    },
  },
  donationCard: {
    border: '1px solid rgba(0, 0, 0, 0.12)',
    borderRadius: 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      borderColor: '#4CAF50',
    },
  },
  statusChip: {
    borderRadius: 4,
    fontWeight: 500,
    textTransform: 'uppercase',
    fontSize: '0.75rem',
  },
  mapContainer: {
    height: 400,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.12)',
  },
  analyticsCard: {
    padding: 3,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    '& .MuiTypography-h6': {
      marginBottom: 2,
    },
  },
  notificationItem: {
    borderLeft: '4px solid transparent',
    '&.new': {
      borderLeftColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.08)',
    },
  },
}; 