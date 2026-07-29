# Gharana — Premium Indian Grocery Delivery (Mobile)

**Ghar jaisi shuddhata, ab har roz.**  
Real Indian pantry — cold-pressed oils, stone-ground flours, unpolished dals, aged basmati — delivered honestly.

## Stack
- Expo Router / React Native (SDK 54)
- FastAPI + MongoDB backend, JWT auth
- expo-image, expo-blur, expo-linear-gradient, react-native-reanimated

## Features
- Home discovery: sticky header, pulsing ETA pill, Trust Ticker marquee, editorial hero, category grid, Gharana Specials, Build Your Thali, Fresh This Week
- Categories & product browsing with sort chips
- Product detail with Story/Ingredients/How to Use/Reviews tabs, weight variants, recipes
- Cart with promo codes (GHAR50, PURE10, FIRSTBOX), free-delivery progress bar, express vs scheduled slots
- Checkout with address selection/create, payment method (UPI/Card/Wallet/COD), animated Gharana quality stamp on confirmation
- Live order tracking with journey timeline (auto-progresses via mock time-based logic)
- Orders history + one-tap reorder
- Address book with default toggle, edit, delete
- Ration Plans (subscriptions) — weekly / biweekly / monthly with pause/resume
- Referrals — share code, earn ₹100 credit when a friend orders
- Search with recent + trending
- Dietary preferences (Vegan / Jain / Diabetic-friendly / Gluten-free)

## Test credentials
See `/app/memory/test_credentials.md`. Seeded user: `test@gharana.in` / `Test@1234`.
