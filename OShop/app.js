/* ============================================================
   OShopping — Web app
   Data ported from the iOS app's SampleData; a hash router that
   mirrors the app's screens (Home / Search / Saved / Cart /
   Checkout / Account / Product / Category). Monochrome, HIG.
   ============================================================ */
'use strict';

/* ---------------- Data ---------------- */

const CATEGORIES = [
  { id:'tech',    name:'Tech',    symbol:'laptopcomputer' },
  { id:'audio',   name:'Audio',   symbol:'headphones' },
  { id:'home',    name:'Home',    symbol:'lamp.desk' },
  { id:'fashion', name:'Fashion', symbol:'tshirt' },
  { id:'beauty',  name:'Beauty',  symbol:'sparkles' },
  { id:'fitness', name:'Fitness', symbol:'figure.run' },
  { id:'kitchen', name:'Kitchen', symbol:'fork.knife' },
  { id:'gaming',  name:'Gaming',  symbol:'gamecontroller' },
];

// price, compareAt as numbers; colorways [name,hex]
const RAW = [
  ['Aero Pro Wireless Headphones','Sonance','audio',279,349,4.8,12480,'Adaptive noise cancellation, 40-hour battery and spatial audio in a feather-light frame.',['Adaptive ANC','40h battery','Spatial audio','USB-C fast charge'],'headphones',null,[['Midnight','1F2937'],['Ivory','E7E5E4'],['Sky','60A5FA']]],
  ['Lumen 14" UltraBook','Northwave','tech',1399,1599,4.7,3210,'A 1.1kg machined-aluminium laptop with an all-day battery and a stunning OLED display.',['14" OLED 3K','18h battery','16GB unified','Backlit keyboard'],'laptopcomputer',null,[['Space','374151'],['Silver','D1D5DB']]],
  ['Pulse Smart Watch Series 6','Sonance','tech',329,null,4.6,8870,'Health tracking, GPS and a brilliant always-on display that lasts two days.',['ECG + SpO2','2-day battery','Always-on','Water resistant'],'applewatch',null,[['Graphite','1F2937'],['Rose','FB7185']]],
  ['Orbit Mechanical Keyboard','Keylab','gaming',149,189,4.9,5640,'Hot-swappable switches, per-key RGB and a satisfying tactile feel built to last.',['Hot-swap switches','Per-key RGB','Aluminium frame','USB-C + BT'],'keyboard',null,[]],
  ['Halo Studio Desk Lamp','Lumio','home',89,119,4.5,2140,'Tunable warm-to-cool light with a wireless charging base. Quietly beautiful.',['Tunable white','Qi charging base','Touch dimmer','Aluminium arm'],'lamp.desk',null,[]],
  ['Terra Insulated Bottle 750ml','Terra','fitness',34,null,4.8,19200,'Keeps drinks cold 24h, hot 12h. Powder-coated and built for the trail.',['24h cold','Leak-proof','Powder-coat finish'],'waterbottle',null,[['Pine','166534'],['Sand','D6C7A1'],['Coral','FB7185']]],
  ['Cloudstep Running Shoes','Strive','fashion',129,160,4.6,7430,'Responsive foam and a breathable knit upper for effortless daily miles.',['Responsive foam','Recycled knit','8mm drop'],'shoe',null,[['Slate','475569'],['Flame','F97316']]],
  ['Aroma Precision Espresso','Cremo','kitchen',449,529,4.7,4120,'Café-grade pressure, built-in grinder and milk texturing for barista results at home.',['15-bar pump','Conical grinder','Steam wand','PID temp control'],'cup.and.saucer.fill',null,[]],
  ['Glow Vitamin-C Serum','Lumière','beauty',42,null,4.4,9810,'A brightening daily serum with stabilized vitamin C and hyaluronic acid.',['15% Vitamin C','Hyaluronic acid','Vegan & cruelty-free'],'drop.fill',null,[]],
  ['Nimbus Bluetooth Speaker','Sonance','audio',119,149,4.6,6650,'Room-filling 360° sound, 20-hour battery and an IP67 waterproof shell.',['360° sound','20h battery','IP67 waterproof','Stereo pair'],'hifispeaker.fill',null,[['Charcoal','1F2937'],['Mist','CBD5E1']]],
  ['Flex Adjustable Dumbbells','Strive','fitness',349,null,4.8,3380,'5 to 25kg per hand with a quick-dial selector. A whole rack in one set.',['5–25kg per hand','Quick-dial','Compact tray'],'dumbbell.fill',null,[]],
  ['Vertex Pro Controller','Keylab','gaming',79,99,4.5,11200,'Hall-effect sticks, mappable back paddles and a 1000Hz wireless link.',['Hall-effect sticks','Back paddles','1000Hz wireless'],'gamecontroller.fill',null,[]],
  ['Terawave Warmth Relaxation Wand','Terawave','beauty',118.88,null,4.3,77,'A handheld wand pairing gentle, adjustable warmth with soothing vibration for at-home relaxation. Ergonomic polished-metal body, USB-C rechargeable, with an auto-off timer.',['Adjustable warmth','Soothing vibration','USB-C rechargeable','Polished metal finish'],'wand.and.rays','TerawaveWand',[['Red','C0241F']]],
  ['Auric Air Buds','Auric','audio',99,129,4.6,30882,'All-day comfort with adaptive spatial audio, the custom Auric A1 chip and voice isolation for clearer calls. Up to 30 hours of total battery with the compact USB-C charging case.',['Adaptive spatial audio','Auric A1 chip','Up to 30h battery','IP54 water resistant'],'airpods',null,[['White','F2F2F7']]],
  ['Northwave Tab 11','Northwave','tech',599,699,4.6,4120,'An 11-inch tablet with a laminated 120Hz display, all-day battery and an optional magnetic keyboard.',['11" 120Hz','12h battery','Magnetic keyboard','USB-C'],'ipad',null,[['Space','374151'],['Silver','D1D5DB']]],
  ['Volt 65W GaN Charger','Volt','tech',39,49,4.8,9210,'A compact gallium-nitride charger that powers a laptop and two phones at once.',['65W output','3 ports','Foldable pins'],'powerplug.fill',null,[]],
  ['Northwave View 27" Monitor','Northwave','tech',449,null,4.5,1870,'A 27-inch 4K display with 98% DCI-P3 color and a height-adjustable stand.',['4K UHD','98% DCI-P3','USB-C 90W','Height + tilt'],'display',null,[]],
  ['Auric Studio Over-Ear','Auric','audio',349,399,4.7,5310,'Reference over-ear headphones with adaptive ANC, plush memory-foam cups and a 50-hour battery.',['Adaptive ANC','50h battery','Memory-foam cups','USB-C + 3.5mm'],'headphones',null,[['Midnight','1F2937'],['Ivory','E7E5E4']]],
  ['Sonance Bar 5.1 Soundbar','Sonance','audio',499,599,4.6,3290,'A 5.1 soundbar with a wireless subwoofer and spatial audio for cinematic rooms.',['5.1 channels','Wireless sub','Spatial audio','HDMI eARC'],'hifispeaker.fill',null,[]],
  ['Sonance Studio Monitors','Sonance','audio',279,null,4.7,1480,'A pair of bookshelf monitors with silk-dome tweeters and a warm, accurate stage.',['Silk-dome tweeters','Bi-amped','Optical + RCA'],'hifispeaker.2.fill',null,[]],
  ['Lumio Arc Floor Lamp','Lumio','home',159,199,4.6,2210,'An arc floor lamp with a dimmable warm-to-cool head and a weighted marble base.',['Tunable white','Touch dimmer','Marble base'],'lamp.floor',null,[]],
  ['Aura Air Purifier','Aura','home',219,null,4.7,6640,'A quiet HEPA-13 purifier that clears a large room in under 20 minutes.',['HEPA-13','Covers 60m²','23dB quiet','Auto mode'],'wind',null,[]],
  ['Hearth Smart Thermostat','Lumio','home',129,149,4.5,4030,'A learning thermostat that trims energy use and adapts to your week automatically.',['Auto-schedule','Energy reports','App control'],'thermometer.medium',null,[]],
  ['Loom Weighted Blanket','Loom','home',89,null,4.8,12830,'A breathable 7kg weighted blanket with a washable cotton cover for deeper rest.',['7kg even weight','Breathable cotton','Machine washable'],'bed.double.fill',null,[['Slate','475569'],['Sand','D6C7A1']]],
  ['Strive Everyday Tee','Strive','fashion',32,null,4.5,8810,'A heavyweight Pima-cotton tee with a clean drape that holds its shape wash after wash.',['Pima cotton','Pre-shrunk','Relaxed fit'],'tshirt',null,[['Black','111827'],['Bone','E7E5E4'],['Olive','4D7C0F']]],
  ['Atlas Leather Weekender','Atlas','fashion',249,299,4.7,1960,'A full-grain leather weekender with a shoe compartment and a lifetime hardware warranty.',['Full-grain leather','Shoe compartment','Lifetime hardware'],'bag.fill',null,[]],
  ['Meridian Aviator Sunglasses','Meridian','fashion',145,null,4.6,3410,'Polarized aviators with a titanium frame and scratch-resistant lenses.',['Polarized','Titanium frame','UV400'],'eyeglasses',null,[]],
  ['Lumière Hydrating Cream','Lumière','beauty',38,null,4.6,14210,'A lightweight daily moisturizer with ceramides and squalane for a soft, balanced finish.',['Ceramides','Squalane','Fragrance-free'],'drop.fill',null,[]],
  ['Strive Pro Yoga Mat','Strive','fitness',68,85,4.8,5270,'A 6mm natural-rubber mat with a grippy, sweat-wicking top and alignment lines.',['6mm natural rubber','Grippy top','Alignment lines'],'figure.yoga',null,[]],
  ['Terra Resistance Band Set','Terra','fitness',29,null,4.6,7720,'Five layered-latex bands from light to heavy, with a door anchor and carry pouch.',['5 resistances','Door anchor','Carry pouch'],'figure.strengthtraining.traditional',null,[]],
  ['Verde Chef’s Knife','Verde','kitchen',95,119,4.8,4490,'An 8-inch high-carbon steel chef’s knife, hand-finished and balanced for control.',['High-carbon steel','8" blade','Full tang'],'fork.knife',null,[]],
  ['Keylab Glide Gaming Mouse','Keylab','gaming',69,89,4.7,8150,'A 58g wireless mouse with a 26K optical sensor and a 90-hour battery.',['58g lightweight','26K sensor','90h battery','1000Hz'],'computermouse.fill',null,[]],
];

