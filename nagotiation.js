import { writeDB } from './database.js';

export function handleNegotiation(db, userOffer, product) {
  const session = db.userProfile.chatContext;
  let active = session.activeBargain;

  // Initialize negotiation context if not present or if negotiating a different product
  if (!active || active.productId !== product.id) {
    active = {
      productId: product.id,
      originalPrice: product.price,
      minPrice: product.minPrice,
      flexibility: product.flexibility,
      counterCount: 0,
      lastCounterOffer: product.price,
      dealStruck: false,
      priceAgreed: null
    };
  }

  active.counterCount += 1;

  const originalPrice = active.originalPrice;
  const minPrice = active.minPrice;
  const flex = active.flexibility;

  let responseText = "";
  let finalPriceAgreed = null;

  if (userOffer >= originalPrice) {
    responseText = `The current price is Rs. ${originalPrice}. No negotiation needed! I've added it to your cart.`;
    active.dealStruck = true;
    finalPriceAgreed = originalPrice;
  } else if (userOffer < minPrice) {
    // Offer is below minimum seller price
    if (active.counterCount === 1) {
      // First counter offer from seller
      const counter = Math.round(originalPrice - (originalPrice - minPrice) * flex * 0.4);
      responseText = `Rs. ${userOffer} is a bit too low for this premium ${product.name}. However, I can offer it to you for Rs. ${counter}. What do you think?`;
      active.lastCounterOffer = counter;
    } else if (active.counterCount === 2) {
      // Second counter offer
      const counter = Math.round(active.lastCounterOffer - (active.lastCounterOffer - minPrice) * flex * 0.5);
      responseText = `That's still below our cost. How about we meet in the middle at Rs. ${counter}? This is a special deal just for you!`;
      active.lastCounterOffer = counter;
    } else {
      // Final offer (Round 3+)
      responseText = `I understand your budget, but Rs. ${minPrice} is the absolute minimum the seller can accept. I can lock in Rs. ${minPrice} for you right now if you'd like.`;
      active.lastCounterOffer = minPrice;
      // If user is offering close to minPrice or if it's the final round, they can accept it or type yes.
    }
  } else {
    // User offer is between minPrice and originalPrice
    const margin = originalPrice - userOffer;
    
    if (active.counterCount === 1 && margin > 500 && flex < 0.6) {
      // Seller can negotiate a bit to save margin
      const counter = Math.round(originalPrice - margin * flex * 0.5);
      responseText = `I appreciate your offer! How about Rs. ${counter}? It's a great value for this quality.`;
      active.lastCounterOffer = counter;
    } else {
      // Accept offer!
      responseText = `That sounds fair! We have a deal. I've approved a special price of Rs. ${userOffer} for this ${product.name}. Use coupon code BARGAIN_${product.id.toUpperCase()} at checkout!`;
      active.dealStruck = true;
      finalPriceAgreed = userOffer;
    }
  }

  // Update session
  if (active.dealStruck) {
    active.priceAgreed = finalPriceAgreed;
    session.activeBargain = null; // Clear active bargain on success
  } else {
    session.activeBargain = active;
  }

  db.userProfile.chatContext = session;
  writeDB(db);

  return {
    responseText,
    dealStruck: active.dealStruck,
    priceAgreed: finalPriceAgreed,
    couponCode: active.dealStruck ? `BARGAIN_${product.id.toUpperCase()}` : null,
    counterCount: active.counterCount
  };
}
