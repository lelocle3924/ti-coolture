import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc, 
  query, 
  where, 
  increment,
  onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";
import { StoreProfile, Product, TouristRoute, UserProfile, WebhookLog } from "../types";

// Trigger a real webhook log on the Express backend simulation server
export async function triggerWebhook(action: string, payload: any) {
  try {
    const response = await fetch("/api/webhooks/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action,
        payload,
        timestamp: new Date().toISOString()
      })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to trigger webhook:", error);
    return null;
  }
}

// Fetch all stores
export async function fetchStores(): Promise<StoreProfile[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "stores"));
    const stores: StoreProfile[] = [];
    querySnapshot.forEach((doc) => {
      stores.push({ id: doc.id, ...doc.data() } as StoreProfile);
    });
    return stores;
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
}

// Fetch store by ID
export async function fetchStoreById(storeId: string): Promise<StoreProfile | null> {
  try {
    const docRef = doc(db, "stores", storeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as StoreProfile;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching store ${storeId}:`, error);
    return null;
  }
}

// Fetch products (supports filtering by status)
export async function fetchProducts(status: "Pending" | "Approved" | "Rejected" = "Approved"): Promise<Product[]> {
  try {
    const q = query(collection(db, "products"), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

// Fetch all products regardless of status (mostly for shop owner or admin)
export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}

// Fetch products of a specific store
export async function fetchProductsStore(storeId: string): Promise<Product[]> {
  try {
    const q = query(collection(db, "products"), where("storeId", "==", storeId));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (error) {
    console.error(`Error fetching products for store ${storeId}:`, error);
    return [];
  }
}

// Fetch single product by ID
export async function fetchProductById(productId: string): Promise<Product | null> {
  try {
    const docRef = doc(db, "products", productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

// Increment product click count (for Popular Now section)
export async function incrementProductClick(productId: string): Promise<void> {
  try {
    const docRef = doc(db, "products", productId);
    await updateDoc(docRef, {
      clicks: increment(1)
    });
  } catch (error) {
    console.error(`Error incrementing clicks for ${productId}:`, error);
  }
}

// Increment product view count
export async function incrementProductView(productId: string): Promise<void> {
  try {
    const docRef = doc(db, "products", productId);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error(`Error incrementing views for ${productId}:`, error);
  }
}

// Fetch tourist routes for Homepage
export async function fetchTouristRoutes(): Promise<TouristRoute[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "routes"));
    const routes: TouristRoute[] = [];
    querySnapshot.forEach((doc) => {
      routes.push({ id: doc.id, ...doc.data() } as TouristRoute);
    });
    return routes;
  } catch (error) {
    console.error("Error fetching tourist routes:", error);
    return [];
  }
}

// Create or retrieve a UserProfile
export async function getOrCreateUserProfile(userId: string, email: string): Promise<UserProfile> {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    } else {
      const isMockAdmin = email === "admin@ticoolture.vn" || email === "locle30092004@gmail.com";
      const newProfile: UserProfile = {
        id: userId,
        email,
        role: isMockAdmin ? "Admin" : email.endsWith("@shop.vn") ? "Shop" : "User",
        wishlist: [],
        wishlistNotes: {},
        wishlistPriceAlerts: {},
        followedShops: [],
        createdAt: new Date().toISOString()
      };
      await setDoc(docRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    console.error(`Error creating user profile for ${userId}:`, error);
    throw error;
  }
}

// Toggle wishlist status
export async function toggleWishlist(userId: string, productId: string): Promise<string[]> {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];
    
    const data = docSnap.data() as UserProfile;
    let newWishlist = [...(data.wishlist || [])];
    if (newWishlist.includes(productId)) {
      newWishlist = newWishlist.filter(id => id !== productId);
    } else {
      newWishlist.push(productId);
    }
    
    await updateDoc(docRef, { wishlist: newWishlist });
    return newWishlist;
  } catch (error) {
    console.error(`Error toggling wishlist for ${userId}:`, error);
    return [];
  }
}

// Save user notes on a wishlist item
export async function saveWishlistNote(userId: string, productId: string, note: string): Promise<void> {
  try {
    const docRef = doc(db, "users", userId);
    const fieldPath = `wishlistNotes.${productId}`;
    await updateDoc(docRef, {
      [fieldPath]: note
    });
  } catch (error) {
    console.error("Error saving wishlist note:", error);
  }
}

// Toggle store following status
export async function toggleFollowShop(userId: string, storeId: string): Promise<string[]> {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];

    const data = docSnap.data() as UserProfile;
    let newFollowed = [...(data.followedShops || [])];
    if (newFollowed.includes(storeId)) {
      newFollowed = newFollowed.filter(id => id !== storeId);
    } else {
      newFollowed.push(storeId);
    }

    await updateDoc(docRef, { followedShops: newFollowed });
    return newFollowed;
  } catch (error) {
    console.error("Error toggling followed shop:", error);
    return [];
  }
}

// Register or Update a Store Profile
export async function upsertStoreProfile(storeId: string, storeData: Partial<StoreProfile>): Promise<void> {
  try {
    const docRef = doc(db, "stores", storeId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const existing = docSnap.data() as StoreProfile;
      const newStatus = existing.status === "Approved" ? "Approved" : "Pending";
      await updateDoc(docRef, {
        ...storeData,
        status: newStatus,
        rejectionReason: newStatus === "Pending" ? "" : (existing.rejectionReason || "")
      });
    } else {
      await setDoc(docRef, {
        id: storeId,
        registered: true,
        status: "Pending",
        createdAt: new Date().toISOString(),
        ...storeData
      });
    }
  } catch (error) {
    console.error(`Error upserting store ${storeId}:`, error);
    throw error;
  }
}

// Submit/Upload a new Product for Moderation
export async function createProduct(productData: Omit<Product, "id" | "createdAt" | "clicks">): Promise<void> {
  try {
    const newProductRef = doc(collection(db, "products"));
    const newProduct: Product = {
      ...productData,
      id: newProductRef.id,
      clicks: 0,
      createdAt: new Date().toISOString()
    };
    await setDoc(newProductRef, newProduct);
  } catch (error) {
    console.error("Error creating product for moderation:", error);
    throw error;
  }
}

// Moderate/Approve/Reject a product (Admin capability)
export async function moderateProduct(productId: string, status: "Approved" | "Rejected", rejectionReason?: string): Promise<void> {
  try {
    const docRef = doc(db, "products", productId);
    await updateDoc(docRef, {
      status,
      rejectionReason: rejectionReason || ""
    });
  } catch (error) {
    console.error(`Error moderating product ${productId}:`, error);
    throw error;
  }
}

export interface ButtonClickStat {
  id: string;
  buttonText: string;
  pagePath: string;
  clicks: number;
  lastClickedAt: string;
}

// Track button click
export async function recordButtonClick(buttonText: string, pagePath: string) {
  try {
    const cleanText = buttonText.trim().replace(/[\n\r]/g, " ").substring(0, 100) || "unlabeled-button";
    const cleanPath = pagePath || "unknown-page";
    const docId = encodeURIComponent(`${cleanPath}_${cleanText}`).replace(/\./g, "%2E");
    const docRef = doc(db, "button_clicks", docId);
    
    await setDoc(docRef, {
      buttonText: cleanText,
      pagePath: cleanPath,
      clicks: increment(1),
      lastClickedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error recording button click:", error);
  }
}

// Fetch all button click stats
export async function fetchButtonClickStats(): Promise<ButtonClickStat[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "button_clicks"));
    const stats: ButtonClickStat[] = [];
    querySnapshot.forEach((doc) => {
      stats.push({ id: doc.id, ...doc.data() } as ButtonClickStat);
    });
    return stats.sort((a, b) => b.clicks - a.clicks);
  } catch (error) {
    console.error("Error fetching button click stats:", error);
    return [];
  }
}

// Update/Edit an existing product (puts it back to Pending)
export async function updateProduct(productId: string, productData: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, "products", productId);
    await updateDoc(docRef, {
      ...productData,
      status: "Pending", // Reset to pending for Admin moderation
      rejectionReason: "" // Clear any previous rejection message
    });
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    throw error;
  }
}

// Request deletion of a product (sets status to Pending and deleteRequested to true)
export async function requestDeleteProduct(productId: string): Promise<void> {
  try {
    const docRef = doc(db, "products", productId);
    await updateDoc(docRef, {
      status: "Pending",
      deleteRequested: true
    });
  } catch (error) {
    console.error(`Error requesting deletion of product ${productId}:`, error);
    throw error;
  }
}

// Permanently delete a product (used by Admin to approve deletion)
export async function permanentlyDeleteProduct(productId: string): Promise<void> {
  try {
    const docRef = doc(db, "products", productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error permanently deleting product ${productId}:`, error);
    throw error;
  }
}

// Fetch message template
export async function fetchMessageTemplate(): Promise<string> {
  try {
    const docRef = doc(db, "config", "message_template");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().template || "Hi, I saw your product {product_name} on Tí Coolture and want to buy it";
    }
  } catch (error) {
    console.error("Error fetching message template:", error);
  }
  return "Hi, I saw your product {product_name} on Tí Coolture and want to buy it";
}

// Update message template
export async function updateMessageTemplate(template: string): Promise<void> {
  try {
    const docRef = doc(db, "config", "message_template");
    await setDoc(docRef, { template }, { merge: true });
  } catch (error) {
    console.error("Error updating message template:", error);
    throw error;
  }
}

// Moderate/Approve/Reject a store profile (Admin capability)
export async function moderateStore(storeId: string, status: "Approved" | "Rejected", rejectionReason?: string): Promise<void> {
  try {
    const docRef = doc(db, "stores", storeId);
    await updateDoc(docRef, {
      status,
      rejectionReason: rejectionReason || ""
    });
  } catch (error) {
    console.error(`Error moderating store ${storeId}:`, error);
    throw error;
  }
}

