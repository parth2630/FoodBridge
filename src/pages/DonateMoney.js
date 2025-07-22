import React from 'react';
import { Box, Typography } from '@mui/material';
import MoneyDonation from '../components/donation/MoneyDonation';

const DonateMoney = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Donate Money
      </Typography>
      <MoneyDonation />
    </Box>
  );
};

export default DonateMoney; 