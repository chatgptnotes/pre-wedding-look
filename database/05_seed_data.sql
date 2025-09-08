-- =====================================================
-- SEED DATA FOR PRE-WEDDING AI STUDIO
-- =====================================================

-- =====================================================
-- 1. SEED STYLES DATA
-- =====================================================

INSERT INTO styles (name, type, category, description, prompt_template, cultural_tags, regional_style, preview_url, thumbnail_url, is_active, sort_order) VALUES

-- Bride Attire Styles
('Red Lehenga', 'attire', 'bride', 'Traditional Indian bridal red lehenga with intricate golden embroidery', 
 '{"positive": "beautiful Indian bride in stunning red lehenga, heavy golden zari work, traditional bridal jewelry, elegant pose", "negative": "western dress, casual clothing, modern outfit", "params": {"strength": 0.8}}', 
 ARRAY['indian', 'traditional', 'wedding'], 'indian', 'https://example.com/red-lehenga.jpg', 'https://example.com/red-lehenga-thumb.jpg', true, 1),

('Nauvari Saree', 'attire', 'bride', 'Traditional 9-yard Maharashtrian saree in bright colors', 
 '{"positive": "Maharashtrian bride in traditional nauvari saree, 9-yard draping style, bright colors, traditional jewelry", "negative": "regular saree, modern dress", "params": {"strength": 0.85}}', 
 ARRAY['maharashtrian', 'traditional'], 'maharashtrian', 'https://example.com/nauvari.jpg', 'https://example.com/nauvari-thumb.jpg', true, 2),

('Paithani Saree', 'attire', 'bride', 'Elegant Maharashtrian Paithani saree with peacock motifs', 
 '{"positive": "bride in exquisite Paithani saree with peacock and lotus motifs, rich silk texture, traditional Maharashtrian style", "negative": "plain saree, modern clothing", "params": {"strength": 0.8}}', 
 ARRAY['maharashtrian', 'silk', 'traditional'], 'maharashtrian', 'https://example.com/paithani.jpg', 'https://example.com/paithani-thumb.jpg', true, 3),

('Silk Shalu Saree', 'attire', 'bride', 'Rich Maharashtrian wedding saree with traditional shalu border', 
 '{"positive": "Maharashtrian bride in traditional silk shalu saree, rich texture, elegant draping, wedding jewelry", "negative": "casual saree, western dress", "params": {"strength": 0.8}}', 
 ARRAY['maharashtrian', 'silk', 'wedding'], 'maharashtrian', 'https://example.com/shalu.jpg', 'https://example.com/shalu-thumb.jpg', true, 4),

('Pastel Saree', 'attire', 'bride', 'Elegant light-colored silk saree for modern brides', 
 '{"positive": "elegant bride in beautiful pastel silk saree, soft colors, modern styling, delicate jewelry", "negative": "bright colors, heavy embroidery", "params": {"strength": 0.7}}', 
 ARRAY['modern', 'elegant', 'silk'], 'modern', 'https://example.com/pastel.jpg', 'https://example.com/pastel-thumb.jpg', true, 5),

('Royal Anarkali', 'attire', 'bride', 'Majestic floor-length Anarkali suit with royal embellishments', 
 '{"positive": "bride in regal Anarkali suit, floor-length, royal embroidery, majestic appearance, heavy dupatta", "negative": "simple dress, casual wear", "params": {"strength": 0.85}}', 
 ARRAY['royal', 'embroidered', 'traditional'], 'north_indian', 'https://example.com/anarkali.jpg', 'https://example.com/anarkali-thumb.jpg', true, 6),

-- Groom Attire Styles
('Classic Sherwani', 'attire', 'groom', 'Traditional cream-colored sherwani with matching turban', 
 '{"positive": "handsome groom in classic cream sherwani, traditional turban, royal appearance, wedding attire", "negative": "western suit, casual clothes", "params": {"strength": 0.8}}', 
 ARRAY['traditional', 'formal', 'indian'], 'north_indian', 'https://example.com/sherwani.jpg', 'https://example.com/sherwani-thumb.jpg', true, 1),