const SELLERS = {
  Auric:['Sound and silicon, beautifully made.','Austin, TX',2010],
  Sonance:['Sound, engineered to disappear.','Copenhagen, DK',2009],
  Northwave:['Machined for the modern desk.','Seattle, WA',2014],
  Keylab:['Built for play. Tuned for pros.','Taipei, TW',2018],
  Lumio:['Light, thoughtfully made.','Milan, IT',2016],
  Terra:['Made for the trail.','Boulder, CO',2012],
  Strive:['Move better, every day.','Portland, OR',2015],
  Cremo:['Café-grade results, at home.','Turin, IT',2011],
  'Lumière':['Skincare, brightened.','Paris, FR',2017],
  Terawave:['Wellness, reimagined.','Sedona, AZ',2021],
  Volt:['Power, perfected.','Austin, TX',2016],
  Aura:['Cleaner air, quietly.','Denver, CO',2018],
  Loom:['Comfort, woven in.','Portland, OR',2017],
  Atlas:['Made to travel.','Brooklyn, NY',2013],
  Meridian:['See it clearly.','Los Angeles, CA',2015],
  Verde:['Tools for the table.','Turin, IT',2012],
};

const PROMOS = {
  SAVE10:    { code:'SAVE10',    label:'10% off your order',       kind:'percent', value:10 },
  WELCOME15: { code:'WELCOME15', label:'$15 off your first order', kind:'amount',  value:15 },
  FREESHIP:  { code:'FREESHIP',  label:'Free delivery',            kind:'freeship' },
};

const EARBUD_REVIEWS = [
  ['Quandel D.',5,'Great purchase','Sound is full and good quality, and cancels noise well even though these aren’t the ANC ones. Stays in my ears, connects with no issue, and the charge lasts a long time.',17],
  ['Chrissy',5,'She uses them every single day','Bought these for my daughter’s birthday and they were a total win. Sound quality is impressive and clear, they fit comfortably and stay in place, and the battery life has been excellent.',9],
  ['Dave S.',5,'Best price-to-performance earbuds','Sounds amazing, battery lasts a while, and they connect seamlessly across my laptop, phone and tablet. Haven’t had them fall out once.',15],
  ['Sasori N.',4,'Great sound, fit could be better','Water resistant and the appearance is super cute. They don’t quite fit my ears, but the sound is amazing — even without ANC it overshadows everything.',5],
];
const GENERIC_REVIEWS = [
  ['Jordan M.',5,'Exceeded expectations','Build quality is genuinely premium and it performs even better than advertised. Would buy again.',4],
  ['Priya S.',5,'Worth every penny','Shipped fast, packaged beautifully. This has become part of my daily routine.',12],
  ['Alex R.',4,'Great, with one small note','Love it overall. Took a day to get used to but now I can’t imagine going back.',30],
];

const PROFILE = {
  name:'Saswat J', email:'chensaswat@gmail.com',
  address:{ label:'Home', recipient:'Saswat J', street:'742 Market Street', city:'San Francisco', state:'CA', zip:'94103' },
};

/* ---------------- Derive product objects ---------------- */

function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,'-'); }

const PRODUCTS = RAW.map(r => {
  const [name,brand,category,price,compareAt,rating,ratingCount,desc,highlights,symbol,image,colorways] = r;
  return {
    sku: slugify(name), name, brand, category, price,
    compareAt: compareAt || null, rating, ratingCount, desc, highlights, symbol,
    image: image || null,
    colorways: (colorways||[]).map(c => ({ name:c[0], hex:c[1] })),
    freeReturns: true, inStock: true,
    get discount(){ return this.compareAt && this.compareAt>this.price ? Math.round((this.compareAt-this.price)/this.compareAt*100) : null; }
  };
});
const BY_SKU = Object.fromEntries(PRODUCTS.map(p => [p.sku, p]));
const productsIn = id => PRODUCTS.filter(p => p.category===id);
const DEALS = PRODUCTS.filter(p => p.discount);
const TRENDING = [...PRODUCTS].sort((a,b)=>b.ratingCount-a.ratingCount);
const TOP_RATED = [...PRODUCTS].sort((a,b)=>b.rating-a.rating);
const category = id => CATEGORIES.find(c=>c.id===id) || CATEGORIES[0];

/* ---------------- Icons ---------------- */
const ICON = {
  'headphones':'headphones','laptopcomputer':'laptop','applewatch':'watch','keyboard':'keyboard',
  'lamp.desk':'lampdesk','waterbottle':'bottle','shoe':'shoe','cup.and.saucer.fill':'coffee',
  'drop.fill':'droplet','hifispeaker.fill':'speaker','hifispeaker.2.fill':'speaker',
  'dumbbell.fill':'dumbbell','gamecontroller':'gamepad','gamecontroller.fill':'gamepad',
  'wand.and.rays':'wand','airpods':'earbuds','ipad':'tablet','powerplug.fill':'plug',
  'display':'monitor','lamp.floor':'lampfloor','wind':'wind','thermometer.medium':'thermometer',
  'bed.double.fill':'bed','tshirt':'shirt','bag.fill':'bag','eyeglasses':'glasses',
  'figure.yoga':'person','figure.strengthtraining.traditional':'dumbbell','fork.knife':'utensils',
  'computermouse.fill':'mouse','figure.run':'footprints','sparkles':'sparkles',
};
const icon = id => `<svg class="ic"><use href="#i-${id}"/></svg>`;
const prodIcon = sym => icon(ICON[sym] || 'package');

