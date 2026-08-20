import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to read database
export function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData = seedDatabase();
      writeDB(initialData);
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading DB, re-seeding:', error);
    const initialData = seedDatabase();
    writeDB(initialData);
    return initialData;
  }
}

// Helper to write database
export function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

// Seed Initial Data
function seedDatabase() {
  return {
    products: [
      {
        id: "p1",
        name: "Pastel Lavender Engagement Leheriya Gown",
        category: "fashion",
        price: 5200,
        originalPrice: 5200,
        minPrice: 4200,
        flexibility: 0.8,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60",
        description: "Elegant pastel lavender gown, perfect for engagement ceremonies and festive occasions. Made with lightweight Georgette fabric.",
        colors: ["pastel", "lavender", "pink"],
        sizes: ["S", "M", "L", "XL"],
        fitGuide: { S: 34, M: 36, L: 38, XL: 40 }, // Chest size in inches
        fitType: "runs-small", // Warn if user typically buys M and this runs small
        tags: ["petite", "engagement", "partywear", "traditional", "gown", "sister", "lavender"]
      },
      {
        id: "p2",
        name: "Pastel Mint Green Anarkali Suit",
        category: "fashion",
        price: 4800,
        originalPrice: 4800,
        minPrice: 3900,
        flexibility: 0.7,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60",
        description: "Graceful mint green designer Anarkali suit with delicate silver embroidery. Made of premium cotton silk, comfortable yet regal.",
        colors: ["pastel", "mint green", "green"],
        sizes: ["S", "M", "L", "XL"],
        fitGuide: { S: 34, M: 36, L: 38, XL: 40 },
        fitType: "true-to-size",
        tags: ["wedding", "engagement", "pastel", "festive", "traditional", "petite", "mint"]
      },
      {
        id: "p3",
        name: "Classic Navy Blue Slim Fit Suit",
        category: "fashion",
        price: 7500,
        originalPrice: 7500,
        minPrice: 6500,
        flexibility: 0.5,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&auto=format&fit=crop&q=60",
        description: "Sharp and sophisticated navy blue two-piece suit. Made of breathable Italian wool blend, tailored for a modern slim silhouette.",
        colors: ["navy", "blue"],
        sizes: ["M", "L", "XL"],
        fitGuide: { M: 38, L: 40, XL: 42 },
        fitType: "runs-small",
        tags: ["formal", "wedding", "office", "navy", "slim-fit"]
      },
      {
        id: "p4",
        name: "Pastel Peach Embroidered Lehenga",
        category: "fashion",
        price: 9500,
        originalPrice: 9500,
        minPrice: 7800,
        flexibility: 0.9,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&auto=format&fit=crop&q=60",
        description: "Stunning peach color Lehenga with detailed silver floral hand-embroidery. Perfect for bridesmaids and high-end ceremonies.",
        colors: ["pastel", "peach", "pink"],
        sizes: ["S", "M", "L"],
        fitGuide: { S: 34, M: 36, L: 38 },
        fitType: "true-to-size",
        tags: ["wedding", "engagement", "pastel", "lehenga", "designer", "peach"]
      },
      {
        id: "p5",
        name: "18K Rose Gold Diamond Engagement Ring",
        category: "jewelry",
        price: 24500,
        originalPrice: 24500,
        minPrice: 22000,
        flexibility: 0.4,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=60",
        description: "Exquisite 18-karat rose gold band set with a central round brilliant-cut solitaire diamond. GIA certified.",
        colors: ["rose gold", "gold"],
        sizes: ["6", "7", "8"],
        fitGuide: { 6: 16.5, 7: 17.3, 8: 18.1 }, // Internal diameter in mm
        fitType: "true-to-size",
        tags: ["engagement", "luxury", "diamond", "gold", "ring"]
      },
      {
        id: "p6",
        name: "Minimalist Silver Pendant Necklace",
        category: "jewelry",
        price: 1800,
        originalPrice: 1800,
        minPrice: 1500,
        flexibility: 0.6,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60",
        description: "Elegant sterling silver chain with a geometric teardrop pendant. Hypoallergenic, perfect for everyday minimal wear.",
        colors: ["silver"],
        sizes: ["one-size"],
        fitGuide: { "one-size": 18 }, // Chain length in inches
        fitType: "true-to-size",
        tags: ["silver", "minimalist", "casual", "necklace", "gift"]
      },
      {
        id: "p7",
        name: "Aura Smart Watch Series 5",
        category: "electronics",
        price: 4999,
        originalPrice: 4999,
        minPrice: 4300,
        flexibility: 0.5,
        rating: 4.4,
        image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=60",
        description: "Advanced fitness tracker and smart notifications hub. 1.8-inch AMOLED display, 7-day battery, heart rate & SpO2 tracking.",
        colors: ["matte black", "slate silver"],
        sizes: ["one-size"],
        fitGuide: { "one-size": 44 }, // Case size in mm
        fitType: "true-to-size",
        tags: ["smartwatch", "gadget", "fitness", "wearable", "black"]
      },
      {
        id: "p8",
        name: "Zenith Pro Wireless ANC Headphones",
        category: "electronics",
        price: 8999,
        originalPrice: 8999,
        minPrice: 7500,
        flexibility: 0.6,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
        description: "Industry-leading active noise cancelling headphones. Hi-Res audio, 40 hours playtime, memory foam ear cups for long sessions.",
        colors: ["matte black", "sandstone beige"],
        sizes: ["one-size"],
        fitGuide: { "one-size": 0 },
        fitType: "true-to-size",
        tags: ["headphones", "anc", "wireless", "audio", "music"]
      }
    ],
    // Mock user profile (id: user_1)
    userProfile: {
      id: "user_1",
      name: "Anjali Gupta",
      styleProfile: {
        preferredCategories: ["fashion", "jewelry"],
        preferredColors: ["pastel lavender", "peach"],
        preferredMetals: ["rose gold"],
        preferredSizes: {
          fashion: "M",
          jewelry: "7"
        },
        typicalBudget: 6000,
        stylePreferences: ["traditional", "minimalist", "pastel"]
      },
      // Purchase history & returns behavior for the Size & Fit Advisor
      purchaseHistory: [
        {
          orderId: "o1001",
          productId: "p3", // Classic Navy Blue Suit
          productName: "Classic Navy Blue Slim Fit Suit",
          size: "M",
          status: "delivered",
          date: "2026-04-10"
        },
        {
          orderId: "o1002",
          productId: "p1", // Gown
          productName: "Pastel Lavender Engagement Leheriya Gown",
          size: "M",
          status: "returned",
          returnReason: "too-tight",
          returnComment: "Beautiful gown but fits too tight around the chest. I need a larger size.",
          date: "2026-05-15"
        }
      ],
      chatContext: {
        activeBargain: null, // Track negotiations: { productId, userOffer, counterCount, lastCounterOffer }
        history: [
          { sender: "assistant", text: "Hello! I am your AI Shopping Assistant. How can I help you find the perfect outfit, accessory, or gadget today?" }
        ]
      }
    },
    orders: [
      {
        orderId: "o1001",
        userId: "user_1",
        productId: "p3",
        productName: "Classic Navy Blue Slim Fit Suit",
        pricePaid: 7500,
        size: "M",
        status: "Delivered",
        date: "2026-04-10",
        trackingStatus: "Delivered to reception desk."
      },
      {
        orderId: "o1002",
        userId: "user_1",
        productId: "p1",
        productName: "Pastel Lavender Engagement Leheriya Gown",
        pricePaid: 5200,
        size: "M",
        status: "Returned",
        returnReason: "too-tight",
        date: "2026-05-15",
        trackingStatus: "Return approved and refund processed."
      }
    ]
  };
}
