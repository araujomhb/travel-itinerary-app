import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  deleteDoc, 
  updateDoc,
  Timestamp,
  orderBy,
  onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";

export interface Trip {
  id?: string;
  userId: string;
  name?: string;
  destination: string;
  cities?: string[];
  startDate?: Date;
  endDate?: Date;
  baseCurrency: string;
  status: "planned" | "visited";
  averageDailyExpense?: number;
  totalTripCost?: number;
  notes?: string;
  categoryBudgets?: Partial<Record<Expense["category"], number>>;
  createdAt: Date;
}

export interface ItineraryItem {
  id?: string;
  tripId: string;
  date: Date;
  time: string;
  description: string;
  location: string;
}

export interface Expense {
  id?: string;
  tripId: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  category: "Food" | "Transport" | "Accommodation" | "Activities" | "Other";
  date: Date;
  notes: string;
}

const TRIPS_COLLECTION = "trips";
const ITINERARY_COLLECTION = "itinerary";
const EXPENSES_COLLECTION = "expenses";

export const getTrip = async (tripId: string) => {
  try {
    const docRef = doc(db, TRIPS_COLLECTION, tripId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      startDate: data.startDate ? (data.startDate as Timestamp).toDate() : undefined,
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
      createdAt: (data.createdAt as Timestamp).toDate(),
      status: data.status || "planned",
    } as Trip;
  } catch (error) {
    console.error(`[DB ERROR] getTrip fail (ID: ${tripId}):`, error);
    throw error;
  }
};

export const subscribeToTrip = (tripId: string, callback: (trip: Trip | null) => void) => {
  const docRef = doc(db, TRIPS_COLLECTION, tripId);
  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }
    const data = docSnap.data();
    callback({
      id: docSnap.id,
      ...data,
      startDate: data.startDate ? (data.startDate as Timestamp).toDate() : undefined,
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
      createdAt: (data.createdAt as Timestamp).toDate(),
      status: data.status || "planned",
    } as Trip);
  }, (error) => {
    console.error(`[DB ERROR] subscribeToTrip sync fail (ID: ${tripId}):`, error);
  });
};

export const createTrip = async (tripData: Omit<Trip, "id" | "createdAt">) => {
  try {
    const data: any = {
      ...tripData,
      status: tripData.status || "planned",
      createdAt: Timestamp.now(),
    };
    if (tripData.startDate) data.startDate = Timestamp.fromDate(tripData.startDate);
    if (tripData.endDate) data.endDate = Timestamp.fromDate(tripData.endDate);
    
    console.log(`[DB INFO] Creating trip for user: ${tripData.userId} in ${tripData.destination}`);
    const docRef = await addDoc(collection(db, TRIPS_COLLECTION), data);
    console.log(`[DB SUCCESS] Trip created with ID: ${docRef.id}`);
    return docRef;
  } catch (error) {
    console.error(`[DB ERROR] createTrip fail:`, error);
    throw error;
  }
};

export const getTrips = async (userId: string) => {
  try {
    const q = query(
      collection(db, TRIPS_COLLECTION), 
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate ? (data.startDate as Timestamp).toDate() : undefined,
        endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
        createdAt: (data.createdAt as Timestamp).toDate(),
        status: data.status || "planned",
      };
    }) as Trip[];
  } catch (error) {
    console.error(`[DB ERROR] getTrips fail (User: ${userId}):`, error);
    throw error;
  }
};

export const deleteTrip = async (tripId: string) => {
  try {
    await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
  } catch (error) {
    console.error(`[DB ERROR] deleteTrip fail (ID: ${tripId}):`, error);
    throw error;
  }
};

export const updateTrip = async (tripId: string, data: Partial<Trip>) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = Timestamp.fromDate(data.startDate);
    if (data.endDate) updateData.endDate = Timestamp.fromDate(data.endDate);
    await updateDoc(tripRef, updateData);
  } catch (error) {
    console.error(`[DB ERROR] updateTrip fail (ID: ${tripId}):`, error);
    throw error;
  }
};

// Itinerary Helpers
export const addItineraryItem = async (item: Omit<ItineraryItem, "id">) => {
  try {
    return await addDoc(collection(db, TRIPS_COLLECTION, item.tripId, ITINERARY_COLLECTION), {
      ...item,
      date: Timestamp.fromDate(item.date),
    });
  } catch (error) {
    console.error(`[DB ERROR] addItineraryItem fail (Trip: ${item.tripId}):`, error);
    throw error;
  }
};

export const getItinerary = async (tripId: string) => {
  try {
    const q = query(
      collection(db, TRIPS_COLLECTION, tripId, ITINERARY_COLLECTION),
      orderBy("date", "asc"),
      orderBy("time", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate(),
    })) as ItineraryItem[];
  } catch (error) {
    console.error(`[DB ERROR] getItinerary fail (Trip: ${tripId}):`, error);
    throw error;
  }
};

export const deleteItineraryItem = async (tripId: string, itemId: string) => {
  try {
    await deleteDoc(doc(db, TRIPS_COLLECTION, tripId, ITINERARY_COLLECTION, itemId));
  } catch (error) {
    console.error(`[DB ERROR] deleteItineraryItem fail (Item: ${itemId}):`, error);
    throw error;
  }
};

export const updateItineraryItem = async (tripId: string, itemId: string, item: Partial<ItineraryItem>) => {
  try {
    const itemRef = doc(db, TRIPS_COLLECTION, tripId, ITINERARY_COLLECTION, itemId);
    const updateData: any = { ...item };
    if (item.date) updateData.date = Timestamp.fromDate(item.date);
    await updateDoc(itemRef, updateData);
  } catch (error) {
    console.error(`[DB ERROR] updateItineraryItem fail (Item: ${itemId}):`, error);
    throw error;
  }
};

// Expense Helpers
export const addExpense = async (expense: Omit<Expense, "id">) => {
  try {
    return await addDoc(collection(db, TRIPS_COLLECTION, expense.tripId, EXPENSES_COLLECTION), {
      ...expense,
      date: Timestamp.fromDate(expense.date),
    });
  } catch (error) {
    console.error(`[DB ERROR] addExpense fail (Trip: ${expense.tripId}):`, error);
    throw error;
  }
};

export const getExpenses = async (tripId: string) => {
  try {
    const q = query(
      collection(db, TRIPS_COLLECTION, tripId, EXPENSES_COLLECTION),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate(),
    })) as Expense[];
  } catch (error) {
    console.error(`[DB ERROR] getExpenses fail (Trip: ${tripId}):`, error);
    throw error;
  }
};

export const deleteExpense = async (tripId: string, expenseId: string) => {
  try {
    await deleteDoc(doc(db, TRIPS_COLLECTION, tripId, EXPENSES_COLLECTION, expenseId));
  } catch (error) {
    console.error(`[DB ERROR] deleteExpense fail (Expense: ${expenseId}):`, error);
    throw error;
  }
};
