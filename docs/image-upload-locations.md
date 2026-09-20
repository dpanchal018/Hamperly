# Where to Upload Images on Hamperly

This is a working checklist of every place on the site that needs a real image, generated from a live audit of the production database on 2026-09-19. Use it to track your progress as you upload images manually.

**Summary**

| Type | Total | Missing a real image | Admin upload exists? |
|---|---|---|---|
| Products | 416 | 366 (no image at all) + 50 (gray placeholder) | ✅ Yes |
| Hampers | 18 | 18 | ✅ Yes |
| Occasions | 1 | 1 | ❌ No — see note below |
| Events | 4 | 4 | ✅ Yes |
| Categories | 10 | 10 | ❌ No — see note below |
| Homepage hero banners | 3 | 0 (already real photos) | ❌ No — hardcoded in code |

---

## 1. Products (416 total)

**Where it shows on the site:** product cards on `/products`, product detail pages, and anywhere a hamper includes that product.

**Where to upload:** Admin panel → **Products** → open a product → **Edit** → the image upload field on the form uploads directly to storage and saves it. No developer needed.

**Note on the 366 with "no image row":** these are all lumped under a category called **"General"** — they look like they were bulk-imported (via `scripts/import_excel.js`) without ever being sorted into a proper category or given an image. You may want to re-categorize them at the same time as adding images, since "General" isn't a real product category.

The other 50 products already have a *placeholder* image (a plain gray box with text) that just needs replacing with a real photo — they're already properly categorized.

<details>
<summary><strong>Products already categorized, just need a real photo (50)</strong></summary>

**Beverages:** Assorted Herbal Tea Box, Gourmet Arabica Coffee Pack, Hot Chocolate Gift Tin, Masala Chai Gift Box, Premium Green Tea Collection

**Candles & Fragrance:** Jasmine Fragrance Candle, Lavender Relaxation Candle, Reed Diffuser Gift Set, Rose Oud Scented Candle, Sandalwood Aroma Candle, Vanilla Soy Scented Candle

**Chocolates & Sweets:** Assorted Indian Sweets Box, Belgian Truffle Collection, Chocolate-Dipped Biscuit Pack, Dark Chocolate Selection, Gourmet Praline Box, Handmade Fudge Box, Milk Chocolate Gift Pack, Premium Assorted Chocolate Box

**Decor & Festive:** Artificial Flower Bouquet, Brass Diya Pair, Decorative Rangoli Set, Festive Decorative Lantern, Festive Tealight Holder Set, Handcrafted Diya Set, Mini Floral Table Arrangement

**Dry Fruits & Nuts:** Cashew Almond Gift Jar, Honey-Coated Almond Jar, Mixed Nut & Berry Jar, Premium Mixed Dry Fruit Box, Premium Walnut Box, Roasted Pistachio Jar

**Packaging:** Premium Rigid Gift Box, Premium Wooden Hamper Tray, Woven Hamper Basket

**Personalized Gifts:** Inspirational Message Card, Personalized Coffee Mug, Personalized Gift Tag Set, Personalized Name Keychain, Personalized Photo Frame, Premium Anniversary Greeting Card

**Self-Care:** Aromatherapy Bath Salt Jar, Herbal Soap Collection, Lavender Bath & Body Set, Relaxation Spa Gift Set, Rose Hand Cream Duo

**Snacks & Gourmet:** Gourmet Butter Cookie Box, Gourmet Trail Mix Pack, Mini Gourmet Granola Jar, Premium Assorted Biscuit Tin

</details>

<details>
<summary><strong>Products with NO image and no real category — "General" bucket (366)</strong></summary>

