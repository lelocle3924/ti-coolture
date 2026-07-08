import { collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { StoreProfile, Product, TouristRoute } from "../types";

const INITIAL_STORES: StoreProfile[] = [
  {
    id: "store_clay_craft",
    userId: "mock_shop_owner_1",
    name: "Tí Clay Craft",
    logoUrl: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150&h=150&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1565192647048-f997ded87958?w=1000&h=400&fit=crop",
    story: "Founded by a group of young artisans in Saigon, Tí Clay Craft breathes new life into traditional Vietnamese terracotta. Each piece is hand-thrown and fired in small batches, reflecting the rugged yet graceful beauty of local clay.",
    vibe: "Warm, earthy, wabi-sabi minimalist",
    phone: "0901234567",
    email: "claycraft@ticoolture.vn",
    address: "12/4 Nguyen Hue, District 1, Ho Chi Minh City",
    taxId: "0314567890",
    socials: {
      facebook: "https://facebook.com/ticlaycraft",
      instagram: "https://instagram.com/ticlaycraft",
      tiktok: "https://tiktok.com/@ticlaycraft",
      threads: "https://threads.net/@ticlaycraft"
    },
    socialToggles: {
      facebook: true,
      instagram: true,
      tiktok: true,
      threads: true,
      website: false,
      zalo: false
    },
    registered: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "store_saigon_weaver",
    userId: "mock_shop_owner_2",
    name: "Saigon Weaver",
    logoUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=150&h=150&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1000&h=400&fit=crop",
    story: "Saigon Weaver preserves ancient ethnic minority weaving techniques from the Highlands of Vietnam. Our designs bridge the gap between traditional cultural textiles and modern, brutalist aesthetic interiors.",
    vibe: "Stark, textured, geometric heritage",
    phone: "0909876543",
    email: "weaver@ticoolture.vn",
    address: "88 Le Loi, District 1, Ho Chi Minh City",
    taxId: "0310987654",
    socials: {
      facebook: "https://facebook.com/saigonweaver",
      instagram: "https://instagram.com/saigonweaver",
      tiktok: "https://tiktok.com/@saigonweaver"
    },
    socialToggles: {
      facebook: true,
      instagram: true,
      tiktok: true,
      threads: false,
      website: false,
      zalo: false
    },
    registered: true,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_ceramic_set",
    storeId: "store_clay_craft",
    storeName: "Tí Clay Craft",
    storeLogo: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150&h=150&fit=crop",
    name: "Terracotta Tea Set 'Đất Đen'",
    price: 450000,
    currency: "VND",
    description: "A stark, unglazed terracotta tea set crafted with regional dark clay. Naturally porous surface absorbs tea oils over time, enriching the flavor and developing a unique dark sheen.",
    images: [
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1594631252845-29fc4cc8cdf9?w=600&h=600&fit=crop"
    ],
    category: "Tableware",
    variants: ["Charcoal Black", "Unglazed Ochre"],
    material: "Terracotta local clay",
    size: "Teapot 450ml, 4x Cups 80ml",
    brand: "Tí Clay Craft",
    story: "Designed in our District 1 workshop and wood-fired in Biên Hòa for 72 hours, achieving erratic metallic flashes across the surface.",
    clicks: 142,
    status: "Approved",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_rough_vase",
    storeId: "store_clay_craft",
    storeName: "Tí Clay Craft",
    storeLogo: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150&h=150&fit=crop",
    name: "Brutalist Crushed Vase",
    price: 320000,
    currency: "VND",
    description: "A heavy, hand-pinched vase with dramatic finger indentations and a coarse sand-grog texture. Perfect as a singular sculptural piece or holding dry branches.",
    images: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&h=600&fit=crop"
    ],
    category: "Home Decor",
    variants: ["Standard Sand", "Oxide Grey"],
    material: "Stoneware with river sand grog",
    size: "Height: 22cm, Weight: 1.8kg",
    brand: "Tí Clay Craft",
    story: "An homage to the rugged concrete architecture of 1970s Saigon, combining brutal geometry with the organic warmth of earth.",
    clicks: 89,
    status: "Approved",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_rattan_basket",
    storeId: "store_clay_craft",
    storeName: "Tí Clay Craft",
    storeLogo: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=150&h=150&fit=crop",
    name: "Split-Rattan Utility Carrier",
    price: 280000,
    currency: "VND",
    description: "A structured, double-walled container woven using split rattan and wild vines. Features thick ironwood carrying pegs secured with structural hemp binding.",
    images: [
      "https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=600&fit=crop"
    ],
    category: "Home Decor",
    variants: ["Natural Rattan", "Smoked Charcoal"],
    material: "Natural Rattan & Hemp cord",
    size: "Diameter: 30cm, Height: 18cm",
    brand: "Tí Coolture curated",
    story: "Hand-made in a family workshop in Sông Bé province, utilizing traditional split-weave geometry.",
    clicks: 53,
    status: "Approved",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_brocade_tote",
    storeId: "store_saigon_weaver",
    storeName: "Saigon Weaver",
    storeLogo: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=150&h=150&fit=crop",
    name: "Geometric Brocade Tote Bag",
    price: 520000,
    currency: "VND",
    description: "A hard-wearing utility bag constructed with dense, hand-woven brocade cotton sourced directly from K'Ho weavers. Reinforced with natural black leather straps and brutalist oxidized metal rivets.",
    images: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&h=600&fit=crop"
    ],
    category: "Accessories",
    variants: ["Midnight Obsidian", "Raw Ivory & Rust"],
    material: "Handspun Cotton & Bovine Leather",
    size: "Width: 40cm, Height: 35cm, Depth: 12cm",
    brand: "Saigon Weaver",
    story: "The textile pattern represents the 'Starry Night' motif of K'Ho folklore, woven entirely from memory without modern templates.",
    clicks: 167,
    status: "Approved",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod_indigo_apron",
    storeId: "store_saigon_weaver",
    storeName: "Saigon Weaver",
    storeLogo: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=150&h=150&fit=crop",
    name: "Natural Indigo Studio Apron",
    price: 390000,
    currency: "VND",
    description: "A heavy-weight canvas apron hand-dipped 12 times in pure organic indigo ferment. Over time, the garment will form deep custom crease patterns unique to your work habits.",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&h=600&fit=crop"
    ],
    category: "Apparel",
    variants: ["Deep Indigo", "Overdyed Indigo Black"],
    material: "14oz Canvas & Brass hardware",
    size: "One Size (Adjustable straps)",
    brand: "Saigon Weaver",
    story: "Hand-dyed using cold indigo vats in our rooftop workshop in Saigon. Smells slightly of fermented mountain herbs.",
    clicks: 110,
    status: "Approved",
    createdAt: new Date().toISOString()
  }
];

