//------------   Tourist Interests   -----------------//         

export interface Interest {
  id: string;
  label: string;
  emoji: string;
}

export const INTERESTS: Interest[] = [
  { id: 'pottery', label: 'Pottery', emoji: '🏺' },
  { id: 'batik', label: 'Batik', emoji: '🎨' },
  { id: 'woodcarving', label: 'Wood Carving', emoji: '🪵' },
  { id: 'weaving', label: 'Weaving', emoji: '🧵' },
  { id: 'masks', label: 'Mask Making', emoji: '🎭' },
  { id: 'brasswork', label: 'Brass Work', emoji: '🎺' },
  { id: 'lacquer', label: 'Lacquer Work', emoji: '✨' },
  { id: 'jewellery', label: 'Jewellery Making', emoji: '💍' },
  { id: 'handloom', label: 'Handloom', emoji: '🪡' },
];

export const INTEREST_MAP: Record<string, Interest> = Object.fromEntries(
  INTERESTS.map((i) => [i.id, i])
);


// -------------------- Tourist Regions -----------------------------

export interface Regions {
  id: string;
  label: string;
  emoji: string;
}

export const REGIONS: Regions[] = [
  { id: 'colombo', label: 'Colombo', emoji: '🏙️' },
  { id: 'kandy', label: 'Kandy', emoji: '🏔️' },
  { id: 'galle', label: 'Galle', emoji: '🏰' },
  { id: 'jaffna', label: 'Jaffna', emoji: '🌴' },
  { id: 'anuradhapura', label: 'Anuradhapura', emoji: '🏛️' },
  { id: 'sigiriya', label: 'Sigiriya', emoji: '🪨' },
  { id: 'ella', label: 'Ella', emoji: '🌿' },
  { id: 'trincomalee', label: 'Trincomalee', emoji: '🌊' },
  { id: 'negombo', label: 'Negombo', emoji: '⛵' },
  { id: 'other', label: 'Other', emoji: '📍' },
];

export const REGIONS_MAP: Record<string, Regions> = Object.fromEntries(
  REGIONS.map((i) => [i.id, i])
);


//-------------------- Blog Hashtags -----------------------------------

export const TRENDING_TAGS = [
  '#Batik', '#Pottery', '#Masks', '#Weaving', '#LacquerWork', '#BrassWork', '#JewelleryMaking', '#Handloom', '#WoodCarving',
  '#Colombo', '#Kandy', '#Galle', '#Jaffna', '#Anuradhapura', '#Sigiriya', '#Ella', '#Trincomalee', '#Negombo',
  '#SriLanka',
];

//-------------------- Countries -----------------------------------

export const COUNTRIES = [
  'Sri Lanka', 'India', 'Pakistan', 'United Kingdom', 'United States',
  'Australia', 'Russia', 'Ukraine', 'China', 'Germany', 'France',
  'Japan', 'Canada', 'Singapore', 'Other'
];

export const COUNTRY_CODES: Record<string, string> = {
  'Sri Lanka': 'LK',
  'India': 'IN',
  'Pakistan': 'PK',
  'United Kingdom': 'GB',
  'United States': 'US',
  'Australia': 'AU',
  'Russia': 'RU',
  'Ukraine': 'UA',
  'China': 'CN',
  'Germany': 'DE',
  'France': 'FR',
  'Japan': 'JP',
  'Canada': 'CA',
  'Singapore': 'SG'
};

export const LANGUAGES = ['English', 'Sinhala', 'Tamil', 'Other'];