Anniversary Banner, Aroma Candle, Aroma Diffuser, Artificial Flowers, Assorted Chocolates, Assorted Mithai, Baby Activity Toy, Baby Bath Set, Baby Bibs, Baby Blanket, Baby Book, Baby Caps, Baby Grooming Kit, Baby Memory Book, Baby Mittens, Baby Name Card, Baby Onesies, Baby Photo Frame, Baby Rompers, Baby Socks, Baby T-Shirts, Baby Towel, Baby Washcloths, Balloons, Bandhani Potli, Bangles, Bath Bomb, Bath Salts, Beard Comb, Beard Grooming Kit, Beard Oil, Belt, Bib, Bindi, Bindi Set, Birthday Badge, Birthday Banner, Birthday Cake, Birthday Cap, Bluetooth Speaker, Body Butter, Body Lotion, Body Mist, Bottle Opener, Bottle Stopper, Bouquet, Bow Tie, Bracelet, Bride-to-be Badge, Bride-to-be Sash, Bridesmaid Badge, Brownie, Building Blocks, Burp Cloths, Business Card Holder, Cable Organizer, Cake, Candle, Candy, Cap, Card Holder, Changing Mat, Chips, Chocolate, Chocolate Box, Chocolate Truffles, Chocolates, Christmas Cake, Christmas Mug, Christmas Ornament, Christmas Socks, Claw Clip, Cloth Book, Coaster Set, Coasters, Cocktail Glass, Cocktail Shaker, Coconut Chips, Coffee, Coffee Box, Coffee Mug, Color-Proof Pouch, Coloring Book, Compact Mirror, Company Merchandise, Cookies, Couple Bracelets, Couple Keychains, Couple Mugs, Couple Photo, Couple Photo Frame, Couple Sippers, Couple T-Shirts, Couple Wine Glasses, Couple's Thank You Card, Crayons, Cufflinks, Cupcakes, Dandiya Accessories, Dates, Decorative Candle, Decorative Dandiya, Decorative Diya, Decorative Jar, Decorative Keepsake, Decorative Toran, Desk Calendar, Desk Organizer, Desk Plant, Diwali Namkeen, Diya Set, Doll, Dry Fruit Box, Dry Fruits, Dupatta, Ear Plugs, Earrings, Energy Bars, Event Schedule, Executive Pen, Face Mask, Face Serum, Face Sheet Mask, Face Towel, Face Wash, Fafda, Fairy Lights, Fasting Snacks, Flask, Flavoured Water, Floral Hair Accessories, Floral Jewellery, Fragrance, Fridge Magnet, Gourmet Snacks, Granola, Granola Bar, Greeting Card, Groom Card, Groom-to-be Badge, Groom-to-be Sash, Grooming Kit, Grooming Pouch, Gujiya, Hair Accessories, Hair Band, Hair Brush, Hair Pins, Hair Wax, Haldi-themed Jewellery, Hand Cream, Hand Sanitizer, Hand Towel, Handkerchief, Handprint/Footprint Kit, Healthy Snack Box, Healthy Snacks, Herbal Gulal, Herbal Tea, Holi Greeting Card, Honey, Honey Jar, Hot Chocolate, Incense Sticks, Insulated Bottle, Insulated Tumbler, Jalebi, Jam Jar, Jewellery, Jewellery Box, Journal, Kaju Katli, Keychain, Kids Mug, Kite Set, Kite Spool, Kite String Alternative, Lakshmi-Ganesh Idol, Laptop Sleeve, Laptop Stand, Leather Wallet, Leather/PU Pouch, Leather/PU Wallet, LED Photo Frame, Lip Balm, Lip Gloss, Lipstick, Local Specialty Product, Love Coupons, Love Letter, Luggage Tag, Luxury Candle, Macarons, Makeup Kit, Makeup Pouch, Marshmallows, Matching Keychains, Matching Mugs, Matching Sippers, Mehendi Aftercare Balm, Mehendi Cones, Metal Keychain, Milestone Cards, Mini Board Game, Mini Candle, Mini Christmas Decoration, Mini Mug, Mini Perfume, Mini Pillow, Mini Plant, Mini Snack Box, Mini Towel, Mints, Mithai Box, Moisturizer, Mom-to-Be Badge, Mom-to-Be Card, Mom-to-Be Sash, Mug, Muslin Swaddle, Muslin Swaddles, Nail Paint, Nail Stickers, Namkeen, Necklace, Notebook, Onesie, Organic Gulal, Oxidized Earrings, Party Accessories, Passport Holder, Peanut Chikki, Pen, Pencil Box, Personalized Baby Blanket, Personalized Bride Card, Personalized Card, Personalized Corporate Card, Personalized Cushion, Personalized Diwali Card, Personalized Employee Card, Personalized Greeting Card, Personalized Groomsmen Badge, Personalized Haldi Card, Personalized Holi Tag, Personalized Keepsake, Personalized Keychain, Personalized Letter, Personalized Mehendi Card, Personalized Mug, Personalized Name Plaque, Personalized Name Tag, Personalized Note, Personalized Notebook, Personalized Photo, Personalized Sangeet Card, Personalized Thank You Card, Personalized Welcome Card, Phone Stand, Photo Album, Photo Frame, Pichkari, Pickle Jar, Planner, Plum Cake, Pocket Perfume, Pocket Square, Popcorn, Potli, Pouch, Power Bank, Pregnancy Journal, Premium Backpack, Premium Chocolate, Premium Chocolates, Premium Coffee, Premium Dry Fruits, Premium Notebook, Premium Perfume, Premium Photo Frame, Premium Sipper, Premium Snack Box, Premium Tea, Premium Tea/Coffee, Preserved Flowers, Preserved Rose, Puzzle, Rattle, Reed Diffuser, Ring, Rings, Roasted Makhana, Roasted Nuts, Roasted Peanuts, Room Freshener, Rose, Roses, Santa-themed Keychain, Satin Eye Mask, Satin Hair Band, Satin Robe, Satin Scrunchie, Scented Candle, Scrunchie, Scrunchies, Sensory Toy, Shaving Kit, Sheet Mask, Shot Glass, Silver-Plated Coin, Sipper, Sketch Pens, Skincare Kit, Skincare Product, Skincare Set, Sleep Mask, Slippers, Small Bouquet, Small Glass, Snack Box, Snack Mix, Snacks, Socks, Soft Socks, Soft Toy, Stickers, Sticky Notes, Story Book, Succulent, Succulent Pot, Sun-care Mini Kit, Sunglasses, Sunscreen, Tea, Tea Box, Teether, Thandai Mix, Tie, Til Chikki, Tissues, Toiletry Bag, Toiletry Pouch, Toothbrush, Toothpaste, Tote Bag, Toy Car, Traditional Snacks, Travel Adapter, Travel Grooming Kit, Travel Mug, Travel Organizer, Travel Pouch, Venue Map, Wallet, Watch, Water Balloons, Water Bottle, Wedding Itinerary, Wedding Merchandise, Wet Wipes, Whiskey Glass, Wine Glass, Wine Glasses, Wireless Charger, Yellow Bangles

