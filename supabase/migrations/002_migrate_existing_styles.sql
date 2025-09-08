-- Migrate existing constants to styles table
-- This converts the current app constants into reusable database styles

-- Migrate Bride Attire
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) VALUES
  ('Red Lehenga', 'attire', 'bride', 
   '{"positive": "a stunning, intricately embroidered red lehenga", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "traditional", "wedding"}', 1),
  
  ('Nauvari Saree', 'attire', 'bride',
   '{"positive": "a vibrant, traditional Maharashtrian Nauvari saree", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "marathi", "traditional"}', 2),
  
  ('Paithani Saree', 'attire', 'bride',
   '{"positive": "an exquisite silk Paithani saree with peacock motifs", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "marathi", "silk", "traditional"}', 3),
  
  ('Silk Shalu Saree', 'attire', 'bride',
   '{"positive": "a rich, traditional Maharashtrian silk Shalu wedding saree", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "marathi", "silk", "wedding"}', 4),
  
  ('Pastel Saree', 'attire', 'bride',
   '{"positive": "an elegant pastel-colored silk saree", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "modern", "elegant"}', 5),
  
  ('Royal Anarkali', 'attire', 'bride',
   '{"positive": "a royal, floor-length Anarkali gown", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "royal", "gown"}', 6),
  
  ('Modern Gown', 'attire', 'bride',
   '{"positive": "a flowing, contemporary evening gown", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"modern", "western", "elegant"}', 7);

-- Migrate Groom Attire
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) VALUES
  ('Classic Sherwani', 'attire', 'groom',
   '{"positive": "a classic cream-colored sherwani with a turban", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "traditional", "wedding"}', 1),
  
  ('Dhoti & Pheta', 'attire', 'groom',
   '{"positive": "a traditional Maharashtrian dhoti-kurta with a vibrant Pheta (turban)", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "marathi", "traditional"}', 2),
  
  ('Kurta with Bandi', 'attire', 'groom',
   '{"positive": "an elegant kurta paired with a classic Bandi jacket", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "traditional", "elegant"}', 3),
  
  ('Bandhgala Suit', 'attire', 'groom',
   '{"positive": "a sharp, tailored bandhgala suit", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "formal", "modern"}', 4),
  
  ('Simple Kurta', 'attire', 'groom',
   '{"positive": "a simple and elegant linen kurta pajama", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"indian", "casual", "elegant"}', 5),
  
  ('Modern Tuxedo', 'attire', 'groom',
   '{"positive": "a modern, well-fitted tuxedo", "negative": "low quality, blurry", "params": {"strength": 0.8}}',
   '{"western", "formal", "modern"}', 6);

-- Migrate Hairstyles
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) VALUES
  ('Elegant Updo', 'hairstyle', 'bride',
   '{"positive": "an elegant, intricate updo with some loose strands framing her face", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}',
   '{"elegant", "formal", "wedding"}', 1),
  
  ('Maharashtrian Bun', 'hairstyle', 'bride',
   '{"positive": "a traditional Maharashtrian Ambada bun hairstyle, often adorned with flowers or simple pearls", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}',
   '{"indian", "marathi", "traditional"}', 2),
  
  ('Loose Curls', 'hairstyle', 'bride',
   '{"positive": "long, romantic loose curls cascading down her shoulders", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}',
   '{"romantic", "modern", "elegant"}', 3),
  
  ('Traditional Braid', 'hairstyle', 'bride',
   '{"positive": "a classic, thick traditional Indian braid, adorned with flowers", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}',
   '{"indian", "traditional", "wedding"}', 4),
  
  ('Classic Gelled', 'hairstyle', 'groom',
   '{"positive": "a classic, neat gelled hairstyle", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}',
   '{"formal", "classic", "neat"}', 5),
  
  ('Modern Fade', 'hairstyle', 'groom',
   '{"positive": "a modern fade haircut", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}',
   '{"modern", "trendy", "neat"}', 6);

-- Migrate Jewelry
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) VALUES
  ('Maharashtrian Nath', 'jewelry', 'bride',
   '{"positive": "a traditional gold Maharashtrian nath (nose ring) in a distinctive paisley shape, adorned with small white pearls and green gemstones", "negative": "no jewelry, plain", "params": {"strength": 0.6}}',
   '{"indian", "marathi", "traditional", "gold"}', 1),
  
  ('Kundan Choker', 'jewelry', 'bride',
   '{"positive": "an elaborate Kundan choker necklace with matching earrings", "negative": "no jewelry, plain", "params": {"strength": 0.6}}',
   '{"indian", "kundan", "traditional", "elegant"}', 2),
  
  ('Temple Jewelry Set', 'jewelry', 'bride',
   '{"positive": "a classic South Indian temple jewelry set with a long necklace and jhumkas", "negative": "no jewelry, plain", "params": {"strength": 0.6}}',
   '{"indian", "south-indian", "temple", "traditional"}', 3),
  
  ('Polki Diamond Set', 'jewelry', 'bride',
   '{"positive": "a sparkling Polki diamond necklace with a maang tikka", "negative": "no jewelry, plain", "params": {"strength": 0.6}}',
   '{"indian", "polki", "diamond", "royal"}', 4);

