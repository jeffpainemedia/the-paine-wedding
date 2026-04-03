// ============================================================
// WEDDING CONTENT CONFIG
// All site content lives here. Update this file when details
// change — every page pulls from it automatically.
// ============================================================

export const WEDDING = {
  couple: {
    bride: { first: 'Ashlyn', last: 'Bimmerle', full: 'Ashlyn Bimmerle' },
    groom: { first: 'Jeffrey', last: 'Paine', full: 'Jeffrey Paine' },
    names: 'Ashlyn & Jeffrey',
    lastName: 'Paine',
  },

  date: {
    display: 'September 26, 2026',
    iso: '2026-09-26',
    dayOfWeek: 'Saturday',
    rsvpDeadline: 'August 1, 2026',
    rsvpDeadlineIso: '2026-08-01',
  },

  venue: {
    name: 'Davis & Grey Farms',
    address: '2975 CR 1110',
    city: 'Celeste, TX 75423',
    fullAddress: '2975 CR 1110, Celeste, TX 75423',
    cityDisplay: 'Celeste, Texas',
    mapsUrl: 'https://maps.google.com/?q=Davis+%26+Grey+Farms+2975+CR+1110+Celeste+TX+75423',
    // TODO: Replace with real Google Maps embed src from maps.google.com → Share → Embed a map
    mapsEmbedSrc:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3323.0!2d-96.1!3d33.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDE4JzAwLjAiTiA5NsKwMDYnMDAuMCJX!5e0!3m2!1sen!2sus!4v0000000000000!5m2!1sen!2sus',
    ceremonyTime: '5:00 PM',
    cocktailTime: '5:45 PM',
    receptionTime: '6:45 PM',
    sendOffTime: '10:00 PM',
    parking:
      'Please park in any of the parking spaces at the venue. Do not park on the grass.',
    shuttle: 'none',
  },

  schedule: [
    {
      time: '4:30 PM',
      title: 'Guest Arrival',
      description:
        'Doors open at 4:30 PM. Please arrive early to find your seat — the ceremony will begin promptly and late arrivals will not be seated after it starts.',
    },
    {
      time: '5:00 PM',
      title: 'Ceremony',
      description:
        'The main event! Join us in the chapel as Ashlyn and Jeffrey exchange vows and begin forever.',
    },
    {
      time: '5:45 PM',
      title: 'Cocktail Hour',
      description:
        'Enjoy drinks and light bites while we take photos. Mingle, celebrate, and get ready for a fun evening.',
    },
    {
      time: '7:00 PM',
      title: 'Dinner',
      description:
        'A seated dinner will be served. Enjoy a delicious meal with the people you love.',
    },
    {
      time: '7:30 PM',
      title: 'Toasts',
      description:
        'Words of love and laughter from our closest friends and family. Have your tissues — and your drinks — ready.',
    },
    {
      time: '8:00 PM',
      title: 'Dancing',
      description:
        'The dance floor opens! Come ready to celebrate and make some memories.',
    },
    {
      time: '8:30 PM',
      title: 'Cake Cutting',
      description:
        'Time for the sweet stuff. The cutting of the cake — a wedding tradition we are very excited about.',
    },
    {
      time: '10:00 PM',
      title: 'Send-Off',
      description:
        'The night ends with a send-off as Ashlyn and Jeffrey head into their happily ever after. Don\'t miss it!',
    },
  ] as Array<{ time: string; title: string; description: string }>,

  dresscode: {
    short: 'Semi-Formal',
    summary:
      'Both the ceremony and reception are indoors. Come dressed up and ready to celebrate — see the Attire page for full guidance.',
    ladies:
      'Midi or floor-length dresses, polished jumpsuits, and refined separates are all welcome. We recommend elevated fabrics, a tailored silhouette, and heels or dressy flats for an overall look that feels polished rather than casual.',
    gentlemen:
      'Suits or tailored separates in classic tones are ideal, paired with a dress shirt and polished shoes or boots. Ties are optional, but the overall look should feel clean, dressy, and evening-ready.',
  },

  bridalParty: {
    bridesmaids: [
      {
        name: 'Paige Bimmerle',
        role: 'Maid of Honor',
        relationship: "Ashlyn's Sister",
        image: '/images/bridal-party/Bridesmaids/Paige.jpg',
      },
      {
        name: 'Shelby Gerner',
        role: 'Bridesmaid',
        relationship: "Ashlyn's Friend & Roommate",
        image: '/images/bridal-party/Bridesmaids/Shelvy.jpg',
      },
      {
        name: 'Izzy May',
        role: 'Bridesmaid',
        relationship: "Ashlyn's College Friend",
        image: '/images/bridal-party/Bridesmaids/Izzy.jpg',
      },
      {
        name: 'Alondra Santillan',
        role: 'Bridesmaid',
        relationship: "Ashlyn's High School & College Friend",
        image: '/images/bridal-party/Bridesmaids/Alondra.jpg',
      },
      {
        name: 'Megan Groezinger',
        role: 'Bridesmaid',
        relationship: "Ashlyn's Friend",
        image: '/images/bridal-party/Bridesmaids/Megan.jpg',
      },
      {
        name: 'Brynn Wilson',
        role: 'Bridesmaid',
        relationship: "Jeff's Cousin",
        image: '/images/bridal-party/Bridesmaids/Brynn.jpg',
      },
      {
        name: 'Emma Wilson',
        role: 'Bridesmaid',
        relationship: "Jeff's Cousin",
        image: '/images/bridal-party/Bridesmaids/Emma.jpg',
      },
    ],
    groomsmen: [
      {
        name: 'John Paine',
        role: 'Best Man',
        relationship: "Jeff's Brother",
        image: '/images/bridal-party/Groomsmen/John.jpg',
      },
      {
        name: 'Hudson Boyd',
        role: 'Groomsman',
        relationship: "Jeff's College Friend",
        image: '/images/bridal-party/Groomsmen/Hudson.jpg',
      },
      {
        name: 'Roman Richichi',
        role: 'Groomsman',
        relationship: "Jeff's High School Friend",
        image: '/images/bridal-party/Groomsmen/Roman.jpg',
      },
      {
        name: 'Justin Luurtsema',
        role: 'Groomsman',
        relationship: "Jeff's College Friend",
        image: '/images/bridal-party/Groomsmen/Justin.jpg',
      },
      {
        name: 'Duncan Marshall',
        role: 'Groomsman',
        relationship: "Jeff's High School Friend",
        image: '/images/bridal-party/Groomsmen/Duncan.jpg',
      },
      {
        name: 'Collin Groezinger',
        role: 'Groomsman',
        relationship: "Jeff's Childhood Friend",
        image: '/images/bridal-party/Groomsmen/Collin.jpg',
      },
      {
        name: 'Blake Bimmerle',
        role: 'Groomsman',
        relationship: "Ashlyn's Brother",
        image: '/images/bridal-party/Groomsmen/Blake.jpg',
      },
    ],
  } as {
    bridesmaids: Array<{ name: string; role: string; relationship: string; image: string }>;
    groomsmen: Array<{ name: string; role: string; relationship: string; image: string }>;
  },

  // Meal options for RSVP form. Empty array = meal section hidden until catering is confirmed.
  // Example entry: { value: 'beef', label: 'Beef Tenderloin' }
  mealOptions: [] as Array<{ value: string; label: string }>,

  hotels: [
    {
      name: 'Holiday Inn Express & Suites Greenville',
      distance: '~13 mi · ~19 min from venue',
      description: 'Our top pick in Greenville — free hot breakfast, outdoor pool, fitness center, and free parking. Pet-friendly ($30/night fee). Standard kings from ~$104/night.',
      address: '2901 Mustang Crossing, Greenville, TX 75402',
      phone: '1-903-454-8680',
      bookingUrl: 'https://www.ihg.com/holidayinnexpress/hotels/us/en/greenville/gvtxx/hoteldetail',
      hub: 'Greenville',
      badge: 'Closest & Recommended',
    },
    {
      name: 'Hampton Inn & Suites Greenville',
      distance: '~13 mi · ~19 min from venue',
      description: 'Reliable Hilton brand in the Greenville hotel corridor. Free hot breakfast, free parking, pool, and Wi-Fi. Pet fee $75 (1–4 nights). Rates vary by date.',
      address: '3001 Kari Lane, Greenville, TX 75402',
      phone: '+1 903-457-9200',
      bookingUrl: 'https://www.hilton.com/en/hotels/gevtxhx-hampton-suites-greenville/',
      hub: 'Greenville',
      badge: '',
    },
    {
      name: 'Best Western Plus Monica Royale Inn & Suites',
      distance: '~13 mi · ~19 min from venue',
      description: 'Great value in Greenville with free breakfast, pool, hot tub, and fitness center. No pets allowed. Standard rooms from ~$97/night.',
      address: '3001 Mustang Crossing Annex, Greenville, TX 75402',
      phone: '(903) 454-3700',
      bookingUrl: 'https://www.bestwestern.com/en_US/book/hotels-in-greenville/best-western-plus-monica-royale-inn-suites/propertyCode.44632.html',
      hub: 'Greenville',
      badge: '',
    },
    {
      name: 'Sheraton McKinney Hotel',
      distance: '~38 mi · ~51 min from venue',
      description: 'Full-service hotel near McKinney\'s historic downtown. Outdoor pool, on-site dining, and complimentary parking. Pet-friendly (dogs/cats ≤50 lbs, $75 fee). Rooms from ~$103/night.',
      address: '1900 Gateway Boulevard, McKinney, TX 75070',
      phone: '+1 972-549-4000',
      bookingUrl: 'https://www.marriott.com/en-us/hotels/dalks-sheraton-mckinney-hotel/overview/',
      hub: 'McKinney',
      badge: '',
    },
    {
      name: 'The Neathery Estate Bed & Breakfast',
      distance: '~38 mi · ~51 min from venue',
      description: 'A charming boutique B&B in McKinney\'s historic downtown with 4 suites sleeping up to 13 guests. Perfect for VIPs or the wedding party who want a special stay together.',
      address: '215 N Waddill St, McKinney, TX 75069',
      phone: '(469) 343-8471',
      bookingUrl: 'https://www.neatheryestate.com/',
      hub: 'McKinney',
      badge: 'Boutique Pick',
    },
    {
      name: 'CottageKat — Farmersville Airbnb',
      distance: '~10 mi · ~15 min from venue',
      description: 'Entire cottage in historic Farmersville — the closest private rental to the venue. 2 bedrooms, 2 baths, sleeps up to 3 guests. Self check-in. Exact address provided after booking.',
      address: 'Farmersville, TX (exact address after booking)',
      phone: '',
      bookingUrl: 'https://www.airbnb.com/rooms/36040258',
      hub: 'Farmersville',
      badge: 'Closest to Venue',
    },
  ] as Array<{
    name: string;
    distance: string;
    description: string;
    address: string;
    phone: string;
    bookingUrl: string;
    hub: string;
    badge: string;
  }>,
  registry: [
    {
      name: 'Amazon',
      description: 'Our full registry for the home.',
      url: 'https://www.amazon.com/wedding/share/ThePaineWedding',
      icon: 'gift' as const,
    },
    {
      name: 'Target',
      description: 'Our Target registry for home essentials.',
      url: 'https://www.target.com/gift-registry/gift/ThePaineWedding',
      icon: 'gift' as const,
    },
  ],

  faq: [
    {
      q: 'Are kids invited?',
      a: 'As much as we love kids, we are doing an adult-only wedding! We would love for you to enjoy a date night away from the kids.',
    },
    {
      q: 'Can I bring a plus one?',
      a: 'Plus ones are reserved for long-term significant others or spouses. If you have a plus one, they will be included on your RSVP.',
    },
    {
      q: 'What should I wear?',
      a: 'Semi-formal! We would like everyone to dress up, but you do not have to come in a suit and tie! Come dressed up and ready to dance!',
    },
    {
      q: 'What time should I arrive?',
      a: 'Please arrive at 4:30 PM to allow time to find a seat. The ceremony will start on time and you will not be allowed in the chapel after it has begun.',
    },
    {
      q: 'Where should I park?',
      a: 'There is a parking lot at the venue that will be easy to find when you arrive on the property. Please do not park on the grass.',
    },
    {
      q: 'Is there transportation provided?',
      a: 'No, you will need to arrange your own transportation to and from the venue. We recommend planning for a rideshare if you plan on enjoying the open bar!',
    },
    {
      q: 'Will alcohol be served?',
      a: 'We will have a beer and wine open bar! We ask that you not bring your own alcohol, per our venue\'s request.',
    },
    {
      q: 'When is the RSVP deadline?',
      a: 'Please RSVP by August 1st, 2026, so we can have an accurate headcount for our caterer.',
    },
    {
      q: 'What if I can\'t attend?',
      a: 'We will miss you on our big day, but we totally understand! Please RSVP "no" so we know you won\'t be there — it really helps with our planning.',
    },
  ],

  // Our Story timeline
  story: [
    {
      year: '2021',
      title: 'How We Met',
      description:
        'Ashlyn and Jeffrey met at an ice cream social at Texas A&M University – Commerce in 2021. Ashlyn had asked a mutual friend to introduce them because she had been hoping for a chance to talk to him. After the introduction, they started texting and finding excuses to hang out. Their first official date was a trip to Sonic and a long drive around town where they talked for hours. They dated for about six months before going their separate ways — they both needed time to grow and mature in their walk with the Lord.',
      image: '/images/story/First round.jpg',
      imageFallback: '/images/story/First round.jpg',
    },
    {
      year: 'October 2024',
      title: 'Our Reunion',
      description:
        'Almost two years later, they both ended up at an A&M football game with 100,000 other people — sitting just five rows apart. They spotted each other and kept their distance, unsure if the other would want to reconnect. Afterward, Jeffrey texted Ashlyn just to say he hoped she was doing well. That simple message sparked nearly a year of monthly check-ins. In August of 2024, Jeffrey asked Ashlyn to hang out. She said no at first, nervous and second-guessing herself, but then regretted it and reached back out. Jeffrey drove four and a half hours to Houston to take Ashlyn on a date at Galveston Bay Brewing, where they talked for hours and realized they were both different people who had grown a lot in the years apart. Two months later, they started dating again on October 18th, 2024.',
      image: '/images/story/A&M Game(Reunion).jpg',
      imageFallback: '/images/story/A&M Game(Reunion).jpg',
    },
    {
      year: 'October 2024',
      title: 'Days by the Water',
      description:
        'The last year and a half has been long distance, but Ashlyn lives thirty minutes from Galveston — which means plenty of beach days and trips to the lake in Dallas. Any excuse to be outside in the sun, they took it.',
      image: '/images/story/Lake.jpg',
      imageFallback: '/images/story/Lake.jpg',
    },
    {
      year: '2024',
      title: 'Their First Trip to New York',
      description:
        'They love to travel and experience new places together. Their first big trip was New York City — Ashlyn had never been. Jeffrey has traveled his whole life, but he says experiencing places with Ashlyn for the first time makes it feel brand new again.',
      image: '/images/story/NYC.jpg',
      imageFallback: '/images/story/NYC.jpg',
    },
    {
      year: '2025',
      title: 'Quiet Weekends Together',
      description:
        'Any weekend without plans, they head to the park with their hammocks. They read, talk about life, or just enjoy being outside together. It is one of their favorite simple things.',
      image: '/images/story/Hammock.jpg',
      imageFallback: '/images/story/Hammock.jpg',
    },
    {
      year: '2025',
      title: 'Creating Together',
      description:
        'Jeffrey has done photography and videography for years, and Ashlyn shot photos in high school. They started getting asked to shoot proposals and weddings and discovered they make a great team — Jeffrey behind the camera, Ashlyn directing and posing clients. It has become a fun way to spend time together and be part of their friends\' biggest moments.',
      image: '/images/story/Photographers.jpg',
      imageFallback: '/images/story/Photographers.jpg',
    },
    {
      year: '2025',
      title: 'An Anniversary Weekend',
      description:
        'To celebrate one year of dating, they headed to San Antonio for the weekend. They strolled the River Walk, tried new restaurants, and ended with a celebratory dinner at what Google called "the most romantic restaurant in Texas." They spent the evening reflecting on the year and talking through their favorite memories together.',
      image: '/images/story/San Antonio.jpg',
      imageFallback: '/images/story/San Antonio.jpg',
    },
    {
      year: '2025',
      title: 'A Hill Country Escape',
      description:
        'A first for both of them — they went on wine tours, learned how the wine is made, and explored the Hill Country together. Another trip, another set of memories.',
      image: '/images/story/Fredricksburg.jpg',
      imageFallback: '/images/story/Fredricksburg.jpg',
    },
    {
      year: 'February 2026',
      title: 'The Proposal',
      description:
        'Jeffrey proposed on February 21st, 2026. Ashlyn thought she had planned a day for her friends Megan and Izzy to meet — she had no idea they were already in on it. After a full day together, they suggested a walk at Arbor Hills Nature Preserve and steered Ashlyn down a different path through the trees. That is when she saw Jeffrey waiting for her. He got down on one knee and asked her to spend forever with him. She said, "Yes, yes, yes, yes — I will!" The evening kept going: a private dinner at 60 Vines where they talked through all the planning that had gone into the day, then the biggest surprise of all — a party at Jeffrey\'s parents\' house filled with every person they love most.',
      image: '/images/story/Proposal.jpg',
      imageFallback: '/images/story/Proposal.jpg',
    },
  ],

  // Travel info
  travel: {
    airports: [
      {
        name: 'Dallas Love Field (DAL)',
        code: 'DAL',
        description:
          'The closest major airport to the venue, located in Dallas. Approximately 1 hour from Davis & Grey Farms.',
        url: 'https://www.dallas-lovefield.com/',
      },
      {
        name: 'Dallas/Fort Worth International (DFW)',
        code: 'DFW',
        description:
          'The largest airport in the area with more flight options. Approximately 1 hour to 1.5 hours from the venue depending on traffic.',
        url: 'https://www.dfwairport.com/',
      },
    ],
  },

  meta: {
    title: "Ashlyn & Jeffrey | The Paine Wedding",
    description:
      'Join us to celebrate our wedding at Davis & Grey Farms on September 26, 2026.',
    ogImage: '/images/engagement/og-image.jpg',
  },
} satisfies WeddingConfig;