const INITIAL_ROUTES: TouristRoute[] = [
  {
    id: "route_artisan_cafe",
    name: "Artisan Café Route",
    description: "A curated route mapping HCMC's most striking brutalist-style cafés celebrating local pottery, manual brews, and raw architecture.",
    stops: [
      {
        id: "cafe_1",
        name: "Tí Clay Craft (Main Studio)",
        address: "12/4 Nguyen Hue, District 1, HCMC",
        description: "Check in at the active pottery workshop and view local ceramic installations. Get a 10% coupon with checking in on Tí Coolture.",
        x: 25,
        y: 40
      },
      {
        id: "cafe_2",
        name: "Saigon Weaver Showroom",
        address: "88 Le Loi, District 1, HCMC",
        description: "Discover ethnic minority hand-woven textiles and enjoy hand-drip coffee served in custom 'Đất Đen' stoneware.",
        x: 55,
        y: 50
      },
      {
        id: "cafe_3",
        name: "Unglazed Coffee Lab",
        address: "145 Pasteur, District 3, HCMC",
        description: "A brutalist cafe structure built entirely from raw concrete and local brick, serving craft cold brews.",
        x: 80,
        y: 25
      }
    ]
  },
  {
    id: "route_handicraft_trail",
    name: "Handicraft Trail",
    description: "A trail for raw texture lovers, guiding you through ancient textile workshops and natural indigo dyeing pits.",
    stops: [
      {
        id: "trail_1",
        name: "Saigon Weaver Weaving Room",
        address: "88 Le Loi, District 1, HCMC",
        description: "Observe manual loom operation and try weaving a custom geometric coaster under expert ethnic guidance.",
        x: 30,
        y: 65
      },
      {
        id: "trail_2",
        name: "Indigo Rooftop Vats",
        address: "220 Dien Bien Phu, Binh Thanh, HCMC",
        description: "An outdoor mountain indigo vat station. Try hand-dyeing a raw cotton tote in rich blue tones.",
        x: 75,
        y: 45
      }
    ]
  }
];

export async function seedFirestoreIfEmpty() {
  try {
    // Check if seeded already in localStorage to avoid double calls
    if (localStorage.getItem("ticoolture_seeded") === "true") {
      return;
    }

    const storesSnap = await getDocs(collection(db, "stores"));
    if (storesSnap.empty) {
      console.log("Seeding stores...");
      for (const store of INITIAL_STORES) {
        await setDoc(doc(db, "stores", store.id), store);
      }
    }

    const productsSnap = await getDocs(collection(db, "products"));
    if (productsSnap.empty) {
      console.log("Seeding products...");
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
    }

    const routesSnap = await getDocs(collection(db, "routes"));
    if (routesSnap.empty) {
      console.log("Seeding routes...");
      for (const route of INITIAL_ROUTES) {
        await setDoc(doc(db, "routes", route.id), route);
      }
    }

    localStorage.setItem("ticoolture_seeded", "true");
    console.log("Firestore seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding firestore:", error);
  }
}
