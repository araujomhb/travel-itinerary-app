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
  destination: string;
  city?: string;
  startDate?: Date;
  endDate?: Date;
  baseCurrency: string;
  status: "planned" | "visited";
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
  });
};

export const createTrip = async (tripData: Omit<Trip, "id" | "createdAt">) => {
  const data: any = {
    ...tripData,
    status: tripData.status || "planned",
    createdAt: Timestamp.now(),
  };
  if (tripData.startDate) data.startDate = Timestamp.fromDate(tripData.startDate);
  if (tripData.endDate) data.endDate = Timestamp.fromDate(tripData.endDate);
  
  return await addDoc(collection(db, TRIPS_COLLECTION), data);
};

export const getTrips = async (userId: string) => {
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
};

export const deleteTrip = async (tripId: string) => {
  await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
};

export const updateTrip = async (tripId: string, data: Partial<Trip>) => {
  const tripRef = doc(db, TRIPS_COLLECTION, tripId);
  const updateData: any = { ...data };
  if (data.startDate) updateData.startDate = Timestamp.fromDate(data.startDate);
  if (data.endDate) updateData.endDate = Timestamp.fromDate(data.endDate);
  await updateDoc(tripRef, updateData);
};

// Itinerary Helpers
export const addItineraryItem = async (item: Omit<ItineraryItem, "id">) => {
  return await addDoc(collection(db, TRIPS_COLLECTION, item.tripId, ITINERARY_COLLECTION), {
    ...item,
    date: Timestamp.fromDate(item.date),
  });
};

export const getItinerary = async (tripId: string) => {
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
};

// Expense Helpers
export const addExpense = async (expense: Omit<Expense, "id">) => {
  return await addDoc(collection(db, TRIPS_COLLECTION, expense.tripId, EXPENSES_COLLECTION), {
    ...expense,
    date: Timestamp.fromDate(expense.date),
  });
};

export const getExpenses = async (tripId: string) => {
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
};
