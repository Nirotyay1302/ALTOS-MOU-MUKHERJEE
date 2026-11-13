const path = require('path');
const dbModule = require('../database');

const productUsages = {
  // Liquid Extract & Drops
  'tulsi power': 'Add 2-3 drops in a glass of lukewarm water, tea, or juice. Take 2-3 times daily, especially in the morning on an empty stomach to enhance immunity and respiratory defense.',
  'tulsi power & haldi kesar': 'Add 2-3 drops to a glass of warm water or milk twice daily. Promotes daily immunity, respiratory wellness, and glowing skin.',
  'shudh shilajit paste': 'Take a pea-sized amount (300-500 mg) using the spoon/spatula provided. Dissolve thoroughly in a glass of warm milk or water. Consume once or twice daily, preferably in the morning or 30 minutes before sleep.',
  'stevia drops': 'Add 1-2 drops directly to tea, coffee, milk, or desserts as a healthy, zero-calorie, diabetic-friendly replacement for sugar.',
  'netar jyoti eye drop': 'Instill 1-2 drops into each eye twice daily (morning and bedtime). Rest with eyes closed for 1 minute to relieve eye strain, redness, and dryness.',
  'jeewan shakti avaleh': 'Adults: 1-2 teaspoonfuls (10-15 gm) twice daily with warm milk. Children: 1/2-1 teaspoonful twice daily. Excellent daily herbal rejuvenator.',

  // Capsules
  'ashwagandha': 'Take 1 capsule twice daily with warm milk or lukewarm water, ideally 30 minutes after meals (morning and night), or as advised by your healthcare practitioner.',
  'aroplex': 'Take 1 capsule twice daily with milk or water after meals to fight chronic fatigue and maintain high daily energy.',
  'abhinol': 'Take 1-2 capsules twice daily 30 minutes before meals with lukewarm water to help regulate healthy blood glucose levels.',
  'brahmi': 'Take 1 capsule twice daily with water or milk after meals to support concentration, memory retention, and mental calmness.',
  'coloston': 'Take 1-2 capsules twice daily with warm water on an empty stomach or before meals to strengthen immune defenses and gut integrity.',
  'curcum': 'Take 1 capsule twice daily after meals with water or warm milk to reduce inflammation, promote joint comfort, and support immunity.',
  'flax oil': 'Take 1 capsule twice daily with meals to support heart health, regulate cholesterol, and improve skin hydration.',
  'ganoderma': 'Take 1 capsule twice daily on an empty stomach with warm water to promote natural detoxification and bolster immune health.',
  'garlicplus': 'Take 1 capsule twice daily after food with water to maintain healthy blood pressure and cholesterol levels.',
  'hadjod': 'Take 1-2 capsules twice daily with warm milk or water after meals to strengthen bones and accelerate fracture recovery.',
  'haldi pure': 'Take 1 capsule twice daily with warm milk or water to purify blood, soothe inflammation, and support healthy skin.',
  'neem': 'Take 1 capsule twice daily before meals with water for internal blood purification and acne-free skin.',
  'noni': 'Take 1-2 capsules twice daily 30 minutes before meals on an empty stomach with a large glass of water.',
  'nutroprash': 'Take 1 capsule daily after breakfast with water or milk for daily micronutrient support and stamina.',
  'nutroton': 'Take 1 capsule daily after breakfast with water or milk for complete daily multivitamin replenishment.',
  'ore piles': 'Take 1-2 capsules twice daily after meals with warm water. Drink plenty of water and fiber-rich fluids throughout the day.',
  'paindon': 'Take 1-2 capsules twice daily after meals with lukewarm water for relief from joint, muscular, and arthritis pain.',
  'rakatchap': 'Take 1 capsule twice daily with water after meals to help support normal cardiovascular function and blood pressure.',
  'red ginseng': 'Take 1 capsule every morning after breakfast with water or juice to revitalize mental and physical endurance.',
  'to breen': 'Take 1 capsule twice daily after meals with milk or water to enhance focus, memory, and cognitive alertness.',
  'ultra k-10': 'Take 1 capsule twice daily with a glass of warm water 30 minutes before lunch and dinner to support healthy fat metabolism.',
  'vig -r': 'Take 1-2 capsules at bedtime with warm milk to rejuvenate male vitality, stamina, and physical endurance.',
  'vigvit': 'Take 1 capsule daily after meals with water to fight fatigue and support active daily wellness.',
  'young look capsule (fairness)': 'Take 1 capsule twice daily after meals with warm water to promote cellular skin repair and radiant glow.',
  'young look capsule (slimming': 'Take 1 capsule twice daily with warm water 30 minutes before meals to support fat metabolism and weight control.',
  'little-b-big': 'Take 1 capsule twice daily with warm water after meals, or as recommended by an Ayurvedic physician.',
  'musli pure': 'Take 1 capsule twice daily with warm milk after meals to boost natural vigor, strength, and stamina.',

  // Juices & Concentrates
  'noni juice': 'Dilute 15-30 ml in a glass of water and drink twice daily on an empty stomach (30 minutes before breakfast and dinner).',
  'ore amla': 'Mix 20-30 ml with an equal amount of water and drink first thing in the morning on an empty stomach.',
  'sea buckthorn juice': 'Dilute 20 ml with 100 ml water. Consume once or twice daily after meals for rich Vitamin C and Omega-7 benefits.',
  'ft-15': 'Mix 15-30 ml in lukewarm water and consume twice daily before meals to detoxify the body and aid digestion.',
  'oregel': 'Take 15-20 ml twice daily before meals with water for digestive balance and metabolic support.',
  'shilajit syrup': 'Take 10-15 ml twice daily after meals with lukewarm water or milk for physical energy and stamina.',

  // Syrups
  'abhiliv': 'Adults: 10 ml (2 teaspoons) twice daily after meals. Children: 5 ml twice daily. Shake well before use.',
  'abhizyme': 'Take 10-15 ml immediately after meals with a small sip of water to relieve gas, bloating, and indigestion.',
  'breen syrup': 'Take 10 ml twice daily after meals with water to support brain activity and memory.',
  'cough syrup': 'Adults: 5-10 ml 3 times a day with warm water. Children: 2.5-5 ml 3 times a day.',
  'heal cough': 'Adults: 5-10 ml 3 times a day with warm water. Children: 2.5-5 ml 3 times a day.',
  'giloy syrup': 'Take 10-20 ml twice daily mixed with equal quantity of lukewarm water to boost immunity and fight recurrent infections.',
  'hridya care': 'Take 10-15 ml twice daily after meals with water to support cardiac muscle strength and healthy circulation.',
  'natural blood purifier': 'Take 10 ml twice daily after meals with water to eliminate toxins and achieve clear, blemish-free skin.',
  'prakruti punch': 'Mix 20-30 ml in a glass of water, consume twice daily for full body revitalization and energy.',
  'sundri jiwan': 'Take 10 ml twice daily with water after meals to support hormonal balance and vitality in women.',
  'tulsi syrup': 'Take 5-10 ml twice daily with warm water to relieve cough, cold, and soothe the throat.',
  'uripure': 'Take 10-15 ml twice daily with plenty of water to support urinary tract wellness and kidney cleansing.',
  'vigvit multi vitamin syrup': 'Take 10 ml once or twice daily after meals for vital energy and nutrient supplementation.',

  // Powders
  'triphala churna': 'Take 1 teaspoonful (3-5 gm) at bedtime with a glass of lukewarm water for gentle colon cleansing and smooth digestion.',
  'ayush kwath': 'Boil 3 gm powder in 150 ml water for 5 minutes. Filter and drink warm like tea once or twice daily. Add jaggery or lemon to taste.',
  'altos oreslim shake': 'Add 30 gm (approx. 2 scoops) to 250 ml of skimmed milk or cold water. Shake vigorously in a shaker bottle and consume as a meal replacement.',
  'vigvit protein': 'Mix 1-2 scoops (25-30 gm) with 200 ml of milk or water. Consume immediately post-workout or with breakfast.',
  'wheatpure': 'Dissolve 1 teaspoon (approx. 3 gm) in a glass of warm water or juice. Drink every morning on an empty stomach.',
  'choco kidz': 'Stir 2 tablespoons into a glass of warm milk once or twice daily for growing children nutrition and cognitive development.',
  'swadisht powder': 'Take 1 teaspoon (3-5 gm) with lukewarm water after heavy meals to soothe stomach discomfort and indigestion.',
  'consoft powder': 'Take 1-2 teaspoons at night with warm water to relieve chronic constipation and ensure smooth bowel evacuation.',
  'energize powder': 'Mix 2 spoons in a glass of water or fruit juice, drink during or after sports/work for instant energy.',
  'nutro dia powder': 'Take 1 teaspoon with warm water 30 minutes before meals twice daily for glucose management.',
  'oregain': 'Mix 2 scoops in 250 ml whole milk twice daily for healthy weight and muscle mass gain.',
  'sanjeevani granules': 'Mix 1 sachet in a cup of warm water or milk, take once daily for full vitality.',

  // Tablets
  'moringa': 'Take 1-2 tablets twice daily after meals with water to replenish vitamins, minerals, and natural antioxidants.',
  'calcium magnesium zinc': 'Take 1 tablet daily after meals with water or milk to strengthen bone density and support healthy teeth.',
  'chelated iron': 'Take 1 tablet daily after meals with water or citrus juice to boost hemoglobin and fight anemia.',
  'glucosamine': 'Take 1 tablet twice daily with meals to support cartilage regeneration, joint lubrication, and flexibility.',
  'mc vital': 'Take 1 tablet daily after breakfast with water for daily vigor and mental freshness.',
  'multi collagen': 'Take 1 tablet twice daily with water to support skin elasticity, nail strength, and joint connective tissues.',
  'orecal calcium': 'Take 1 tablet daily after meals with water or milk to strengthen bone structure.',
  'papita giloy': 'Take 1 tablet twice daily with warm water to maintain healthy platelet count and boost immunity.',
  'shatavari': 'Take 1 tablet twice daily with warm milk after meals to support female vitality and endocrine health.',
  'spirulina': 'Take 1 tablet twice daily with water after meals to boost natural energy and fight nutritional deficiencies.',
  'vitamin c from amla extract': 'Take 1 tablet daily after breakfast or lunch with a glass of water to enhance immune defense and skin radiance.',
  'wheat grass tablets': 'Take 1-2 tablets twice daily before meals with water for systemic detoxification and alkalinity.',

  // Hair Care
  'shampoo': 'Apply to wet hair and scalp. Massage gently for 1-2 minutes to create a rich lather. Rinse thoroughly with cool or lukewarm water. Use 2-3 times weekly.',
  'hair oil': 'Apply generously to the scalp and hair roots. Massage gently with fingertips in circular motions for 5-10 minutes. Leave on overnight or for at least 2 hours before washing.',
  'hair serum': 'Take 2-4 drops on palms, rub together, and distribute evenly through towel-dried or dry hair from mid-lengths to ends. Do not rinse.',
  'hair conditioner': 'After shampooing, apply from mid-lengths to the ends of hair. Leave on for 2-3 minutes, then rinse thoroughly with cool water.',
  'hair vitalizer': 'Spray or apply directly onto clean scalp sections. Gently massage with fingertips. Use daily before bedtime for optimal root stimulation.',

  // Face Care & Treatments
  'scrub': 'Apply a small amount to damp face and neck. Gently massage in upward circular motions for 1-2 minutes, avoiding the eye area. Rinse off with water. Use 1-2 times a week.',
  'face wash': 'Wet face with water. Dispense a coin-sized amount onto palm, work into a lather, and massage gently over face and neck for 30-60 seconds. Rinse thoroughly and pat dry. Use twice daily.',
  'face serum': 'Dispense 3-4 drops directly onto cleansed face and neck every morning and evening. Gently pat into skin until absorbed. Follow with moisturizer and sunscreen.',
  'face pack': 'Apply an even layer over cleansed face and neck, avoiding eyes and lips. Allow to dry for 10-15 minutes. Wash off gently with lukewarm water and pat dry. Use twice weekly.',
  'bleach cream': 'Mix cream with activator powder as directed in package. Apply evenly on clean face, avoiding eyebrows and eyes. Leave for 10-15 minutes, then wipe off with cold water.',
  'facial kit': 'Step 1: Cleanser (massage 2-3 min, wipe). Step 2: Scrub (massage 3-5 min, rinse). Step 3: Massage Cream (massage 10-15 min with upward strokes). Step 4: Face Pack (apply 15 min, rinse). Step 5: Serum (pat into skin). Use once a month for a salon-quality radiant glow.',
  'anti wrinkle': 'Apply gently onto cleansed face and neck at night with upward strokes, concentrating on forehead, crow feet, and smile lines.',
  'pimple treatment': 'Wash face thoroughly, pat dry, and apply a small dot directly onto pimples and affected blemishes twice daily.',
  'anti blemishing': 'Apply a small amount over pigmentation and dark spots twice daily after cleansing.',
  'skin glow cream': 'Apply smoothly across face and neck after morning wash for daylight hydration and glow.',
  'under eye cream': 'Take a rice grain-sized amount on ring finger, gently tap around orbital eye bone and under-eye area before bedtime.',
  'whitening & glow': 'Apply evenly over face and neck twice daily after washing face.',
  'hair removing': 'Apply thick layer over unwanted hair. Leave for 5-7 minutes. Wipe off gently with spatula against hair direction and rinse with water.',
  'antiseptic cream': 'Clean the affected skin, apply a thin layer 2-3 times daily on cuts, scratches, burns, or dry chapped skin.',

  // Herbal Oil & Ointment
  'paindon oil': 'Apply 5-10 ml to the painful joint or muscle area. Massage gently for 5-10 minutes until absorbed. For accelerated relief, apply a warm compress afterwards. Use 2-3 times daily.',
  'altos balm': 'Gently apply a small amount onto temples, forehead, or chest. Inhale the aromatic vapors for fast relief from headache and nasal congestion.',
  'baby oil': 'Pour a few drops onto palms and massage gently all over baby body before or after bath to nourish delicate skin and bones.',
  'foot care': 'Wash feet with warm water and pat dry. Apply cream liberally to cracked heels and rough areas twice daily, especially before going to sleep.',
  'itch care': 'Clean and dry the affected area. Apply a thin layer of cream 2-3 times daily to relieve itching, redness, and irritation.',
  'korvin oil': 'Apply 2-3 drops on chest and throat, or add a few drops to hot steaming water and inhale steam for nasal and chest congestion.',
  'piles ointment': 'Apply locally to affected anal area twice daily and after every bowel movement using the applicator nozzle. Wash hands thoroughly before and after.',
  'paindon ointment': 'Massage gently over affected painful muscles or joints 2-3 times daily.',

  // Personal Care & Soaps & Deos
  'bathing bar': 'Lather generously over wet body during bath or shower, then rinse thoroughly with clean water.',
  'soap': 'Work into rich lather on wet skin, gently massage across body and face, then rinse thoroughly.',
  'body lotion': 'Apply generously all over the body after a bath or shower while skin is slightly damp. Massage gently until completely absorbed.',
  'sunscreen': 'Apply generously and evenly to all exposed skin 15-20 minutes before sun exposure. Reapply every 2-3 hours or after swimming/sweating.',
  'sun block': 'Apply evenly over face, neck, and arms 20 minutes before stepping into direct sunlight.',
  'hand wash': 'Wet hands with clean water, dispense 1-2 pumps, lather vigorously for at least 20 seconds covering palms, fingers, and nails. Rinse thoroughly.',
  'liquid cream soap': 'Apply onto wet hands, lather well, and rinse clean with water.',
  'talcum': 'Dust gently over body after bathing or whenever feeling sweaty to stay cool, fresh, and odor-free.',
  'deodorant': 'Hold can 15 cm away from armpits and body, spray for 2-3 seconds. Use daily after morning shower.',
  'perfume': 'Spray onto pulse points such as wrists, neck, and behind ears for a long-lasting captivating fragrance.',
  'eau de perfume': 'Spray lightly on collarbones, wrists, and clothing from 10-15 cm away.',
  'shaving cream': 'Apply a coin-sized amount to damp brush or hands, work into rich lather over beard area, shave smoothly and rinse with cool water.',
  'lipbalm': 'Glide smoothly across lips as often as needed throughout the day to prevent chapping and keep lips moisturized.',
  'lipstick': 'Apply evenly from the center of upper lip toward the edges, following contour of your mouth. Repeat on lower lip.',
  'kajal': 'Apply smoothly along the waterline of the lower eye and inner rim of upper eyelid for intense, smudge-free definition.',
  'bb cream': 'Dot onto forehead, cheeks, nose, and chin, then blend outward with fingertips or sponge for an even, glowing finish.',
  'sindur': 'Use the precision applicator wand to apply a neat stroke along the hairline parting.',
  'cleansing milk': 'Massage gently over face and neck in circular motions with cotton pad, then wipe away dirt and makeup.',
  'skin toner': 'After cleansing, pour onto cotton pad or palms and gently pat over face and neck. Allow to air dry before applying moisturizer.',
  'rose water': 'Spray or dab with cotton onto clean face to refresh, hydrate, and tone the skin throughout the day.',
  'toothpaste': 'Brush teeth thoroughly twice daily (morning and before bedtime) for 2 minutes using a soft bristle brush. Do not swallow.',

  // Home Care & Food
  'sweet rose sharbat': 'Mix 30-40 ml in a glass of chilled water or milk. Stir well and serve cold as a refreshing herbal cooler.',
  'tea': 'Boil water, add 1 teaspoonful per cup, brew for 2-3 minutes. Add milk and sweetener as preferred, or enjoy as black tea.',
  'dish top': 'Dilute 1 teaspoon (5 ml) in a small bowl of water. Dip sponge or scrubber, clean dishes and cookware, then rinse clean.',
  'detergent': 'Add 1-2 scoops (40-60 gm) to a bucket of water or washing machine drum. Soak clothes for 20 minutes, then wash and rinse.',
  'floor cleaner': 'Add 1 capful (15-20 ml) to half a bucket of water (approx. 4 liters). Mop the floor gently, no need to rinse.',
  'glass cleaner': 'Spray directly onto glass, mirror, or laminated surface. Wipe clean immediately with a dry lint-free cloth or newspaper.',
  'toilet cleaner': 'Squirt liquid nozzle around toilet rim and bowl. Leave for 15-20 minutes, then scrub with brush and flush.',
  'agarbatti': 'Light the coated tip of incense stick, blow out flame after it catches, and place safely in incense holder.',
  'rice bran oil': 'Use for everyday cooking, sauteing, and deep frying. Has a high smoke point and is heart-healthy.',
  'dhania powder': 'Add 1-2 teaspoons during cooking curries, gravies, and vegetables for rich aroma and flavor.',
  'mirch powder': 'Add as desired to give authentic color and spicy warmth to Indian dishes.',
  'garam masala': 'Sprinkle 1/2 teaspoon towards the end of cooking for deep aroma and traditional flavor.',
  'haldi powder': 'Add 1/2 - 1 teaspoon to curries, daals, or warm milk for golden color, flavor, and natural health benefits.',

  // Agri Care
  'altocare': 'Dilute 1.5 - 2 ml per liter of water. Spray evenly over crops, foliage, and root soil during early morning or late afternoon.',
  'altogro': 'Mix 2 ml per liter of water. Spray during vegetative, flowering, and fruiting phases to promote crop yield.',
  'oregon 80': 'Add 5 ml per 15 liters of spray solution (water + pesticide/fertilizer). Mix thoroughly before spraying for maximum coverage and sticking.'
};

