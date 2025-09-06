# How to Add Images to Your Pre-Wedding Look App

## Quick Start Guide

1. **Download or collect images** for each category according to the specifications in `IMAGE_REQUIREMENTS.md`
2. **Rename the images** to match the exact filenames listed below
3. **Place them in the correct folders** as specified

## Folder Structure and Required Images

```
public/images/
├── locations/
│   ├── taj-mahal.jpg
│   ├── kerala-backwaters.jpg
│   ├── udaipur-palace.jpg
│   ├── goa-beach.jpg
│   ├── rajasthan-desert.jpg
│   ├── lonavala-hills.jpg
│   ├── shaniwar-wada.jpg
│   ├── gateway-india.jpg
│   ├── munnar-tea.jpg
│   └── hawa-mahal.jpg
├── bride/
│   ├── attire/
│   │   ├── red-lehenga.jpg
│   │   ├── nauvari-saree.jpg
│   │   ├── paithani-saree.jpg
│   │   ├── shalu-saree.jpg
│   │   ├── pastel-saree.jpg
│   │   ├── royal-anarkali.jpg
│   │   └── modern-gown.jpg
│   ├── hairstyle/
│   │   ├── elegant-updo.jpg
│   │   ├── maharashtrian-bun.jpg
│   │   ├── loose-curls.jpg
│   │   ├── traditional-braid.jpg
│   │   └── sleek-ponytail.jpg
│   └── jewelry/
│       ├── maharashtrian-nath.jpg
│       ├── kundan-choker.jpg
│       ├── temple-set.jpg
│       ├── polki-diamond.jpg
│       ├── jadau-necklace.jpg
│       └── meenakari-earrings.jpg
├── groom/
│   ├── attire/
│   │   ├── classic-sherwani.jpg
│   │   ├── dhoti-pheta.jpg
│   │   ├── kurta-bandi.jpg
│   │   ├── bandhgala-suit.jpg
│   │   ├── simple-kurta.jpg
│   │   └── modern-tuxedo.jpg
│   └── hairstyle/
│       ├── classic-gelled.jpg
│       ├── modern-fade.jpg
│       ├── slightly-messy.jpg
│       └── traditional-turban.jpg
├── poses/
│   ├── bride/
│   │   ├── front-view.jpg
│   │   ├── laaj-pose.jpg
│   │   ├── aukshan.jpg
│   │   ├── looking-groom.jpg
│   │   ├── twirling.jpg
│   │   ├── leaning-shoulder.jpg
│   │   ├── forehead-touch.jpg
│   │   ├── adjusting-tie.jpg
│   │   ├── walking-together.jpg
│   │   ├── sitting-graceful.jpg
│   │   ├── side-view.jpg
│   │   ├── back-view.jpg
│   │   └── topdown-view.jpg
│   └── groom/
│       ├── front-view.jpg
│       ├── offering-gajra.jpg
│       ├── decorated-horse.jpg
│       ├── looking-bride.jpg
│       ├── lifting-bride.jpg
│       ├── kneeling-rose.jpg
│       ├── forehead-touch.jpg
│       ├── helping-hand.jpg
│       ├── walking-together.jpg
│       ├── forehead-kiss.jpg
│       ├── side-view.jpg
│       ├── back-view.jpg
│       └── topdown-view.jpg
└── styles/
    ├── cinematic.jpg
    ├── dreamy.jpg
    ├── vibrant.jpg
    ├── vintage.jpg
    ├── portrait-ratio.jpg
    ├── square-ratio.jpg
    └── landscape-ratio.jpg
```

## Image Specifications
- **Size**: 300x200 pixels (recommended)
- **Format**: JPG
- **Quality**: High quality, web-optimized
- **File Size**: Keep under 100KB per image for better performance

## Features
- **Automatic Fallbacks**: If an image is missing, the app shows a beautiful colored placeholder
- **Loading States**: Images show loading animations while downloading
- **Error Handling**: Graceful fallback to placeholder if image fails to load

## Tips
1. Start with the most important categories (Bride's Attire, Groom's Attire, Locations)
2. You can add images gradually - the app works with missing images
3. Use high-quality, representative images for better user experience
4. Consider cultural accuracy, especially for traditional Indian wear and locations

The app will automatically use your images once they're placed in the correct folders!