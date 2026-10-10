import type { CountryCulturalInfo } from "@/types/cultural";

export const CULTURAL_FALLBACK_DATA: Record<string, CountryCulturalInfo> = {
  JP: {
    countryId: "JPN",
    countryName: "Japan",
    alpha2: "JP",
    weatherInfo:
      "Japan has four distinct seasons:\n• Spring (Mar–May): Cherry blossoms, mild 10–20°C (50–68°F)\n• Summer (Jun–Aug): Rainy season in June, humid 25–35°C (77–95°F), typhoons Aug–Sep\n• Autumn (Sep–Nov): Comfortable 15–25°C (59–77°F), vibrant foliage\n• Winter (Dec–Feb): Snow in the north (Hokkaido –10 to 0°C), milder in Tokyo 5–10°C (41–50°F)",
    currencyInfo: {
      name: "Japanese Yen",
      code: "JPY",
      exchangeRate: "Approximately 140–160 JPY = 1 USD / 150–170 JPY = 1 EUR",
      tips: "• Cash remains widely used—carry sufficient yen bills\n• ATMs at 7-Eleven, Japan Post & major convenience stores accept foreign cards\n• Use Suica/Pasmo/IC cards for subways, buses & vending machines\n• Strictly no tipping culture—it can cause confusion or be considered impolite\n• Exchange currency at airports or major bank counters",
    },
    emergencyInfo: {
      police: "110",
      ambulance: "119",
      embassy: "US Embassy Tokyo: +81 3-3224-5000 | UK Embassy Tokyo: +81 3-5275-3200",
    },
    essentialItems: [
      {
        title: "Clothing",
        items: [
          "Slip-on shoes (you will remove shoes frequently at shrines, ryokans & restaurants)",
          "Comfortable walking shoes for 15,000+ daily steps",
          "Layered clothing for varying indoor heating / air conditioning",
          "Compact travel umbrella (or buy clear umbrella at konbini)",
          "Modest clothing for visiting temples and shrines",
          "Thermal base layers for winter trips",
        ],
      },
      {
        title: "Electronics & Connectivity",
        items: [
          "Type A power adapter (two-prong flat, 100V, 50/60Hz)",
          "High-capacity portable charger / power bank for navigating transit",
          "eSIM or Pocket Wi-Fi device (essential for Tokyo train navigation)",
          "Suica or Pasmo digital transit card loaded on Apple/Google Wallet",
          "Google Maps & Google Translate with offline Japanese dictionary downloaded",
        ],
      },
      {
        title: "Documents & Essentials",
        items: [
          "Passport (law requires tourists to carry physical passport at all times)",
          "Visit Japan Web QR codes (fast-track customs & immigration)",
          "Small coin purse (yen uses many high-value 100, 500 yen coins)",
          "Small plastic bag or pouch for trash (public trash cans are rare)",
          "Hand towel or handkerchief (many public restrooms lack paper towels)",
        ],
      },
    ],
    localCustoms: [
      {
        title: "Bowing Etiquette",
        description:
          "Depth and duration of bows vary by context—from a subtle head nod to a respectful bow—used for greetings, gratitude, and apologies.",
      },
      {
        title: "Shoe Removal (Genkan)",
        description:
          "Always remove shoes indoors at homes, traditional ryokan, tatami seating, and temples. Slippers are provided, but remove them before stepping on tatami.",
      },
      {
        title: "Train & Transit Etiquette",
        description:
          "Keep phones on silent (Manner Mode). Avoid phone calls on trains. Speak in hushed tones and take your backpack off your back in crowded cars.",
      },
      {
        title: "No Tipping Culture",
        description:
          "Tipping does not exist in Japan and can create awkward situations. Great service is built into the culture and price.",
      },
    ],
    culturalTaboos: [
      {
        title: "Chopstick Mistakes",
        description:
          "Never stick chopsticks vertically into a bowl of rice (resembles funeral incense) or pass food directly chopstick-to-chopstick.",
      },
      {
        title: "Walking While Eating",
        description:
          "Eating or drinking while walking down streets is considered impolite. Eat near the vending machine or store where purchased.",
      },
      {
        title: "Tattoos in Onsen (Hot Springs)",
        description:
          "Many traditional onsens forbid visible tattoos. Seek tattoo-friendly baths or private kashikiri ryokan baths.",
      },
    ],
    safetyTips: [
      {
        title: "One of the World's Safest Destinations",
        description:
          "Violent crime is exceedingly rare. Lost items are routinely turned into Koban (police boxes) and recovered intact.",
      },
      {
        title: "Earthquake Preparedness",
        description:
          "Japan experiences regular seismic activity. Download the 'Safety Tips' app from the Japan National Tourism Organization (JNTO).",
      },
      {
        title: "Pedestrian & Traffic Discipline",
        description:
          "Follow pedestrian lights strictly even on quiet streets; cars drive on the left side of the road.",
      },
    ],
    commonScams: [
      {
        title: "Kabukicho / Roppongi Touts",
        description:
          "Do not follow nightlife touts offering 'cheap drinks' or free entry in nightlife districts; patrons may face exorbitant hidden cover fees.",
      },
      {
        title: "Fake Monks Soliciting Donations",
        description:
          "Near major tourist temples (e.g., Asakusa), fraudulent people dressed as monks may offer bracelets and demand immediate cash.",
      },
    ],
    usefulPhrases: [
      { phrase: "Hello / Good day", translation: "こんにちは", phonetic: "Konnichiwa" },
      { phrase: "Thank you very much", translation: "ありがとうございます", phonetic: "Arigatō gozaimasu" },
      { phrase: "Excuse me / Sorry", translation: "すみません", phonetic: "Sumimasen" },
      { phrase: "Please (requesting)", translation: "お願いします", phonetic: "Onegaishimasu" },
      { phrase: "How much is this?", translation: "これはいくらですか？", phonetic: "Kore wa ikura desu ka?" },
      { phrase: "Where is the station?", translation: "駅はどこですか？", phonetic: "Eki wa doko desu ka?" },
      { phrase: "Check, please", translation: "お会計をお願いします", phonetic: "O-kaikei o onegaishimasu" },
      { phrase: "Delicious!", translation: "美味しいです！", phonetic: "Oishii desu!" },
      { phrase: "Do you speak English?", translation: "英語を話せますか？", phonetic: "Eigo o hanasemasu ka?" },
    ],
  },
  IT: {
    countryId: "ITA",
    countryName: "Italy",
    alpha2: "IT",
    weatherInfo:
      "Mediterranean climate:\n• Spring (Apr–Jun): Ideal weather, 16–24°C (60–75°F)\n• Summer (Jul–Aug): Hot & dry, 28–36°C (82–97°F)\n• Autumn (Sep–Oct): Pleasant harvest season, 18–26°C\n• Winter (Nov–Feb): Cool and rainy in the south, colder in northern Alps",
    currencyInfo: {
      name: "Euro",
      code: "EUR",
      exchangeRate: "Official Eurozone currency",
      tips: "• Contactless cards widely accepted\n• Always carry small Euro coins for espresso (typically €1.20–€1.50 at the counter) and public restrooms\n• Coperto (cover charge) is standard on restaurant bills\n• Tipping is optional (€1–€2 per person for good service)",
    },
    emergencyInfo: {
      police: "112 (European Emergency) / 113",
      ambulance: "118",
      embassy: "US Embassy Rome: +39 06 46741 | UK Embassy Rome: +39 06 4220 0001",
    },
    essentialItems: [
      {
        title: "Clothing",
        items: [
          "Shoulder and knee-covering attire for entering churches (St. Peter's, Duomo)",
          "Sturdy cobblestone-friendly walking shoes",
          "Sunglasses and sun hat for summer ruins",
          "Light scarf for cooler evenings and basilica dress code",
        ],
      },
      {
        title: "Electronics",
        items: [
          "Type C / F / L Euro power adapter",
          "Portable phone charger",
          "Trenitalia / Italo rail booking app on phone",
        ],
      },
      {
        title: "Documents",
        items: [
          "Passport and European health insurance or travel insurance card",
          "Pre-booked timed tickets for major museums (Colosseum, Vatican, Uffizi)",
        ],
      },
    ],
    localCustoms: [
      {
        title: "Coffee Rules",
        description:
          "Cappuccino is strictly a breakfast beverage; ordering cappuccino after 11am or after dinner is unusual. Order caffè (espresso) after lunch or dinner.",
      },
      {
        title: "Validate Regional Train Tickets",
        description:
          "Paper regional train and bus tickets must be stamped in green/yellow validation machines on platforms before boarding to avoid steep fines.",
      },
    ],
    culturalTaboos: [
      {
        title: "Dress Codes in Churches",
        description:
          "No bare shoulders, short shorts, or plunging necklines in religious sites, including the Vatican and Florence Duomo.",
      },
    ],
    safetyTips: [
      {
        title: "Pickpocket Awareness",
        description:
          "Stay vigilant on crowded public transit (Rome Metro Line A, Termini, Venice vaporetto) and around crowded monuments.",
      },
    ],
    commonScams: [
      {
        title: "Friendship Bracelet Scam",
        description:
          "Strangers around Milan Duomo or Rome Colosseum may tie a bracelet on your wrist unprompted and demand €10–€20.",
      },
    ],
    usefulPhrases: [
      { phrase: "Good morning / Hello", translation: "Buongiorno", phonetic: "Bwon-jor-no" },
      { phrase: "Thank you", translation: "Grazie", phonetic: "Graht-see-eh" },
      { phrase: "Please", translation: "Per favore", phonetic: "Pehr fah-voh-reh" },
      { phrase: "Excuse me", translation: "Scusi", phonetic: "Skoo-zee" },
      { phrase: "Where is...?", translation: "Dov'è...?", phonetic: "Doh-veh" },
      { phrase: "The bill, please", translation: "Il conto, per favore", phonetic: "Eel kon-toh" },
    ],
  },
  GB: {
    countryId: "GBR",
    countryName: "United Kingdom",
    alpha2: "GB",
    weatherInfo:
      "Temperate maritime climate:\n• Spring (Mar–May): 10–16°C (50–61°F), blooming parks\n• Summer (Jun–Aug): 18–26°C (64–79°F), long daylight hours\n• Autumn (Sep–Nov): 10–18°C, crisp and colorful\n• Winter (Dec–Feb): 3–9°C (37–48°F), overcast with occasional frost",
    currencyInfo: {
      name: "British Pound Sterling",
      code: "GBP",
      exchangeRate: "Approximately £1 = $1.25–$1.35 USD / €1.15–€1.22 EUR",
      tips: "• Virtually 100% cashless across transit, pubs, and restaurants\n• Tap-to-pay credit/debit card or Apple/Google Pay works on all Tube, bus, and rail\n• Tipping 10–12.5% is common in sit-down restaurants (often added as 'optional service charge')",
    },
    emergencyInfo: {
      police: "999 (Emergency) / 101 (Non-emergency)",
      ambulance: "999",
      embassy: "US Embassy London: +44 20 7499 9000",
    },
    essentialItems: [
      {
        title: "Clothing",
        items: [
          "Waterproof raincoat or trench coat",
          "Comfortable walking boots or sneakers",
          "Layered sweaters and cardigans",
          "Wind-resistant compact umbrella",
        ],
      },
      {
        title: "Electronics",
        items: [
          "Type G 3-pin British power adapter (230V)",
          "Portable phone charger for contactless transit taps",
          "Citymapper app installed for London navigation",
        ],
      },
    ],
    localCustoms: [
      {
        title: "Stand on the Right",
        description:
          "On London Underground escalators, stand on the right, walk on the left. The British queuing etiquette is sacrosanct.",
      },
      {
        title: "Pub Ordering",
        description:
          "In traditional pubs, order food and drinks directly at the bar, not from your table.",
      },
    ],
    culturalTaboos: [
      {
        title: "Queue Jumping",
        description: "Never cut ahead in any queue; wait in line patiently.",
      },
    ],
    safetyTips: [
      {
        title: "Traffic Direction",
        description:
          "Traffic drives on the left. Look right first before crossing streets (painted road markings will remind you: 'LOOK RIGHT').",
      },
    ],
    commonScams: [
      {
        title: "Phone Snatching by Mopeds/Bikes",
        description:
          "Do not hold your smartphone carelessly near curbs in central London, as thieves on e-bikes snatch phones.",
      },
    ],
    usefulPhrases: [
      { phrase: "Cheers (thanks/bye)", translation: "Cheers", phonetic: "Cheerz" },
      { phrase: "Sorry / Pardon", translation: "Sorry", phonetic: "Soh-ree" },
      { phrase: "Could I have the bill, please?", translation: "Could I have the bill, please?", phonetic: "Bill please" },
    ],
  },
  FR: {
    countryId: "FRA",
    countryName: "France",
    alpha2: "FR",
    weatherInfo:
      "Varied continental & Mediterranean:\n• Spring (Apr–Jun): 15–22°C (59–72°F)\n• Summer (Jul–Aug): Warm to hot, 25–33°C (77–91°F)\n• Autumn (Sep–Nov): Mild, 12–20°C\n• Winter (Dec–Feb): Chilly, 3–9°C (37–48°F) in Paris",
    currencyInfo: {
      name: "Euro",
      code: "EUR",
      exchangeRate: "Eurozone standard",
      tips: "• Contactless payments widely accepted\n• Service compris (service included) by French law on restaurant bills\n• Leaving an extra €1–€3 for great dining service is a pleasant gesture",
    },
    emergencyInfo: {
      police: "112 / 17",
      ambulance: "15 (SAMU)",
      embassy: "US Embassy Paris: +33 1 43 12 22 22",
    },
    essentialItems: [
      {
        title: "Clothing",
        items: [
          "Smart casual attire (Parisians dress neatly)",
          "Comfortable walking shoes for museum marathons and cobblestones",
          "Stylish light jacket or trench",
        ],
      },
      {
        title: "Electronics",
        items: [
          "Type C / E Euro adapter",
          "Bonjour RATP / Citymapper app for metro",
        ],
      },
    ],
    localCustoms: [
      {
        title: "Always Say 'Bonjour'",
        description:
          "When entering any shop, café, bakery, or interaction, greet the staff with 'Bonjour Madame/Monsieur' before speaking.",
      },
    ],
    culturalTaboos: [
      {
        title: "Rushing a Meal",
        description:
          "Dining is an art; waiters won't bring the check until you request it ('L'addition, s'il vous plaît').",
      },
    ],
    safetyTips: [
      {
        title: "Metro Pickpockets",
        description:
          "Keep bags zipped and held in front on Paris Metro Line 1 and around major sights (Eiffel Tower, Louvre, Montmartre).",
      },
    ],
    commonScams: [
      {
        title: "Gold Ring or Petition Scam",
        description:
          "Strangers asking you to sign a petition or handing you a 'found gold ring' near tourist spots are distracting you for pickpockets.",
      },
    ],
    usefulPhrases: [
      { phrase: "Hello / Good day", translation: "Bonjour", phonetic: "Bohn-zhoor" },
      { phrase: "Good evening", translation: "Bonsoir", phonetic: "Bohn-swahr" },
      { phrase: "Please", translation: "S'il vous plaît", phonetic: "Seel voo pleh" },
      { phrase: "Thank you very much", translation: "Merci beaucoup", phonetic: "Mehr-see boh-koo" },
      { phrase: "The check, please", translation: "L'addition, s'il vous plaît", phonetic: "Lah-dee-syohn" },
    ],
  },
  ES: {
    countryId: "ESP",
    countryName: "Spain",
    alpha2: "ES",
    weatherInfo:
      "Sunny Mediterranean climate:\n• Spring (Apr–Jun): 18–25°C (64–77°F)\n• Summer (Jul–Aug): Warm & sunny, 28–36°C (82–97°F)\n• Autumn (Sep–Nov): Pleasant 18–24°C\n• Winter (Dec–Feb): Mild coastal winters 12–16°C",
    currencyInfo: {
      name: "Euro",
      code: "EUR",
      exchangeRate: "Eurozone standard",
      tips: "• Cards accepted almost everywhere\n• Tapas are often served with drinks in Granada and traditional bars\n• Small tip (round up or €1–€2) is appreciated but not mandatory",
    },
    emergencyInfo: {
      police: "112 / 091",
      ambulance: "112 / 061",
      embassy: "US Embassy Madrid: +34 91 587 2200",
    },
    essentialItems: [
      {
        title: "Clothing",
        items: [
          "Breathable summer clothing and sun protection",
          "Comfortable walking shoes",
          "Evening attire for late-night dining (dinner starts at 9:00 PM)",
        ],
      },
      {
        title: "Electronics",
        items: [
          "Type C / F Euro adapter",
          "Portable battery charger",
        ],
      },
    ],
    localCustoms: [
      {
        title: "Late Dining Schedules",
        description:
          "Lunch is 14:00–16:00. Dinner rarely starts before 21:00 (9:00 PM). Restaurants are empty at 19:00.",
      },
    ],
    culturalTaboos: [
      {
        title: "Expecting Quick Early Dinners",
        description:
          "Embrace the Spanish rhythm of afternoon siesta and leisurely tapeo (tapas hopping).",
      },
    ],
    safetyTips: [
      {
        title: "Las Ramblas & Metro Security",
        description:
          "Barcelona and Madrid have skilled pickpockets in crowded tourist zones. Keep wallets in front pockets.",
      },
    ],
    commonScams: [
      {
        title: "Rose / Rosemary Handouts",
        description:
          "Elderly women offering rosemary twigs for 'good luck' near cathedrals will demand money and read palms.",
      },
    ],
    usefulPhrases: [
      { phrase: "Hello", translation: "Hola", phonetic: "Oh-lah" },
      { phrase: "Thank you", translation: "Gracias", phonetic: "Grah-syahs" },
      { phrase: "Please", translation: "Por favor", phonetic: "Pohr fah-vohr" },
      { phrase: "The check, please", translation: "La cuenta, por favor", phonetic: "Lah kwen-tah" },
    ],
  },
  US: {
    countryId: "USA",
    countryName: "United States",
    alpha2: "US",
    weatherInfo:
      "Continental climate vary greatly by coast:\n• Northeast (NYC/BOS): 4 seasons, hot summers 28–32°C, cold winters 0 to -5°C\n• West Coast (CA): Year-round mild to warm, 18–28°C\n• South / Florida: Subtropical warmth and humidity",
    currencyInfo: {
      name: "US Dollar",
      code: "USD",
      exchangeRate: "Global standard currency",
      tips: "• Cashless & contactless cards accepted everywhere\n• Sales tax is added at checkout and not included on sticker prices\n• Tipping culture: 18–22% standard in sit-down restaurants, $1–$2 per drink at bars, $2–$5 for hotel staff",
    },
    emergencyInfo: {
      police: "911",
      ambulance: "911",
      embassy: "National emergency dial 911",
    },
    essentialItems: [
      {
        title: "Clothing",
        items: [
          "Comfortable footwear for city walking or national parks",
          "Layered apparel suitable for climate",
        ],
      },
      {
        title: "Electronics",
        items: [
          "Type A / B 120V power adapter",
          "Ride-share apps (Uber, Lyft) installed",
        ],
      },
      {
        title: "Documents",
        items: [
          "ESTA / Visa authorization approved before departure",
          "Valid passport and international travel health insurance",
        ],
      },
    ],
    localCustoms: [
      {
        title: "Tipping Culture",
        description:
          "Tipping is customary and expected for restaurant servers, taxi drivers, bartenders, and food delivery.",
      },
    ],
    culturalTaboos: [
      {
        title: "Not Tipping Service Staff",
        description:
          "Service workers rely on tips as primary income. Stiffing a tip is considered a major offense.",
      },
    ],
    safetyTips: [
      {
        title: "Emergency 911",
        description:
          "Dial 911 for immediate medical, police, or fire dispatch from any phone without country code.",
      },
    ],
    commonScams: [
      {
        title: "Costume Characters / CD Sellers",
        description:
          "In Times Square (NYC) and Hollywood Blvd (LA), costumed characters or music promoters may aggressively demand cash for photos or sample CDs.",
      },
    ],
    usefulPhrases: [
      { phrase: "How's it going?", translation: "How are you?", phonetic: "How's it going?" },
      { phrase: "Check, please", translation: "May I have the bill?", phonetic: "Check please" },
    ],
  },
  HU: {
    countryId: "HUN",
    countryName: "Hungary",
    alpha2: "HU",
    weatherInfo:
      "Hungary features continental seasons:\n• Spring (Apr–May): Pleasant 15–22°C (59–72°F), ideal for Budapest walking tours\n• Summer (Jun–Aug): Warm to hot 26–32°C (79–90°F), vibrant riverfront terraces\n• Autumn (Sep–Oct): Golden foliage, 14–20°C (57–68°F), harvest wine festivals\n• Winter (Nov–Feb): Chilly 0–5°C (32–41°F), magical Christmas markets & thermal baths",
    currencyInfo: {
      name: "Hungarian Forint",
      code: "HUF",
      exchangeRate: "Approximately 380–400 HUF = 1 EUR / 360–380 HUF = 1 USD",
      tips: "• Cards are widely accepted in Budapest, but keep small Forint notes for ruin bars & baths\n• Avoid airport currency exchange booths with high spreads\n• Standard restaurant tip is 10–12% if service charge is not already included in bill",
    },
    emergencyInfo: {
      police: "107",
      ambulance: "104",
      embassy: "US Embassy Budapest: +36 1 475-4400 | UK Embassy: +36 1 266-2888",
    },
    essentialItems: [
      {
        title: "Thermal Bath Essentials",
        items: [
          "Swimwear, flip-flops & swimming cap (required in some historic thermal pools)",
          "Quick-dry microfiber towel to avoid rental fees at Széchenyi or Gellért",
        ],
      },
      {
        title: "City Exploration",
        items: [
          "Comfortable footwear for cobblestone streets in Buda Castle district",
          "BudapestGO transit app for single tickets and 24h passes on trams & metro line 1",
          "Europlug (Type C/F) 230V adapter",
        ],
      },
    ],
    localCustoms: [
      {
        title: "Beer Clinking Tradition",
        description:
          "Traditionally, older Hungarians avoid clinking beer glasses due to historic 1848 revolution folklore, though saying 'Egészségedre' with eye contact is warmly welcomed.",
      },
      {
        title: "Thermal Bath Etiquette",
        description:
          "Shower thoroughly before entering thermal pools. Respect quiet zones and sauna rules.",
      },
    ],
    safetyTips: [
      {
        title: "Licensed Yellow Cabs",
        description:
          "Always use official yellow taxis (Főtaxi, Bolt) rather than unmarked cabs waiting outside nightlife venues.",
      },
    ],
    usefulPhrases: [
      { phrase: "Köszönöm", translation: "Thank you", phonetic: "KOE-soe-noem" },
      { phrase: "Kérem", translation: "Please / You're welcome", phonetic: "KAY-rem" },
      { phrase: "Szia", translation: "Hello / Bye", phonetic: "SEE-ah" },
      { phrase: "Egészségedre!", translation: "Cheers! / To your health", phonetic: "AY-gaysh-shay-ged-reh" },
    ],
  },
  PT: {
    countryId: "PRT",
    countryName: "Portugal",
    alpha2: "PT",
    weatherInfo:
      "Portugal boasts mild Mediterranean Atlantic weather:\n• Spring (Mar–May): Blooming & sunny 18–23°C (64–73°F)\n• Summer (Jun–Aug): Warm 25–30°C (77–86°F), breezy coastal evenings\n• Autumn (Sep–Nov): Mild 18–24°C (64–75°F), great surf season\n• Winter (Dec–Feb): Mild rainy spells 12–16°C (54–61°F), rare frost",
    currencyInfo: {
      name: "Euro",
      code: "EUR",
      exchangeRate: "Member of Eurozone (EUR)",
      tips: "• Multibanco card system is universal, but small pastelarias appreciate cash for bica (espresso) & pastel de nata\n• Tipping 5–10% in sit-down restaurants is customary for attentive service",
    },
    emergencyInfo: {
      police: "112",
      ambulance: "112",
      embassy: "US Embassy Lisbon: +351 21 727-3300 | UK Embassy: +351 21 392-4000",
    },
    essentialItems: [
      {
        title: "Walking Gear",
        items: [
          "Rubber-soled sneakers (Lisbon & Porto calcada tiles become slick when worn)",
          "Windbreaker for coastal breezes in Sintra, Cascais or Belém",
          "Viva Viagem / Navegante transit card for historic tram 28 & regional trains",
        ],
      },
    ],
    localCustoms: [
      {
        title: "Table Couvert",
        description:
          "Appetizers placed on your restaurant table (bread, olives, cheese) are not complimentary—you only pay if you eat them.",
      },
    ],
    usefulPhrases: [
      { phrase: "Obrigado (m) / Obrigada (f)", translation: "Thank you", phonetic: "oh-bree-GAH-doo" },
      { phrase: "Por favor", translation: "Please", phonetic: "poor fah-VOHR" },
      { phrase: "Bom dia", translation: "Good morning", phonetic: "bohm DEE-ah" },
      { phrase: "Uma bica, por favor", translation: "An espresso, please", phonetic: "OO-mah BEE-kah" },
    ],
  },
  AE: {
    countryId: "ARE",
    countryName: "United Arab Emirates",
    alpha2: "AE",
    weatherInfo:
      "UAE has desert sunshine throughout the year:\n• Winter (Nov–Mar): Peak season 22–28°C (72–82°F), balmy & clear\n• Summer (Jun–Sep): Very hot 38–45°C (100–113°F), air-conditioned indoors",
    currencyInfo: {
      name: "UAE Dirham",
      code: "AED",
      exchangeRate: "Pegged at approx 3.67 AED = 1 USD / ~4.0 AED = 1 EUR",
      tips: "• Contactless Apple/Google Pay and credit cards accepted everywhere\n• 10–15% tip is standard in restaurants",
    },
    emergencyInfo: {
      police: "999",
      ambulance: "998",
      embassy: "US Embassy Abu Dhabi / Consulate Dubai: +971 4 309-4000",
    },
    essentialItems: [
      {
        title: "Comfort & Attire",
        items: [
          "Light breathable fabrics with modest coverage for malls, mosques & souks",
          "Nol transit card for Dubai Metro and water ferries",
          "Type G 3-pin UK-style adapter (230V)",
        ],
      },
    ],
    localCustoms: [
      {
        title: "Public Etiquette",
        description:
          "Dress respectfully in government buildings and mosques. Ask before photographing locals.",
      },
    ],
    usefulPhrases: [
      { phrase: "Shukran", translation: "Thank you", phonetic: "SHOOK-rahn" },
      { phrase: "Marhaban", translation: "Hello", phonetic: "MAR-hah-bahn" },
      { phrase: "Min fadlak", translation: "Please", phonetic: "min FAHD-lahk" },
    ],
  },
};

