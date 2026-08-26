import type { Language } from '../types';

export const LANGUAGES: {code: Language;label: string;native: string;note: string;}[] = [
{ code: 'en', label: 'English', native: 'English', note: 'Default' },
{ code: 'si', label: 'Sinhala', native: 'සිංහල', note: 'සිංහල භාෂාව' },
{ code: 'ta', label: 'Tamil', native: 'தமிழ்', note: 'தமிழ் மொழி' }];


type Dict = Record<string, string>;

const en: Dict = {
  'nav.home': 'Home',
  'nav.discover': 'Discover',
  'nav.create': 'Post',
  'nav.activity': 'Activity',
  'nav.profile': 'Profile',
  'home.greeting': 'Good morning',
  'home.hero.title': 'Find someone to get it done.',
  'home.hero.sub': 'Post a task, compare real offers, hire with confidence.',
  'home.cta.post': 'Post a Task',
  'home.cta.find': 'Find Tasks',
  'home.cta.activeTasks': 'Active tasks',
  'home.todo': 'Needs your attention',
  'home.nearby': 'Nearby tasks',
  'home.categories': 'Popular categories',
  'home.recommended': 'Recommended for you',
  'home.activity': 'Your activity',
  'home.seeAll': 'See all',
  'home.mode.requester': 'I need a service',
  'home.mode.provider': 'I provide services',
  'home.activity.active': 'Active tasks',
  'home.activity.offers': 'Pending offers',
  'home.activity.jobs': 'Upcoming jobs',
  'home.activity.messages': 'Unread messages',
  'common.offers': 'offers',
  'common.away': 'away'
};

const si: Dict = {
  'nav.home': 'මුල් පිටුව',
  'nav.discover': 'සොයන්න',
  'nav.create': 'යොදන්න',
  'nav.activity': 'ක්‍රියාකාරකම්',
  'nav.profile': 'ගිණුම',
  'home.greeting': 'සුබ උදෑසනක්',
  'home.hero.title': 'ඔබේ වැඩ කරන්න හරි කෙනෙක් හොයාගන්න.',
  'home.hero.sub': 'කාර්යයක් යොදන්න, ලැබෙන මිල ගණන් සසඳන්න, විශ්වාසයෙන් බඳවා ගන්න.',
  'home.cta.post': 'කාර්යයක් යොදන්න',
  'home.cta.find': 'කාර්යයන් සොයන්න',
  'home.cta.activeTasks': 'ක්‍රියාකාරී කාර්යයන්',
  'home.todo': 'ඔබේ අවධානය අවශ්‍යයි',
  'home.nearby': 'ආසන්න කාර්යයන්',
  'home.categories': 'ජනප්‍රිය කාණ්ඩ',
  'home.recommended': 'ඔබට නිර්දේශිත',
  'home.activity': 'ඔබේ ක්‍රියාකාරකම්',
  'home.seeAll': 'සියල්ල',
  'home.mode.requester': 'මට සේවාවක් අවශ්‍යයි',
  'home.mode.provider': 'මම සේවා සපයමි',
  'home.activity.active': 'ක්‍රියාකාරී කාර්යයන්',
  'home.activity.offers': 'පොරොත්තු මිල ගණන්',
  'home.activity.jobs': 'ඉදිරි රැකියා',
  'home.activity.messages': 'නොකියවූ පණිවිඩ',
  'common.offers': 'මිල ගණන්',
  'common.away': 'දුරින්'
};

const ta: Dict = {
  'nav.home': 'முகப்பு',
  'nav.discover': 'கண்டறி',
  'nav.create': 'இடு',
  'nav.activity': 'செயல்பாடு',
  'nav.profile': 'சுயவிவரம்',
  'home.greeting': 'காலை வணக்கம்',
  'home.hero.title': 'வேலையை முடிக்க சரியான நபரைக் கண்டறியுங்கள்.',
  'home.hero.sub': 'பணியை இடுங்கள், விலைகளை ஒப்பிடுங்கள், நம்பிக்கையுடன் பணியமர்த்துங்கள்.',
  'home.cta.post': 'பணியை இடுங்கள்',
  'home.cta.find': 'பணிகளைத் தேடு',
  'home.cta.activeTasks': 'செயலில் உள்ள பணிகள்',
  'home.todo': 'உங்கள் கவனம் தேவை',
  'home.nearby': 'அருகிலுள்ள பணிகள்',
  'home.categories': 'பிரபல வகைகள்',
  'home.recommended': 'உங்களுக்கு பரிந்துரை',
  'home.activity': 'உங்கள் செயல்பாடு',
  'home.seeAll': 'அனைத்தும்',
  'home.mode.requester': 'எனக்கு சேவை தேவை',
  'home.mode.provider': 'நான் சேவை வழங்குகிறேன்',
  'home.activity.active': 'செயலில் உள்ள பணிகள்',
  'home.activity.offers': 'நிலுவை விலைகள்',
  'home.activity.jobs': 'வரவிருக்கும் வேலைகள்',
  'home.activity.messages': 'படிக்காத செய்திகள்',
  'common.offers': 'விலைகள்',
  'common.away': 'தூரம்'
};

const dictionaries: Record<Language, Dict> = { en, si, ta };

export function translate(language: Language, key: string): string {
  return dictionaries[language][key] ?? dictionaries.en[key] ?? key;
}