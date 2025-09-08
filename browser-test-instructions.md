# 🎮 Blind Date Style-Off - Browser Testing Guide

## 🌐 Live Application URL
**Production:** https://pre-wedding-look-n0da68wzb-chatgptnotes-6366s-projects.vercel.app

## ✅ Testing Checklist

### 1️⃣ **Initial Setup**
- [ ] Open the production URL in your browser
- [ ] Check that the page loads without errors
- [ ] Verify the "Blind Date Style-Off" tab appears in the navigation (🎭 icon)

### 2️⃣ **Authentication Testing**
- [ ] Click on the user icon or sign-in button
- [ ] Test Google OAuth sign-in
- [ ] OR create a new account with email/password
- [ ] Confirm you're logged in (user avatar/name visible)

### 3️⃣ **Navigate to Blind Date Tab**
- [ ] Click on the "🎭 Blind Date Style-Off" tab
- [ ] Verify the matchmaking screen appears
- [ ] Check that both game modes are visible:
  - ⚡ Quick Match
  - 👫 Play with Partner

### 4️⃣ **Test Private Game Creation**
- [ ] Click "🔗 Create Private Room"
- [ ] Verify you receive a 6-character invite code
- [ ] Note the invite code for sharing
- [ ] Check the waiting room displays correctly
- [ ] Verify game rules are shown

### 5️⃣ **Test Quick Match**
- [ ] Go back to matchmaking screen
- [ ] Click "🎯 Find Random Match"
- [ ] Verify the matching process starts
- [ ] Check if you enter a waiting room

### 6️⃣ **Test Game Flow (with 2 browsers/devices)**

**Browser/Device 1 (Player A):**
1. Create a private game
2. Share the invite code

**Browser/Device 2 (Player B):**
1. Sign in with a different account
2. Click "Have an invite code?"
3. Enter the invite code
4. Join the game

**Both Players:**
- [ ] Verify game starts when both players join
- [ ] Test Round 1: Attire selection (3 minutes)
  - Select styles for both Player A and B
  - Submit choices
- [ ] Test Round 2: Hair & Accessories (3 minutes)
  - Select styles for both players
  - Submit choices
- [ ] Test Round 3: Location & Vibe (2 minutes)
  - Select locations for both players
  - Submit choices

### 7️⃣ **Test Reveal Screen**
- [ ] Verify all designs are displayed side-by-side
- [ ] Check Player A's styled looks
- [ ] Check Player B's styled looks
- [ ] Test voting (whose styling felt more "you")
- [ ] Test reaction emojis (❤️🔥😂😱)
- [ ] Try the "Share Results" button
- [ ] Test "Play Again" functionality

### 8️⃣ **Test Timer Functionality**
- [ ] Verify countdown timer displays correctly
- [ ] Check timer changes color as time runs out
- [ ] Test if round auto-advances when timer expires

### 9️⃣ **Test Error Handling**
- [ ] Try leaving a game mid-round
- [ ] Test joining with an invalid invite code
- [ ] Check behavior with poor internet connection

### 🔟 **Test Mobile Responsiveness**
- [ ] Open on mobile device or use browser dev tools
- [ ] Verify all UI elements are properly sized
- [ ] Test touch interactions work correctly
- [ ] Check that modals and overlays display properly

## 🐛 Known Issues to Check

1. **RLS Policy Error**: If you see "infinite recursion" errors, the database policies need updating
2. **Authentication**: Ensure Google OAuth is configured in Supabase dashboard
3. **Edge Functions**: Verify they're accessible from the frontend

## 📝 Test Data

### Quick Test Accounts
You can create test accounts with any email format like:
- `tester1@example.com`
- `tester2@example.com`

### Sample Game Flow
1. **Player 1**: Creates private game → Gets code "ABC123"
2. **Player 2**: Joins with code "ABC123"
3. **Both**: Style each other through 3 rounds
4. **Reveal**: See results and react

## 🎯 Success Criteria

✅ **Fully Working** if:
- Users can create/join games
- Timer counts down properly
- Styling choices save correctly
- Reveal screen shows all designs
- Reactions can be submitted
- No console errors

⚠️ **Partially Working** if:
- Basic flow works but has minor UI issues
- Some features work but others fail
- Performance is slow but functional

❌ **Not Working** if:
- Can't create/join games
- Timer doesn't work
- Designs don't save
- Major errors prevent gameplay

## 🚀 Quick Start Testing

1. Open: https://pre-wedding-look-n0da68wzb-chatgptnotes-6366s-projects.vercel.app
2. Sign in (Google or email)
3. Click "🎭 Blind Date Style-Off" tab
4. Create a private game
5. Share code with friend (or open in incognito for solo test)
6. Play through all 3 rounds
7. View results and reactions

## 📱 Share Your Results

After testing, share your experience:
- Screenshot any errors
- Note which features worked/didn't work
- Share feedback on user experience
- Report performance issues

---

**The game is NOW LIVE and ready for beta testing!** 🎉