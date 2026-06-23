import os
import sqlite3
import requests
import re
import json
import html
import time
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from io import BytesIO

DB_PATH = "d:\\ALTOS\\altos.db"
IMAGE_DIR = "d:\\ALTOS\\public\\images\\products"

os.makedirs(IMAGE_DIR, exist_ok=True)

def get_queries(category, name):
    name_lower = name.lower()
    
    # Agri Care
    if category == "Agri Care":
        if "altocare" in name_lower:
            return ["organic neem pesticide bottle", "organic pesticide bottle"]
        if "altogro" in name_lower:
            return ["organic plant growth booster bottle", "plant growth promoter liquid bottle"]
        return ["silicon agricultural spreader adjuvant bottle", "organic agricultural liquid fertilizer"]
        
    # Capsule
    if category == "Capsule":
        if "ashwagandha" in name_lower:
            return ["ashwagandha capsules bottle", "herbal capsules bottle"]
        if "brahmi" in name_lower:
            return ["brahmi capsules bottle", "herbal capsules bottle"]
        if "curcum" in name_lower:
            return ["curcumin capsules bottle", "turmeric capsules bottle"]
        if "flax" in name_lower:
            return ["flaxseed oil capsules bottle", "omega 3 capsules bottle"]
        if "ganoderma" in name_lower:
            return ["ganoderma capsules bottle", "mushroom capsules bottle"]
        if "ginseng" in name_lower:
            return ["red ginseng capsules bottle", "ginseng capsules bottle"]
        if "hadjod" in name_lower:
            return ["hadjod capsules bottle", "joint capsules bottle"]
        if "shilajit" in name_lower:
            return ["shilajit capsules bottle", "ayurvedic capsules bottle"]
        if "tulsi" in name_lower:
            return ["tulsi capsules bottle", "herbal capsules bottle"]
        if "paindon" in name_lower:
            return ["joint pain relief capsules bottle", "pain relief capsules"]
        if "piles" in name_lower:
            return ["piles capsules bottle", "herbal capsules bottle"]
        if "neem" in name_lower:
            return ["neem capsules bottle", "pure neem capsules"]
        if "noni" in name_lower:
            return ["noni capsules bottle", "noni fruit capsules"]
        return [f"{name_lower} capsules bottle", "herbal supplements capsules bottle", "capsules bottle medicine"]
        
    # Clothing
    if category == "Clothing":
        if "mask" in name_lower:
            return ["cotton face mask reusable", "protective face mask cotton"]
        if "tie" in name_lower:
            return ["silk necktie formal corporate", "mens necktie corporate"]
        if "saree" in name_lower:
            return ["indian traditional corporate saree", "designer formal saree"]
        if "shirt" in name_lower:
            return ["men white cotton formal shirt", "men dress shirt white"]
        return ["casual warm fleece sweatshirt", "hoodie sweatshirt casual"]
        
    # Color Cosmetic
    if category == "Color Cosmetic":
        if "bb cream" in name_lower:
            return ["bb cream tube cosmetic foundation", "bb cream face tube"]
        if "kajal" in name_lower:
            return ["black kajal eyeliner pencil", "kajal eyeliner stick"]
        return ["liquid sindoor red bottle traditional", "sindoor bottle liquid"]
        
    # Deo & Perfume
    if category == "Deo & Perfume":
        if "bloom" in name_lower:
            return ["floral women perfume glass bottle", "luxury perfume spray bottle"]
        if "deodorant" in name_lower:
            return ["men deodorant spray bottle body spray", "deodorant body spray can"]
        return ["luxury eau de parfum bottle spray", "men luxury perfume spray bottle"]
        
    # Face Care
    if category == "Face Care":
        if "scrub" in name_lower:
            return ["apricot face scrub cream tube", "face scrub exfoliating tube"]
        if "pack" in name_lower:
            return ["face pack clay mask jar cream", "face pack mud mask jar"]
        if "wash" in name_lower:
            return ["herbal face wash tube packaging", "face wash tube foaming"]
        return ["vitamin c face serum glass bottle dropper", "face serum dropper bottle"]
        
    # Facial Kit & Bleach
    if category == "Facial Kit & Bleach":
        if "bleach" in name_lower:
            return ["skin bleach cream jar gold facial", "bleach cream jar"]
        return ["facial kit box cosmetic treatment", "facial kit beauty package"]
        
    # Hair Care
    if category == "Hair Care":
        if "serum" in name_lower:
            return ["hair shine serum dropper bottle", "hair serum glass bottle"]
        if "shampoo" in name_lower:
            return ["onion herbal shampoo bottle hair fall", "herbal shampoo bottle"]
        if "oil" in name_lower:
            return ["herbal hair oil bottle amla", "hair oil bottle coconut"]
        return ["hair vitalizer spray bottle", "hair spray bottle tonic"]
        
    # Hand & Body Care
    if category == "Hand & Body Care":
        if "hand wash" in name_lower:
            return ["antiseptic liquid hand wash pump bottle", "liquid hand wash pump bottle"]
        if "soap" in name_lower:
            return ["moisturizing liquid cream soap pump bottle", "liquid hand soap cream"]
        if "talcum" in name_lower:
            return ["cooling talcum powder tin bottle packaging", "talcum powder pack"]
        return ["toiletries travel kit bag", "travel toiletries pouch bag"]
        
    # Herbal Oil & Ointment
    if category == "Herbal Oil & Ointment":
        if "balm" in name_lower:
            return ["herbal pain relief balm small jar", "pain relief balm jar"]
        if "baby oil" in name_lower:
            return ["baby massage oil bottle gentle", "baby oil bottle"]
        if "foot" in name_lower:
            return ["cracked heel repair foot care cream tube", "foot care cream tube"]
        if "paindon oil" in name_lower:
            return ["ayurvedic joint pain relief massage oil bottle", "joint pain massage oil bottle"]
        if "itch" in name_lower:
            return ["itch relief antiseptic cream tube", "antiseptic cream tube itch"]
        return ["pain relief topical ointment cream tube", "ointment tube medical"]
        
    # Home Care
    if category == "Home Care":
        if "agarbatti" in name_lower:
            return ["incense sticks agarbatti pack", "incense sticks box"]
        if "detergent" in name_lower:
            return ["washing powder laundry detergent pack", "laundry detergent powder bag"]
        if "dish" in name_lower:
            return ["dishwashing liquid soap bottle", "dishwash liquid concentrate bottle"]
        if "glass" in name_lower:
            return ["glass window cleaner spray bottle blue", "glass cleaner spray bottle"]
        if "sharbat" in name_lower:
            return ["rose syrup concentrate bottle sharbat", "rose sharbat bottle"]
        if "floor" in name_lower:
            return ["floor cleaner disinfectant liquid bottle", "floor cleaner bottle"]
        return ["toilet cleaner liquid bottle blue", "toilet cleaner liquid bottle"]
        
    # Juice Concentrate
    if category == "Juice Concentrate":
        if "noni" in name_lower:
            return ["organic noni juice bottle health", "noni juice bottle concentrate"]
        if "amla" in name_lower:
            return ["pure organic amla juice bottle", "amla juice bottle"]
        if "sea buckthorn" in name_lower:
            return ["sea buckthorn juice bottle organic", "sea buckthorn juice bottle"]
        return ["herbal wellness juice bottle amla noni", "organic health juice bottle"]
        
    # Lips
    if category == "Lips":
        if "lipbalm" in name_lower:
            return ["strawberry lip balm stick tube", "lip balm stick tube cosmetic"]
        return ["matte lipstick open cosmetic tube", "red lipstick case open"]
        
    # Liquid Extract
    if category == "Liquid Extract":
        if "netar jyoti" in name_lower:
            return ["herbal eye drops small bottle", "eye drops bottle sterile"]
        if "shilajit paste" in name_lower:
            return ["shilajit resin pure black paste small jar", "pure shilajit paste jar"]
        return ["herbal drops liquid dropper bottle tulsi", "liquid extract dropper bottle"]
        
    # Marketing Tool
    if category == "Marketing Tool":
        if "bag" in name_lower:
            return ["green non woven carry shopping bag", "non woven bag shopping"]
        if "notebook" in name_lower:
            return ["spiral notebook diary plain cover", "office notebook diary"]
        return ["business notebook document folder", "printed product brochure catalog"]
        
    # Mens Grooming
    if category == "Mens Grooming":
        return ["men shaving cream foaming lather tube", "shaving cream tube"]
        
    # Moisturizer
    if category == "Moisturizer":
        return ["body lotion moisturizing pump bottle", "body lotion moisturizer bottle"]

    return [f"product {category} {name_lower}"]