/* ---------------- Money ---------------- */
const money = n => '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const moneyShort = n => Number.isInteger(Number(n)) ? '$'+Number(n).toLocaleString('en-US') : money(n);

/* ---------------- Persistent state ---------------- */
const store = {
  cart: load('oshop.cart.v1', []),        // [{sku, qty, color}]
  saved: load('oshop.saved.v1', []),      // [sku]
  recent: load('oshop.recent.v1', []),    // [sku]
  promo: null,                            // code string
  deselected: new Set(),                  // sku set
};
function load(k,f){ try{ return JSON.parse(localStorage.getItem(k)) ?? f }catch(e){ return f } }
function persist(){
  localStorage.setItem('oshop.cart.v1', JSON.stringify(store.cart));
  localStorage.setItem('oshop.saved.v1', JSON.stringify(store.saved));
  localStorage.setItem('oshop.recent.v1', JSON.stringify(store.recent));
}

/* cart ops */
function cartItems(){ return store.cart.map(i => ({...i, product:BY_SKU[i.sku]})).filter(i=>i.product); }
function cartCount(){ return store.cart.reduce((s,i)=>s+i.qty,0); }
function addToCart(sku, color, qty=1){
  const ex = store.cart.find(i=>i.sku===sku);
  if(ex) ex.qty += qty; else store.cart.push({sku, color:color||null, qty});
  persist(); syncChrome();
}
function setQty(sku,q){
  const it = store.cart.find(i=>i.sku===sku); if(!it) return;
  if(q<=0){ store.cart = store.cart.filter(i=>i.sku!==sku); store.deselected.delete(sku); }
  else it.qty = q;
  persist(); syncChrome();
}
function removeFromCart(sku){ store.cart = store.cart.filter(i=>i.sku!==sku); store.deselected.delete(sku); persist(); syncChrome(); }
function isSelected(sku){ return !store.deselected.has(sku); }
function selectedItems(){ return cartItems().filter(i=>isSelected(i.sku)); }

/* wishlist */
function toggleSaved(sku){
  const i = store.saved.indexOf(sku);
  if(i>=0) store.saved.splice(i,1); else store.saved.push(sku);
  persist(); syncChrome();
}
const isSaved = sku => store.saved.includes(sku);

/* recently viewed */
function recordView(sku){
  store.recent = [sku, ...store.recent.filter(s=>s!==sku)].slice(0,10);
  persist();
}

/* ---------------- Cart math ---------------- */
const SHIP_THRESHOLD = 50, SHIP_FEE = 4.99, TAX_RATE = 0.0875;
function calc(items){
  const subtotal = items.reduce((s,i)=>s + i.product.price*i.qty, 0);
  const savings = items.reduce((s,i)=>s + (i.product.compareAt ? (i.product.compareAt-i.product.price)*i.qty : 0), 0);
  const promo = store.promo ? PROMOS[store.promo] : null;
  const freeship = promo && promo.kind==='freeship';
  let promoDiscount = 0;
  if(promo){
    if(promo.kind==='percent') promoDiscount = round2(subtotal*promo.value/100);
    else if(promo.kind==='amount') promoDiscount = Math.min(promo.value, subtotal);
  }
  const shipping = freeship ? 0 : (items.length===0 || subtotal>=SHIP_THRESHOLD ? 0 : SHIP_FEE);
  const tax = round2(subtotal*TAX_RATE);
  const total = Math.max(0, subtotal-promoDiscount) + shipping + tax;
  return { subtotal, savings, promo, freeship, promoDiscount, shipping, tax, total,
           count: items.reduce((s,i)=>s+i.qty,0) };
}
const round2 = n => Math.round(n*100)/100;

/* ============================================================
   Components (HTML strings)
   ============================================================ */
function stars(rating, big){
  const pct = (rating/5*100).toFixed(1);
  const row = icon('star').repeat(5);
  return `<span class="stars">
    <span class="r-bg">${row}</span>
    <span class="r-fill" style="width:${pct}%">${row}</span>
  </span>`;
}
function ratingHTML(p, big){
  return `<span class="rating${big?' big':''}">
    <span class="v">${p.rating.toFixed(1)}</span>
    ${stars(p.rating,big)}
    ${p.ratingCount!=null?`<span class="cnt">(${compact(p.ratingCount)})</span>`:''}
  </span>`;
}
const compact = n => n>=1000 ? (n/1000).toFixed(n>=10000?0:1).replace(/\.0$/,'')+'K' : ''+n;

function priceHTML(p, size='md'){
  return `<span class="price ${size}">
    <span class="now">${moneyShort(p.price)}</span>
    ${p.compareAt?`<span class="was">${moneyShort(p.compareAt)}</span>`:''}
  </span>`;
}
function pimg(p, cls=''){
  const inner = p.image ? `<img src="assets/${p.image}.jpg" alt="${esc(p.name)}" loading="lazy">` : prodIcon(p.symbol);
  const badge = p.discount ? `<span class="badge-discount">-${p.discount}%</span>` : '';
  return `<div class="pimg ${cls}">${badge}${inner}</div>`;
}
function productCard(p){
  return `<div class="card">
    <div class="pimg">
      ${p.discount?`<span class="badge-discount">-${p.discount}%</span>`:''}
      ${p.image?`<img src="assets/${p.image}.jpg" alt="${esc(p.name)}" loading="lazy">`:prodIcon(p.symbol)}
      <button class="quick-add" data-add="${p.sku}" aria-label="Add ${esc(p.name)} to cart">${icon('cart')} Add to Cart</button>
    </div>
    <a class="tile-link" href="#/product/${p.sku}" aria-label="${esc(p.name)}"></a>
    <button class="fav${isSaved(p.sku)?' on':''}" data-fav="${p.sku}" aria-label="Save ${esc(p.name)}">${icon('heart')}</button>
    <div class="card-info">
      <span class="brand">${esc(p.brand)}</span>
      <span class="name">${esc(p.name)}</span>
      ${ratingHTML(p)}
      ${priceHTML(p)}
      <span class="badge-express" style="align-self:flex-start;margin-top:4px">${icon('bolt')}EXPRESS</span>
    </div>
  </div>`;
}
function sectionHead(title, sub, seeAllHref){
  return `<div class="section-head">
    <div><h2>${title}</h2>${sub?`<div class="sub">${sub}</div>`:''}</div>
    ${seeAllHref?`<a class="link-action" href="${seeAllHref}">See all ${icon('chevron-right')}</a>`:''}
  </div>`;
}
function rail(title, sub, list, seeAllHref){
  return `<section class="block">
    ${sectionHead(title, sub, seeAllHref)}
    <div class="rail-scroll">${list.map(productCard).join('')}</div>
  </section>`;
}

/* ============================================================
   SPATIAL HERO ("In focus") + gallery plate
   ============================================================ */
const FEATURED = ['aero-pro-wireless-headphones','lumen-14-ultrabook','aroma-precision-espresso','orbit-mechanical-keyboard','auric-air-buds','atlas-leather-weekender'];
let heroIndex = 0;

function heroPieceHTML(p){
  return `<div class="hero-fade" id="heroFade">
    <div class="hero-plate-col">
      <div class="hero-plate-float">
        <div class="hero-plate">
          ${p.discount?`<span class="badge-discount">-${p.discount}%</span>`:''}
          ${p.image?`<img src="assets/${p.image}.jpg" alt="${esc(p.name)}">`:prodIcon(p.symbol)}
        </div>
        <div class="hero-contact"></div>
      </div>
    </div>
    <div class="hero-placard">
      <div class="hp-eyebrow">${esc(p.brand)} · ${esc(category(p.category).name)}</div>
      <div class="hp-name">${esc(p.name)}</div>
      <div class="hp-row">${priceHTML(p,'lg')} ${ratingHTML(p)}</div>
      <p class="hp-desc">${esc(p.desc)}</p>
      <div class="hp-actions">
        <a class="btn btn-pill" href="#/product/${p.sku}">View piece ${icon('arrow-right')}</a>
        <button class="btn btn-secondary" style="width:auto;padding:0 22px" data-add="${p.sku}">${icon('cart')} Add to Cart</button>
      </div>
      <div class="hero-nav">
        <span class="hn-count">${String(heroIndex+1).padStart(2,'0')} / ${String(FEATURED.length).padStart(2,'0')}</span>
        <span class="hn-btns">
          <button data-hero-nav="prev" aria-label="Previous piece">${icon('chevron-left')}</button>
          <button data-hero-nav="next" aria-label="Next piece">${icon('chevron-right')}</button>
        </span>
      </div>
    </div>
  </div>`;
}

