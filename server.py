import os
import json
import re
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

DB_FILE = os.path.join(os.getcwd(), 'db.json')
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- SEED & DATABASE HELPERS ---
def seed_database():
    return {
        "products": [
            {
                "id": "p1",
                "name": "Pastel Lavender Engagement Leheriya Gown",
                "category": "fashion",
                "price": 5200,
                "originalPrice": 5200,
                "minPrice": 4200,
                "flexibility": 0.8,
                "rating": 4.8,
                "image": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60",
                "description": "Elegant pastel lavender gown, perfect for engagement ceremonies and festive occasions. Made with lightweight Georgette fabric.",
                "colors": ["pastel", "lavender", "pink"],
                "sizes": ["S", "M", "L", "XL"],
                "fitGuide": { "S": 34, "M": 36, "L": 38, "XL": 40 },
                "fitType": "runs-small",
                "tags": ["petite", "engagement", "partywear", "traditional", "gown", "sister", "lavender"]
            },
            {
                "id": "p2",
                "name": "Pastel Mint Green Anarkali Suit",
                "category": "fashion",
                "price": 4800,
                "originalPrice": 4800,
                "minPrice": 3900,
                "flexibility": 0.7,
                "rating": 4.7,
                "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=60",
                "description": "Graceful mint green designer Anarkali suit with delicate silver embroidery. Made of premium cotton silk, comfortable yet regal.",
                "colors": ["pastel", "mint green", "green"],
                "sizes": ["S", "M", "L", "XL"],
                "fitGuide": { "S": 34, "M": 36, "L": 38, "XL": 40 },
                "fitType": "true-to-size",
                "tags": ["wedding", "engagement", "pastel", "festive", "traditional", "petite", "mint"]
            },
            {
                "id": "p3",
                "name": "Classic Navy Blue Slim Fit Suit",
                "category": "fashion",
                "price": 7500,
                "originalPrice": 7500,
                "minPrice": 6500,
                "flexibility": 0.5,
                "rating": 4.6,
                "image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&auto=format&fit=crop&q=60",
                "description": "Sharp and sophisticated navy blue two-piece suit. Made of breathable Italian wool blend, tailored for a modern slim silhouette.",
                "colors": ["navy", "blue"],
                "sizes": ["M", "L", "XL"],
                "fitGuide": { "M": 38, "L": 40, "XL": 42 },
                "fitType": "runs-small",
                "tags": ["formal", "wedding", "office", "navy", "slim-fit"]
            },
            {
                "id": "p4",
                "name": "Pastel Peach Embroidered Lehenga",
                "category": "fashion",
                "price": 9500,
                "originalPrice": 9500,
                "minPrice": 7800,
                "flexibility": 0.9,
                "rating": 4.9,
                "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&auto=format&fit=crop&q=60",
                "description": "Stunning peach color Lehenga with detailed silver floral hand-embroidery. Perfect for bridesmaids and high-end ceremonies.",
                "colors": ["pastel", "peach", "pink"],
                "sizes": ["S", "M", "L"],
                "fitGuide": { "S": 34, "M": 36, "L": 38 },
                "fitType": "true-to-size",
                "tags": ["wedding", "engagement", "pastel", "lehenga", "designer", "peach"]
            },
            {
                "id": "p5",
                "name": "18K Rose Gold Diamond Engagement Ring",
                "category": "jewelry",
                "price": 24500,
                "originalPrice": 24500,
                "minPrice": 22000,
                "flexibility": 0.4,
                "rating": 4.9,
                "image": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop&q=60",
                "description": "Exquisite 18-karat rose gold band set with a central round brilliant-cut solitaire diamond. GIA certified.",
                "colors": ["rose gold", "gold"],
                "sizes": ["6", "7", "8"],
                "fitGuide": { "6": 16.5, "7": 17.3, "8": 18.1 },
                "fitType": "true-to-size",
                "tags": ["engagement", "luxury", "diamond", "gold", "ring"]
            },
            {
                "id": "p6",
                "name": "Minimalist Silver Pendant Necklace",
                "category": "jewelry",
                "price": 1800,
                "originalPrice": 1800,
                "minPrice": 1500,
                "flexibility": 0.6,
                "rating": 4.5,
                "image": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60",
                "description": "Elegant sterling silver chain with a geometric teardrop pendant. Hypoallergenic, perfect for everyday minimal wear.",
                "colors": ["silver"],
                "sizes": ["one-size"],
                "fitGuide": { "one-size": 18 },
                "fitType": "true-to-size",
                "tags": ["silver", "minimalist", "casual", "necklace", "gift"]
            },
            {
                "id": "p7",
                "name": "Aura Smart Watch Series 5",
                "category": "electronics",
                "price": 4999,
                "originalPrice": 4999,
                "minPrice": 4300,
                "flexibility": 0.5,
                "rating": 4.4,
                "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=60",
                "description": "Advanced fitness tracker and smart notifications hub. 1.8-inch AMOLED display, 7-day battery, heart rate & SpO2 tracking.",
                "colors": ["matte black", "slate silver"],
                "sizes": ["one-size"],
                "fitGuide": { "one-size": 44 },
                "fitType": "true-to-size",
                "tags": ["smartwatch", "gadget", "fitness", "wearable", "black"]
            },
            {
                "id": "p8",
                "name": "Zenith Pro Wireless ANC Headphones",
                "category": "electronics",
                "price": 8999,
                "originalPrice": 8999,
                "minPrice": 7500,
                "flexibility": 0.6,
                "rating": 4.8,
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
                "description": "Industry-leading active noise cancelling headphones. Hi-Res audio, 40 hours playtime, memory foam ear cups for long sessions.",
                "colors": ["matte black", "sandstone beige"],
                "sizes": ["one-size"],
                "fitGuide": { "one-size": 0 },
                "fitType": "true-to-size",
                "tags": ["headphones", "anc", "wireless", "audio", "music"]
            }
        ],
        "userProfile": {
            "id": "user_1",
            "name": "Anjali Gupta",
            "styleProfile": {
                "preferredCategories": ["fashion", "jewelry"],
                "preferredColors": ["pastel lavender", "peach"],
                "preferredMetals": ["rose gold"],
                "preferredSizes": {
                    "fashion": "M",
                    "jewelry": "7"
                },
                "typicalBudget": 6000,
                "stylePreferences": ["traditional", "minimalist", "pastel"]
            },
            "purchaseHistory": [
                {
                    "orderId": "o1001",
                    "productId": "p3",
                    "productName": "Classic Navy Blue Slim Fit Suit",
                    "size": "M",
                    "status": "delivered",
                    "date": "2026-04-10"
                },
                {
                    "orderId": "o1002",
                    "productId": "p1",
                    "productName": "Pastel Lavender Engagement Leheriya Gown",
                    "size": "M",
                    "status": "returned",
                    "returnReason": "too-tight",
                    "returnComment": "Beautiful gown but fits too tight around the chest. I need a larger size.",
                    "date": "2026-05-15"
                }
            ],
            "chatContext": {
                "activeBargain": None,
                "history": [
                    { "sender": "assistant", "text": "Hello! I am your AI Shopping Assistant. How can I help you find the perfect outfit, accessory, or gadget today?" }
                ]
            }
        },
        "orders": [
            {
                "orderId": "o1001",
                "userId": "user_1",
                "productId": "p3",
                "productName": "Classic Navy Blue Slim Fit Suit",
                "pricePaid": 7500,
                "size": "M",
                "status": "Delivered",
                "date": "2026-04-10",
                "trackingStatus": "Delivered to reception desk."
            },
            {
                "orderId": "o1002",
                "userId": "user_1",
                "productId": "p1",
                "productName": "Pastel Lavender Engagement Leheriya Gown",
                "pricePaid": 5200,
                "size": "M",
                "status": "Returned",
                "returnReason": "too-tight",
                "date": "2026-05-15",
                "trackingStatus": "Return approved and refund processed."
            }
        ]
    }