def download_and_save_image(p_id, category, name):
    queries = get_queries(category, name)
    # Always append category-wide generic queries as final fallback
    generic_fallbacks = {
        "Capsule": ["herbal capsules bottle", "medicine capsules bottle"],
        "Agri Care": ["organic agricultural spray bottle"],
        "Clothing": ["mens necktie corporate", "cotton face mask"],
        "Color Cosmetic": ["makeup foundation tube", "eyeliner pencil"],
        "Deo & Perfume": ["perfume spray bottle"],
        "Face Care": ["face wash tube", "dropper bottle face serum"],
        "Facial Kit & Bleach": ["facial kit package", "skin cream jar"],
        "Hair Care": ["shampoo bottle", "hair oil bottle"],
        "Hand & Body Care": ["liquid hand wash bottle", "talcum powder pack"],
        "Herbal Oil & Ointment": ["herbal balm jar", "pain relief ointment tube"],
        "Home Care": ["incense sticks pack", "floor cleaner bottle"],
        "Juice Concentrate": ["herbal juice bottle"],
        "Lips": ["lipstick tube", "lip balm stick"],
        "Liquid Extract": ["dropper bottle", "herbal drops bottle"],
        "Marketing Tool": ["notebook diary", "shopping bag"],
        "Mens Grooming": ["shaving cream tube"],
        "Moisturizer": ["body lotion bottle"]
    }
    
    if category in generic_fallbacks:
        queries.extend(generic_fallbacks[category])
        
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    }
    
    filename = f"{p_id}.jpg"
    filepath = os.path.join(IMAGE_DIR, filename)

    for query in queries:
        url = f"https://www.bing.com/images/search?q={requests.utils.quote(query)}"
        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code != 200:
                continue
            
            # Find image URLs
            matches = re.findall(r'class="iusc"[^>]*m="([^"]+)"', r.text)
            for m in matches[:10]: # Check top 10 results
                try:
                    data = json.loads(html.unescape(m))
                    img_url = data.get("murl")
                    if not img_url:
                        continue
                        
                    # Fetch actual image content
                    img_res = requests.get(img_url, headers=headers, timeout=5)
                    if img_res.status_code == 200 and len(img_res.content) > 1000:
                        # Open using PIL to verify it's an image, convert to RGB, and save as JPEG
                        img = Image.open(BytesIO(img_res.content))
                        img = img.convert("RGB")
                        # Resize to standard size (e.g. 500x500) if too large
                        if img.width > 800 or img.height > 800:
                            img.thumbnail((800, 800))
                        img.save(filepath, "JPEG", quality=85)
                        
                        # Verify the saved file exists and is not empty
                        if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
                            return f"/images/products/{filename}"
                except Exception:
                    continue
        except Exception:
            continue
            
    # Ultimate fallback in case search fails completely: draw a simple colored square with PIL
    try:
        img = Image.new("RGB", (300, 300), color=(74, 85, 104))
        img.save(filepath, "JPEG")
        return f"/images/products/{filename}"
    except Exception:
        pass
        
    return None

def process_product(p):
    p_id, category, name = p
    local_path = download_and_save_image(p_id, category, name)
    if local_path:
        print(f"[{p_id}] SUCCESS: {name} -> {local_path}")
        return p_id, local_path
    else:
        print(f"[{p_id}] FAILED: {name}")
        return p_id, None

def main():
    start_time = time.time()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, category, name FROM products")
    products = cursor.fetchall()
    conn.close()
    
    print(f"Loaded {len(products)} products to fetch images for.")
    
    # Process products concurrently
    results = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(process_product, products))
        
    # Update DB sequentially to avoid locks
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    success_count = 0
    for p_id, local_path in results:
        if local_path:
            cursor.execute("UPDATE products SET image_url = ? WHERE id = ?", (local_path, p_id))
            success_count += 1
    conn.commit()
    conn.close()
    
    end_time = time.time()
    print(f"\nDone! Successfully updated {success_count}/{len(products)} products in the database.")
    print(f"Time taken: {end_time - start_time:.2f} seconds.")

if __name__ == "__main__":
    main()