/* a product presented as a floating tile with a label beneath (gallery wall) */
function plate(p, feature){
  return `<article class="plate${feature?' plate--feature':''}">
    <div class="plate-tile">
      ${p.discount?`<span class="badge-discount">-${p.discount}%</span>`:''}
      ${p.image?`<img src="assets/${p.image}.jpg" alt="${esc(p.name)}">`:prodIcon(p.symbol)}
      <a class="tile-link" href="#/product/${p.sku}" aria-label="${esc(p.name)}"></a>
      <button class="fav${isSaved(p.sku)?' on':''}" data-fav="${p.sku}" aria-label="Save ${esc(p.name)}">${icon('heart')}</button>
    </div>
    <div class="plate-label">
      <span class="pl-eyebrow">${esc(p.brand)} · ${esc(category(p.category).name)}</span>
      <a class="pl-name" href="#/product/${p.sku}">${esc(p.name)}</a>
      <div class="pl-row">${priceHTML(p)} ${ratingHTML(p)}</div>
      ${feature?`<p class="pl-desc">${esc(p.desc)}</p><a class="btn btn-pill" href="#/product/${p.sku}" style="margin-top:8px">View piece ${icon('arrow-right')}</a>`:''}
    </div>
  </article>`;
}

function cycleHero(dir){
  heroIndex = (heroIndex + dir + FEATURED.length) % FEATURED.length;
  const stage = document.getElementById('heroStage'); if(!stage) return;
  const fade = document.getElementById('heroFade');
  const swap = () => {
    const wrap = document.createElement('div');
    wrap.innerHTML = heroPieceHTML(BY_SKU[FEATURED[heroIndex]]);
    const old = document.getElementById('heroFade');
    if(old) stage.replaceChild(wrap.firstElementChild, old);
  };
  if(fade && !matchMedia('(prefers-reduced-motion:reduce)').matches){
    fade.classList.add('out'); setTimeout(swap, 220);
  } else swap();
}

function mountSpatialHome(){
  // scroll reveal — sections settle into place
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin:'0px 0px -6% 0px', threshold:.06 });
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // hero parallax — custom props set on the stage inherit to the plate,
  // so they survive the plate being re-rendered on cycle.
  const stage = document.getElementById('heroStage');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const fine = matchMedia('(pointer:fine)').matches;
  if(stage && !reduce && fine){
    let raf;
    stage.addEventListener('pointermove', e=>{
      const r = stage.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width - 0.5;
      const py = (e.clientY-r.top)/r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        stage.style.setProperty('--hx', (px*12).toFixed(2)+'deg');
        stage.style.setProperty('--hy', (-py*9).toFixed(2)+'deg');
      });
    });
    stage.addEventListener('pointerleave', ()=>{
      stage.style.setProperty('--hx','0deg'); stage.style.setProperty('--hy','0deg');
    });
  }
}

/* ============================================================
   Greeting
   ============================================================ */
function greeting(){
  const h = new Date().getHours();
  return h<12 ? 'Good morning' : h<17 ? 'Good afternoon' : h<22 ? 'Good evening' : 'Good night';
}

/* ============================================================
   SCREENS
   ============================================================ */
function screenHome(){
  const heroPiece = BY_SKU[FEATURED[heroIndex]];
  const wallFeature = BY_SKU['terawave-warmth-relaxation-wand'];
  const wallPicks = TOP_RATED.filter(p => !FEATURED.includes(p.sku) && p.sku !== wallFeature.sku).slice(0, 4);

  return `
  <div class="view-enter home-spatial">
    <header class="sp-head reveal">
      <p class="eyebrow">OShopping</p>
      <h1>In focus.</h1>
      <p class="sp-sub">A small, well-chosen catalogue — met one piece at a time, or browsed all at once.</p>
    </header>

    <section class="hero-stage reveal" id="heroStage">
      <div class="hero-field"></div>
      ${heroPieceHTML(heroPiece)}
    </section>

    <section class="block reveal">
      ${sectionHead('The edit','A few pieces worth a closer look','#/browse/toprated')}
      <div class="gallery-wall">
        ${plate(wallFeature, true)}
        ${wallPicks.map(p=>plate(p)).join('')}
      </div>
    </section>

    <div class="reveal">${rail('Trending now',"What everyone's buying", TRENDING, '#/browse/trending')}</div>

    <section class="block reveal"><div class="editorial">
      <h2>Thoughtfully chosen.<br>Beautifully delivered.</h2>
      <p>Every product, curated for the way you live.</p>
    </div></section>

    <div class="reveal">${rail('Deals of the day','Limited-time savings', DEALS, '#/browse/deals')}</div>

    <div class="home-footer">
      <div class="hf-mark">OShopping</div>
      <div class="hf-sub">Designed for you · Delivered with care</div>
    </div>
  </div>`;
}

const BROWSE_LISTS = {
  deals:['Deals of the day', ()=>DEALS],
  trending:['Trending now', ()=>TRENDING],
  toprated:['Top rated', ()=>TOP_RATED],
  all:['Everything', ()=>PRODUCTS],
};
let browseSort = 'featured';
let currentList = [];
const SORT_OPTS = [['featured','Featured'],['price-asc','Price: Low to High'],['price-desc','Price: High to Low'],['rating','Top rated'],['reviews','Most reviewed']];
function applySort(list){
  const l = [...list];
  switch(browseSort){
    case 'price-asc':  return l.sort((a,b)=>a.price-b.price);
    case 'price-desc': return l.sort((a,b)=>b.price-a.price);
    case 'rating':     return l.sort((a,b)=>b.rating-a.rating);
    case 'reviews':    return l.sort((a,b)=>b.ratingCount-a.ratingCount);
    default:           return l;
  }
}
function sortBar(count){
  return `<div class="sort-bar">
    <span class="sort-count">${count} item${count===1?'':'s'}</span>
    <label class="sort-ctl">Sort by
      <select data-sort>${SORT_OPTS.map(o=>`<option value="${o[0]}"${browseSort===o[0]?' selected':''}>${o[1]}</option>`).join('')}</select>
    </label>
  </div>`;
}
function productGrid(list){ return `<div class="pgrid" id="browseGrid">${applySort(list).map(productCard).join('')}</div>`; }

function screenBrowse(key){
  let title, list;
  if(BROWSE_LISTS[key]){ title = BROWSE_LISTS[key][0]; list = BROWSE_LISTS[key][1](); }
  else { const c = category(key); title = c.name; list = productsIn(key); }
  browseSort = 'featured'; currentList = list;
  return `<div class="page view-enter">
    <div class="page-head">
      <a class="back-btn" href="#/" aria-label="Back">${icon('chevron-left')}</a>
      <div><div class="page-title">${title}</div></div>
    </div>
    ${sortBar(list.length)}
    ${productGrid(list)}
  </div>`;
}

function screenCategories(){
  return `<div class="page view-enter">
    <div class="page-head"><div class="page-title">Categories</div></div>
    <div class="cat-grid" style="margin-top:10px">
      ${CATEGORIES.map(c=>`<a class="cat-tile" href="#/browse/${c.id}">
        <div class="cat-ico">${icon(ICON[c.symbol]||'package')}</div>
        <div><div class="cat-name">${c.name}</div><div class="cat-count">${productsIn(c.id).length} items</div></div>
        <span class="cat-arrow">${icon('arrow-up-right')}</span>
      </a>`).join('')}
    </div>
  </div>`;
}

