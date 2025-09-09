#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment setup
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users data
const TEST_USERS = [
  {
    email: 'test1@prewedding.app',
    password: 'TestPass123!',
    metadata: {
      full_name: 'Alice Johnson',
      avatar_url: 'https://picsum.photos/seed/alice/200',
      test_user: true
    }
  },
  {
    email: 'test2@prewedding.app', 
    password: 'TestPass123!',
    metadata: {
      full_name: 'Bob Smith',
      avatar_url: 'https://picsum.photos/seed/bob/200',
      test_user: true
    }
  },
  {
    email: 'admin@prewedding.app',
    password: 'AdminPass123!',
    metadata: {
      full_name: 'Admin User',
      avatar_url: 'https://picsum.photos/seed/admin/200',
      test_user: true,
      role: 'admin'
    }
  }
];

// Test blind date game rooms
const TEST_ROOMS = [
  {
    room_code: 'TEST01',
    max_players: 2,
    rounds_per_game: 3,
    is_active: true,
    created_by_name: 'Alice Johnson'
  },
  {
    room_code: 'TEST02', 
    max_players: 4,
    rounds_per_game: 3,
    is_active: true,
    created_by_name: 'Bob Smith'
  },
  {
    room_code: 'DEMO99',
    max_players: 2,
    rounds_per_game: 1,
    is_active: true,
    created_by_name: 'Demo Room'
  }
];

// Test style options for different cultural backgrounds
const TEST_STYLES = [
  // Maharashtrian styles
  {
    category: 'attire',
    subcategory: 'bride',
    name: 'Traditional Nauvari Saree',
    description: 'Elegant 9-yard Maharashtrian saree',
    image_url: 'https://picsum.photos/seed/nauvari/300',
    cultural_style: 'marathi',
    gender: 'female',
    is_active: true
  },
  {
    category: 'attire', 
    subcategory: 'groom',
    name: 'Dhoti Pheta Set',
    description: 'Traditional Maharashtrian groom attire',
    image_url: 'https://picsum.photos/seed/dhoti/300',
    cultural_style: 'marathi',
    gender: 'male',
    is_active: true
  },
  
  // South Indian styles
  {
    category: 'attire',
    subcategory: 'bride', 
    name: 'Kanjivaram Silk Saree',
    description: 'Rich South Indian silk saree',
    image_url: 'https://picsum.photos/seed/kanjivaram/300',
    cultural_style: 'tamil',
    gender: 'female',
    is_active: true
  },
  {
    category: 'attire',
    subcategory: 'groom',
    name: 'Veshti Kurta',
    description: 'Traditional South Indian groom wear',
    image_url: 'https://picsum.photos/seed/veshti/300', 
    cultural_style: 'tamil',
    gender: 'male',
    is_active: true
  },

  // Locations
  {
    category: 'location',
    subcategory: 'outdoor',
    name: 'Taj Mahal Gardens',
    description: 'Romantic Agra monument backdrop',
    image_url: 'https://picsum.photos/seed/tajmahal/300',
    is_active: true
  },
  {
    category: 'location',
    subcategory: 'indoor',
    name: 'Palace Ballroom',
    description: 'Elegant royal palace interior',
    image_url: 'https://picsum.photos/seed/palace/300',
    is_active: true
  }
];

// Test promo codes
const TEST_PROMO_CODES = [
  {
    code: 'TEST50',
    credits: 50,
    max_uses: 100,
    description: 'Test promo code - 50 credits',
    valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  },
  {
    code: 'WELCOME25',
    credits: 25,
    max_uses: null, // unlimited
    description: 'Welcome bonus for new users',
    valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
  },
  {
    code: 'E2ETEST',
    credits: 100,
    max_uses: 10,
    description: 'E2E testing promo code',
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
];

/**
 * Clean existing test data
 */
async function cleanTestData() {
  console.log('🧹 Cleaning existing test data...');

  try {
    // Delete test users (cascades to related data)
    const { data: testUsers, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.warn('⚠️ Could not fetch users for cleanup:', fetchError.message);
    } else if (testUsers?.users) {
      for (const user of testUsers.users) {
        if (user.email?.includes('@prewedding.app')) {
          await supabase.auth.admin.deleteUser(user.id);
        }
      }
    }

    // Clean specific tables
    const tables = [
      'blinddate_game_rounds',
      'blinddate_game_participants', 
      'blinddate_rooms',
      'promo_code_redemptions',
      'credit_transactions',
      'user_credit_wallets'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error && !error.message.includes('does not exist')) {
        console.warn(`⚠️ Error cleaning ${table}:`, error.message);
      }
    }

    // Clean test promo codes
    await supabase
      .from('promo_codes')
      .delete()
      .in('code', TEST_PROMO_CODES.map(p => p.code));

    console.log('✅ Test data cleaned');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

/**
 * Create test users
 */
async function createTestUsers() {
  console.log('👥 Creating test users...');

  const createdUsers = [];

  for (const userData of TEST_USERS) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: userData.metadata
      });

      if (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
        continue;
      }

      if (data.user) {
        console.log(`✅ Created user: ${userData.email}`);
        createdUsers.push({ ...userData, id: data.user.id });

        // Create credit wallet with some initial credits
        const initialCredits = userData.email.includes('admin') ? 1000 : 100;
        
        await supabase
          .from('user_credit_wallets')
          .insert({
            user_id: data.user.id,
            balance: initialCredits,
            lifetime_earned: initialCredits
          });

        // Add initial credits transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: data.user.id,
            transaction_type: 'bonus',
            amount: initialCredits,
            balance_after: initialCredits,
            description: 'Initial test credits'
          });
      }
    } catch (error) {
      console.error(`❌ Unexpected error creating user ${userData.email}:`, error);
    }
  }

  return createdUsers;
}

