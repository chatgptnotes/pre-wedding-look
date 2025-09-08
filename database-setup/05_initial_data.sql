-- INSERT INITIAL DATA
-- ===================================

-- Insert sample countries
INSERT INTO public.countries (iso_code, name, flag_emoji, cultural_styles) VALUES
('IN', 'India', '🇮🇳', '[
  {"name": "Marathi", "region": "Maharashtra", "styles": ["nauvari_saree", "dhoti_pheta"]},
  {"name": "Tamil", "region": "Tamil Nadu", "styles": ["kanjivaram_saree", "veshti_kurta"]},
  {"name": "Punjabi", "region": "Punjab", "styles": ["lehenga_choli", "sherwani"]},
  {"name": "Bengali", "region": "West Bengal", "styles": ["tant_saree", "kurta_dhoti"]}
]'::jsonb),
('US', 'United States', '🇺🇸', '[{"name": "Western", "styles": ["wedding_dress", "tuxedo"]}]'::jsonb),
('FR', 'France', '🇫🇷', '[{"name": "French", "styles": ["haute_couture", "classic_suit"]}]'::jsonb),
('JP', 'Japan', '🇯🇵', '[{"name": "Japanese", "styles": ["kimono", "hakama"]}]'::jsonb),
('GB', 'United Kingdom', '🇬🇧', '[{"name": "British", "styles": ["morning_coat", "wedding_gown"]}]'::jsonb)
ON CONFLICT (iso_code) DO NOTHING;

-- Insert basic styles
INSERT INTO public.styles (name, type, category, prompt_template, description) VALUES
('Classic Red Lehenga', 'attire', 'bride', '{"color": "red", "style": "lehenga", "embroidery": "golden"}', 'Traditional Indian bridal lehenga in red with golden embroidery'),
('Elegant Sherwani', 'attire', 'groom', '{"color": "cream", "style": "sherwani", "accessories": "turban"}', 'Classic cream-colored sherwani with matching turban'),
('Romantic Beach', 'location', 'background', '{"setting": "beach", "time": "sunset", "mood": "romantic"}', 'Beautiful beach setting during golden hour'),
('Palace Courtyard', 'location', 'background', '{"setting": "palace", "architecture": "indian", "mood": "royal"}', 'Majestic Indian palace courtyard with traditional architecture')
ON CONFLICT DO NOTHING;

-- ===================================
-- COMPLETION MESSAGE
-- ===================================
DO $$
BEGIN
  RAISE NOTICE 'Database setup complete! All tables, functions, and policies have been created successfully.';
END $$;