def read_db():
    if not os.path.exists(DB_FILE):
        data = seed_database()
        write_db(data)
        return data
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        data = seed_database()
        write_db(data)
        return data

def write_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

# --- NLP PARSING ENGINE ---
def parse_intent_and_entities(text):
    query = text.lower()
    intent = 'search'

    negotiation_kws = ['negotiate', 'discount', 'lower the price', 'cheap', 'bargain', 'price', 'give it to me for', 'how about', 'take', 'can i get']
    tracking_kws = ['track', 'where is my order', 'status of order', 'order status', 'tracking']
    return_kws = ['return', 'exchange', 'refund', 'send back']
    size_kws = ['what size', 'which size', 'size guide', 'size advisor', 'fit check', 'does it fit']

    # Standalone price offers
    price_offer_match = re.search(r'(?:for|take|about|buy)?\s*(?:rs\.?|inr|usd|\$)?\s*(\d{3,5})', query)
    contains_price_offer = price_offer_match and (
        any(kw in query for kw in negotiation_kws) or 'budget' in query or 'around' in query
    )

    if any(kw in query for kw in tracking_kws) or re.search(r'order\s*#?\d+', query):
        intent = 'track_order'
    elif any(kw in query for kw in return_kws):
        intent = 'return_exchange'
    elif any(kw in query for kw in size_kws):
        intent = 'size_advice'
    elif any(kw in query for kw in negotiation_kws) or (price_offer_match and re.search(r'negotiate|offer|bargain|discount|give|take', query)):
        intent = 'negotiation'

    # Budget
    budget = None
    budget_match = re.search(r'(?:budget|price|around|under|below|max|maximum)\s*(?:of|is|around|under|about)?\s*(?:rs\.?|inr|usd|\$)?\s*(\d{3,5})', query)
    if budget_match:
        budget = int(budget_match.group(1))
    elif intent == 'search' and price_offer_match:
        num = int(price_offer_match.group(1))
        if 500 <= num <= 50000:
            budget = num

    # Categories
    categories = []
    if re.search(r'dress|clothing|suit|gown|shirt|lehenga|saree|garment|fashion|wear|clothes', query):
        categories.append('fashion')
    if re.search(r'jewelry|jewel|ring|necklace|pendant|earring|gold|silver', query):
        categories.append('jewelry')
    if re.search(r'electronic|smartwatch|watch|headphone|audio|gadget|wearable', query):
        categories.append('electronics')

    # Colors
    colors = []
    color_list = ['pastel', 'lavender', 'mint', 'peach', 'pink', 'navy', 'blue', 'black', 'gold', 'silver', 'green']
    for color in color_list:
        if color in query:
            colors.append(color)

    # Styles / Fit characteristics
    styles = []
    if 'pastel' in query: styles.append('pastel')
    if 'engagement' in query: styles.append('engagement')
    if 'wedding' in query or 'marriage' in query: styles.append('wedding')
    if 'casual' in query: styles.append('casual')
    if 'formal' in query or 'office' in query: styles.append('formal')
    if any(x in query for x in ['traditional', 'saree', 'lehenga']): styles.append('traditional')
    if 'petite' in query: styles.append('petite')
    if 'slim' in query or 'tight' in query: styles.append('slim')

    # Order ID matching
    order_id = None
    order_match = re.search(r'order\s*#?([o]?\d+)', query)
    if order_match:
        order_id = order_match.group(1)
        if not order_id.startswith('o'):
            order_id = 'o' + order_id

    return {
        'intent': intent,
        'entities': {
            'budget': budget,
            'categories': categories,
            'colors': colors,
            'styles': styles,
            'orderId': order_id,
            'rawOffer': int(price_offer_match.group(1)) if price_offer_match else None
        }
    }