// ============================================================
// IMAGE PATHS
// Drop real photos into /public/images/* and they auto-load.
// Falls back to Unsplash until real images are added.
// ============================================================

export const IMAGES = {
  hero: {
    main: '/images/hero/JeffAshlyn-7977_2.jpg',
    fallback: '/images/hero/JeffAshlyn-7977_2.jpg',
  },
  engagement: {
    main: '/images/engagement/engagement-1.webp',
    og: '/images/engagement/og-image.jpg',
    fallback: '/images/hero/JeffAshlyn-7977_2.jpg',
  },
  attire: {
    ladies: [
      '/images/attire/Womens Outfit 1.png',
      '/images/attire/Womens Outfit 2.jpg',
      '/images/attire/Womens Outfit 3.jpg',
      '/images/attire/Womens Outfit 4.jpg',
      '/images/attire/Womens Outfit 5.jpg',
      '/images/attire/Womens Outfit 6.png',
      '/images/attire/Womens Outfit 7.png',
      '/images/attire/Womens Outfit 8.jpg',
      '/images/attire/Womens Outfit 9.jpg',
      '/images/attire/Womens Outfit 10.jpg',
    ],
    gents: [
      '/images/attire/Mens Outfit 1.jpg',
      '/images/attire/Mens Outfit 2.jpg',
      '/images/attire/Mens Outfit 3.jpg',
      '/images/attire/Mens Outfit 4.png',
      '/images/attire/Mens Outfit 5.jpg',
      '/images/attire/Mens Outfit 6.jpg',
      '/images/attire/Mens Outfit 7.jpg',
      '/images/attire/Mens Outfit 8.jpg',
      '/images/attire/Mens Outfit 9.jpg',
    ],
    ladiesFallbacks: [
      '/images/attire/Womens Outfit 1.png',
      '/images/attire/Womens Outfit 2.jpg',
      '/images/attire/Womens Outfit 3.jpg',
    ],
    gentsFallbacks: [
      '/images/attire/Mens Outfit 1.jpg',
      '/images/attire/Mens Outfit 2.jpg',
      '/images/attire/Mens Outfit 3.jpg',
    ],
  },
};