('Dhoti & Pheta', 'attire', 'groom', 'Traditional Maharashtrian groom outfit with dhoti and pheta', 
 '{"positive": "Maharashtrian groom in traditional white dhoti kurta, colorful pheta turban, traditional jewelry", "negative": "western suit, modern clothes", "params": {"strength": 0.85}}', 
 ARRAY['maharashtrian', 'traditional'], 'maharashtrian', 'https://example.com/dhoti-pheta.jpg', 'https://example.com/dhoti-pheta-thumb.jpg', true, 2),

('Kurta with Bandi', 'attire', 'groom', 'Elegant kurta with classic Nehru jacket', 
 '{"positive": "groom in elegant kurta with Nehru jacket bandi, sophisticated look, traditional yet modern", "negative": "western shirt, casual wear", "params": {"strength": 0.75}}', 
 ARRAY['elegant', 'traditional', 'formal'], 'indian', 'https://example.com/kurta-bandi.jpg', 'https://example.com/kurta-bandi-thumb.jpg', true, 3),

('Bandhgala Suit', 'attire', 'groom', 'Sharp, tailored Indian formal suit with royal touch', 
 '{"positive": "groom in sharp bandhgala suit, royal appearance, formal Indian attire, sophisticated styling", "negative": "western suit, casual clothes", "params": {"strength": 0.8}}', 
 ARRAY['formal', 'royal', 'indian'], 'indian', 'https://example.com/bandhgala.jpg', 'https://example.com/bandhgala-thumb.jpg', true, 4);

-- =====================================================
-- 2. SEED COUNTRY MODELS DATA
-- =====================================================

INSERT INTO country_models (country_id, role, name, source_image_url, thumbnail_url, is_active) VALUES

-- India Models
((SELECT id FROM countries WHERE iso_code = 'IN'), 'bride', 'India Bride Model', 
 'https://images.unsplash.com/photo-1594736797933-d0511ba2fe65?w=400&h=600&fit=crop&crop=face', 
 'https://images.unsplash.com/photo-1594736797933-d0511ba2fe65?w=200&h=300&fit=crop&crop=face', true),