const categoryDefaultUsages = {
  'Agri Care': 'Dilute 1.5 - 2 ml per liter of water. Spray evenly over plant foliage and soil during early morning or late afternoon.',
  'Capsule': 'Take 1 capsule twice daily with warm water or milk after meals, or as directed by a healthcare professional.',
  'Clothing': 'Gentle machine wash or hand wash in cold water with mild detergent. Air dry in shade.',
  'Color Cosmetic': 'Apply gently and evenly to clean skin. Suitable for everyday makeup and festive wear.',
  'Deo & Perfume': 'Hold can or bottle 15 cm away and spray onto body, clothes, or pulse points. Use daily for lasting freshness.',
  'Face Care': 'Apply onto clean face and neck in gentle upward circular motions. Use regularly as part of your daily skincare routine.',
  'Facial Kit & Bleach': 'Follow step-by-step instructions from cleanser to serum. Recommended once a month for a salon-quality radiant glow.',
  'Hair Care': 'Apply generously to scalp and hair strands. Massage gently and wash with mild shampoo for healthy, lustrous hair.',
  'Hand & Body Care': 'Apply or lather onto skin with water. Rinse thoroughly or massage gently until absorbed.',
  'Herbal Oil & Ointment': 'Apply 5-10 ml or a thin layer to the affected area. Massage lightly 2-3 times daily for soothing relief.',
  'Home Care': 'Use as directed on label for home hygiene, fabric cleaning, dishwashing, or refreshing aromatherapy.',
  'Juice Concentrate': 'Dilute 15-30 ml in a glass of water. Drink twice daily, preferably on an empty stomach for maximum vitality.',
  'Lips': 'Apply smoothly across clean lips as needed throughout the day for hydration, sun protection, and color.',
  'Liquid Extract': 'Add 2-3 drops to lukewarm water, tea, or milk 2-3 times daily to boost vitality and immune health.',
  'Marketing Tool': 'Official Altos distributor reference, presentation, and sales guide for building your wellness business.',
  'Mens Grooming': 'Apply onto damp skin, work into a rich lather, shave smoothly and rinse with cool water.',
  'Moisturizer': 'Apply generously over face and body after bath or shower. Massage gently until absorbed.',
  'Nail': 'Apply two thin coats onto clean, dry nails. Allow 2-3 minutes between coats to dry completely.',
  'Personal Care': 'Use daily as needed for personal hygiene, freshness, and optimal self-care.',
  'Powder': 'Mix 1 teaspoonful (3-5 gm) in a glass of warm water or milk. Consume as directed once or twice daily.',
  'Skin Treatment': 'Apply a thin layer to the targeted area twice daily after washing and patting dry.',
  'Soap': 'Work into rich lather on wet skin, gently massage across body and face, then rinse thoroughly.',
  'Spices & Oil': 'Use in daily culinary preparations to enhance flavor, aroma, and natural wellness.',
  'Sunscreen': 'Apply evenly to all exposed skin 15-20 minutes before stepping into the sun. Reapply every 2-3 hours.',
  'Syrup': 'Adults: 10 ml (2 teaspoons) twice daily after meals. Children: 5 ml twice daily. Shake bottle well before use.',
  'Tablet': 'Take 1 tablet once or twice daily after meals with a glass of water, or as recommended by a physician.',
  'Tea': 'Brew 1 teaspoonful per cup in boiling water for 2-3 minutes. Enjoy hot with or without milk and sweetener.',
  'Toner': 'Pour onto a cotton pad or palms and gently dab across face and neck after cleansing. Allow to air dry.',
  'Toothpaste': 'Brush teeth thoroughly twice daily for 2 minutes using a soft bristle brush. Do not swallow.',
  'Veterinary': 'Administer with livestock feed or drinking water as advised by a veterinarian.',
  'Vitamins & Minerals': 'Consume 1 gummy or tablet daily after food to replenish vital micronutrients.'
};

async function main() {
  dbModule.initialize();

  // Ensure column exists
  await new Promise((resolve) => {
    dbModule.db.run("ALTER TABLE products ADD COLUMN usage TEXT", [], (err) => {
      // Column might already exist
      resolve();
    });
  });

  const products = await dbModule.all('SELECT id, category, name FROM products');
  console.log(`Loaded ${products.length} products to populate usage guidelines.`);

  const updateSql = 'UPDATE products SET usage = ? WHERE id = ?';
  let updatedCount = 0;

  for (const p of products) {
    const nameLower = p.name.toLowerCase();
    let usage = null;

    // Check specific name matches
    for (const [key, val] of Object.entries(productUsages)) {
      if (nameLower.includes(key)) {
        usage = val;
        break;
      }
    }

    // Fallback to category default
    if (!usage) {
      usage = categoryDefaultUsages[p.category] || 'Use as directed on product packaging or consult an Altos wellness advisor.';
    }

    await dbModule.run(updateSql, [usage, p.id]);
    updatedCount++;
  }

  console.log(`Successfully updated usage instructions for ${updatedCount} products.`);
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
