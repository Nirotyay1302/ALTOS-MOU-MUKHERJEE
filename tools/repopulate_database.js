const dbModule = require('../database');

const descriptions = {
  // Agri Care
  'altocare': 'A premium quality organic plant protector and soil conditioner. Altocare improves soil health, stimulates root growth, and enhances crop yield naturally.',
  'altogro': 'An organic plant growth promoter enriched with natural nutrients. It boosts plant metabolism, enhances vegetative growth, and increases flowering and fruiting.',
  'oregon 80': 'A premium non-ionic silicon-based spreader, sticker, and activator. It improves the coverage and penetration of agricultural sprays, ensuring maximum efficacy.',
  
  // Capsule
  'abhinol': 'An ayurvedic formulation designed to support healthy blood sugar levels and promote overall vitality. Helps regulate insulin activity and maintains daily energy.',
  'aroplex': 'A daily multi-vitamin and herbal health supplement to boost immunity, reduce fatigue, and support cognitive and physical performance.',
  'ashwagandha': 'A traditional stress relief capsule containing pure Ashwagandha extract. Helps calm the mind, reduces cortisol levels, and boosts overall stamina.',
  'brahmi': 'Supports brain health, concentration, and cognitive function. Rich in antioxidants that enhance memory retention and reduce mental fatigue.',
  'coloston': 'Formulated with pure bovine colostrum. Rich in immunoglobulins that strengthen body defense, support gut health, and promote cell repair.',
  'curcum': 'Enriched with premium curcumin and piperine extracts. Provides powerful anti-inflammatory benefits for joint comfort, heart health, and anti-aging.',
  'flax oil': 'A rich source of Omega-3, 6, and 9 essential fatty acids. Supports cardiovascular health, regulates cholesterol, and improves skin and joint flexibility.',
  'ganoderma': 'Reishi mushroom capsule that acts as a natural adaptogen. Boosts cellular immunity, detoxifies the liver, and enhances sleep quality and energy levels.',
  'garlicplus': 'Supports cardiovascular health, maintains healthy blood pressure and cholesterol levels, and provides strong antimicrobial and immune support.',
  'hadjod': 'A traditional bone-healing ayurvedic capsule. Promotes calcium absorption, accelerates bone fracture healing, and strengthens joints.',
  'haldi': 'Pure Turmeric extract containing high curcuminoids. Acts as a powerful natural antioxidant, supports joint health, and purifies skin from within.',
  'young look': 'Formulated with natural herbs that promote weight management, boost fat metabolism, and support healthy weight loss.',
  'musli': 'Safed Musli extract known for boosting energy, vigor, and physical endurance. Acts as a natural revitalizer for active individuals.',
  'neem': 'A natural blood purifier and skin detox capsule. Fights acne-causing bacteria, improves skin texture, and enhances overall immunity.',
  'noni': 'Rich in nutrients, phytonutrients, and antioxidants. Helps revitalize body cells, relieves joint pain, and boosts overall energy and immunity.',
  'nutroprash': 'A unique combination of standard herbs in capsule form. Boosts daily immunity, improves digestion, and provides energy throughout the day.',
  'nutroton': 'A complete daily multivitamin and mineral capsule. Fights nutritional deficiencies, boosts energy, and keeps the body active and healthy.',
  'ore piles': 'Provides natural relief from the pain, swelling, and itching associated with piles, hemorrhoids, and fissures.',
  'paindon': 'A fast-acting joint pain relief capsule. Relieves inflammation, improves joint mobility, and helps with arthritis and muscle stiffness.',
  'rakatchap': 'Helps maintain healthy blood pressure levels, regulates cardiovascular system activity, and reduces physical stress.',
  'red ginseng': 'A premium energy booster that improves stamina, reduces fatigue, and enhances physical and mental performance.',
  'to breen': 'A brain health supplement that improves focus, memory, and concentration. Perfect for students and working professionals.',
  'ultra k-10': 'A natural fat burner and metabolic booster. Helps burn stubborn body fat, controls appetite, and supports active fitness goals.',
  'vig -r': 'A premium energy and stamina revitalizer for men. Boosts vigor, reduces fatigue, and promotes general strength and endurance.',
  'vigvit': 'Enriched with essential vitamins, minerals, and antioxidants. Promotes active lifestyle, cellular health, and daily energy.',
  
  // Clothing
  'mask': 'Reusable, washable double-layered cotton face mask. Provides comfortable protection against dust, pollen, and airborne particles.',
  'tie': 'A premium silk-blend corporate necktie. Adds a sharp, professional touch to your formal business attire.',
  'saree': 'An elegant traditional premium saree with rich borders. Crafted from high-quality fabric for special corporate and festive occasions.',
  'shirt': 'A premium cotton formal white shirt. Features breathable fabric, classic collar, and regular fit for everyday corporate look.',
  'sweat': 'A cozy, comfortable sweatshirt made of warm fleece fabric. Perfect for casual wear during cold seasons.',
  
  // Color Cosmetic
  'bb cream': 'A multi-benefit BB cream that moisturizes, protects, and gives a flawless, glowing complexion with light coverage.',
  'kajal': 'A long-lasting, smudge-proof, deep black kajal pencil. Safe for eyes and enriched with natural soothing ingredients.',
  'sindur': 'A traditional water-resistant liquid sindur. Features a precise applicator and vibrant red or maroon color that lasts all day.',
  
  // Deo & Perfume
  'perfume bloom': 'A luxury long-lasting fragrance with sweet floral and warm musky notes. Exudes elegance and charm.',
  'deodorant': 'Provides 24-hour protection against body odor with a fresh, masculine fragrance. Keeps you active and confident.',
  'eau de perfume': 'A premium, long-lasting executive fragrance. Captivates the senses with rich, sophisticated aroma notes.',
  
  // Face Care
  'scrub': 'Gentle face scrub containing natural apricot kernels. Exfoliates dead skin cells, removes blackheads, and reveals glowing skin.',
  'pack': 'A skin-purifying face pack that deeply cleanses pores, absorbs excess oil, and restores skin firmness and natural radiance.',
  'face wash': 'A gentle daily facial cleanser that removes dirt, impurities, and oil while maintaining skin moisture and brightness.',
  'serum': 'A powerful brightening face serum with Vitamin C and Hyaluronic acid. Fades dark spots, evens skin tone, and hydrates deeply.',
  
  // Facial Kit & Bleach
  'bleach': 'Gold bleach cream that gently lightens facial hair to match skin tone, giving an instant bright golden glow.',
  'facial kit': 'A professional-grade multi-step facial kit. Deeply cleanses, exfoliates, massages, and masks skin for a salon-like glow.',
  
  // Hair Care
  'hair serum': 'An advanced hair shine serum that tames frizz, protects hair from styling heat, and adds a brilliant silky texture.',
  'shampoo': 'A nourishing hair shampoo that cleanses the scalp, strengthens roots, reduces hair fall, and adds natural volume.',
  'hair oil': 'A premium hair oil containing natural extracts that prevent hair fall, nourish the scalp, and promote healthy growth.',
  'hair vitalizer': 'An aromatic hair vitalizer spray that stimulates hair follicles, prevents thinning, and promotes hair regrowth.',
  
  // Hand & Body Care
  'hand wash': 'An antiseptic hand wash that kills 99.9% of germs while keeping hands moisturized and pleasantly scented.',
  'liquid cream soap': 'A luxurious, moisturizing liquid hand soap that leaves skin feeling soft, hydrated, and refreshed.',
  'talcum': 'Provides long-lasting sweat protection and freshness. Exudes a cooling sensation with a pleasant fragrance.',
  'travel kit': 'A convenient travel pack containing essential toiletries for hand, face, and body care on the go.',
  
  // Herbal Oil & Ointment
  'balm': 'A fast-acting herbal pain relief balm for headaches, cold, chest congestion, and minor body pain.',
  'baby oil': 'Gentle, nourishing oil formulated for baby massage. Promotes healthy skin and bone development with regular use.',
  'foot care': 'A rich moisturizing cream that heals dry, cracked heels, softens rough skin, and relieves foot fatigue.',
  'paindon oil': 'An effective ayurvedic massage oil for joint pain, backache, arthritis, and muscle stiffness.',
  'itch care': 'Provides instant relief from skin itching, fungal infections, eczema, and heat rashes with soothing herbs.',
  'korvin oil': 'A soothing aromatic oil for relief from nasal congestion, cold symptoms, and sinus headaches.',
  'ointment': 'Soothing topical ointment for pain relief and skin care applications.',
  
  // Home Care
  'agarbatti': 'Premium incense sticks with a rich, natural fragrance. Perfect for daily prayers, meditation, and room freshening.',
  'detergent': 'Powerful detergent wash that removes tough stains from fabric while keeping colors bright and fabric soft.',
  'dish top': 'Concentrated dishwashing liquid that easily cuts through grease and sanitizes dishes and cookware.',
  'glass cleaner': 'Provides a streak-free shine on glass windows, mirrors, car screens, and laminated wood surfaces.',
  'rose sharbat': 'A refreshing, sweet rose syrup concentrate. Perfect for mixing with cold water or milk on warm days.',
  'floor cleaner': 'Disinfectant floor cleaner that kills germs, removes stains, and leaves a fresh long-lasting fragrance.',
  
  // Juice Concentrate
  'ft-15': 'A premium health juice blend of 15 super herbs. Promotes digestion, detoxifies the body, and boosts natural immunity.',
  'noni juice': 'Pure Noni fruit juice concentrate. Revitalizes cells, boosts immune system, and acts as a shopping/energy tonic.',
  'ore amla': 'Pure organic Amla juice concentrate. Extremely rich in Vitamin C, supports digestion, and improves hair and skin health.',
  'oregel': 'A natural wellness juice designed to regulate digestion and support general physiological health.',
  'sea buckthorn': 'Made from organic sea buckthorn berries. Packed with Vitamin C, antioxidants, and rare Omega-7 fatty acids.',
  'shilajit syrup': 'An organic syrup containing purified shilajit. Boosts physical strength, stamina, and overall vitality.',
  
  // Lips
  'lipbalm': 'Moisturizes and protects lips from chapping and dryness with SPF protection and fruit flavor.',
  'lipstick': 'Vibrant, long-lasting matte lipstick. Enriched with natural oils that keep lips moisturized all day.',
  
  // Liquid Extract
  'jeewan shakti': 'A premium quality ayurvedic chyawanprash paste. Boosts daily energy, respiratory health, and body defense.',
  'netar jyoti': 'Soothing herbal eye drops that relieve eye strain, redness, dry eyes, and protect eyes from dust and glare.',
  'shilajit paste': 'Pure purified Himalayan Shilajit resin. Boosts strength, cellular energy, stamina, and testosterone levels.',
  'stevia': 'Zero-calorie, natural herbal sweetener drops extracted from Stevia leaves. Safe for diabetic individuals.',
  'tulsi power': 'A highly concentrated liquid extract of 5 types of pure tulsi. Boosts immunity and fights cold, cough, and fever.',
  
  // Marketing Tool
  'book': 'A comprehensive distributor notebook and business presentation book for Altos direct sellers.',
  'booklet': 'A pocket guide detailing product specs, prices, business plans, and distributor rules.',
  'bag': 'An eco-friendly, durable non-woven carry bag for delivering products to customers.',
  'notebook': 'A premium diary notebook for recording orders, sales, and contact details.',
  'brochure': 'A color-printed product catalog flyer highlighting key products, benefits, and MRP values.',
  
  // Mens Grooming
  'shaving cream': 'Provides a rich, creamy lather for a close and comfortable shaving experience. Soothes and moisturizes skin.',
  
  // Moisturizer
  'body lotion': 'A deeply hydrating body lotion containing honey and saffron. Restores skin moisture, fades dry lines, and brightens skin.'
};

