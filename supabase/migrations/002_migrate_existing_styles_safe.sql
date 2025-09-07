-- Safe migration of existing constants to styles table
-- Only inserts styles that don't already exist

-- Migrate Bride Attire (only if not exists)
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) 
SELECT * FROM (VALUES
  ('Red Lehenga', 'attire'::style_type, 'bride', 
   '{"positive": "a stunning, intricately embroidered red lehenga", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'traditional', 'wedding'], 1),
  
  ('Nauvari Saree', 'attire'::style_type, 'bride',
   '{"positive": "a vibrant, traditional Maharashtrian Nauvari saree", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'marathi', 'traditional'], 2),
  
  ('Paithani Saree', 'attire'::style_type, 'bride',
   '{"positive": "an exquisite silk Paithani saree with peacock motifs", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'marathi', 'silk', 'traditional'], 3),
  
  ('Silk Shalu Saree', 'attire'::style_type, 'bride',
   '{"positive": "a rich, traditional Maharashtrian silk Shalu wedding saree", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'marathi', 'silk', 'wedding'], 4),
  
  ('Pastel Saree', 'attire'::style_type, 'bride',
   '{"positive": "an elegant pastel-colored silk saree", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'modern', 'elegant'], 5),
  
  ('Royal Anarkali', 'attire'::style_type, 'bride',
   '{"positive": "a royal, floor-length Anarkali gown", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'royal', 'gown'], 6),
  
  ('Modern Gown', 'attire'::style_type, 'bride',
   '{"positive": "a flowing, contemporary evening gown", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['modern', 'western', 'elegant'], 7)
) AS t(name, type, category, prompt_template, cultural_tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM styles WHERE styles.name = t.name AND styles.category = t.category);

-- Migrate Groom Attire
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) 
SELECT * FROM (VALUES
  ('Classic Sherwani', 'attire'::style_type, 'groom',
   '{"positive": "a classic cream-colored sherwani with a turban", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'traditional', 'wedding'], 1),
  
  ('Dhoti & Pheta', 'attire'::style_type, 'groom',
   '{"positive": "a traditional Maharashtrian dhoti-kurta with a vibrant Pheta (turban)", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'marathi', 'traditional'], 2),
  
  ('Kurta with Bandi', 'attire'::style_type, 'groom',
   '{"positive": "an elegant kurta paired with a classic Bandi jacket", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'traditional', 'elegant'], 3),
  
  ('Bandhgala Suit', 'attire'::style_type, 'groom',
   '{"positive": "a sharp, tailored bandhgala suit", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'formal', 'modern'], 4),
  
  ('Simple Kurta', 'attire'::style_type, 'groom',
   '{"positive": "a simple and elegant linen kurta pajama", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['indian', 'casual', 'elegant'], 5),
  
  ('Modern Tuxedo', 'attire'::style_type, 'groom',
   '{"positive": "a modern, well-fitted tuxedo", "negative": "low quality, blurry", "params": {"strength": 0.8}}'::jsonb,
   ARRAY['western', 'formal', 'modern'], 6)
) AS t(name, type, category, prompt_template, cultural_tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM styles WHERE styles.name = t.name AND styles.category = t.category);

-- Migrate Hairstyles
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) 
SELECT * FROM (VALUES
  ('Elegant Updo', 'hairstyle'::style_type, 'bride',
   '{"positive": "an elegant, intricate updo with some loose strands framing her face", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}'::jsonb,
   ARRAY['elegant', 'formal', 'wedding'], 1),
  
  ('Maharashtrian Bun', 'hairstyle'::style_type, 'bride',
   '{"positive": "a traditional Maharashtrian Ambada bun hairstyle, often adorned with flowers or simple pearls", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}'::jsonb,
   ARRAY['indian', 'marathi', 'traditional'], 2),
  
  ('Loose Curls', 'hairstyle'::style_type, 'bride',
   '{"positive": "long, romantic loose curls cascading down her shoulders", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}'::jsonb,
   ARRAY['romantic', 'modern', 'elegant'], 3),
  
  ('Traditional Braid', 'hairstyle'::style_type, 'bride',
   '{"positive": "a classic, thick traditional Indian braid, adorned with flowers", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}'::jsonb,
   ARRAY['indian', 'traditional', 'wedding'], 4),
  
  ('Classic Gelled', 'hairstyle'::style_type, 'groom',
   '{"positive": "a classic, neat gelled hairstyle", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}'::jsonb,
   ARRAY['formal', 'classic', 'neat'], 5),
  
  ('Modern Fade', 'hairstyle'::style_type, 'groom',
   '{"positive": "a modern fade haircut", "negative": "messy hair, unkempt", "params": {"strength": 0.7}}'::jsonb,
   ARRAY['modern', 'trendy', 'neat'], 6)
) AS t(name, type, category, prompt_template, cultural_tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM styles WHERE styles.name = t.name AND styles.category = t.category);

-- Migrate Jewelry
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) 
SELECT * FROM (VALUES
  ('Maharashtrian Nath', 'jewelry'::style_type, 'bride',
   '{"positive": "a traditional gold Maharashtrian nath (nose ring) in a distinctive paisley shape, adorned with small white pearls and green gemstones", "negative": "no jewelry, plain", "params": {"strength": 0.6}}'::jsonb,
   ARRAY['indian', 'marathi', 'traditional', 'gold'], 1),
  
  ('Kundan Choker', 'jewelry'::style_type, 'bride',
   '{"positive": "an elaborate Kundan choker necklace with matching earrings", "negative": "no jewelry, plain", "params": {"strength": 0.6}}'::jsonb,
   ARRAY['indian', 'kundan', 'traditional', 'elegant'], 2),
  
  ('Temple Jewelry Set', 'jewelry'::style_type, 'bride',
   '{"positive": "a classic South Indian temple jewelry set with a long necklace and jhumkas", "negative": "no jewelry, plain", "params": {"strength": 0.6}}'::jsonb,
   ARRAY['indian', 'south-indian', 'temple', 'traditional'], 3),
  
  ('Polki Diamond Set', 'jewelry'::style_type, 'bride',
   '{"positive": "a sparkling Polki diamond necklace with a maang tikka", "negative": "no jewelry, plain", "params": {"strength": 0.6}}'::jsonb,
   ARRAY['indian', 'polki', 'diamond', 'royal'], 4)
) AS t(name, type, category, prompt_template, cultural_tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM styles WHERE styles.name = t.name AND styles.category = t.category);

-- Migrate Locations/Backdrops
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) 
SELECT * FROM (VALUES
  ('Taj Mahal Sunrise', 'backdrop'::style_type, 'universal',
   '{"positive": "in front of the Taj Mahal at sunrise, golden hour lighting, romantic atmosphere", "negative": "dark, night time, crowded", "params": {"strength": 0.9}}'::jsonb,
   ARRAY['indian', 'iconic', 'romantic', 'heritage'], 1),
  
  ('Kerala Backwaters', 'backdrop'::style_type, 'universal',
   '{"positive": "on a traditional houseboat in the serene Kerala backwaters, lush greenery, peaceful water", "negative": "urban, city, buildings", "params": {"strength": 0.9}}'::jsonb,
   ARRAY['indian', 'kerala', 'nature', 'serene'], 2),
  
  ('Udaipur City Palace', 'backdrop'::style_type, 'universal',
   '{"positive": "at the majestic Udaipur City Palace overlooking the lake, royal architecture", "negative": "modern buildings, urban", "params": {"strength": 0.9}}'::jsonb,
   ARRAY['indian', 'rajasthan', 'royal', 'palace'], 3),
  
  ('Goa Beach Sunset', 'backdrop'::style_type, 'universal',
   '{"positive": "on a beautiful Goa beach during a golden sunset, waves, sand, romantic lighting", "negative": "crowded, urban, dark", "params": {"strength": 0.9}}'::jsonb,
   ARRAY['indian', 'beach', 'sunset', 'romantic'], 4),
  
  ('Rajasthan Desert', 'backdrop'::style_type, 'universal',
   '{"positive": "in the Thar Desert of Rajasthan with camels, sand dunes, desert landscape", "negative": "urban, water, greenery", "params": {"strength": 0.9}}'::jsonb,
   ARRAY['indian', 'rajasthan', 'desert', 'traditional'], 5),
  
  ('Gateway of India', 'backdrop'::style_type, 'universal',
   '{"positive": "in front of the iconic Gateway of India in Mumbai with the sea in the background", "negative": "rural, village, forest", "params": {"strength": 0.9}}'::jsonb,
   ARRAY['indian', 'mumbai', 'iconic', 'urban'], 6),
  
  ('Munnar Tea Gardens', 'backdrop'::style_type, 'universal',
   '{"positive": "amidst the lush, rolling tea gardens of Munnar, Kerala, misty mountains", "negative": "urban, desert, beach", "params": {"strength": 0.9}}'::jsonb,
   ARRAY['indian', 'kerala', 'nature', 'scenic'], 7),
  
  ('Hawa Mahal Jaipur', 'backdrop'::style_type, 'universal',
   '{"positive": "in front of the stunning pink architecture of Hawa Mahal in Jaipur", "negative": "modern, glass buildings", "params": {"strength": 0.9}}'::jsonb,
   ARRAY['indian', 'rajasthan', 'pink-city', 'heritage'], 8)
) AS t(name, type, category, prompt_template, cultural_tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM styles WHERE styles.name = t.name AND styles.category = t.category);

-- Create composite styles (combining multiple elements)
INSERT INTO styles (name, type, category, prompt_template, cultural_tags, sort_order) 
SELECT * FROM (VALUES
  ('Traditional Marathi Wedding', 'composite'::style_type, 'couple',
   '{"positive": "traditional Marathi wedding attire, nauvari saree and dhoti-pheta, temple backdrop, traditional jewelry", "negative": "modern, western, casual", "params": {"strength": 0.85}}'::jsonb,
   ARRAY['indian', 'marathi', 'traditional', 'wedding'], 1),
  
  ('Royal Rajasthani Wedding', 'composite'::style_type, 'couple',
   '{"positive": "royal Rajasthani wedding attire, lehenga and sherwani, palace backdrop, traditional jewelry", "negative": "modern, casual, simple", "params": {"strength": 0.85}}'::jsonb,
   ARRAY['indian', 'rajasthani', 'royal', 'wedding'], 2),
  
  ('Modern Fusion Wedding', 'composite'::style_type, 'couple',
   '{"positive": "modern fusion wedding attire, indo-western style, contemporary backdrop", "negative": "fully traditional, old-fashioned", "params": {"strength": 0.85}}'::jsonb,
   ARRAY['indian', 'fusion', 'modern', 'wedding'], 3),
  
  ('Beach Wedding Paradise', 'composite'::style_type, 'couple',
   '{"positive": "beach wedding attire, light fabrics, sunset beach backdrop, barefoot on sand", "negative": "formal, heavy clothing, indoor", "params": {"strength": 0.85}}'::jsonb,
   ARRAY['beach', 'destination', 'romantic', 'sunset'], 4),
  
  ('Traditional South Indian', 'composite'::style_type, 'couple',
   '{"positive": "traditional South Indian wedding attire, silk saree and veshti, temple backdrop", "negative": "north indian, western, modern", "params": {"strength": 0.85}}'::jsonb,
   ARRAY['indian', 'south-indian', 'traditional', 'temple'], 5)
) AS t(name, type, category, prompt_template, cultural_tags, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM styles WHERE styles.name = t.name AND styles.category = t.category);