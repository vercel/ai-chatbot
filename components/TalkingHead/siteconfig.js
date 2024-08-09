// Site configuration
export const site = {

  // Preset avatars
  avatars: {
    'Brunette': {
      url: './avatars/brunette.glb',
      body: 'F',
      avatarMood: 'neutral',
      fi: 'Brunetti'
    }
  },

  // Google voices
  googleVoices: {
    "fi-F": { id: "fi-FI-Standard-A" },
    "lv-M": { id: "lv-LV-Standard-A" },
    "lt-M": { id: "lt-LT-Standard-A" },
    "en-F": { id: "en-US-Journey-F" },
    "en-M": { id: "en-GB-Standard-D" }
  },

  // ElevenLab voices
  elevenVoices: {
    "Bella": { id: "EXAVITQu4vr4xnSDxMaL" },
    "Elli": { id: "MF3mGyEYCl7XYWbV9V6O" },
    "Rachel": { id: "21m00Tcm4TlvDq8ikWAM" },
    "Adam": { id: "pNInz6obpgDQGcFmaJgB" },
    "Antoni": { id: "ErXwobaYiN019PkySvjV" },
    "Arnold": { id: "VR6AewLTigWG4xSOukaG" },
    "Domi": { id: "AZnzlk1XvdvUeBnXmlld" },
    "Josh": { id: "TxGEqnHWrfWFTfGW9XjX" },
    "Sam": { id: "yoZ06aMxZJJ28mfd3POQ" }
  },

  // Microsoft voices
  microsoftVoices: {
    "fi-Selma": { lang: "fi-FI", id: "fi-FI-SelmaNeural" },
    "fi-Noora": { lang: "fi-FI", id: "fi-FI-NooraNeural" },
    "fi-Harri": { lang: "fi-FI", id: "fi-FI-HarriNeural" },
    "en-Jenny": { lang: "en-US", id: "en-US-JennyNeural" },
    "en-Tony": { lang: "en-US", id: "en-US-TonyNeural" },
  },

  // Preset views
  views: {
    'DrStrange': { url: './views/strange.jpg', type: 'image/jpg', fi: 'TohtoriOuto' },
    'Matrix': { url: './views/matrix.mp4', type: 'video/mp4' }
  },

  // Preset poses (includes internal poses)
  poses: {
    'Straight': { url: "straight", fi: 'Suora' },
    'Side': { url: "side", fi: 'Keno' },
    'Hip': { url: "hip", fi: 'Lantio' },
    'Turn': { url: "turn", fi: 'Sivu' },
    'Back': { url: "back", fi: 'Taka' },
    'Wide': { url: "wide", fi: 'Haara' },
    'OneKnee': { url: "oneknee", fi: 'Polvi' },
    'TwoKnees': { url: "kneel", fi: 'Polvet' },
    'Bend': { url: "bend", fi: 'Perä' },
    'Sitting': { url:"sitting", fi: 'Istuva' },
    'Dance': { url: './poses/dance.fbx', fi: 'Tanssi' }
  },

  // Preset animations
  animations: {
    'Walking': { url: './animations/walking.fbx', fi: 'Kävely' }
  },

  // Impulse responses
  impulses: {
    'Room': { url: './audio/ir-room.m4a', fi: 'Huone' },
    'Basement': { url: './audio/ir-basement.m4a', fi: 'Kellari' },
    'Forest': { url: './audio/ir-forest.m4a', fi: 'Metsä' },
    'Church': { url: './audio/ir-church.m4a', fi: 'Kirkko' }
  },

  // Background ambient sounds/music
  music: {
    'Murmur': { url: './audio/murmur.mp3', fi: 'Puheensorina'}
  }

};
