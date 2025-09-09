import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

// Default template for OG images
const getDefaultTemplate = (type: string, data: any) => {
  const { userName, challengeTitle, tournamentName, streak, referralTier } = data;

  const gradients = {
    tournament: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    challenge: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    streak: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    referral: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    default: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
  };

  const background = gradients[type as keyof typeof gradients] || gradients.default;

  switch (type) {
    case 'tournament':
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background,
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 64, marginRight: 20 }}>🏆</div>
            <div>Winner!</div>
          </div>
          <div style={{ fontSize: 56, marginBottom: 20 }}>{userName}</div>
          <div style={{ fontSize: 32, opacity: 0.9 }}>{tournamentName}</div>
          <div 
            style={{
              position: 'absolute',
              bottom: 30,
              right: 30,
              fontSize: 24,
              opacity: 0.8,
            }}
          >
            PreWedding AI Studio
          </div>
        </div>
      );

    case 'challenge':
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background,
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
            <div style={{ fontSize: 56, marginRight: 20 }}>⭐</div>
            <div style={{ fontSize: 44 }}>Daily Challenge</div>
          </div>
          <div style={{ fontSize: 38, marginBottom: 30, textAlign: 'center', maxWidth: '80%' }}>
            {challengeTitle}
          </div>
          <div style={{ fontSize: 32, opacity: 0.9 }}>{userName} completed!</div>
          <div 
            style={{
              position: 'absolute',
              bottom: 30,
              right: 30,
              fontSize: 24,
              opacity: 0.8,
            }}
          >
            PreWedding AI Studio
          </div>
        </div>
      );

    case 'streak':
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background,
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 64, marginRight: 20 }}>🔥</div>
            <div>{streak} Day Streak!</div>
          </div>
          <div style={{ fontSize: 36, marginBottom: 20 }}>{userName}</div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>Keep the momentum going!</div>
          <div 
            style={{
              position: 'absolute',
              bottom: 30,
              right: 30,
              fontSize: 24,
              opacity: 0.8,
            }}
          >
            PreWedding AI Studio
          </div>
        </div>
      );

    case 'referral':
      const tierEmojis = {
        bronze: '🥉',
        silver: '🥈', 
        gold: '🥇',
        platinum: '💎'
      };

      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background,
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 64, marginRight: 20 }}>
              {tierEmojis[referralTier as keyof typeof tierEmojis] || '🎯'}
            </div>
            <div style={{ textTransform: 'capitalize' }}>{referralTier} Tier</div>
          </div>
          <div style={{ fontSize: 36, marginBottom: 20 }}>{userName}</div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>Referral Champion</div>
          <div 
            style={{
              position: 'absolute',
              bottom: 30,
              right: 30,
              fontSize: 24,
              opacity: 0.8,
            }}
          >
            PreWedding AI Studio
          </div>
        </div>
      );

    default:
      return (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: gradients.default,
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 64, marginRight: 20 }}>💕</div>
            <div>PreWedding AI</div>
          </div>
          <div style={{ fontSize: 36, marginBottom: 20 }}>{userName}</div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>Create Your Perfect Story</div>
          <div 
            style={{
              position: 'absolute',
              bottom: 30,
              right: 30,
              fontSize: 24,
              opacity: 0.8,
            }}
          >
            PreWedding AI Studio
          </div>
        </div>
      );
  }
};

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract parameters from URL
    const type = searchParams.get('type') || 'default';
    const userName = searchParams.get('userName') || 'User';
    const challengeTitle = searchParams.get('challengeTitle') || 'Amazing Challenge';
    const tournamentName = searchParams.get('tournamentName') || 'Epic Tournament';
    const streak = searchParams.get('streak') || '1';
    const referralTier = searchParams.get('referralTier') || 'bronze';
    const templateId = searchParams.get('templateId');
    const vanitySlug = searchParams.get('vanitySlug');

    // Additional customization parameters
    const width = parseInt(searchParams.get('width') || '1200');
    const height = parseInt(searchParams.get('height') || '630');
    
    const data = {
      userName,
      challengeTitle,
      tournamentName,
      streak,
      referralTier,
      vanitySlug,
    };

    // If templateId is provided, we could fetch custom template from database
    // For now, using default templates based on type
    
    const template = getDefaultTemplate(type, data);

    return new ImageResponse(
      template,
      {
        width,
        height,
        // You can add custom fonts here
        fonts: [
          {
            name: 'Inter',
            data: await fetch(
              new URL('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', import.meta.url)
            ).then((res) => res.arrayBuffer()),
            style: 'normal',
          },
        ],
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    
    // Return a fallback error image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
          }}
        >
          <div style={{ marginBottom: 20 }}>⚠️</div>
          <div>PreWedding AI Studio</div>
          <div style={{ fontSize: 24, opacity: 0.8 }}>Image generation failed</div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}