((SELECT id FROM countries WHERE iso_code = 'IN'), 'groom', 'India Groom Model', 
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face', 
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop&crop=face', true),

-- US Models
((SELECT id FROM countries WHERE iso_code = 'US'), 'bride', 'USA Bride Model', 
 'https://images.unsplash.com/photo-1494790108755-2616c6a75169?w=400&h=600&fit=crop&crop=face', 
 'https://images.unsplash.com/photo-1494790108755-2616c6a75169?w=200&h=300&fit=crop&crop=face', true),

((SELECT id FROM countries WHERE iso_code = 'US'), 'groom', 'USA Groom Model', 
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face', 
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=300&fit=crop&crop=face', true);

-- =====================================================
-- 3. SEED REGIONAL STYLES DATA
-- =====================================================

INSERT INTO regional_styles (name, region, description, cultural_significance, traditional_colors, typical_fabrics, jewelry_types, hairstyle_features, ritual_elements) VALUES

('Maharashtrian Wedding', 'maharashtrian', 'Traditional Maharashtrian wedding style with rich cultural elements', 
 'Represents the rich cultural heritage of Maharashtra with traditional attire and rituals',
 ARRAY['red', 'yellow', 'green', 'saffron'], 
 ARRAY['paithani silk', 'cotton', 'khadi'],
 ARRAY['nath', 'mangalsutra', 'mundavalya', 'tode'], 
 ARRAY['ambada bun', 'fresh flowers', 'traditional styling'],
 ARRAY['mundavalya ceremony', 'saat phere', 'mangalashtak']),

('Tamil Wedding', 'tamil', 'Traditional Tamil wedding with South Indian cultural elements', 
 'Rich South Indian traditions with emphasis on temple rituals and classical elements',
 ARRAY['red', 'gold', 'maroon', 'orange'], 
 ARRAY['kanjivaram silk', 'pattu silk'],
 ARRAY['temple jewelry', 'long necklace', 'jhumkas', 'maang tikka'], 
 ARRAY['traditional bun', 'jasmine flowers', 'classical styling'],
 ARRAY['mangalya dharanam', 'saptapadi', 'kanyadaan']),

('Punjabi Wedding', 'punjabi', 'Vibrant Punjabi wedding with colorful and festive elements', 
 'Represents the joyous and colorful culture of Punjab with energetic celebrations',
 ARRAY['red', 'pink', 'orange', 'yellow'], 
 ARRAY['silk', 'velvet', 'brocade'],
 ARRAY['heavy jewelry', 'kalire', 'chooda', 'maang tikka'], 
 ARRAY['side parting', 'roses', 'fresh flower styling'],
 ARRAY['anand karaj', 'laavan', 'milni ceremony']);

-- =====================================================
-- 4. SEED STORY TEMPLATES DATA
-- =====================================================

INSERT INTO story_templates (title, category, language, template_text, placeholders, duration_estimate) VALUES

('Classic Love Story', 'romantic', 'en', 
 'Once upon a time, {bride_name} and {groom_name} found each other in the beautiful city of {location}. Their love story began with a simple smile, grew with shared dreams, and blossomed into eternal commitment. Today, as they start their journey together, we witness the magic of true love.',
 '{"bride_name": "Bride Name", "groom_name": "Groom Name", "location": "City Name"}', 60),

('Humorous Wedding Story', 'humorous', 'en',
 'Meet {bride_name} and {groom_name} - she said yes to his proposal, and he said yes to her cooking! They prove that opposites attract: she loves {bride_hobby}, he loves {groom_hobby}. But together, they make the perfect team. Here''s to a lifetime of laughter and love!',
 '{"bride_name": "Bride Name", "groom_name": "Groom Name", "bride_hobby": "Reading", "groom_hobby": "Sports"}', 45),

('Traditional Indian Wedding', 'traditional', 'en',
 'In the sacred traditions of our ancestors, {bride_name} and {groom_name} unite not just as individuals, but as two souls becoming one. Blessed by the elements, witnessed by family, and celebrated with joy, their union represents the eternal bond of marriage in our beautiful culture.',
 '{"bride_name": "Bride Name", "groom_name": "Groom Name"}', 75);

-- =====================================================
-- 5. SEED MAGIC PRESETS DATA
-- =====================================================

INSERT INTO magic_presets (name, description, preset_type, automation_rules, quality_weights) VALUES

('Perfect Indian Wedding', 'Complete automation for traditional Indian wedding photos', 'complete',
 '{"style_selection": "cultural_match", "background_logic": "traditional_venues", "voice_settings": "romantic_traditional"}',
 '{"face_preservation": 0.9, "style_accuracy": 0.8, "background_harmony": 0.7}'),

('Modern Elegance', 'Sophisticated modern wedding styling with contemporary elements', 'complete',
 '{"style_selection": "modern_elegant", "background_logic": "contemporary_venues", "voice_settings": "sophisticated"}',
 '{"face_preservation": 0.85, "style_accuracy": 0.75, "background_harmony": 0.8}'),

('Royal Heritage', 'Majestic royal wedding theme with traditional grandeur', 'complete',
 '{"style_selection": "royal_traditional", "background_logic": "palace_venues", "voice_settings": "majestic"}',
 '{"face_preservation": 0.9, "style_accuracy": 0.9, "background_harmony": 0.85}');

-- =====================================================
-- 6. SEED BRUSH TOOLS DATA
-- =====================================================

INSERT INTO brush_tools (name, tool_type, settings, sort_order) VALUES

('Clothing Transformer', 'clothing', '{"brush_size": [10, 50], "opacity": [0.5, 1.0], "blend_mode": "normal"}', 1),
('Makeup Enhancer', 'makeup', '{"brush_size": [5, 25], "opacity": [0.3, 0.8], "blend_mode": "soft_light"}', 2),
('Hair Styler', 'hair', '{"brush_size": [15, 40], "opacity": [0.6, 1.0], "blend_mode": "normal"}', 3),
('Jewelry Adder', 'jewelry', '{"brush_size": [8, 30], "opacity": [0.8, 1.0], "blend_mode": "normal"}', 4),
('Background Changer', 'background', '{"brush_size": [20, 100], "opacity": [0.7, 1.0], "blend_mode": "normal"}', 5),
('Lighting Effects', 'effects', '{"brush_size": [25, 75], "opacity": [0.4, 0.9], "blend_mode": "overlay"}', 6);

-- =====================================================
-- 7. SEED ACHIEVEMENTS DATA
-- =====================================================

INSERT INTO achievements (name, description, icon_url, category, requirements, reward_type, reward_value, rarity) VALUES

('First Creation', 'Create your first styled image', '/icons/first-creation.svg', 'milestone',
 '{"type": "generation_count", "target_value": 1}', 'credits', '{"amount": 5}', 'common'),

('Style Explorer', 'Try 10 different styles', '/icons/style-explorer.svg', 'creativity',
 '{"type": "unique_styles_used", "target_value": 10}', 'credits', '{"amount": 10}', 'common'),

('Cultural Enthusiast', 'Use 5 different regional styles', '/icons/cultural.svg', 'cultural',
 '{"type": "regional_styles_used", "target_value": 5}', 'feature_unlock', '{"feature": "premium_regions"}', 'rare'),

('Master Creator', 'Generate 100 images', '/icons/master.svg', 'milestone',
 '{"type": "generation_count", "target_value": 100}', 'credits', '{"amount": 50}', 'epic'),

('Voice Storyteller', 'Create your first voice slideshow', '/icons/voice.svg', 'feature',
 '{"type": "voice_slideshow_count", "target_value": 1}', 'credits', '{"amount": 15}', 'rare');

-- =====================================================
-- 8. SEED AI MODELS DATA
-- =====================================================

INSERT INTO ai_models (name, model_type, version, provider, capabilities, performance_metrics, cost_per_operation) VALUES

('StyleGAN Wedding', 'style_transfer', 'v2.1', 'stability_ai', 
 ARRAY['style_transfer', 'clothing_change', 'pose_preservation'], 
 '{"accuracy": 0.85, "speed": "fast", "quality": "high"}', 0.05),

('Face Harmony Pro', 'face_swap', 'v1.3', 'runway_ml', 
 ARRAY['face_preservation', 'expression_matching', 'lighting_adaptation'], 
 '{"accuracy": 0.92, "speed": "medium", "quality": "ultra"}', 0.08),

('Cultural Context AI', 'style_transfer', 'v3.0', 'anthropic', 
 ARRAY['cultural_accuracy', 'regional_styles', 'traditional_elements'], 
 '{"cultural_accuracy": 0.95, "speed": "medium", "quality": "premium"}', 0.12),

('Voice Clone Studio', 'voice_clone', 'v2.0', 'eleven_labs', 
 ARRAY['voice_cloning', 'emotion_control', 'multi_language'], 
 '{"naturalness": 0.88, "similarity": 0.92, "speed": "fast"}', 0.03);

-- =====================================================
-- 9. UPDATE SEQUENCES (for auto-incrementing IDs)
-- =====================================================

-- No need for sequence updates since we're using UUIDs

-- =====================================================
-- 10. CREATE SAMPLE ADMIN USER (Optional)
-- =====================================================

-- Note: This would typically be done after a real user signs up
-- INSERT INTO admin_users (user_id, role_id) 
-- SELECT 'your-user-uuid-here', id FROM admin_roles WHERE name = 'super_admin';

-- =====================================================
-- 11. VERIFY SEED DATA
-- =====================================================

-- You can run these queries to verify the data was inserted correctly:
-- SELECT COUNT(*) as total_countries FROM countries;
-- SELECT COUNT(*) as total_styles FROM styles;
-- SELECT COUNT(*) as total_models FROM country_models;
-- SELECT COUNT(*) as total_regional_styles FROM regional_styles;