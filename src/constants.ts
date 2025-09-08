import { SelectionOption } from './types';

const NONE_OPTION: SelectionOption = {
  id: 'none',
  label: 'None',
  imageUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='4.93' y1='4.93' x2='19.07' y2='19.07'%3E%3C/line%3E%3C/svg%3E`,
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

export const BRIDE_POSES: SelectionOption[] = [
    NONE_OPTION,
    { id: 'bpose1', label: 'Front View', imageUrl: '/images/scen/Front View.png', promptValue: 'standing in a front view portrait' },
    { id: 'bpose13', label: 'Laaj Pose', imageUrl: '/images/scen/Laaj Pose.jpg', promptValue: "in a traditional shy 'laaj' pose, coyly looking down" },
    { id: 'bpose14', label: 'Performing Aukshan', imageUrl: '/images/scen/Performing Aukshan.png', promptValue: "gracefully performing the traditional 'aukshan' ritual for the groom with a decorative platter" },
    { id: 'bpose5', label: 'Looking at Groom', imageUrl: '/images/scen/Looking at Groom-Looking at Bride.jpg', promptValue: 'looking lovingly at the groom' },
    { id: 'bpose6', label: 'Twirling', imageUrl: '/images/scen/Twirling.jpg', promptValue: 'playfully twirling' },
    { id: 'bpose7', label: 'Leaning on Shoulder', imageUrl: '/images/scen/Leaning on Shoulder.jpg', promptValue: "gently leaning her head on the groom's shoulder" },
    { id: 'bpose10', label: 'Forehead Touch', imageUrl: '/images/scen/Forehead Touch.jpg', promptValue: 'gently touching foreheads with the groom in a moment of intimacy' },
    { id: 'bpose11', label: 'Adjusting Tie', imageUrl: '/images/scen/Adjusting Tie.png', promptValue: "lovingly adjusting the groom's tie or kurta collar" },
    { id: 'bpose12', label: 'Walking Together', imageUrl: '/images/scen/Walking Together.png', promptValue: 'walking hand-in-hand with the groom, sharing a smile' },
    { id: 'bpose9', label: 'Sitting Gracefully', imageUrl: '/images/scen/Sitting Gracefully.jpg', promptValue: 'sitting gracefully, looking towards the camera' },
    { id: 'bpose2', label: 'Side View', imageUrl: '/images/scen/Side View.png', promptValue: 'in a side profile view' },
    { id: 'bpose3', label: 'Back View', imageUrl: '/images/scen/Back View.png', promptValue: 'showing the back of her attire' },
    { id: 'bpose4', label: 'Top-down View', imageUrl: '/images/scen/Top-down View.jpg', promptValue: 'seen from a top-down angle' },
];

export const GROOM_POSES: SelectionOption[] = [
    NONE_OPTION,
    { id: 'gpose1', label: 'Front View', imageUrl: '/images/scen/Front View.png', promptValue: 'standing in a front view portrait' },
    { id: 'gpose13', label: 'Offering Gajra', imageUrl: '/images/scen/Offering Gajra.jpg', promptValue: 'lovingly offering a gajra (flower garland) to the bride' },
    { id: 'gpose14', label: 'On Decorated Horse', imageUrl: '/images/scen/On Decorated Horse.png', promptValue: 'majestically sitting on a decorated horse, ready for the baraat (wedding procession)' },
    { id: 'gpose5', label: 'Looking at Bride', imageUrl: '/images/scen/Looking at Groom-Looking at Bride.jpg', promptValue: 'looking lovingly at the bride' },
    { id: 'gpose6', label: 'Lifting Bride', imageUrl: '/images/scen/Lifting Bride.jpg', promptValue: 'lifting the bride joyfully' },
    { id: 'gpose7', label: 'Kneeling with Rose', imageUrl: '/images/scen/Kneeling with Rose.png', promptValue: 'kneeling on one knee, offering a rose to the bride' },
    { id: 'gpose10', label: 'Forehead Touch', imageUrl: '/images/scen/Forehead Touch.jpg', promptValue: 'gently touching foreheads with the bride in a moment of intimacy' },
    { id: 'gpose11', label: 'Helping Hand', imageUrl: '/images/scen/Helping Hand.jpg', promptValue: "gallantly helping the bride down a set of steps" },
    { id: 'gpose12', label: 'Walking Together', imageUrl: '/images/scen/Walking Together.png', promptValue: "walking hand-in-hand with the bride, looking at her lovingly" },
    { id: 'gpose9', label: 'Forehead Kiss', imageUrl: '/images/scen/Forehead Kiss.jpg', promptValue: 'gently kissing the bride on her forehead' },
    { id: 'gpose2', label: 'Side View', imageUrl: '/images/scen/Side View.png', promptValue: 'in a side profile view' },
    { id: 'gpose3', label: 'Back View', imageUrl: '/images/scen/Back View.png', promptValue: 'showing the back of his attire' },
    { id: 'gpose4', label: 'Top-down View', imageUrl: '/images/scen/Top-down View.jpg', promptValue: 'seen from a top-down angle' },
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