/**
 * Normalizes an IATA airport code, country code, or country name to a standard Alpha-2 or Alpha-3 lookup key.
 */
export function resolveCountryKey(identifier: string): string {
  const clean = identifier.trim().toUpperCase();
  // Map common airport codes to country codes
  const iataToCountry: Record<string, string> = {
    // Japan
    NRT: "JP",
    HND: "JP",
    KIX: "JP",
    FUK: "JP",
    CTS: "JP",
    NGO: "JP",
    // Italy
    FCO: "IT",
    CIA: "IT",
    MXP: "IT",
    LIN: "IT",
    BGY: "IT",
    VCE: "IT",
    TSF: "IT",
    BLQ: "IT",
    FLR: "IT",
    PSA: "IT",
    NAP: "IT",
    PMO: "IT",
    CTA: "IT",
    BRI: "IT",
    TRN: "IT",
    // UK
    LHR: "GB",
    LGW: "GB",
    STN: "GB",
    LTN: "GB",
    MAN: "GB",
    EDI: "GB",
    // France
    CDG: "FR",
    ORY: "FR",
    NCE: "FR",
    LYS: "FR",
    // Spain
    MAD: "ES",
    BCN: "ES",
    AGP: "ES",
    VLC: "ES",
    // Hungary
    BUD: "HU",
    // UAE
    AUH: "AE",
    // USA
    JFK: "US",
    EWR: "US",
    LGA: "US",
    BOS: "US",
    LAX: "US",
    SFO: "US",
    ORD: "US",
    MIA: "US",
    DFW: "US",
    ATL: "US",
    SEA: "US",
    // Others
    DUB: "IE",
    LIS: "PT",
    OPO: "PT",
    AMS: "NL",
    BRU: "BE",
    FRA: "DE",
    MUC: "DE",
    BER: "DE",
    ZRH: "CH",
    GVA: "CH",
    VIE: "AT",
    PRG: "CZ",
    ATH: "GR",
    IST: "TR",
    DXB: "AE",
    SIN: "SG",
    BKK: "TH",
    HKG: "HK",
    ICN: "KR",
    SYD: "AU",
  };

  if (iataToCountry[clean]) {
    return iataToCountry[clean];
  }

  // Alpha-3 to Alpha-2
  const alpha3ToAlpha2: Record<string, string> = {
    JPN: "JP",
    ITA: "IT",
    GBR: "GB",
    FRA: "FR",
    ESP: "ES",
    USA: "US",
    DEU: "DE",
    NLD: "NL",
    PRT: "PT",
    CHE: "CH",
    AUT: "AT",
    GRC: "GR",
    TUR: "TR",
    ARE: "AE",
    SGP: "SG",
    THA: "TH",
    KOR: "KR",
    AUS: "AU",
  };

  if (alpha3ToAlpha2[clean]) {
    return alpha3ToAlpha2[clean];
  }

  // Country name lookup
  const nameToCode: Record<string, string> = {
    JAPAN: "JP",
    ITALY: "IT",
    "UNITED KINGDOM": "GB",
    UK: "GB",
    FRANCE: "FR",
    SPAIN: "ES",
    "UNITED STATES": "US",
    USA: "US",
    GERMANY: "DE",
    NETHERLANDS: "NL",
    PORTUGAL: "PT",
    SWITZERLAND: "CH",
    AUSTRIA: "AT",
    GREECE: "GR",
    TURKEY: "TR",
    THAILAND: "TH",
  };

  if (nameToCode[clean]) {
    return nameToCode[clean];
  }

  return clean;
}