const imgPools = {
  'Agri Care': ['img_p1_2.png'],
  'Capsule': [
    'img_p1_20.png', 'img_p1_22.png', 'img_p1_24.png', 'img_p1_26.png', 'img_p1_28.png',
    'img_p1_30.png', 'img_p1_32.png', 'img_p1_34.png', 'img_p1_36.png', 'img_p1_38.png',
    'img_p1_40.png', 'img_p1_42.png', 'img_p1_44.png', 'img_p1_46.png', 'img_p1_48.png',
    'img_p1_50.png', 'img_p1_52.png', 'img_p1_54.png', 'img_p1_56.png', 'img_p1_58.png',
    'img_p1_60.png', 'img_p1_62.png', 'img_p1_64.png'
  ],
  'Clothing': ['img_p1_7.jpg'],
  'Color Cosmetic': ['img_p1_103.jpg'],
  'Deo & Perfume': ['img_p6_2.png', 'img_p6_6.png', 'img_p6_10.png', 'img_p6_14.png', 'img_p6_18.png'],
  'Face Care': [
    'img_p1_12.png', 'img_p1_46.png', 'img_p1_54.png', 'img_p1_58.png', 'img_p1_60.png'
  ],
  'Facial Kit & Bleach': ['img_p1_14.png', 'img_p1_62.png', 'img_p1_64.png'],
  'Hair Care': [
    'img_p6_22.png', 'img_p6_26.png', 'img_p6_30.png', 'img_p6_34.png', 'img_p6_38.png',
    'img_p6_42.png', 'img_p6_44.png', 'img_p6_48.png', 'img_p6_54.png', 'img_p6_58.png',
    'img_p6_60.png', 'img_p6_62.png', 'img_p6_68.png', 'img_p6_72.png'
  ],
  'Hand & Body Care': ['img_p6_76.png', 'img_p6_86.png', 'img_p6_90.png', 'img_p6_94.png'],
  'Herbal Oil & Ointment': ['img_p6_100.png', 'img_p6_106.png', 'img_p6_113.png', 'img_p6_117.png', 'img_p6_122.png', 'img_p6_124.png', 'img_p6_128.png', 'img_p6_132.png', 'img_p6_138.png'],
  'Home Care': ['img_p6_26.png', 'img_p6_54.png', 'img_p6_58.png', 'img_p6_62.png'],
  'Juice Concentrate': ['img_p6_30.png', 'img_p6_68.png', 'img_p6_72.png', 'img_p6_86.png'],
  'Lips': ['img_p6_54.png', 'img_p6_90.png', 'img_p6_94.png', 'img_p6_100.png', 'img_p6_106.png'],
  'Liquid Extract': ['img_p6_58.png', 'img_p6_113.png', 'img_p6_117.png', 'img_p6_122.png'],
  'Marketing Tool': ['img_p6_72.png', 'img_p6_124.png', 'img_p6_132.png'],
  'Mens Grooming': ['img_p8_3.png'],
  'Moisturizer': ['img_p8_4.png']
};

