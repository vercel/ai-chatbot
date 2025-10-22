# HeyGen Digital Twin Setup

## Overview
The Glen AI platform integrates with HeyGen's Interactive Avatar API to provide a realistic video avatar experience.

## Prerequisites
1. HeyGen account with API access
2. HeyGen Avatar ID for your digital twin

## Environment Variables

Add these to your `.env.local`:

```bash
HEYGEN_API_KEY=your_api_key_here
HEYGEN_AVATAR_ID=your_avatar_id_here
```

## Getting Your HeyGen Credentials

### 1. Create a HeyGen Account
- Visit [HeyGen](https://www.heygen.com/)
- Sign up for an account
- Navigate to API settings

### 2. Generate API Key
- Go to Settings → API
- Generate a new API key
- Copy and save it securely

### 3. Create Your Digital Twin
- In HeyGen dashboard, create a new Interactive Avatar
- Record or upload video of yourself
- Wait for processing (usually 24-48 hours)
- Copy the Avatar ID once ready

## Integration Points

The avatar integration is used in:
- `/avatar` route - Full interactive avatar experience with HeyGen video
- Falls back to static image and orb visualization if HeyGen is not configured

## Testing Without HeyGen

The platform gracefully degrades if HeyGen credentials are not provided:
- Shows Glen's static image in the orb
- Voice and text modes work independently
- No video avatar, but all other features remain functional

## API Limits

Check your HeyGen plan for:
- Minutes per month
- Concurrent sessions
- API rate limits

## Troubleshooting

### Avatar Won't Connect
- Verify API key is correct in `.env.local`
- Check Avatar ID matches your HeyGen dashboard
- Ensure avatar processing is complete
- Check browser console for specific errors

### Poor Video Quality
- Check your internet connection
- Try switching to voice or text mode
- Contact HeyGen support for avatar quality issues

## Cost Considerations

- HeyGen charges per minute of avatar usage
- Consider implementing session time limits
- Monitor usage in HeyGen dashboard
- Budget accordingly for production use

## Support

- HeyGen Docs: https://docs.heygen.com/
- HeyGen Support: support@heygen.com
- Glen AI Issues: [GitHub Issues](https://github.com/yourusername/glen-ai/issues)
