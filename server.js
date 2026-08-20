import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { readDB, writeDB } from './database.js';
import { parseIntentAndEntities, updateStyleProfile, searchProducts } from './nlp.js';
import { handleNegotiation } from './negotiation.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Set up image uploads for visual search
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

// --- API ENDPOINTS ---

// Get all products
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Get user profile (including style profile and purchase history)
app.get('/api/profile', (req, res) => {
  const db = readDB();
  res.json(db.userProfile);
});

// Process dynamic checkout / order creation
app.post('/api/order', (req, res) => {
  const { productId, size, pricePaid } = req.body;
  const db = readDB();

  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const orderId = 'o' + (1000 + db.orders.length + 1);
  const newOrder = {
    orderId,
    userId: "user_1",
    productId,
    productName: product.name,
    pricePaid: pricePaid || product.price,
    size,
    status: "Delivered",
    date: new Date().toISOString().split('T')[0],
    trackingStatus: "Order placed. Dispatched from fulfillment center."
  };

  db.orders.unshift(newOrder);
  db.userProfile.purchaseHistory.unshift({
    orderId,
    productId,
    productName: product.name,
    size,
    status: "delivered",
    date: newOrder.date
  });

  // Automatically add category to preferred list
  if (!db.userProfile.styleProfile.preferredCategories.includes(product.category)) {
    db.userProfile.styleProfile.preferredCategories.push(product.category);
  }
  // Automatically add size to preferences
  db.userProfile.styleProfile.preferredSizes[product.category] = size;

  writeDB(db);
  res.json({ success: true, order: newOrder, profile: db.userProfile.styleProfile });
});

