export interface CurrencyInfo {
  name: string;
  code: string;
  exchangeRate?: string;
  tips?: string;
}

export interface EmergencyInfo {
  police: string;
  ambulance: string;
  embassy?: string;
}

export interface EssentialItemGroup {
  title: string;
  items: string[];
}

export interface CulturalItem {
  title: string;
  description: string;
}

export interface UsefulPhrase {
  phrase: string;
  translation: string;
  phonetic: string;
}

export interface LanguageInfo {
  languageId?: string;
  languageName?: string;
  interestingFacts?: string[];
  commonChallenges?: Array<{ challenge: string; solution: string }>;
  resources?: Array<{ category: string; items: string[] }>;
  speakerInfo?: {
    totalSpeakers?: string;
    nativeSpeakers?: string;
    countriesSpoken?: string[];
    officialLanguageIn?: string[];
    languageFamily?: string;
    writingDirection?: string;
  };
}

export interface CountryCulturalInfo {
  countryId: string;
  countryName: string;
  alpha2: string;
  flagUrl?: string;
  weatherInfo?: string;
  currencyInfo?: CurrencyInfo;
  emergencyInfo?: EmergencyInfo;
  essentialItems?: EssentialItemGroup[];
  localCustoms?: CulturalItem[];
  culturalTaboos?: CulturalItem[];
  safetyTips?: CulturalItem[];
  commonScams?: CulturalItem[];
  usefulPhrases?: UsefulPhrase[];
  languages?: LanguageInfo[];
}