-- Migrate Locations/Backdrops
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) VALUES
  ('Taj Mahal Sunrise', 'backdrop', 'universal',
   '{"positive": "in front of the Taj Mahal at sunrise, golden hour lighting, romantic atmosphere", "negative": "dark, night time, crowded", "params": {"strength": 0.9}}',
   '{"indian", "iconic", "romantic", "heritage"}', 1),
  
  ('Kerala Backwaters', 'backdrop', 'universal',
   '{"positive": "on a traditional houseboat in the serene Kerala backwaters, lush greenery, peaceful water", "negative": "urban, city, buildings", "params": {"strength": 0.9}}',
   '{"indian", "kerala", "nature", "serene"}', 2),
  
  ('Udaipur City Palace', 'backdrop', 'universal',
   '{"positive": "at the majestic Udaipur City Palace overlooking the lake, royal architecture", "negative": "modern buildings, urban", "params": {"strength": 0.9}}',
   '{"indian", "rajasthan", "royal", "palace"}', 3),
  
  ('Goa Beach Sunset', 'backdrop', 'universal',
   '{"positive": "on a beautiful Goa beach during a golden sunset, waves, sand, romantic lighting", "negative": "crowded, urban, dark", "params": {"strength": 0.9}}',
   '{"indian", "beach", "sunset", "romantic"}', 4),
  
  ('Rajasthan Desert', 'backdrop', 'universal',
   '{"positive": "in the Thar Desert of Rajasthan with camels, sand dunes, desert landscape", "negative": "urban, water, greenery", "params": {"strength": 0.9}}',
   '{"indian", "rajasthan", "desert", "traditional"}', 5),
  
  ('Gateway of India', 'backdrop', 'universal',
   '{"positive": "in front of the iconic Gateway of India in Mumbai with the sea in the background", "negative": "rural, village, forest", "params": {"strength": 0.9}}',
   '{"indian", "mumbai", "iconic", "urban"}', 6),
  
  ('Munnar Tea Gardens', 'backdrop', 'universal',
   '{"positive": "amidst the lush, rolling tea gardens of Munnar, Kerala, misty mountains", "negative": "urban, desert, beach", "params": {"strength": 0.9}}',
   '{"indian", "kerala", "nature", "scenic"}', 7),
  
  ('Hawa Mahal Jaipur', 'backdrop', 'universal',
   '{"positive": "in front of the stunning pink architecture of Hawa Mahal in Jaipur", "negative": "modern, glass buildings", "params": {"strength": 0.9}}',
   '{"indian", "rajasthan", "pink-city", "heritage"}', 8);

-- Create composite styles (combining multiple elements)
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) VALUES
  ('Traditional Marathi Wedding', 'composite', 'couple',
   '{"positive": "traditional Marathi wedding attire, nauvari saree and dhoti-pheta, temple backdrop, traditional jewelry", "negative": "modern, western, casual", "params": {"strength": 0.85}}',
   '{"indian", "marathi", "traditional", "wedding"}', 1),
  
  ('Royal Rajasthani Wedding', 'composite', 'couple',
   '{"positive": "royal Rajasthani wedding attire, lehenga and sherwani, palace backdrop, traditional jewelry", "negative": "modern, casual, simple", "params": {"strength": 0.85}}',
   '{"indian", "rajasthani", "royal", "wedding"}', 2),
  
  ('Modern Fusion Wedding', 'composite', 'couple',
   '{"positive": "modern fusion wedding attire, indo-western style, contemporary backdrop", "negative": "fully traditional, old-fashioned", "params": {"strength": 0.85}}',
   '{"indian", "fusion", "modern", "wedding"}', 3),
  
  ('Beach Wedding Paradise', 'composite', 'couple',
   '{"positive": "beach wedding attire, light fabrics, sunset beach backdrop, barefoot on sand", "negative": "formal, heavy clothing, indoor", "params": {"strength": 0.85}}',
   '{"beach", "destination", "romantic", "sunset"}', 4),
  
  ('Traditional South Indian', 'composite', 'couple',
   '{"positive": "traditional South Indian wedding attire, silk saree and veshti, temple backdrop", "negative": "north indian, western, modern", "params": {"strength": 0.85}}',
   '{"indian", "south-indian", "traditional", "temple"}', 5);