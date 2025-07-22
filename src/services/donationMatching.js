import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// ML model simulation for donation needs prediction
const predictDonationNeeds = async (ngoData, historicalDonations) => {
  // In a real implementation, this would use TensorFlow.js or a cloud ML service
  const predictions = {
    estimatedQuantity: 0,
    preferredFoodTypes: [],
    bestPickupTimes: [],
    urgencyScore: 0
  };

  // Analyze historical donation patterns
  const weekday = new Date().getDay();
  const hour = new Date().getHours();

  // Calculate average donations by day and time
  const donationsByDay = new Array(7).fill(0);
  const donationsByHour = new Array(24).fill(0);
  
  historicalDonations.forEach(donation => {
    const donationDate = donation.createdAt.toDate();
    donationsByDay[donationDate.getDay()]++;
    donationsByHour[donationDate.getHours()]++;
  });

  // Predict needed quantity based on historical patterns
  predictions.estimatedQuantity = Math.round(
    (donationsByDay[weekday] / historicalDonations.length) * 100
  );

  // Determine preferred food types based on successful donations
  const foodTypeCount = {};
  historicalDonations.forEach(donation => {
    if (!foodTypeCount[donation.foodType]) {
      foodTypeCount[donation.foodType] = 0;
    }
    foodTypeCount[donation.foodType]++;
  });

  predictions.preferredFoodTypes = Object.entries(foodTypeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type);

  // Calculate best pickup times
  const peakHours = donationsByHour
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(({ hour }) => hour);

  predictions.bestPickupTimes = peakHours.map(hour => ({
    hour,
    probability: donationsByHour[hour] / Math.max(...donationsByHour),
  }));

  // Calculate urgency score based on recent donation frequency
  const recentDonations = historicalDonations.filter(
    donation => Date.now() - donation.createdAt.toDate() < 7 * 24 * 60 * 60 * 1000
  );
  predictions.urgencyScore = Math.min(
    100,
    Math.round((1 - recentDonations.length / 7) * 100)
  );

  return predictions;
};

// Route optimization using a simplified version of the Vehicle Routing Problem
const optimizeRoute = (points, startPoint) => {
  const route = [startPoint];
  const unvisited = [...points];
  let currentPoint = startPoint;

  while (unvisited.length > 0) {
    const distances = unvisited.map(point => ({
      point,
      distance: calculateDistance(currentPoint, point)
    }));
    
    const nearest = distances.reduce((min, curr) => 
      curr.distance < min.distance ? curr : min
    );

    route.push(nearest.point);
    unvisited.splice(unvisited.indexOf(nearest.point), 1);
    currentPoint = nearest.point;
  }

  return route;
};

const calculateDistance = (point1, point2) => {
  // Haversine formula for calculating distance between two points
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRad = (value) => (value * Math.PI) / 180;

// Smart scheduling system
const generateOptimalSchedule = async (donations, ngoLocation) => {
  const schedule = [];
  const timeSlots = [];

  // Group donations by proximity and time windows
  const donationGroups = groupDonationsByProximity(donations, ngoLocation);

  // For each group, find optimal pickup time
  for (const group of donationGroups) {
    const optimalTime = await findOptimalPickupTime(group, timeSlots);
    if (optimalTime) {
      schedule.push({
        donations: group,
        pickupTime: optimalTime,
        route: optimizeRoute(group.map(d => d.location), ngoLocation)
      });
      timeSlots.push(optimalTime);
    }
  }

  return schedule;
};

const groupDonationsByProximity = (donations, center) => {
  // Group donations that are within 5km of each other
  const groups = [];
  const processed = new Set();

  for (const donation of donations) {
    if (processed.has(donation.id)) continue;

    const group = [donation];
    processed.add(donation.id);

    for (const other of donations) {
      if (processed.has(other.id)) continue;

      if (calculateDistance(donation.location, other.location) <= 5) {
        group.push(other);
        processed.add(other.id);
      }
    }

    groups.push(group);
  }

  return groups;
};

const findOptimalPickupTime = async (donations, existingTimeSlots) => {
  // Find a time slot that works for all donations in the group
  const availableWindows = donations.map(d => ({
    start: d.availableStartTime,
    end: d.availableEndTime
  }));

  // Find overlapping time windows
  const overlap = availableWindows.reduce((overlap, window) => ({
    start: Math.max(overlap.start, window.start),
    end: Math.min(overlap.end, window.end)
  }));

  if (overlap.start >= overlap.end) return null;

  // Avoid conflicts with existing schedules
  const availableSlots = [];
  for (let time = overlap.start; time <= overlap.end; time += 30 * 60 * 1000) {
    if (!existingTimeSlots.some(slot => Math.abs(slot - time) < 30 * 60 * 1000)) {
      availableSlots.push(time);
    }
  }

  return availableSlots[0] || null;
};

export const DonationMatchingService = {
  predictDonationNeeds,
  optimizeRoute,
  generateOptimalSchedule,
  
  // Main matching function
  async findOptimalMatches(ngoId) {
    try {
      // Make sure ngoId is defined
      if (!ngoId) {
        throw new Error('NGO ID is required for finding optimal matches');
      }

      // Get NGO data
      const ngoDocRef = doc(db, 'users', ngoId);
      const ngoDoc = await getDoc(ngoDocRef);
      
      if (!ngoDoc.exists()) {
        throw new Error('NGO data not found');
      }
      
      const ngoData = ngoDoc.data();

      if (!ngoData || !ngoData.city) {
        throw new Error('NGO city data not available');
      }

      // Get historical donations
      const historicalDonationsQuery = query(
        collection(db, 'donations'),
        where('ngoId', '==', ngoId),
        where('status', '==', 'delivered'),
        orderBy('createdAt', 'desc')
      );
      const historicalDonations = (await getDocs(historicalDonationsQuery))
        .docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // Get active donations
      const activeDonationsQuery = query(
        collection(db, 'donations'),
        where('status', '==', 'available'),
        where('city', '==', ngoData.city)
      );
      const activeDonations = (await getDocs(activeDonationsQuery))
        .docs.map(doc => ({ ...doc.data(), id: doc.id }));

      // Predict NGO needs
      const predictions = await predictDonationNeeds(ngoData, historicalDonations);

      // Score and rank available donations
      const scoredDonations = activeDonations.map(donation => {
        const score = calculateMatchScore(donation, predictions, ngoData);
        return { ...donation, matchScore: score };
      }).sort((a, b) => b.matchScore - a.matchScore);

      // Generate optimal schedule for top matches
      const topMatches = scoredDonations.slice(0, 5);
      const schedule = await generateOptimalSchedule(topMatches, ngoData.location);

      return {
        predictions,
        recommendations: topMatches,
        schedule
      };
    } catch (error) {
      console.error('Error in findOptimalMatches:', error);
      throw error;
    }
  }
};

const calculateMatchScore = (donation, predictions, ngoData) => {
  let score = 0;

  // Food type match
  if (predictions.preferredFoodTypes.includes(donation.foodType)) {
    score += 30;
  }

  // Quantity match
  const quantityDiff = Math.abs(donation.quantity - predictions.estimatedQuantity);
  score += Math.max(0, 20 - (quantityDiff / predictions.estimatedQuantity) * 20);

  // Distance score
  const distance = calculateDistance(donation.location, ngoData.location);
  score += Math.max(0, 30 - (distance / 10) * 30); // Decrease score with distance

  // Time window match
  const pickupTime = new Date(donation.availableStartTime).getHours();
  if (predictions.bestPickupTimes.some(t => t.hour === pickupTime)) {
    score += 20;
  }

  return Math.min(100, score);
}; 