/* ---- Product detail ---- */
let pdColor = 0, pdQty = 1;
function screenProduct(sku){
  const p = BY_SKU[sku];
  if(!p) return notFound();
  recordView(sku);
  pdColor = 0; pdQty = 1;
  const reviews = p.name.toLowerCase().includes('air buds') ? EARBUD_REVIEWS : GENERIC_REVIEWS;
  const seller = SELLERS[p.brand];
  const ship = new Date(Date.now()+86400*1000*2).toLocaleDateString('en-US',{month:'long',day:'numeric'});
  const arrives = new Date(Date.now()+86400*1000*2).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  const related = productsIn(p.category).filter(x=>x.sku!==sku).slice(0,8);
  const two = p.highlights.slice(0,2);
  const praise = two.length===0 ? 'the overall quality and value' : two.length===1 ? two[0] : `${two[0]} and ${two[1]}`;
  const summary = `Reviewers consistently call out ${praise.toLowerCase()}. With ${p.rating.toFixed(1)}★ from ${p.ratingCount.toLocaleString()} ratings, most describe it as well-made and worth the price.`;

  return `<div class="page view-enter">
    <div class="page-head"><a class="back-btn" href="javascript:history.back()" aria-label="Back">${icon('chevron-left')}</a></div>
    <div class="pd">
      <div class="pd-gallery">
        <div class="pd-stage" id="pdStage">
          ${p.discount?`<span class="badge-discount">-${p.discount}%</span>`:''}
          <button class="fav${isSaved(sku)?' on':''}" data-fav="${sku}" aria-label="Save">${icon('heart')}</button>
          ${p.image?`<img src="assets/${p.image}.jpg" alt="${esc(p.name)}">`:prodIcon(p.symbol)}
        </div>
        ${p.colorways.length>1?`<div class="pd-thumbs">${p.colorways.map((c,i)=>`
          <button data-color="${i}" data-sku="${sku}" class="${i===0?'sel':''}" aria-label="${esc(c.name)}"><span class="sw" style="background:#${c.hex}"></span></button>`).join('')}</div>`:''}
      </div>

      <div class="pd-buy">
        <h1 class="pd-title">${esc(p.name)}</h1>
        <a class="seller-link" href="#/seller/${encodeURIComponent(p.brand)}">${esc(p.brand)} ${icon('seal')} ${icon('chevron-right')}</a>

        ${p.colorways.length ? `<div class="pd-colors">
          <div class="lbl"><b>Color</b> <span id="pdColorName">${esc(p.colorways[0].name)}</span></div>
          <div class="swatches">${p.colorways.map((c,i)=>`
            <button class="swatch${i===0?' sel':''}" data-color="${i}" data-sku="${sku}" aria-label="${esc(c.name)}"><span class="dot" style="background:#${c.hex}"></span></button>`).join('')}</div>
        </div>`:''}

        <div class="pd-price-row">
          ${priceHTML(p,'lg')}
          <div class="pd-actions">
            <span class="qty pd-qty">
              <button data-pdqty="dec" disabled aria-label="Decrease quantity">${icon('minus')}</button>
              <span class="n" id="pdQtyN">1</span>
              <button data-pdqty="inc" aria-label="Increase quantity">${icon('plus')}</button>
            </span>
            <button class="btn btn-pill" data-add="${sku}" data-usecolor="1">${icon('cart')} Add to Cart</button>
          </div>
        </div>

        <div class="pd-trust">
          <div class="pd-trust-row">${icon('box')}<span>Free delivery. <b>Arrives ${arrives}</b></span></div>
          <div class="pd-trust-row">${icon('return')}<span>Free 30-day returns</span></div>
          <div class="pd-trust-row">${icon('shield')}<span>Secure checkout · protected payment</span></div>
        </div>

        <div class="pd-info-row">
          <div class="card-shell"><h4>Availability</h4>
            <div class="t-secondary" style="font-size:14px">Ships</div>
            <div class="ship-big">${ship}</div>
          </div>
          <div class="card-shell"><h4>Specifications</h4>
            <div class="spec-list">${p.highlights.slice(0,4).map(s=>`<div class="spec">${icon(specIcon(s))}<span>${esc(s)}</span></div>`).join('')}</div>
          </div>
        </div>

        <div class="card-shell about" style="margin-top:14px"><h4>About this item</h4>
          <p>${esc(p.desc)}</p>
          <span class="ret">${icon('return')} Free 30-day returns</span>
        </div>
      </div>
    </div>

    <section class="pd-reviews">
      <div class="card-shell">
        <h4>Ratings &amp; reviews</h4>
        <div class="rev-summary">
          <div class="rev-score">
            <div class="big">${p.rating.toFixed(1)}</div>
            <div class="rating big">${stars(p.rating,true)}</div>
            <div class="cnt">${p.ratingCount.toLocaleString()} ratings</div>
          </div>
          <div class="rev-bars">${[5,4,3,2,1].map(st=>{
            const w = st===Math.round(p.rating)?70 : st===Math.round(p.rating)+1||st===Math.round(p.rating)-1?22:6;
            return `<div class="rev-bar"><span>${st}</span><span class="track"><span class="fill" style="width:${w}%"></span></span></div>`;
          }).join('')}</div>
          <div class="rev-ai">
            <div class="h">${icon('sparkles')} Review Summary</div>
            <p>${summary}</p>
          </div>
        </div>
      </div>
      <div class="review-grid">
        ${reviews.map(r=>`<div class="card-shell review">
          <div class="r-head">
            <div class="r-av">${r[0].split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
            <div><div class="r-name">${esc(r[0])}</div>
              <div class="r-meta"><span class="rating">${stars(r[1])}</span> · <span class="r-verified">${icon('seal')} Verified</span></div>
            </div>
          </div>
          <div class="r-title">${esc(r[2])}</div>
          <div class="r-body">${esc(r[3])}</div>
        </div>`).join('')}
      </div>
    </section>

    ${related.length ? rail('You might also like', null, related) : ''}
  </div>`;
}
function specIcon(text){
  const t = text.toLowerCase();
  if(/batter/.test(t)) return 'bolt';
  if(/charg/.test(t)) return 'bolt';
  if(/anc|noise|cancel/.test(t)) return 'headphones';
  if(/spatial|audio|sound/.test(t)) return 'speaker';
  if(/water|ip6|ip5|leak/.test(t)) return 'droplet';
  if(/wireless|blue|ghz|link/.test(t)) return 'wind';
  if(/rgb|light|white|dimmer/.test(t)) return 'lampdesk';
  if(/switch|key/.test(t)) return 'keyboard';
  if(/display|oled|screen|3k|4k/.test(t)) return 'monitor';
  if(/heart|ecg|spo2/.test(t)) return 'heart';
  if(/grind|steam|bar|temp/.test(t)) return 'coffee';
  if(/recycl|vegan|cruelty/.test(t)) return 'sparkles';
  if(/return/.test(t)) return 'return';
  if(/paddle|stick/.test(t)) return 'gamepad';
  if(/kg|dial|compact/.test(t)) return 'dumbbell';
  return 'seal';
}

/* ---- Seller ---- */
function screenSeller(brand){
  const info = SELLERS[brand]; if(!info) return notFound();
  const list = PRODUCTS.filter(p=>p.brand===brand);
  return `<div class="page view-enter">
    <div class="page-head"><a class="back-btn" href="javascript:history.back()">${icon('chevron-left')}</a></div>
    <div style="text-align:center;padding:10px 0 6px">
      <div class="acct-head" style="display:inline-flex;text-align:left"><div class="a-av">${brand[0]}</div>
        <div><div class="a-name">${esc(brand)} ${icon('seal')}</div><div class="a-mail">${esc(info[0])}</div>
        <div class="t-tertiary" style="font-size:12px;margin-top:2px">${icon('location')} ${esc(info[1])} · Since ${info[2]}</div></div></div>
    </div>
    <section class="block">${sectionHead(`From ${esc(brand)}`, `${list.length} products`)}
      <div class="pgrid">${list.map(productCard).join('')}</div></section>
  </div>`;
}

/* ---- Cart ---- */
function screenCart(){
  const items = cartItems();
  if(!items.length){
    return `<div class="page view-enter"><div class="empty">
      <div class="e-ic">${icon('cart')}</div>
      <h3>Your cart is empty</h3>
      <p>Discover something you'll love and it'll show up here.</p>
      <a class="btn btn-primary btn-auto" href="#/" style="display:inline-flex;padding:0 28px">Start shopping</a>
      ${store.saved.length?`<div style="margin-top:14px"><a class="link-action" href="#/saved">View saved items (${store.saved.length})</a></div>`:''}
    </div></div>`;
  }
  const sel = selectedItems();
  const c = calc(sel);
  const allSel = store.deselected.size===0;
  const meter = calc(items);
  const remain = Math.max(0, SHIP_THRESHOLD - meter.subtotal);
  const pct = Math.min(100, meter.subtotal/SHIP_THRESHOLD*100);
  const unlocked = remain<=0 || c.freeship;

  return `<div class="page view-enter">
    <div class="page-head"><div class="page-title">Cart</div></div>
    <div class="cart-wrap">
      <div class="cart-main">
        ${!c.freeship ? `<div class="ship-meter ${unlocked?'done':''}">
          <div class="sm-top">${icon(unlocked?'seal':'box')}${unlocked?'You’ve unlocked free delivery':`Add ${money(remain)} for free delivery`}</div>
          <div class="track"><div class="fill" style="width:${pct}%"></div></div>
        </div>`:''}

        <div class="select-all" style="margin-top:12px">
          <span>${allSel?`${items.reduce((s,i)=>s+i.qty,0)} item${items.reduce((s,i)=>s+i.qty,0)===1?'':'s'}`:`${c.count} of ${meter.count} selected`}</span>
          <button data-selectall>${allSel?'Deselect all':'Select all'}</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
        ${items.map(i=>`
          <div class="cart-row">
            <button class="cr-check${isSelected(i.sku)?' on':''}" data-select="${i.sku}" aria-label="Select">${icon('check')}</button>
            <a href="#/product/${i.sku}">${pimg(i.product)}</a>
            <div class="cr-body">
              <a class="cr-name" href="#/product/${i.sku}">${esc(i.product.name)}</a>
              <div class="cr-meta">${esc(i.product.brand)}${i.color?` · ${esc(i.color)}`:''}</div>
              <div class="cr-foot">
                <span class="qty">
                  <button data-qty="dec" data-sku="${i.sku}" ${i.qty<=1?'disabled':''} aria-label="Decrease">${icon('minus')}</button>
                  <span class="n">${i.qty}</span>
                  <button data-qty="inc" data-sku="${i.sku}" aria-label="Increase">${icon('plus')}</button>
                </span>
                <span class="price md"><span class="now">${money(i.product.price*i.qty)}</span></span>
              </div>
              <button class="cr-remove" data-remove="${i.sku}">Remove</button>
            </div>
          </div>`).join('')}
        </div>

        <div class="promo" style="margin-top:14px" id="promoCard">${promoHTML()}</div>
      </div>

      <div class="cart-side">
        <div class="summary">
          <h4>Order summary</h4>
          <div class="sum-line"><span>Subtotal (${c.count} item${c.count===1?'':'s'})</span><b>${money(c.subtotal)}</b></div>
          ${c.savings>0?`<div class="sum-line"><span>Savings</span><span class="save">−${money(c.savings)}</span></div>`:''}
          ${c.promo?`<div class="sum-line"><span>Promo · ${c.promo.code}</span><span class="save">${c.freeship?'Free ship':'−'+money(c.promoDiscount)}</span></div>`:''}
          <div class="sum-line"><span>Shipping</span>${c.shipping===0?'<span class="free">FREE</span>':`<b>${money(c.shipping)}</b>`}</div>
          <div class="sum-line"><span>Estimated tax</span><b>${money(c.tax)}</b></div>
          <div class="sum-total"><span class="lbl">Order total</span><span class="val">${money(c.total)}</span></div>
        </div>
        <div class="checkout-bar" style="position:static;background:none;border:none;backdrop-filter:none;padding:0;margin:14px 0 0">
          <a class="btn btn-primary ${c.count===0?'':''}" href="#/checkout" ${c.count===0?'style="pointer-events:none;opacity:.4"':''}>
            ${c.count>0?`Checkout · ${money(c.total)}`:'Select items'} ${c.count>0?icon('arrow-right'):''}
          </a>
          <div class="t-tertiary" style="font-size:12px;text-align:center;margin-top:10px">${icon('lock')} Secure checkout · Free 30-day returns</div>
        </div>
      </div>
    </div>
  </div>`;
}
function promoHTML(){
  if(store.promo){
    const p = PROMOS[store.promo]; const c = calc(selectedItems());
    return `<div class="p-head">${icon('tag')} Promo code</div>
      <div class="p-applied">${icon('seal')}
        <div><b>${p.code}</b><div class="t-secondary" style="font-size:12px">${p.label}</div></div>
        <span class="pa-off">${c.freeship?'Free ship':'−'+money(c.promoDiscount)}</span>
        <button data-rmpromo aria-label="Remove promo" style="color:var(--text-tertiary)">${icon('x-circle')}</button>
      </div>`;
  }
  return `<div class="p-head">${icon('tag')} Promo code</div>
    <div class="p-entry">
      <input id="promoInput" placeholder="Enter code" autocomplete="off" spellcheck="false">
      <button class="p-apply" id="promoApply">Apply</button>
    </div>
    <div class="p-invalid" id="promoInvalid" hidden>That code isn't valid. Try one below.</div>
    <div class="p-try"><span>Try</span>${Object.keys(PROMOS).map(k=>`<button class="p-code" data-promo="${k}">${k}</button>`).join('')}</div>`;
}

/* ---- Checkout ---- */
let coPayment = 'OShopping Pay';
const PAYMENTS = [['OShopping Pay','bolt'],['•••• 4242','card'],['OShopping Credit','gift']];
function screenCheckout(){
  const sel = selectedItems();
  if(!sel.length){ location.hash = '#/cart'; return '<div></div>'; }
  const c = calc(sel);
  const a = PROFILE.address;
  const arrival = new Date(Date.now()+86400*1000*2).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
  return `<div class="page view-enter" id="checkoutRoot">
    <div class="page-head"><a class="back-btn" href="#/cart">${icon('chevron-left')}</a><div class="page-title">Checkout</div></div>

    <div class="cart-wrap">
      <div class="cart-main">
        <div class="co-card addr">
          <div class="co-head"><span class="h">${icon('location')} Deliver to</span><span class="link-action">Change ${icon('chevron-right')}</span></div>
          <div class="recipient">${esc(a.recipient)}</div>
          <div class="line">${esc(a.street)}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}</div>
          <div class="arr">${icon('bolt')} Arrives ${arrival}</div>
        </div>

        <div class="co-card">
          <div class="co-head"><span class="h">${icon('card')} Payment</span></div>
          ${PAYMENTS.map(([name,ic])=>`<button class="pay-opt${coPayment===name?' sel':''}" data-pay="${esc(name)}">
            ${icon(ic)} <span>${esc(name)}</span>
            <span class="radio">${icon(coPayment===name?'check-circle':'circle')}</span>
          </button>`).join('')}
        </div>
      </div>

      <div class="cart-side">
        <div class="summary">
          <h4>Order summary</h4>
          <div class="sum-line"><span>Subtotal (${c.count} item${c.count===1?'':'s'})</span><b>${money(c.subtotal)}</b></div>
          ${c.savings>0?`<div class="sum-line"><span>Savings</span><span class="save">−${money(c.savings)}</span></div>`:''}
          ${c.promo?`<div class="sum-line"><span>Promo · ${c.promo.code}</span><span class="save">${c.freeship?'Free ship':'−'+money(c.promoDiscount)}</span></div>`:''}
          <div class="sum-line"><span>Shipping</span>${c.shipping===0?'<span class="free">FREE</span>':`<b>${money(c.shipping)}</b>`}</div>
          <div class="sum-line"><span>Estimated tax</span><b>${money(c.tax)}</b></div>
          <div class="sum-total"><span class="lbl">Order total</span><span class="val">${money(c.total)}</span></div>
        </div>
        <button class="btn btn-primary" style="margin-top:14px" data-place>${icon('lock')} Place order · ${money(c.total)}</button>
        <div class="t-tertiary" style="font-size:12px;text-align:center;margin-top:10px">Demo checkout — no payment is processed.</div>
      </div>
    </div>
  </div>`;
}
function screenConfirmation(total){
  return `<div class="page view-enter"><div class="co-confirm">
    <div class="seal">${icon('seal')}</div>
    <h2>Order placed!</h2>
    <p>Thanks for shopping with OShopping. We’ve emailed your receipt to ${esc(PROFILE.email)} and you’ll get tracking updates soon.</p>
    <div class="paid">Total paid · ${money(total)}</div>
    <div style="max-width:320px;margin:0 auto;display:flex;flex-direction:column;gap:10px">
      <a class="btn btn-primary" href="#/account">View orders</a>
      <a class="btn btn-secondary" href="#/">Continue shopping</a>
    </div>
  </div></div>`;
}

/* ---- Search ---- */
function screenSearch(q=''){
  return `<div class="page view-enter">
    <div class="page-head" style="width:100%">
      <div class="top-search" style="display:flex;flex:1;max-width:none;height:46px" onclick="document.getElementById('searchInput').focus()">
        ${icon('search')}<input id="searchInput" placeholder="Search OShopping" value="${esc(q)}" autocomplete="off">
      </div>
    </div>
    <div id="searchResults">${searchResults(q)}</div>
  </div>`;
}
function searchResults(q){
  q = q.trim().toLowerCase();
  if(!q){
    return `<section class="block"><div class="section-head"><div><h2>Browse categories</h2></div></div>
      <div class="cat-rail" style="flex-wrap:wrap">${CATEGORIES.map(c=>`<a class="chip" href="#/browse/${c.id}">${icon(ICON[c.symbol]||'package')}${c.name}</a>`).join('')}</div>
      </section>
      ${rail('Trending now',null,TRENDING.slice(0,10))}`;
  }
  const res = PRODUCTS.filter(p => (p.name+' '+p.brand+' '+category(p.category).name+' '+p.highlights.join(' ')).toLowerCase().includes(q));
  if(!res.length) return `<div class="empty"><div class="e-ic">${icon('search')}</div><h3>No results for “${esc(q)}”</h3><p>Try another term or browse the categories.</p></div>`;
  currentList = res;
  return `${sortBar(res.length)}${productGrid(res)}`;
}

/* ---- Saved ---- */
function screenSaved(){
  const list = store.saved.map(s=>BY_SKU[s]).filter(Boolean);
  if(!list.length) return `<div class="page view-enter"><div class="page-head"><div class="page-title">Saved</div></div>
    <div class="empty"><div class="e-ic">${icon('heart')}</div><h3>Nothing saved yet</h3><p>Tap the heart on any product to keep it here for later.</p>
    <a class="btn btn-primary btn-auto" href="#/" style="display:inline-flex;padding:0 28px">Explore products</a></div></div>`;
  return `<div class="page view-enter"><div class="page-head"><div><div class="page-title">Saved</div><div class="page-sub">${list.length} item${list.length===1?'':'s'}</div></div></div>
    <div class="pgrid" style="margin-top:8px">${list.map(productCard).join('')}</div></div>`;
}

/* ---- Account ---- */
const ORDERS = [
  { num:'OS-2401-8842', days:2, status:'Out for delivery', sku:PRODUCTS[0].sku, qty:1 },
  { num:'OS-2398-1170', days:9, status:'Delivered', sku:PRODUCTS[5].sku, qty:2 },
];
function screenAccount(){
  const initials = PROFILE.name.split(' ').map(w=>w[0]).slice(0,2).join('');
  return `<div class="page view-enter">
    <div class="page-head"><div class="page-title">Account</div></div>
    <div class="acct-head">
      <div class="a-av">${initials}</div>
      <div><div class="a-name">${esc(PROFILE.name)}</div><div class="a-mail">${esc(PROFILE.email)}</div></div>
    </div>

    <section class="block" style="margin-top:20px">${sectionHead('Your orders')}
      ${ORDERS.map(o=>{const p=BY_SKU[o.sku];const d=new Date(Date.now()-o.days*86400*1000).toLocaleDateString('en-US',{month:'short',day:'numeric'});
        return `<a class="order-card" href="#/product/${o.sku}" style="display:block">
          <div class="o-top"><div><div class="o-num">${o.num}</div><div class="o-date">Ordered ${d}</div></div><span class="o-status">${o.status}</span></div>
          <div class="o-item">${pimg(p)}<div><div style="font-weight:600;font-size:15px">${esc(p.name)}</div><div class="t-secondary" style="font-size:13px">Qty ${o.qty} · ${money(p.price*o.qty)}</div></div></div>
        </a>`;}).join('')}
    </section>

    <div class="acct-list">
      ${[['box','Orders','Track, return, or buy again'],['location','Addresses','Home · San Francisco, CA'],['card','Payment methods','OShopping Pay · •••• 4242'],['return','Returns & refunds','30-day window'],['bell','Notifications','Deals & order updates'],['shield','Privacy & security','Manage your data']]
        .map(([ic,t,d])=>`<button class="acct-item"><div class="ai-ic">${icon(ic)}</div><div><div class="ai-t">${t}</div><div class="ai-d">${d}</div></div><span class="ai-arrow">${icon('chevron-right')}</span></button>`).join('')}
    </div>

    <div class="home-footer"><div class="hf-mark">OShopping</div><div class="hf-sub">v1.0 · Designed for you · Delivered with care</div></div>
  </div>`;
}

function notFound(){
  return `<div class="page view-enter"><div class="empty"><div class="e-ic">${icon('search')}</div><h3>Page not found</h3><p>That page doesn’t exist.</p><a class="btn btn-primary btn-auto" href="#/" style="display:inline-flex;padding:0 28px">Back to home</a></div></div>`;
}

/* ============================================================
   Router
   ============================================================ */
const app = document.getElementById('app');
let confirmationTotal = null;

function router(){
  const hash = location.hash.replace(/^#/,'') || '/';
  const parts = hash.split('/').filter(Boolean); // e.g. ['product','sku']
  let html, tab='';
  window.scrollTo(0,0);

  if(parts.length===0){ html=screenHome(); tab='home'; }
  else switch(parts[0]){
    case 'browse':    html = parts[1]==null ? screenCategories() : screenBrowse(decodeURIComponent(parts[1])); break;
    case 'categories':html = screenCategories(); break;
    case 'product':   html = screenProduct(decodeURIComponent(parts[1]||'')); break;
    case 'seller':    html = screenSeller(decodeURIComponent(parts[1]||'')); break;
    case 'search':    html = screenSearch(decodeURIComponent(parts[1]||'')); tab='search'; break;
    case 'saved':     html = screenSaved(); tab='saved'; break;
    case 'cart':      html = screenCart(); tab='cart'; break;
    case 'checkout':  html = screenCheckout(); break;
    case 'confirmation': html = screenConfirmation(confirmationTotal||0); break;
    case 'account':   html = screenAccount(); tab='account'; break;
    default:          html = notFound();
  }
  app.innerHTML = html;
  setActiveTab(tab);
  mounted(parts[0]||'home');
}

function setActiveTab(tab){
  document.querySelectorAll('.tabbar a').forEach(a=>a.classList.toggle('active', a.dataset.tab===tab));
  document.querySelectorAll('.top-nav a').forEach(a=>a.classList.toggle('active', a.dataset.nav===tab));
}

function mounted(route){
  if(route==='home' || route==='' ) mountSpatialHome();
  if(route==='search'){
    const inp = document.getElementById('searchInput');
    if(inp){ inp.focus(); inp.setSelectionRange(inp.value.length,inp.value.length);
      inp.addEventListener('input', ()=>{ document.getElementById('searchResults').innerHTML = searchResults(inp.value); });
    }
    const hs=document.getElementById('homeSearch');
  }
}

/* ============================================================
   Global interaction (event delegation)
   ============================================================ */
document.addEventListener('click', e => {
  const fav = e.target.closest('[data-fav]');
  if(fav){ e.preventDefault(); toggleSaved(fav.dataset.fav);
    fav.classList.toggle('on', isSaved(fav.dataset.fav)); refreshSavedViews(); return; }

  const add = e.target.closest('[data-add]');
  if(add){ e.preventDefault();
    const sku = add.dataset.add;
    let color = null, qty = 1;
    if(add.dataset.usecolor){ const p=BY_SKU[sku]; color = p.colorways.length ? p.colorways[pdColor].name : null; qty = pdQty; }
    addToCart(sku, color, qty);
    flashAdded(add);
    toast(`${BY_SKU[sku].name}${qty>1?` (×${qty})`:''} added to Cart`, 'View Cart', ()=>location.hash='#/cart');
    return; }

  const pq = e.target.closest('[data-pdqty]');
  if(pq){ pdQty = Math.max(1, Math.min(20, pdQty + (pq.dataset.pdqty==='inc'?1:-1)));
    const n=document.getElementById('pdQtyN'); if(n) n.textContent=pdQty;
    const dec=document.querySelector('.pd-qty [data-pdqty="dec"]'); if(dec) dec.toggleAttribute('disabled', pdQty<=1);
    return; }

  const col = e.target.closest('[data-color]');
  if(col){ e.preventDefault(); selectColor(+col.dataset.color, col.dataset.sku); return; }

  const qty = e.target.closest('[data-qty]');
  if(qty){ const sku=qty.dataset.sku; const it=store.cart.find(i=>i.sku===sku); if(!it) return;
    setQty(sku, qty.dataset.qty==='inc'?it.qty+1:it.qty-1); rerenderCart(); return; }

  const rm = e.target.closest('[data-remove]');
  if(rm){ removeFromCart(rm.dataset.remove); rerenderCart(); return; }

  const selBtn = e.target.closest('[data-select]');
  if(selBtn){ const sku=selBtn.dataset.select;
    if(store.deselected.has(sku)) store.deselected.delete(sku); else store.deselected.add(sku);
    rerenderCart(); return; }

  const selAll = e.target.closest('[data-selectall]');
  if(selAll){ const items=cartItems();
    if(store.deselected.size===0) items.forEach(i=>store.deselected.add(i.sku)); else store.deselected.clear();
    rerenderCart(); return; }

  const promoBtn = e.target.closest('[data-promo]');
  if(promoBtn){ applyPromo(promoBtn.dataset.promo); return; }
  const applyBtn = e.target.closest('#promoApply');
  if(applyBtn){ const v=document.getElementById('promoInput').value; applyPromo(v); return; }
  const rmPromo = e.target.closest('[data-rmpromo]');
  if(rmPromo){ store.promo=null; rerenderCart(); return; }

  const pay = e.target.closest('[data-pay]');
  if(pay){ coPayment = pay.dataset.pay;
    document.querySelectorAll('.pay-opt').forEach(o=>{ const on=o.dataset.pay===coPayment;
      o.classList.toggle('sel',on); o.querySelector('.radio').innerHTML = icon(on?'check-circle':'circle'); });
    return; }

  const heroNav = e.target.closest('[data-hero-nav]');
  if(heroNav){ cycleHero(heroNav.dataset.heroNav==='next' ? 1 : -1); return; }

  const place = e.target.closest('[data-place]');
  if(place){ placeOrder(); return; }

  if(e.target.closest('#topSearch') || e.target.closest('#homeSearch')){ e.preventDefault(); location.hash='#/search'; return; }
});

document.addEventListener('keydown', e => {
  if(e.key==='Enter' && e.target.id==='promoInput'){ applyPromo(e.target.value); }
});

document.addEventListener('change', e => {
  const s = e.target.closest('[data-sort]');
  if(s){
    browseSort = s.value;
    const grid = document.getElementById('browseGrid');
    if(grid) grid.innerHTML = applySort(currentList).map(productCard).join('');
  }
});

/* interaction helpers */
function selectColor(i, sku){
  pdColor = i;
  const p = BY_SKU[sku];
  document.querySelectorAll('.swatch').forEach((s,k)=>s.classList.toggle('sel',k===i));
  document.querySelectorAll('.pd-thumbs button').forEach((s,k)=>s.classList.toggle('sel',k===i));
  const nm = document.getElementById('pdColorName'); if(nm) nm.textContent = p.colorways[i].name;
  // tint the stage subtly via the swatch color on the icon? keep monochrome; just update label.
}
function flashAdded(btn){
  const old = btn.innerHTML;
  btn.innerHTML = `${icon('check')} Added`;
  btn.disabled = true;
  setTimeout(()=>{ btn.innerHTML = old; btn.disabled=false; }, 1400);
}
function applyPromo(raw){
  const code = (raw||'').trim().toUpperCase();
  const inv = document.getElementById('promoInvalid');
  if(!PROMOS[code]){ if(inv){ inv.hidden=false; } return; }
  store.promo = code;
  rerenderCart();
}
function rerenderCart(){ if(location.hash.replace(/^#/,'').startsWith('/cart')) app.innerHTML = screenCart(); syncChrome(); }
function refreshSavedViews(){
  const h = location.hash;
  if(h.includes('/saved')) app.innerHTML = screenSaved();
}
function placeOrder(){
  const total = calc(selectedItems()).total;
  const overlay = document.getElementById('authOverlay');
  document.getElementById('authDetail').textContent = `${coPayment} · ${money(total)}`;
  overlay.classList.add('on');
  setTimeout(()=>{
    overlay.classList.remove('on');
    // remove purchased (selected) items
    const buy = new Set(selectedItems().map(i=>i.sku));
    store.cart = store.cart.filter(i=>!buy.has(i.sku));
    store.deselected.clear(); store.promo=null; persist(); syncChrome();
    confirmationTotal = total;
    location.hash = '#/confirmation';
  }, 1300);
}

/* ============================================================
   Toast
   ============================================================ */
let toastTimer=null;
function toast(msg, actionLabel, action){
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  const btn = document.getElementById('toastAction');
  if(actionLabel){ btn.hidden=false; btn.textContent=actionLabel;
    btn.onclick=()=>{ t.classList.remove('on'); action&&action(); }; }
  else btn.hidden=true;
  t.classList.add('on'); clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('on'), 3400);
}

/* ============================================================
   Chrome sync (badges, nav, theme)
   ============================================================ */
function syncChrome(){
  const cc = cartCount(), sc = store.saved.length;
  setBadge('cartBadge', cc); setBadge('tbCart', cc);
  setBadge('savedBadge', sc); setBadge('tbSaved', sc);
  document.getElementById('avatar').textContent = PROFILE.name.split(' ').map(w=>w[0]).slice(0,2).join('');
}
function setBadge(id, n){
  const el = document.getElementById(id); if(!el) return;
  el.textContent = n; el.hidden = n<=0;
}
function buildTopNav(){
  const items = [['tech','Tech'],['audio','Audio'],['home','Home'],['fashion','Fashion'],['gaming','Gaming']];
  document.getElementById('topNav').innerHTML =
    items.map(([id,n])=>`<a href="#/browse/${id}">${n}</a>`).join('') +
    `<a href="#/browse/deals">Deals</a>`;
}

/* theme */
function initTheme(){
  const saved = localStorage.getItem('oshop.theme');
  if(saved) document.documentElement.dataset.theme = saved;
  updateThemeIcon();
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    const cur = document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
    const next = cur==='dark'?'light':'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('oshop.theme', next);
    updateThemeIcon();
  });
}
function updateThemeIcon(){
  const dark = document.documentElement.dataset.theme==='dark'
    || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme:dark)').matches);
  document.querySelector('#themeToggle .ic use').setAttribute('href', dark?'#i-sun':'#i-moon');
}

const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ============================================================
   Boot
   ============================================================ */
buildTopNav();
initTheme();
syncChrome();
window.addEventListener('hashchange', router);
router();