/**
 * Create test rooms and game data
 */
async function createTestRooms(users: any[]) {
  console.log('🎮 Creating test game rooms...');

  for (const roomData of TEST_ROOMS) {
    try {
      // Find a creator user
      const creator = users.find(u => 
        u.metadata.full_name === roomData.created_by_name || 
        u.email.includes('test1')
      );

      if (!creator) {
        console.warn(`⚠️ No creator found for room ${roomData.room_code}`);
        continue;
      }

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('blinddate_rooms')
        .insert({
          ...roomData,
          created_by: creator.id,
          created_by_name: creator.metadata.full_name
        })
        .select()
        .single();

      if (roomError) {
        console.error(`❌ Error creating room ${roomData.room_code}:`, roomError.message);
        continue;
      }

      console.log(`✅ Created room: ${roomData.room_code}`);

      // Add some participants
      const participants = users.slice(0, Math.min(roomData.max_players, users.length));
      
      for (const participant of participants) {
        await supabase
          .from('blinddate_game_participants')
          .insert({
            room_id: room.id,
            user_id: participant.id,
            user_name: participant.metadata.full_name,
            status: 'ready'
          });
      }

      console.log(`✅ Added ${participants.length} participants to room ${roomData.room_code}`);
    } catch (error) {
      console.error(`❌ Unexpected error creating room ${roomData.room_code}:`, error);
    }
  }
}

/**
 * Create test style options
 */
async function createTestStyles() {
  console.log('👗 Creating test style options...');

  // First, clean existing test styles
  await supabase
    .from('style_options')
    .delete()
    .in('name', TEST_STYLES.map(s => s.name));

  for (const style of TEST_STYLES) {
    try {
      const { error } = await supabase
        .from('style_options')
        .insert(style);

      if (error) {
        console.error(`❌ Error creating style ${style.name}:`, error.message);
      } else {
        console.log(`✅ Created style: ${style.name}`);
      }
    } catch (error) {
      console.error(`❌ Unexpected error creating style ${style.name}:`, error);
    }
  }
}

/**
 * Create test promo codes
 */
async function createTestPromoCodes() {
  console.log('🎁 Creating test promo codes...');

  for (const promo of TEST_PROMO_CODES) {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert(promo);

      if (error) {
        console.error(`❌ Error creating promo code ${promo.code}:`, error.message);
      } else {
        console.log(`✅ Created promo code: ${promo.code} (${promo.credits} credits)`);
      }
    } catch (error) {
      console.error(`❌ Unexpected error creating promo code ${promo.code}:`, error);
    }
  }
}

/**
 * Generate test assets (mock images)
 */
async function generateTestAssets() {
  console.log('🖼️ Generating test assets...');

  const assetsDir = path.join(__dirname, '..', 'tests', 'assets');
  
  // Create assets directory
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Create sample test images (1x1 pixels for fast testing)
  const testImages = [
    'bride-photo.jpg',
    'groom-photo.jpg',
    'couple-photo.jpg',
    'test-upload-1.jpg',
    'test-upload-2.jpg'
  ];

  const sampleImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);

  for (const imageName of testImages) {
    const imagePath = path.join(assetsDir, imageName);
    fs.writeFileSync(imagePath, sampleImageBuffer);
  }

  console.log(`✅ Created ${testImages.length} test images`);
}

/**
 * Create test configuration file
 */
async function createTestConfig(users: any[]) {
  console.log('⚙️ Creating test configuration...');

  const testConfig = {
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      password: u.password,
      name: u.metadata.full_name,
      role: u.metadata.role || 'user'
    })),
    rooms: TEST_ROOMS,
    promoCodes: TEST_PROMO_CODES.map(p => p.code),
    baseUrl: process.env.BASE_URL || 'http://localhost:5173',
    createdAt: new Date().toISOString()
  };

  const configPath = path.join(__dirname, '..', 'tests', 'test-config.json');
  fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
  
  console.log('✅ Test configuration saved');
  return testConfig;
}

/**
 * Main seeding function
 */
async function seedTestData() {
  console.log('🌱 Starting test data seeding...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);

  try {
    // Clean existing test data
    await cleanTestData();

    // Create test users
    const users = await createTestUsers();
    
    if (users.length === 0) {
      throw new Error('No test users were created');
    }

    // Create test rooms and game data
    await createTestRooms(users);

    // Create test styles
    await createTestStyles();

    // Create test promo codes
    await createTestPromoCodes();

    // Generate test assets
    await generateTestAssets();

    // Create test configuration
    const config = await createTestConfig(users);

    console.log('🎉 Test data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👥 Users created: ${users.length}`);
    console.log(`   🎮 Rooms created: ${TEST_ROOMS.length}`);
    console.log(`   👗 Styles created: ${TEST_STYLES.length}`);  
    console.log(`   🎁 Promo codes: ${TEST_PROMO_CODES.length}`);
    console.log('\n🔑 Test Users:');
    
    config.users.forEach(user => {
      console.log(`   ${user.email} (${user.role}): ${user.password}`);
    });

    console.log('\n🎁 Test Promo Codes:');
    TEST_PROMO_CODES.forEach(promo => {
      console.log(`   ${promo.code}: ${promo.credits} credits`);
    });

    console.log('\n🎮 Test Room Codes:');
    TEST_ROOMS.forEach(room => {
      console.log(`   ${room.room_code}: ${room.max_players} players`);
    });

    return config;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

/**
 * CLI interface
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'clean':
      cleanTestData();
      break;
    case 'seed':
    default:
      seedTestData();
      break;
  }
}

export { seedTestData, cleanTestData };
export default seedTestData;