// ============================================================
// TYPES
// ============================================================

type WeddingConfig = {
  couple: {
    bride: { first: string; last: string; full: string };
    groom: { first: string; last: string; full: string };
    names: string;
    lastName: string;
  };
  date: {
    display: string;
    iso: string;
    dayOfWeek: string;
    rsvpDeadline: string;
    rsvpDeadlineIso: string;
  };
  venue: {
    name: string;
    address: string;
    city: string;
    fullAddress: string;
    cityDisplay: string;
    mapsUrl: string;
    mapsEmbedSrc: string;
    ceremonyTime: string;
    cocktailTime: string;
    receptionTime: string;
    sendOffTime: string;
    parking: string;
    shuttle: string;
  };
  schedule: Array<{ time: string; title: string; description: string }>;
  dresscode: { short: string; summary: string; ladies: string; gentlemen: string };
  bridalParty: {
    bridesmaids: Array<{ name: string; role: string; relationship: string; image: string }>;
    groomsmen: Array<{ name: string; role: string; relationship: string; image: string }>;
  };
  mealOptions: Array<{ value: string; label: string }>;
  hotels: Array<{ name: string; distance: string; description: string; address: string; phone: string; bookingUrl: string; hub: string; badge: string }>;
  registry: Array<{ name: string; description: string; url: string; icon: 'gift' | 'heart' }>;
  faq: Array<{ q: string; a: string }>;
  story: Array<{
    year: string;
    title: string;
    description: string;
    image: string;
    imageFallback: string;
  }>;
  travel: {
    airports: Array<{
      name: string;
      code: string;
      description: string;
      url: string;
    }>;
  };
  meta: { title: string; description: string; ogImage: string };
};
