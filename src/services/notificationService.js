import { db } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
} from 'firebase/firestore';

export const NotificationTypes = {
  DONATION_ACCEPTED: 'DONATION_ACCEPTED',
  DONATION_PICKED_UP: 'DONATION_PICKED_UP',
  DONATION_DELIVERED: 'DONATION_DELIVERED',
  NEW_DONATION_REQUEST: 'NEW_DONATION_REQUEST',
  PICKUP_REMINDER: 'PICKUP_REMINDER',
};

export const createNotification = async (data) => {
  try {
    const notificationData = {
      userId: data.userId,
      type: data.type,
      message: getNotificationMessage(data),
      data: data.data || {},
      read: false,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return {
      id: docRef.id,
      ...notificationData,
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(notifications);
  });
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: new Date(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const createTestNotifications = async (userId) => {
  try {
    const testNotifications = [
      {
        userId,
        type: NotificationTypes.DONATION_ACCEPTED,
        message: 'Your donation has been accepted by Test NGO',
        data: { ngoName: 'Test NGO' },
        read: false,
        createdAt: new Date(),
      },
      {
        userId,
        type: NotificationTypes.DONATION_PICKED_UP,
        message: 'Your donation has been picked up by Test NGO',
        data: { ngoName: 'Test NGO' },
        read: false,
        createdAt: new Date(),
      },
      {
        userId,
        type: NotificationTypes.DONATION_DELIVERED,
        message: 'Donation has been successfully delivered to Test NGO',
        data: { ngoName: 'Test NGO' },
        read: false,
        createdAt: new Date(),
      },
      {
        userId,
        type: NotificationTypes.NEW_DONATION_REQUEST,
        message: 'New donation available from Test Donor',
        data: { donorName: 'Test Donor' },
        read: false,
        createdAt: new Date(),
      },
      {
        userId,
        type: NotificationTypes.PICKUP_REMINDER,
        message: 'Reminder: Scheduled pickup for donation from Test Donor in 1 hour',
        data: { donorName: 'Test Donor' },
        read: false,
        createdAt: new Date(),
      }
    ];

    for (const notification of testNotifications) {
      await addDoc(collection(db, 'notifications'), notification);
    }

    return true;
  } catch (error) {
    console.error('Error creating test notifications:', error);
    throw error;
  }
};

const getNotificationMessage = (data) => {
  switch (data.type) {
    case NotificationTypes.DONATION_ACCEPTED:
      return `Your donation has been accepted by ${data.data.ngoName}`;
    case NotificationTypes.DONATION_PICKED_UP:
      return `Your donation has been picked up by ${data.data.ngoName}`;
    case NotificationTypes.DONATION_DELIVERED:
      return `Donation has been successfully delivered to ${data.data.ngoName}`;
    case NotificationTypes.NEW_DONATION_REQUEST:
      return `New donation available from ${data.data.donorName}`;
    case NotificationTypes.PICKUP_REMINDER:
      return `Reminder: Scheduled pickup for donation from ${data.data.donorName} in 1 hour`;
    default:
      return 'New notification';
  }
}; 