Also: **Tumbler** (in Personalized Gifts category, but also has no image row)

</details>

---

## 2. Hampers (18 total, all missing an image)

**Where it shows on the site:** hamper cards on `/hampers`, and hamper detail pages.

**Where to upload:** Admin panel → **Hampers** → open a hamper → **Edit** → upload field saves directly.

**Checklist:** Blue Coffee Hamper, Bow Boys Hamper, Bow Girls Hamper, Dry Fruits Hamper, Glass Boys Hamper, Glass Stationery Hamper, Glass Straw Hamper, Golden Boys Hamper, Golden Girls Hamper, Kids PVC Bag White & Blue Tumbler, Pink Hamper, PVC Girls Bag Dark Fantasy, Snacks Hamper, White Box DIY Jar, White Box DIY Tumbler + Mug, White Box Evil Eye, White Box White Tumbler + Dark Chocolate, Yellow Green Girls Hamper

---

## 3. Occasions (1 total, missing an image)

**Where it shows on the site:** the `/occasions` listing page and the individual occasion page.

**Where to upload:** ⚠️ **No upload button exists yet** in Admin → Occasions → Edit, even though the database column (`image_url`) exists. Until that form field is added, the only way to set this is directly via the Supabase dashboard (Table Editor → `occasions` table → paste an image URL, after uploading the file to Storage yourself) or ask me to add the missing upload field to the admin form.

**Checklist:** Festivals

---

## 4. Events (4 total, all missing an image)

**Where it shows on the site:** under `/occasions/[occasion]/events` style pages (Events live under Occasions).

**Where to upload:** Admin panel → **Occasions** → the relevant occasion → **Events** section → upload field exists here already.

**Checklist:** Christmas, Diwali, Holi, Navratri

---

## 5. Categories (10 total, all missing an image)

**Where it shows on the site:** wherever category browsing/filtering is shown on the storefront.

**Where to upload:** ⚠️ **No upload button exists yet** in Admin → Categories → Edit (the image column was only just added to the database). Same options as Occasions above — set it manually via Supabase for now, or ask me to add the missing upload field.

**Checklist:** Beverages, Candles & Fragrance, Chocolates & Sweets, Decor & Festive, Dry Fruits & Nuts, General, Packaging, Personalized Gifts, Self-Care, Snacks & Gourmet

---

## 6. Homepage hero banners (3 total — already done)

**Where it shows on the site:** the rotating banner at the very top of the homepage.

**Current state:** already using 3 real photos (`festive_holiday.jpg`, `luxury_wine.jpg`, `spa_wellness.jpg`), but they're hardcoded into the code (`src/components/customer/HeroCarousel.tsx`), not manageable from the admin panel. Nothing to do here unless you want to replace these photos — if so, they'd need to be swapped as files in the codebase, not through the admin panel.

---

## Quick reference: where images actually get stored

Every image uploaded through the admin panel (Products, Hampers, Events) goes into the same Supabase Storage bucket called `product-images`, and the resulting URL is saved onto that row automatically. You don't need to worry about file paths — just use the upload button on each form.
