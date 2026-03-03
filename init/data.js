const sampleListings = [
  {
    title: "Luxury Jungle Treehouse",
    description: "Live among the treetops in this luxurious treehouse surrounded by tropical rainforest.",
    image: {
      filename: "luxury_jungle_treehouse.jpg",
      url: "https://plus.unsplash.com/premium_photo-1697730133511-31d978a0e8a0?w=600&auto=format&fit=crop&q=60"
    },
    price: 2200,
    location: "Bali",
    country: "Indonesia",
    category: "Nature",
    geometry: {
      type: "Point",
      coordinates: [115.1889, -8.4095]
    }
  },

  {
    title: "Chic Paris Loft",
    description: "Charming and modern loft in the heart of Paris, steps away from the Eiffel Tower.",
    image: {
      filename: "chic_paris_loft.jpg",
      url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"
    },
    price: 2500,
    location: "Paris",
    country: "France",
    category: "City",
    geometry: {
      type: "Point",
      coordinates: [2.3522, 48.8566]
    }
  },

  {
    title: "Desert Glamping Tent",
    description: "A unique desert experience in a luxury tent under the stars.",
    image: {
      filename: "desert_glamping_tent.jpg",
      url: "https://images.unsplash.com/photo-1640755668096-4f4c7b8f4410"
    },
    price: 900,
    location: "Wadi Rum",
    country: "Jordan",
    category: "Camp",
    geometry: {
      type: "Point",
      coordinates: [35.4194, 29.5764]
    }
  },

  {
    title: "Nordic Glass Igloo",
    description: "Sleep under the Northern Lights in a cozy glass igloo.",
    image: {
      filename: "nordic_glass_igloo.jpg",
      url: "https://images.unsplash.com/photo-1634662593278-11d75aacab28"
    },
    price: 2700,
    location: "Rovaniemi",
    country: "Finland",
    category: "Cabin",
    geometry: {
      type: "Point",
      coordinates: [25.7294, 66.5039]
    }
  },

  {
    title: "Santorini Cliffside Home",
    description: "Whitewashed cliffside home with breathtaking Aegean Sea views.",
    image: {
      filename: "santorini_cliffside_home.jpg",
      url: "https://images.unsplash.com/photo-1705860007370-ddc843fc4ad5"
    },
    price: 3000,
    location: "Santorini",
    country: "Greece",
    category: "Castles",
    geometry: {
      type: "Point",
      coordinates: [25.4615, 36.3932]
    }
  },

  {
    title: "Coastal Surf Shack",
    description: "Relax in a boho surf shack just steps from the beach.",
    image: {
      filename: "coastal_surf_shack.jpg",
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
    },
    price: 800,
    location: "Byron Bay",
    country: "Australia",
    category: "Rooms",
    geometry: {
      type: "Point",
      coordinates: [153.6020, -28.6474]
    }
  },

  {
    title: "Tokyo Micro Apartment",
    description: "A compact apartment in downtown Tokyo.",
    image: {
      filename: "tokyo_micro_apartment.jpg",
      url: "https://images.unsplash.com/photo-1734667434795-b760235451dc"
    },
    price: 950,
    location: "Tokyo",
    country: "Japan",
    category: "City",
    geometry: {
      type: "Point",
      coordinates: [139.6917, 35.6895]
    }
  },

  {
    title: "Swiss Alps Chalet",
    description: "A wooden chalet nestled in the snowy Alps.",
    image: {
      filename: "swiss_alps_chalet.jpg",
      url: "https://images.unsplash.com/photo-1633341500706-62690376b1ec"
    },
    price: 2300,
    location: "Zermatt",
    country: "Switzerland",
    category: "Mountains",
    geometry: {
      type: "Point",
      coordinates: [7.7491, 46.0207]
    }
  },

  {
    title: "Rustic Mountain Cabin",
    description: "Unplug and unwind in this cozy mountain cabin.",
    image: {
      filename: "rustic_mountain_cabin.jpg",
      url: "https://images.unsplash.com/photo-1561637270-132c4c64c8dc"
    },
    price: 1200,
    location: "Aspen",
    country: "United States",
    category: "Mountains",
    geometry: {
      type: "Point",
      coordinates: [-106.8175, 39.1911]
    }
  },

  {
    title: "Lakeside A-Frame Cabin",
    description: "A peaceful A-frame cabin by the lake.",
    image: {
      filename: "lakeside_a_frame_cabin.jpg",
      url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914"
    },
    price: 1000,
    location: "Lake Tahoe",
    country: "United States",
    category: "Cabin",
    geometry: {
      type: "Point",
      coordinates: [-120.0324, 39.0968]
    }
  }
];

module.exports = sampleListings;