def update_style_profile(db, entities):
    profile = db['userProfile']['styleProfile']

    # Add categories
    for cat in entities['categories']:
        if cat not in profile['preferredCategories']:
            profile['preferredCategories'].append(cat)

    # Add colors
    for col in entities['colors']:
        final_col = col
        if 'pastel' in entities['styles'] and col != 'pastel':
            final_col = 'pastel ' + col
        if final_col not in profile['preferredColors']:
            profile['preferredColors'].append(final_col)

    # Budgets
    if entities['budget']:
        profile['typicalBudget'] = int(round((profile['typicalBudget'] * 0.7) + (entities['budget'] * 0.3)))

    # Styles
    for st in entities['styles']:
        if st not in profile['stylePreferences']:
            profile['stylePreferences'].append(st)

    db['userProfile']['styleProfile'] = profile
    write_db(db)

def search_products(db, entities):
    products = db['products']

    # 1. Filter by category
    if entities['categories']:
        products = [p for p in products if p['category'] in entities['categories']]

    # 2. Filter by budget (soft filter + 15%)
    if entities['budget']:
        products = [p for p in products if p['price'] <= entities['budget'] * 1.15]

    # 3. Score matching
    scored = []
    for p in products:
        score = 0
        for st in entities['styles']:
            if st in p['tags']:
                score += 3
        for col in entities['colors']:
            if col in p['colors'] or col in p['tags']:
                score += 2
        
        text_query = ' '.join(entities['styles'] + entities['colors'] + entities['categories'])
        if text_query and text_query in p['name'].lower():
            score += 1
        
        scored.append({'product': p, 'score': score})

    # Sort descending by score, ascending by price
    scored.sort(key=lambda x: (-x['score'], x['product']['price']))
    return [item['product'] for item in scored]

