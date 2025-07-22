import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { blockchainService } from './blockchain';

export const createDonation = async (donationData) => {
  try {
    // Create donation in Firestore
    const docRef = await addDoc(collection(db, 'donations'), {
      ...donationData,
      status: 'pending',
      createdAt: new Date(),
    });

    // Create donation on blockchain
    const blockchainData = await blockchainService.createDonation({
      ...donationData,
      id: docRef.id,
    });

    // Update Firestore document with blockchain reference
    await updateDoc(doc(db, 'donations', docRef.id), {
      blockchainId: blockchainData.blockchainId,
      blockchainTxHash: blockchainData.txHash,
    });

    return {
      id: docRef.id,
      ...donationData,
      ...blockchainData,
    };
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
};

export const updateDonationStatus = async (donationId, newStatus) => {
  try {
    const donationRef = doc(db, 'donations', donationId);
    
    // Get current donation data
    const donationSnapshot = await getDocs(query(
      collection(db, 'donations'),
      where('__name__', '==', donationId)
    ));
    
    const donationData = {
      id: donationSnapshot.docs[0].id,
      ...donationSnapshot.docs[0].data(),
    };

    // Update status on blockchain
    if (donationData.blockchainId) {
      await blockchainService.updateDonationStatus(
        donationData.blockchainId,
        newStatus
      );
    }

    // Update status in Firestore
    await updateDoc(donationRef, {
      status: newStatus,
      updatedAt: new Date(),
    });

    return {
      ...donationData,
      status: newStatus,
    };
  } catch (error) {
    console.error('Error updating donation status:', error);
    throw error;
  }
};

export const getDonationsByDonor = async (donorId) => {
  try {
    const q = query(
      collection(db, 'donations'),
      where('donorId', '==', donorId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting donations:', error);
    throw error;
  }
};

export const getDonationsByNgo = async (ngoId) => {
  try {
    const q = query(
      collection(db, 'donations'),
      where('ngoId', '==', ngoId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting donations:', error);
    throw error;
  }
};

export const getDonationsByCity = async (city) => {
  try {
    const q = query(
      collection(db, 'donations'),
      where('city', '==', city),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting donations:', error);
    throw error;
  }
}; 