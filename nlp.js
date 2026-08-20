import { readDB, writeDB } from './database.js';

// Custom semantic parser
export function parseIntentAndEntities(text) {
  const query = text.toLowerCase();
  
  // 1. Identify intent
  let intent = 'search'; // Default intent is search/browse
  
  const negotiationKeywords = ['negotiate', 'discount', 'lower the price', 'cheap', 'bargain', 'price', 'give it to me for', 'how about', 'take', 'can i get'];
  const trackingKeywords = ['track', 'where is my order', 'status of order', 'order status', 'tracking'];
  const returnKeywords = ['return', 'exchange', 'refund', 'send back'];
  const sizeKeywords = ['what size', 'which size', 'size guide', 'size advisor', 'fit check', 'does it fit'];
  
  // Check for bargaining/numbers with currency or naked numbers indicating negotiation
  const priceOfferMatch = query.match(/(?:for|take|about|buy)?\s*(?:rs\.?|inr|usd|\$)?\s*(\d{3,5})/i);
  const containsPriceOffer = priceOfferMatch && (
    negotiationKeywords.some(kw => query.includes(kw)) || 
    query.includes('budget') ||
    query.includes('around')
  );

  if (trackingKeywords.some(kw => query.includes(kw)) || query.match(/order\s*#?\d+/)) {
    intent = 'track_order';
  } else if (returnKeywords.some(kw => query.includes(kw))) {
    intent = 'return_exchange';
  } else if (sizeKeywords.some(kw => query.includes(kw))) {
    intent = 'size_advice';
  } else if (negotiationKeywords.some(kw => query.includes(kw)) || (priceOfferMatch && query.match(/negotiate|offer|bargain|discount|give|take/))) {
    intent = 'negotiation';
  }

  // 2. Extract Entities
  // Budget
  let budget = null;
  const budgetMatch = query.match(/(?:budget|price|around|under|below|max|maximum)\s*(?:of|is|around|under|about)?\s*(?:rs\.?|inr|usd|\$)?\s*(\d{3,5})/i);
  if (budgetMatch) {
    budget = parseInt(budgetMatch[1], 10);
  } else if (intent === 'search' && priceOfferMatch) {
    // If search intent and there's a standalone number around 1000-50000, consider it budget
    const num = parseInt(priceOfferMatch[1], 10);
    if (num >= 500 && num <= 50000) {
      budget = num;
    }
  }

  // Categories
  const categories = [];
  if (query.match(/dress|clothing|suit|gown|shirt|lehenga|saree|garment|fashion|wear|clothes/)) categories.push('fashion');
  if (query.match(/jewelry|jewel|ring|necklace|pendant|earring|gold|silver/)) categories.push('jewelry');
  if (query.match(/electronic|smartwatch|watch|headphone|audio|gadget|wearable/)) categories.push('electronics');

  // Colors
  const colors = [];
  const colorList = ['pastel', 'lavender', 'mint', 'peach', 'pink', 'navy', 'blue', 'black', 'gold', 'silver', 'green'];
  colorList.forEach(color => {
    if (query.includes(color)) {
      colors.push(color);
    }
  });

  // Body shape / style characteristics
  const styles = [];
  if (query.includes('pastel')) styles.push('pastel');
  if (query.includes('engagement')) styles.push('engagement');
  if (query.includes('wedding') || query.includes('marriage')) styles.push('wedding');
  if (query.includes('casual')) styles.push('casual');
  if (query.includes('formal') || query.includes('office')) styles.push('formal');
  if (query.includes('traditional') || query.includes('saree') || query.includes('lehenga')) styles.push('traditional');
  if (query.includes('petite')) styles.push('petite');
  if (query.includes('slim') || query.includes('tight')) styles.push('slim');

  // Extract order ID if present
  let orderId = null;
  const orderMatch = query.match(/order\s*#?([o]?\d+)/i);
  if (orderMatch) {
    orderId = orderMatch[1];
    if (!orderId.startsWith('o')) {
      orderId = 'o' + orderId;
    }
  }

  return {
    intent,
    entities: {
      budget,
      categories,
      colors,
      styles,
      orderId,
      rawOffer: priceOfferMatch ? parseInt(priceOfferMatch[1], 10) : null
    }
  };
}

// Update the user style profile dynamically from chat input
export function updateStyleProfile(db, entities) {
  const profile = db.userProfile.styleProfile;

  // Add categories
  entities.categories.forEach(cat => {
    if (!profile.preferredCategories.includes(cat)) {
      profile.preferredCategories.push(cat);
    }
  });

  // Add colors (especially pastels)
  entities.colors.forEach(col => {
    // Standardize pastel colors
    let finalCol = col;
    if (entities.styles.includes('pastel') && col !== 'pastel') {
      finalCol = 'pastel ' + col;
    }
    if (!profile.preferredColors.includes(finalCol)) {
      profile.preferredColors.push(finalCol);
    }
  });

  // Budget updating: slide budget window
  if (entities.budget) {
    profile.typicalBudget = Math.round((profile.typicalBudget * 0.7) + (entities.budget * 0.3));
  }

  // Styles updating
  entities.styles.forEach(st => {
    if (!profile.stylePreferences.includes(st)) {
      profile.stylePreferences.push(st);
    }
  });

  db.userProfile.styleProfile = profile;
  writeDB(db);
}

// Generate the best products based on the entities matched
export function searchProducts(db, entities) {
  let products = db.products;

  // 1. Filter by category (if specified)
  if (entities.categories && entities.categories.length > 0) {
    products = products.filter(p => entities.categories.includes(p.category));
  }

  // 2. Filter by budget (if specified, soft filter - match items <= budget + 10%)
  if (entities.budget) {
    products = products.filter(p => p.price <= entities.budget * 1.15);
  }

  // 3. Score matching based on tags, colors, and styles
  const scored = products.map(p => {
    let score = 0;
    
    // Tag matching
    entities.styles.forEach(st => {
      if (p.tags.includes(st)) score += 3;
    });

    // Color matching
    entities.colors.forEach(col => {
      if (p.colors.includes(col) || p.tags.includes(col)) score += 2;
    });

    // General string matching in name / description
    const textQuery = [...entities.styles, ...entities.colors, ...entities.categories].join(' ');
    if (p.name.toLowerCase().includes(textQuery)) score += 1;

    return { product: p, score };
  });

  // Sort by score (descending) and price (ascending if score matches)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.product.price - b.product.price;
  });

  return scored.map(item => item.product);
}