# --- NEGOTIATION LOGIC ---
def handle_negotiation(db, user_offer, product):
    session = db['userProfile']['chatContext']
    active = session.get('activeBargain')

    # Initialize or reset bargaining state
    if not active or active['productId'] != product['id']:
        active = {
            'productId': product['id'],
            'originalPrice': product['price'],
            'minPrice': product['minPrice'],
            'flexibility': product['flexibility'],
            'counterCount': 0,
            'lastCounterOffer': product['price'],
            'dealStruck': False,
            'priceAgreed': None
        }

    active['counterCount'] += 1
    original_price = active['originalPrice']
    min_price = active['minPrice']
    flex = active['flexibility']

    response_text = ""
    price_agreed = None

    if user_offer >= original_price:
        response_text = f"The current price is Rs. {original_price}. No negotiation needed! I've added it to your cart."
        active['dealStruck'] = True
        price_agreed = original_price
    elif user_offer < min_price:
        if active['counterCount'] == 1:
            counter = int(round(original_price - (original_price - min_price) * flex * 0.4))
            response_text = f"Rs. {user_offer} is a bit too low for this premium {product['name']}. However, I can offer it to you for Rs. {counter}. What do you think?"
            active['lastCounterOffer'] = counter
        elif active['counterCount'] == 2:
            counter = int(round(active['lastCounterOffer'] - (active['lastCounterOffer'] - min_price) * flex * 0.5))
            response_text = f"That's still below our cost. How about we meet in the middle at Rs. {counter}? This is a special deal just for you!"
            active['lastCounterOffer'] = counter
        else:
            response_text = f"I understand your budget, but Rs. {min_price} is the absolute minimum the seller can accept. I can lock in Rs. {min_price} for you right now if you'd like."
            active['lastCounterOffer'] = min_price
    else:
        margin = original_price - user_offer
        if active['counterCount'] == 1 and margin > 500 and flex < 0.6:
            counter = int(round(original_price - margin * flex * 0.5))
            response_text = f"I appreciate your offer! How about Rs. {counter}? It's a great value for this quality."
            active['lastCounterOffer'] = counter
        else:
            response_text = f"That sounds fair! We have a deal. I've approved a special price of Rs. {user_offer} for this {product['name']}. Use coupon code BARGAIN_{product['id'].upper()} at checkout!"
            active['dealStruck'] = True
            price_agreed = user_offer

    if active['dealStruck']:
        active['priceAgreed'] = price_agreed
        session['activeBargain'] = None
    else:
        session['activeBargain'] = active

    db['userProfile']['chatContext'] = session
    write_db(db)

    return {
        'responseText': response_text,
        'dealStruck': active['dealStruck'],
        'priceAgreed': price_agreed,
        'couponCode': f"BARGAIN_{product['id'].upper()}" if active['dealStruck'] else None,
        'counterCount': active['counterCount'],
        'lastCounterOffer': active.get('lastCounterOffer')
    }

# --- ROUTES ---

@app.route('/api/products', methods=['GET'])
def get_products():
    db = read_db()
    return jsonify(db['products'])

@app.route('/api/profile', methods=['GET'])
def get_profile():
    db = read_db()
    return jsonify(db['userProfile'])

@app.route('/api/order', methods=['POST'])
def create_order():
    req_data = request.get_json()
    product_id = req_data.get('productId')
    size = req_data.get('size')
    price_paid = req_data.get('pricePaid')

    db = read_db()
    product = next((p for p in db['products'] if p['id'] == product_id), None)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    order_id = 'o' + str(1000 + len(db['orders']) + 1)
    new_order = {
        'orderId': order_id,
        'userId': "user_1",
        'productId': product_id,
        'productName': product['name'],
        'pricePaid': price_paid or product['price'],
        'size': size,
        'status': "Delivered",
        'date': datetime.now().strftime('%Y-%m-%d'),
        'trackingStatus': "Order placed. Dispatched from fulfillment center."
    }

    db['orders'].insert(0, new_order)
    db['userProfile']['purchaseHistory'].insert(0, {
        'orderId': order_id,
        'productId': product_id,
        'productName': product['name'],
        'size': size,
        'status': "delivered",
        'date': new_order['date']
    })

    if product['category'] not in db['userProfile']['styleProfile']['preferredCategories']:
        db['userProfile']['styleProfile']['preferredCategories'].append(product['category'])
    
    db['userProfile']['styleProfile']['preferredSizes'][product['category']] = size

    write_db(db)
    return jsonify({'success': True, 'order': new_order, 'profile': db['userProfile']['styleProfile']})