async function main() {
  dbModule.initialize();
  // Fetch products sorted by category and name to perform sequential mapping
  const products = await dbModule.all('SELECT id, category, name FROM products ORDER BY category, name');
  console.log(`Loaded ${products.length} products to repopulate details.`);
  
  const updateSql = 'UPDATE products SET description = ?, image_url = ?, price = mrp, bv = 0, pv = 0 WHERE id = ?';
  let updated = 0;
  
  // Track index inside each category for sequential image mapping
  const catIndices = {};

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const cat = p.category;
    
    if (catIndices[cat] === undefined) {
      catIndices[cat] = 0;
    }
    
    const nameLower = p.name.toLowerCase();
    
    let desc = 'A premium quality Altos wellness product that is pure, natural, and highly effective for daily health and personal care.';
    for (const [key, value] of Object.entries(descriptions)) {
      if (nameLower.includes(key)) {
        desc = value;
        break;
      }
    }
    
    if (desc.startsWith('A premium quality Altos')) {
      if (p.category === 'Capsule') {
        desc = `Premium ayurvedic herbal Capsule for daily wellness. Enriched with natural herbs to boost energy and support physiological balance.`;
      } else if (p.category === 'Face Care') {
        desc = `Organic facial care product designed to deep cleanse, hydrate, and nourish your skin for a natural, vibrant glow.`;
      } else if (p.category === 'Hair Care') {
        desc = `Nourishing hair care formula containing organic extracts that strengthen roots, reduce thinning, and promote silky shine.`;
      } else if (p.category === 'Juice Concentrate') {
        desc = `Pure herbal juice concentrate containing powerful antioxidants to boost immune function and support digestive health.`;
      }
    }
    
    const pool = imgPools[cat] || ['img_p1_2.png'];
    const imgFile = pool[catIndices[cat] % pool.length];
    let imageUrl = `/images/${imgFile}`;
    if (p.id === '25018') {
      imageUrl = '/images/products/25018.jpg';
    } else if (p.id === '25025') {
      imageUrl = '/images/products/25025.jpg';
    }
    
    catIndices[cat]++;
    
    await dbModule.run(updateSql, [desc, imageUrl, p.id]);
    updated++;
  }
  
  console.log(`Successfully repopulated ${updated} products in database with price = mrp, bv = 0, pv = 0, and sequential images.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
