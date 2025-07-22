import { db } from './firebase';
import { doc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';

export const createTestUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document does not exist');
    }

    // Update user with test data
    await updateDoc(userRef, {
      points: 0,
      completedAchievements: [],
      donationCount: 0,
      totalPeopleFed: 0,
      lastUpdated: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error creating test user data:', error);
    throw error;
  }
};

export const createTestDonations = async (userId) => {
  try {
    const donationsRef = collection(db, 'donations');
    const testDonations = [
      {
        donorId: userId,
        foodType: 'Rice',
        foodName: 'Fresh Rice',
        description: 'High-quality rice suitable for cooking',
        quantity: 10,
        unit: 'kg',
        donationType: 'Food',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        pickupDate: new Date().toISOString(),
        pickupTime: '10:00 AM',
        servings: 100,
        location: {
          lat: 20.5937,
          lng: 78.9629,
          address: 'Test Location, City'
        },
        notes: 'Test donation',
        blockchainId: 'test-blockchain-id-1',
        ngoId: 'test-ngo-id',
        ngoName: 'Test NGO'
      },
      {
        donorId: userId,
        foodType: 'Vegetables',
        foodName: 'Fresh Vegetables',
        description: 'Assorted fresh vegetables',
        quantity: 5,
        unit: 'kg',
        donationType: 'Food',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        pickupDate: new Date().toISOString(),
        pickupTime: '11:00 AM',
        servings: 50,
        location: {
          lat: 20.5937,
          lng: 78.9629,
          address: 'Test Location, City'
        },
        notes: 'Test donation',
        blockchainId: 'test-blockchain-id-2',
        ngoId: 'test-ngo-id',
        ngoName: 'Test NGO'
      }
    ];

    for (const donation of testDonations) {
      await addDoc(donationsRef, donation);
    }

    return true;
  } catch (error) {
    console.error('Error creating test donations:', error);
    throw error;
  }
}; 