@app.route('/api/return', methods=['POST'])
def process_return():
    req_data = request.get_json()
    order_id = req_data.get('orderId')
    reason = req_data.get('reason')
    comment = req_data.get('comment')

    db = read_db()
    order = next((o for o in db['orders'] if o['orderId'] == order_id), None)
    history_order = next((h for h in db['userProfile']['purchaseHistory'] if h['orderId'] == order_id), None)

    if not order:
        return jsonify({'error': 'Order not found'}), 404

    order['status'] = "Returned"
    order['returnReason'] = reason
    order['trackingStatus'] = "Returned. Refund processed to original payment method."

    if history_order:
        history_order['status'] = "returned"
        history_order['returnReason'] = reason
        history_order['returnComment'] = comment or ""

    write_db(db)
    return jsonify({'success': True, 'order': order, 'profile': db['userProfile']})

@app.route('/api/chat', methods=['POST'])
def chat():
    req_data = request.get_json()
    message = req_data.get('message')
    if not message:
        return jsonify({'error': 'Message is required'}), 400

    db = read_db()
    nlp_result = parse_intent_and_entities(message)
    update_style_profile(db, nlp_result['entities'])

    response_text = ""
    matched_products = []
    action_data = None

    chat_history = db['userProfile']['chatContext']['history']
    active_bargain = db['userProfile']['chatContext'].get('activeBargain')

    # Intent: NEGOTIATION
    if nlp_result['intent'] == 'negotiation' or active_bargain:
        product_to_negotiate = None
        if active_bargain:
            product_to_negotiate = next((p for p in db['products'] if p['id'] == active_bargain['productId']), None)
        else:
            mentioned = next((p for p in db['products'] if 
                              p['name'].lower() in message.lower() or 
                              p['id'] in message.lower() or
                              (p['category'] == 'fashion' and 'gown' in message.lower()) or
                              (p['category'] == 'jewelry' and 'ring' in message.lower()) or
                              (p['category'] == 'electronics' and 'watch' in message.lower())), None)
            product_to_negotiate = mentioned or db['products'][0]

        if product_to_negotiate:
            user_offer = nlp_result['entities']['rawOffer']
            if not user_offer and active_bargain:
                user_offer = int(round(active_bargain['lastCounterOffer'] * 0.9))
            elif not user_offer:
                user_offer = int(round(product_to_negotiate['price'] * 0.85))

            neg_res = handle_negotiation(db, user_offer, product_to_negotiate)
            response_text = neg_res['responseText']
            action_data = {
                'type': 'negotiation',
                'result': neg_res,
                'product': product_to_negotiate
            }
        else:
            response_text = "Which product would you like to negotiate the price for? Please name the item!"

    # Intent: ORDER TRACKING
    elif nlp_result['intent'] == 'track_order':
        order_id = nlp_result['entities']['orderId']
        if order_id:
            order = next((o for o in db['orders'] if o['orderId'] == order_id), None)
            if order:
                response_text = f"Order **#{order['orderId']}** containing *{order['productName']}* is currently: **{order['status']}**.\n\nStatus update: {order['trackingStatus']}"
            else:
                response_text = f"I couldn't find an order matching #{order_id}. Could you please double-check the order number?"
        else:
            user_orders = [o for o in db['orders'] if o['userId'] == 'user_1']
            if user_orders:
                response_text = "Here are your recent orders. Which one would you like to track?\n" + \
                                '\n'.join([f"- **#{o['orderId']}**: {o['productName']} ({o['status']})" for o in user_orders])
            else:
                response_text = "You don't have any recent orders to track."

    # Intent: RETURNS & EXCHANGES
    elif nlp_result['intent'] == 'return_exchange':
        order_id = nlp_result['entities']['orderId']
        if order_id:
            order = next((o for o in db['orders'] if o['orderId'] == order_id), None)
            if order:
                if order['status'] == 'Returned':
                    response_text = f"Order **#{order['orderId']}** has already been returned. The refund of Rs. {order['pricePaid']} was processed successfully."
                else:
                    response_text = f"Sure! I can help you return your order for *{order['productName']}* (#{order['orderId']}).\n\nCould you tell me why you'd like to return it? Is it because the fit was **too-tight**, **too-loose**, or did you change your mind?"
                    action_data = {
                        'type': 'return_request',
                        'orderId': order['orderId'],
                        'productName': order['productName']
                    }
            else:
                response_text = f"I couldn't find an order matching #{order_id}. Please provide a valid order number."
        else:
            returnable = [o for o in db['orders'] if o['userId'] == 'user_1' and o['status'] != 'Returned']
            if returnable:
                response_text = "I can process returns/exchanges directly. Select an order to return:\n" + \
                                '\n'.join([f"- **#{o['orderId']}**: {o['productName']} (Delivered on {o['date']})" for o in returnable]) + \
                                '\n\nTo initiate, say "Return order #[number]"'
            else:
                response_text = "You don't have any active orders eligible for return."

    # Intent: SIZE ADVICE
    elif nlp_result['intent'] == 'size_advice':
        active_prod = next((p for p in db['products'] if 
                            p['name'].lower() in message.lower() or 
                            (p['category'] == 'fashion' and 'gown' in message.lower()) or
                            (p['category'] == 'fashion' and 'suit' in message.lower())), db['products'][0])
        
        user_returns = [h for h in db['userProfile']['purchaseHistory'] if h['status'] == 'returned' and h.get('returnReason') == 'too-tight']
        
        if active_prod['fitType'] == 'runs-small':
            if user_returns:
                pref_size = db['userProfile']['styleProfile']['preferredSizes'].get('fashion', 'M')
                response_text = f"Sizing Advisor: This **{active_prod['name']}** runs small. Since you previously returned a size {pref_size} gown because it was too tight, we highly recommend sizing up to **Large** for a comfortable fit."
            else:
                response_text = f"Sizing Advisor: The **{active_prod['name']}** has a slim-fit cut. We recommend purchasing one size larger than your typical fit for comfort."
        else:
            pref_size = db['userProfile']['styleProfile']['preferredSizes'].get('fashion', 'M')
            response_text = f"Sizing Advisor: The **{active_prod['name']}** fits true to size. Your typical size **{pref_size}** should fit you perfectly."

    # Intent: SEARCH / BROWSE
    else:
        matched_products = search_products(db, nlp_result['entities'])
        if matched_products:
            top_prod = matched_products[0]
            response_text = f"I found some options matching your request! Let me highlight the **{top_prod['name']}** (Rs. {top_prod['price']})."
            
            if top_prod['category'] == 'fashion' and top_prod['fitType'] == 'runs-small':
                has_too_tight = any(h['status'] == 'returned' and h.get('returnReason') == 'too-tight' for h in db['userProfile']['purchaseHistory'])
                if has_too_tight:
                    response_text += "\n\n*⚠️ Fit Warning: This product has a slim cut and runs small. Based on your return of a size M gown previously due to tightness, I suggest selecting a size **L (Large)**.*"
            
            if top_prod['flexibility'] > 0.5:
                response_text += "\n\n*💡 Tip: The seller is offering flexible pricing on this item. Feel free to negotiate the price with me! (e.g. \"Can I get this for Rs. 4500?\")*"
        else:
            response_text = "I couldn't find any products matching those exact criteria. Could you tell me more about what style, category, budget, or color you are looking for?"

    # Append history logs
    chat_history.append({'sender': 'user', 'text': message})
    chat_history.append({'sender': 'assistant', 'text': response_text})
    db['userProfile']['chatContext']['history'] = chat_history[-20:]

    write_db(db)
    return jsonify({
        'reply': response_text,
        'products': matched_products,
        'profile': db['userProfile'],
        'action': action_data
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    db = read_db()
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400

    filename = secure_filename(file.filename).lower()
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    matched_color = 'pastel'
    if 'blue' in filename or 'navy' in filename:
        matched_color = 'blue'
    elif 'mint' in filename or 'green' in filename:
        matched_color = 'green'
    elif 'gold' in filename:
        matched_color = 'gold'
    elif 'silver' in filename:
        matched_color = 'silver'
    elif any(x in filename for x in ['peach', 'pink', 'lavender']):
        matched_color = 'pastel'

    matched_products = [
        p for p in db['products']
        if matched_color in p['colors'] or matched_color in p['tags'] or (matched_color == 'pastel' and 'pastel' in p['colors'])
    ]

    reply = f"📷 Visual Search: Image uploaded successfully! I detected a **{matched_color}** aesthetic. Here are similar items from our catalog that fit this color scheme."
    return jsonify({
        'reply': reply,
        'products': matched_products if matched_products else db['products'][:3]
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