// Process Return / Exchange
app.post('/api/return', (req, res) => {
  const { orderId, reason, comment } = req.body;
  const db = readDB();

  const order = db.orders.find(o => o.orderId === orderId);
  const historyOrder = db.userProfile.purchaseHistory.find(h => h.orderId === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.status = "Returned";
  order.returnReason = reason;
  order.trackingStatus = "Returned. Refund processed to original payment method.";

  if (historyOrder) {
    historyOrder.status = "returned";
    historyOrder.returnReason = reason;
    historyOrder.returnComment = comment || "";
  }

  writeDB(db);
  res.json({ success: true, order, profile: db.userProfile });
});

// Conversational Shopping Assistant endpoint
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const db = readDB();
  const nlpResult = parseIntentAndEntities(message);
  
  // Update style profile based on entities in the message
  updateStyleProfile(db, nlpResult.entities);

  let responseText = "";
  let matchedProducts = [];
  let actionData = null;

  const chatHistory = db.userProfile.chatContext.history;
  const activeBargain = db.userProfile.chatContext.activeBargain;

  // Intent: PRICE NEGOTIATION
  if (nlpResult.intent === 'negotiation' || activeBargain) {
    // Determine which product is being negotiated
    let productToNegotiate = null;
    
    if (activeBargain) {
      productToNegotiate = db.products.find(p => p.id === activeBargain.productId);
    } else {
      // Find mentioned product in text or check last mentioned product in search results
      // E.g., user is looking at a product card or asked about p1
      const mentionedProd = db.products.find(p => 
        message.toLowerCase().includes(p.name.toLowerCase()) || 
        message.toLowerCase().includes(p.id) ||
        (p.category === 'fashion' && message.toLowerCase().includes('gown')) ||
        (p.category === 'jewelry' && message.toLowerCase().includes('ring')) ||
        (p.category === 'electronics' && message.toLowerCase().includes('watch'))
      );
      productToNegotiate = mentionedProd || db.products[0]; // Fallback to first if none
    }

    if (productToNegotiate) {
      // Find numeric offer in user's text
      let userOffer = nlpResult.entities.rawOffer;
      if (!userOffer && activeBargain) {
        // User didn't specify a number but asked to negotiate/discount
        userOffer = Math.round(activeBargain.lastCounterOffer * 0.9);
      } else if (!userOffer) {
        userOffer = Math.round(productToNegotiate.price * 0.85); // Auto-suggest standard offer
      }

      const negotiationResult = handleNegotiation(db, userOffer, productToNegotiate);
      responseText = negotiationResult.responseText;
      actionData = {
        type: 'negotiation',
        result: negotiationResult,
        product: productToNegotiate
      };
    } else {
      responseText = "Which product would you like to negotiate the price for? Please name the item!";
    }
  } 
  
  // Intent: ORDER TRACKING
  else if (nlpResult.intent === 'track_order') {
    const orderId = nlpResult.entities.orderId;
    if (orderId) {
      const order = db.orders.find(o => o.orderId === orderId);
      if (order) {
        responseText = `Order **#${order.orderId}** containing *${order.productName}* is currently: **${order.status}**.\n\nStatus update: ${order.trackingStatus}`;
      } else {
        responseText = `I couldn't find an order matching #${orderId}. Could you please double-check the order number?`;
      }
    } else {
      // List user orders
      const userOrders = db.orders.filter(o => o.userId === 'user_1');
      if (userOrders.length > 0) {
        responseText = `Here are your recent orders. Which one would you like to track?\n` + 
          userOrders.map(o => `- **#${o.orderId}**: ${o.productName} (${o.status})`).join('\n');
      } else {
        responseText = "You don't have any recent orders to track.";
      }
    }
  }

  // Intent: RETURNS & EXCHANGES
  else if (nlpResult.intent === 'return_exchange') {
    const orderId = nlpResult.entities.orderId;
    if (orderId) {
      const order = db.orders.find(o => o.orderId === orderId);
      if (order) {
        if (order.status === 'Returned') {
          responseText = `Order **#${order.orderId}** has already been returned. The refund of Rs. ${order.pricePaid} was processed successfully.`;
        } else {
          responseText = `Sure! I can help you return your order for *${order.productName}* (#${order.orderId}).\n\nCould you tell me why you'd like to return it? Is it because the fit was **too-tight**, **too-loose**, or did you change your mind?`;
          actionData = {
            type: 'return_request',
            orderId: order.orderId,
            productName: order.productName
          };
        }
      } else {
        responseText = `I couldn't find an order matching #${orderId}. Please provide a valid order number.`;
      }
    } else {
      const returnableOrders = db.orders.filter(o => o.userId === 'user_1' && o.status !== 'Returned');
      if (returnableOrders.length > 0) {
        responseText = `I can process returns/exchanges directly. Select an order to return:\n` + 
          returnableOrders.map(o => `- **#${o.orderId}**: ${o.productName} (Delivered on ${o.date})`).join('\n') +
          `\n\nTo initiate, say "Return order #[number]"`;
      } else {
        responseText = "You don't have any active orders eligible for return.";
      }
    }
  }

  // Intent: SIZE AND FIT ADVICE
  else if (nlpResult.intent === 'size_advice') {
    // Advise based on user history and catalog item characteristics
    const activeProd = db.products.find(p => 
      message.toLowerCase().includes(p.name.toLowerCase()) || 
      p.category === 'fashion' && message.toLowerCase().includes('gown') ||
      p.category === 'fashion' && message.toLowerCase().includes('suit')
    ) || db.products[0]; // fallback to gown
    
    // Check if user has returned this size before
    const userReturns = db.userProfile.purchaseHistory.filter(h => h.status === 'returned' && h.returnReason === 'too-tight');
    
    if (activeProd.fitType === 'runs-small') {
      if (userReturns.length > 0) {
        responseText = `Sizing Advisor: This **${activeProd.name}** runs small. Since you previously returned a size ${db.userProfile.styleProfile.preferredSizes.fashion || 'M'} gown because it was too tight, we highly recommend sizing up to **Large** for a comfortable fit.`;
      } else {
        responseText = `Sizing Advisor: The **${activeProd.name}** has a slim-fit cut. We recommend purchasing one size larger than your typical fit for comfort.`;
      }
    } else {
      responseText = `Sizing Advisor: The **${activeProd.name}** fits true to size. Your typical size **${db.userProfile.styleProfile.preferredSizes.fashion || 'M'}** should fit you perfectly.`;
    }
  }

  // Intent: PRODUCT SEARCH / CHAT
  else {
    matchedProducts = searchProducts(db, nlpResult.entities);
    
    if (matchedProducts.length > 0) {
      const topProd = matchedProducts[0];
      
      // Let's create an intuitive sales associate response
      responseText = `I found some options matching your request! Let me highlight the **${topProd.name}** (Rs. ${topProd.price}). `;
      
      // Size check warning integrated in search results
      if (topProd.category === 'fashion' && topProd.fitType === 'runs-small') {
        const hasTooTightReturn = db.userProfile.purchaseHistory.some(h => h.status === 'returned' && h.returnReason === 'too-tight');
        if (hasTooTightReturn) {
          responseText += `\n\n*⚠️ Fit Warning: This product has a slim cut and runs small. Based on your return of a size M gown previously due to tightness, I suggest selecting a size **L (Large)**.*`;
        }
      }

      // Add a negotiation parameter hint
      if (topProd.flexibility > 0.5) {
        responseText += `\n\n*💡 Tip: The seller is offering flexible pricing on this item. Feel free to negotiate the price with me! (e.g. "Can I get this for Rs. 4500?")*`;
      }
    } else {
      responseText = "I couldn't find any products matching those exact criteria. Could you tell me more about what style, category, budget, or color you are looking for?";
    }
  }

  // Save conversation log
  chatHistory.push({ sender: 'user', text: message });
  chatHistory.push({ sender: 'assistant', text: responseText });
  db.userProfile.chatContext.history = chatHistory.slice(-20); // Keep last 20 messages

  writeDB(db);
  res.json({
    reply: responseText,
    products: matchedProducts,
    profile: db.userProfile,
    action: actionData
  });
});

// Visual Search Upload Router
app.post('/api/upload', upload.single('image'), (req, res) => {
  const db = readDB();
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  // Read filename to simulate color matching
  const fname = file.originalname.toLowerCase();
  let matchedColor = 'pastel';
  
  if (fname.includes('blue') || fname.includes('navy')) {
    matchedColor = 'blue';
  } else if (fname.includes('mint') || fname.includes('green')) {
    matchedColor = 'green';
  } else if (fname.includes('gold')) {
    matchedColor = 'gold';
  } else if (fname.includes('silver')) {
    matchedColor = 'silver';
  } else if (fname.includes('peach') || fname.includes('pink') || fname.includes('lavender')) {
    matchedColor = 'pastel';
  }

  // Filter products by matches
  const matchedProducts = db.products.filter(p => 
    p.colors.includes(matchedColor) || 
    p.tags.includes(matchedColor) || 
    (matchedColor === 'pastel' && p.colors.includes('pastel'))
  );

  const reply = `📷 Visual Search: Image uploaded successfully! I detected a **${matchedColor}** aesthetic. Here are similar items from our catalog that fit this color scheme and design profile.`;

  res.json({
    reply,
    products: matchedProducts.length > 0 ? matchedProducts : db.products.slice(0, 3)
  });
});

app.listen(PORT, () => {
  console.log(`Shopping Assistant Backend running on http://localhost:${PORT}`);
});
