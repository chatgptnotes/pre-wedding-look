import { SelectionOption } from './types';

const NONE_OPTION: SelectionOption = {
  id: 'none',
  label: 'No Selection',
  imageUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='15' fill='white' stroke='%23e5e7eb' stroke-width='2'/%3E%3Cg transform='translate(50,50)'%3E%3Ccircle cx='0' cy='0' r='25' fill='%23f9fafb' stroke='%23e5e7eb' stroke-width='1'/%3E%3Cpath d='M-8,-8 L8,8 M8,-8 L-8,8' stroke='%23374151' stroke-width='3' stroke-linecap='round'/%3E%3C/g%3E%3Ctext x='50' y='85' text-anchor='middle' fill='%23374151' font-family='Arial, sans-serif' font-size='10' font-weight='bold'%3ENone%3C/text%3E%3C/svg%3E`,
  promptValue: '',
};

export const LOCATIONS: SelectionOption[] = [
  NONE_OPTION,
  { id: 'loc1', label: 'Taj Mahal, Agra', imageUrl: '/images/scen/Taj Mahal, Agra.png', promptValue: 'in front of the Taj Mahal at sunrise' },
  { id: 'loc2', label: 'Kerala Backwaters', imageUrl: '/images/scen/Kerala Backwaters.jpg', promptValue: 'on a traditional houseboat in the serene Kerala backwaters' },
  { id: 'loc3', label: 'Udaipur City Palace', imageUrl: '/images/scen/Udaipur City Palace.jpg', promptValue: 'at the majestic Udaipur City Palace overlooking the lake' },
  { id: 'loc4', label: 'Goa Beach Sunset', imageUrl: '/images/scen/Goa Beach Sunset.jpg', promptValue: 'on a beautiful Goa beach during a golden sunset' },
  { id: 'loc5', label: 'Rajasthan Desert', imageUrl: '/images/scen/Rajasthan Desert.png', promptValue: 'in the Thar Desert of Rajasthan with camels' },
  { id: 'loc6', label: 'Lonavala Hills', imageUrl: '/images/scen/Lonavala Hills.jpg', promptValue: 'amidst the lush green hills of Lonavala during monsoon' },
  { id: 'loc7', label: 'Pune Shaniwar Wada', imageUrl: '/images/scen/Pune Shaniwar Wada.jpg', promptValue: 'at the historic Shaniwar Wada fort in Pune' },
  { id: 'loc8', label: 'Gateway of India', imageUrl: '/images/scen/Gateway of India.png', promptValue: 'in front of the iconic Gateway of India in Mumbai with the sea in the background' },
  { id: 'loc9', label: 'Munnar Tea Gardens', imageUrl: '/images/scen/Munnar Tea Gardens.png', promptValue: 'amidst the lush, rolling tea gardens of Munnar, Kerala' },
  { id: 'loc10', label: 'Hawa Mahal, Jaipur', imageUrl: '/images/scen/Hawa Mahal, Jaipur.jpg', promptValue: 'in front of the stunning pink architecture of Hawa Mahal in Jaipur' },
];

export const BRIDE_ATTIRE: SelectionOption[] = [
  NONE_OPTION,
  { id: 'batt1', label: 'Red Lehenga', imageUrl: '/images/bride/attire/Red-lahenga.jpg', promptValue: 'a stunning, intricately embroidered red lehenga' },
  { id: 'batt5', label: 'Nauvari Saree', imageUrl: '/images/bride/attire/Nauvari Saree.jpg', promptValue: 'a vibrant, traditional Maharashtrian Nauvari saree' },
  { id: 'batt6', label: 'Paithani Saree', imageUrl: '/images/bride/attire/Paithani Saree.jpg', promptValue: 'an exquisite silk Paithani saree with peacock motifs' },
  { id: 'batt7', label: 'Silk Shalu Saree', imageUrl: '/images/bride/attire/Silk Shalu Saree.jpg', promptValue: 'a rich, traditional Maharashtrian silk Shalu wedding saree' },
  { id: 'batt2', label: 'Pastel Saree', imageUrl: '/images/bride/attire/Pastel Saree.jpg', promptValue: 'an elegant pastel-colored silk saree' },
  { id: 'batt3', label: 'Royal Anarkali', imageUrl: '/images/bride/attire/Royal Anarkali.jpg', promptValue: 'a royal, floor-length Anarkali gown' },
  { id: 'batt4', label: 'Modern Gown', imageUrl: '/images/bride/attire/Modern Gown.jpg', promptValue: 'a flowing, contemporary evening gown' },
];

export const HAIRSTYLES: SelectionOption[] = [
  NONE_OPTION,
  { id: 'hair1', label: 'Elegant Updo', imageUrl: '/images/bride/attire/Elegant Updo bride.jpg', promptValue: 'an elegant, intricate updo with some loose strands framing her face' },
  { id: 'hair5', label: 'Maharashtrian Bun', imageUrl: '/images/bride/attire/Maharashtrian Bun.jpg', promptValue: 'a traditional Maharashtrian Ambada bun hairstyle, often adorned with flowers or simple pearls' },
  { id: 'hair2', label: 'Loose Curls', imageUrl: '/images/bride/attire/Loose Curls.jpg', promptValue: 'long, romantic loose curls cascading down her shoulders' },
  { id: 'hair3', label: 'Traditional Braid', imageUrl: '/images/bride/attire/Traditional Braid.jpg', promptValue: 'a classic, thick traditional Indian braid, adorned with flowers' },
  { id: 'hair4', label: 'Sleek Ponytail', imageUrl: '/images/bride/attire/Sleek ponytail.png', promptValue: 'a modern and sleek high ponytail' },
];

export const GROOM_HAIRSTYLES: SelectionOption[] = [
    NONE_OPTION,
    { id: 'ghair1', label: 'Classic Gelled', imageUrl: '/images/grooms/classic gelled.png', promptValue: 'a classic, neat gelled hairstyle' },
    { id: 'ghair2', label: 'Modern Fade', imageUrl: '/images/grooms/Modern Fade.png', promptValue: 'a modern fade haircut' },
    { id: 'ghair3', label: 'Slightly Messy', imageUrl: '/images/grooms/Slightly Messy.jpg', promptValue: 'a stylish, slightly messy look' },
    { id: 'ghair4', label: 'Traditional Turban', imageUrl: '/images/grooms/Traditional Turban.jpg', promptValue: 'a traditional, elegantly wrapped turban that complements his attire' },
];

export const GROOM_ATTIRE: SelectionOption[] = [
  NONE_OPTION,
  { id: 'gatt1', label: 'Classic Sherwani', imageUrl: '/images/grooms/Classic Sherwani.jpg', promptValue: 'a classic cream-colored sherwani with a turban' },
  { id: 'gatt5', label: 'Dhoti & Pheta', imageUrl: '/images/grooms/Dhoti-Pheta.jpg', promptValue: 'a traditional Maharashtrian dhoti-kurta with a vibrant Pheta (turban)' },
  { id: 'gatt6', label: 'Kurta with Bandi', imageUrl: '/images/grooms/Kurta with Bandi.jpg', promptValue: 'an elegant kurta paired with a classic Bandi jacket' },
  { id: 'gatt2', label: 'Bandhgala Suit', imageUrl: '/images/grooms/Bandhgala Suit.jpg', promptValue: 'a sharp, tailored bandhgala suit' },
  { id: 'gatt3', label: 'Simple Kurta', imageUrl: '/images/grooms/SimpleKurta.jpg', promptValue: 'a simple and elegant linen kurta pajama' },
  { id: 'gatt4', label: 'Modern Tuxedo', imageUrl: '/images/grooms/Modern Tuxedo.jpg', promptValue: 'a modern, well-fitted tuxedo' },
];

// Solo poses for individual styling
export const SOLO_BRIDE_POSES: SelectionOption[] = [
    NONE_OPTION,
    { id: 'bpose1', label: 'Regal Sitting Pose', imageUrl: '/images/bride/brideposes/Regal Sitting Pose.png', promptValue: 'sitting regally on an ornate surface with traditional red lehenga, one hand on hip, majestic pose' },
    { id: 'bpose2', label: 'Playful Sunglasses', imageUrl: '/images/bride/brideposes/Playful Sunglasses.png', promptValue: 'sitting with stylish sunglasses, playful and modern bridal attitude with confident smile' },
    { id: 'bpose3', label: 'Laughing with Mehndi', imageUrl: '/images/bride/brideposes/Laughing with Mehndi.png', promptValue: 'laughing joyfully while showing beautiful mehndi designs, hand near face, pure happiness expression' },
    { id: 'bpose4', label: 'Fountain Side Pose', imageUrl: '/images/bride/brideposes/Fountain Side Pose.png', promptValue: 'sitting gracefully by a fountain in elaborate lehenga, looking down shyly, palace background' },
    { id: 'bpose5', label: 'Lehenga Twirl', imageUrl: '/images/bride/brideposes/Lehenga Twirl.png', promptValue: 'mid-twirl with lehenga flowing dramatically, dupatta spread wide, dynamic movement capture' },
    { id: 'bpose6', label: 'Classic Bridal Portrait', imageUrl: '/images/bride/brideposes/Classic Bridal Portrait.png', promptValue: 'traditional bridal portrait with hands placed elegantly, direct gaze at camera, serene expression' },
    { id: 'bpose7', label: 'Side Profile Grace', imageUrl: '/images/bride/brideposes/Side Profile Grace.png', promptValue: 'elegant side profile showing jewelry and dupatta draping, peaceful downward gaze' },
    { id: 'bpose8', label: 'Dupatta Flow', imageUrl: '/images/bride/brideposes/Dupatta Flow.png', promptValue: 'holding dupatta ends creating graceful flow, standing pose with gentle breeze effect' },
    { id: 'bpose9', label: 'Jewelry Showcase', imageUrl: '/images/bride/brideposes/Jewelry Showcase.png', promptValue: 'posed to prominently display heavy traditional jewelry, necklaces and earrings highlighted' },
    { id: 'bpose10', label: 'Palace Steps', imageUrl: '/images/bride/brideposes/Palace Steps.png', promptValue: 'sitting on ornate palace steps, lehenga spread beautifully, architectural backdrop' },
    { id: 'bpose11', label: 'Confident Standing', imageUrl: '/images/bride/brideposes/Confident Standing.png', promptValue: 'standing confidently with one hand on hip, strong posture, empowered bridal look' },
    { id: 'bpose12', label: 'Dreamy Look Away', imageUrl: '/images/bride/brideposes/Dreamy Look Away.png', promptValue: 'looking away dreamily with soft expression, romantic and contemplative mood' },
];

export const SOLO_GROOM_POSES: SelectionOption[] = [
    NONE_OPTION,
    { id: 'gpose1', label: 'Classic Formal Portrait', imageUrl: '/images/grooms/groomposes/Classic Formal Portrait.png', promptValue: 'standing in a classic formal portrait pose with hands at sides or behind back' },
    { id: 'gpose2', label: 'Confident Stance', imageUrl: '/images/grooms/groomposes/Confident Stance.png', promptValue: 'standing confidently with one hand in pocket and looking directly at camera' },
    { id: 'gpose3', label: 'Elegant Side Profile', imageUrl: '/images/grooms/groomposes/Elegant Side Profile.png', promptValue: 'posed in an elegant side profile showing the outline of his attire' },
    { id: 'gpose4', label: 'Hands Clasped', imageUrl: '/images/grooms/groomposes/Hands Clasped.png', promptValue: 'standing with hands clasped in front, formal and dignified pose' },
    { id: 'gpose5', label: 'Leaning Casual', imageUrl: '/images/grooms/groomposes/Leaning Casual.png', promptValue: 'casually leaning against a pillar or wall with arms crossed' },
    { id: 'gpose6', label: 'Walking Stride', imageUrl: '/images/grooms/groomposes/Walking Stride.png', promptValue: 'captured mid-stride while walking, dynamic and natural movement' },
    { id: 'gpose7', label: 'Adjusting Cufflinks', imageUrl: '/images/grooms/groomposes/Adjusting Cufflinks.png', promptValue: 'adjusting cufflinks or straightening tie, showing attention to detail' },
    { id: 'gpose8', label: 'Looking Over Shoulder', imageUrl: '/images/grooms/groomposes/Looking Over Shoulder.png', promptValue: 'looking back over shoulder with a confident expression' },
    { id: 'gpose9', label: 'Seated Elegant', imageUrl: '/images/grooms/groomposes/Seated Elegant.png', promptValue: 'sitting elegantly in a chair with one leg crossed over the other' },
    { id: 'gpose10', label: 'Arms Crossed', imageUrl: '/images/grooms/groomposes/Arms Crossed.png', promptValue: 'standing with arms crossed, showing confidence and strength' },
    { id: 'gpose11', label: 'Hand in Jacket', imageUrl: '/images/grooms/groomposes/Hand in Jacket.png', promptValue: 'classic pose with one hand partially in jacket, sophisticated look' },
    { id: 'gpose12', label: 'Thoughtful Pose', imageUrl: '/images/grooms/groomposes/Thoughtful Pose.png', promptValue: 'in a thoughtful pose with hand near chin or temple' },
];

// Couple poses for Create Scene section
export const BRIDE_POSES: SelectionOption[] = [
    NONE_OPTION,
    { id: 'bpose1', label: 'Front View', imageUrl: '/images/scen/Front View.png', promptValue: 'standing in a front view portrait with the groom' },
    { id: 'bpose13', label: 'Laaj Pose', imageUrl: '/images/scen/Laaj Pose.jpg', promptValue: "in a traditional shy 'laaj' pose, coyly looking down while standing with the groom" },
    { id: 'bpose14', label: 'Performing Aukshan', imageUrl: '/images/scen/Performing Aukshan.png', promptValue: "gracefully performing the traditional 'aukshan' ritual for the groom with a decorative platter" },
    { id: 'bpose5', label: 'Looking at Groom', imageUrl: '/images/scen/Looking at Groom-Looking at Bride.jpg', promptValue: 'looking lovingly at the groom' },
    { id: 'bpose6', label: 'Twirling', imageUrl: '/images/scen/Twirling.jpg', promptValue: 'playfully twirling while the groom watches admiringly' },
    { id: 'bpose7', label: 'Leaning on Shoulder', imageUrl: '/images/scen/Leaning on Shoulder.jpg', promptValue: "gently leaning her head on the groom's shoulder" },
    { id: 'bpose10', label: 'Forehead Touch', imageUrl: '/images/scen/Forehead Touch.jpg', promptValue: 'gently touching foreheads with the groom in a moment of intimacy' },
    { id: 'bpose11', label: 'Adjusting Tie', imageUrl: '/images/scen/Adjusting Tie.png', promptValue: "lovingly adjusting the groom's tie or kurta collar" },
    { id: 'bpose12', label: 'Walking Together', imageUrl: '/images/scen/Walking Together.png', promptValue: 'walking hand-in-hand with the groom, sharing a smile' },
    { id: 'bpose9', label: 'Sitting Gracefully', imageUrl: '/images/scen/Sitting Gracefully.jpg', promptValue: 'sitting gracefully next to the groom, looking towards the camera' },
    { id: 'bpose2', label: 'Side View', imageUrl: '/images/scen/Side View.png', promptValue: 'in a side profile view with the groom' },
    { id: 'bpose3', label: 'Back View', imageUrl: '/images/scen/Back View.png', promptValue: 'showing the back of her attire while standing with the groom' },
    { id: 'bpose4', label: 'Top-down View', imageUrl: '/images/scen/Top-down View.jpg', promptValue: 'seen from a top-down angle with the groom' },
];

export const GROOM_POSES: SelectionOption[] = [
    NONE_OPTION,
    { id: 'gpose1', label: 'Front View', imageUrl: '/images/scen/Front View.png', promptValue: 'standing in a front view portrait with the bride' },
    { id: 'gpose13', label: 'Offering Gajra', imageUrl: '/images/scen/Offering Gajra.jpg', promptValue: 'lovingly offering a gajra (flower garland) to the bride' },
    { id: 'gpose14', label: 'On Decorated Horse', imageUrl: '/images/scen/On Decorated Horse.png', promptValue: 'majestically sitting on a decorated horse, ready for the baraat (wedding procession)' },
    { id: 'gpose5', label: 'Looking at Bride', imageUrl: '/images/scen/Looking at Groom-Looking at Bride.jpg', promptValue: 'looking lovingly at the bride' },
    { id: 'gpose6', label: 'Lifting Bride', imageUrl: '/images/scen/Lifting Bride.jpg', promptValue: 'lifting the bride joyfully' },
    { id: 'gpose7', label: 'Kneeling with Rose', imageUrl: '/images/scen/Kneeling with Rose.png', promptValue: 'kneeling on one knee, offering a rose to the bride' },
    { id: 'gpose10', label: 'Forehead Touch', imageUrl: '/images/scen/Forehead Touch.jpg', promptValue: 'gently touching foreheads with the bride in a moment of intimacy' },
    { id: 'gpose11', label: 'Helping Hand', imageUrl: '/images/scen/Helping Hand.jpg', promptValue: "gallantly helping the bride down a set of steps" },
    { id: 'gpose12', label: 'Walking Together', imageUrl: '/images/scen/Walking Together.png', promptValue: "walking hand-in-hand with the bride, looking at her lovingly" },
    { id: 'gpose9', label: 'Forehead Kiss', imageUrl: '/images/scen/Forehead Kiss.jpg', promptValue: 'gently kissing the bride on her forehead' },
    { id: 'gpose2', label: 'Side View', imageUrl: '/images/scen/Side View.png', promptValue: 'in a side profile view with the bride' },
    { id: 'gpose3', label: 'Back View', imageUrl: '/images/scen/Back View.png', promptValue: 'showing the back of his attire while standing with the bride' },
    { id: 'gpose4', label: 'Top-down View', imageUrl: '/images/scen/Top-down View.jpg', promptValue: 'seen from a top-down angle with the bride' },
];

export const STYLES: SelectionOption[] = [
  { id: 'style1', label: 'Cinematic', imageUrl: '/images/styles/cinematic.jpg', promptValue: 'cinematic, ultra-realistic, dramatic lighting' },
  { id: 'style2', label: 'Dreamy', imageUrl: '/images/styles/dreamy.jpg', promptValue: 'dreamy, soft focus, ethereal, bokeh' },
  { id: 'style3', label: 'Vibrant', imageUrl: '/images/styles/vibrant.jpg', promptValue: 'vibrant colors, high contrast, joyful mood' },
  { id: 'style4', label: 'Vintage', imageUrl: '/images/styles/vintage.jpg', promptValue: 'vintage film look, grainy, muted colors, nostalgic' },
];

export const ASPECT_RATIOS: SelectionOption[] = [
    { id: 'ar1', label: 'Portrait (9:16)', imageUrl: '/images/styles/portrait-ratio.jpg', promptValue: '9:16 portrait aspect ratio' },
    { id: 'ar2', label: 'Square (1:1)', imageUrl: '/images/styles/square-ratio.jpg', promptValue: '1:1 square aspect ratio' },
    { id: 'ar3', label: 'Landscape (16:9)', imageUrl: '/images/styles/landscape-ratio.jpg', promptValue: '16:9 landscape aspect ratio' },
];

export const JEWELRY: SelectionOption[] = [
  NONE_OPTION,
  { id: 'jewel1', label: 'Maharashtrian Nath', imageUrl: '/images/bride/attire/Maharashtrian Nath.jpg', promptValue: 'a traditional gold Maharashtrian nath (nose ring) in a distinctive paisley shape, adorned with small white pearls and green gemstones, as worn by Marathi brides' },
  { id: 'jewel2', label: 'Kundan Choker', imageUrl: '/images/bride/attire/Kundan Choker.jpg', promptValue: 'an elaborate Kundan choker necklace with matching earrings' },
  { id: 'jewel3', label: 'Temple Jewelry Set', imageUrl: '/images/bride/attire/Temple Jewelry Set.jpg', promptValue: 'a classic South Indian temple jewelry set with a long necklace and jhumkas' },
  { id: 'jewel4', label: 'Polki Diamond Set', imageUrl: '/images/bride/attire/Polki Diamond Set.jpg', promptValue: 'a sparkling Polki diamond necklace with a maang tikka' },
  { id: 'jewel5', label: 'Jadau Necklace Set', imageUrl: '/images/bride/attire/Jadau Necklace Set.png', promptValue: 'a royal Jadau necklace set with uncut diamonds and precious stones, in Mughal style' },
  { id: 'jewel6', label: 'Meenakari Earrings', imageUrl: '/images/bride/attire/Meenakari Earrings.png', promptValue: 'vibrant Meenakari enamel work earrings with intricate designs' },
];