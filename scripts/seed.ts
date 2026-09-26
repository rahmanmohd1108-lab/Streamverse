/**
 * StreamVerse Demo Content Seeder
 *
 * Creates a fully usable demo dataset using:
 *   - Public-domain / sample test videos (Big Buck Bunny, Sintel, Mux test HLS)
 *   - Original SVG poster artwork generated on the fly (no copyright images)
 *   - Fictional movie/series titles
 *
 * The seeder is IDEMPOTENT — running it twice will not create duplicates.
 * It is safe to run in production after first deploy to bootstrap content.
 *
 * Usage:  bun run seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";

const db = new PrismaClient();

const PUBLIC_HLS =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const PUBLIC_MP4S = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

/**
 * Generate a deterministic SVG poster for a movie/series.
 * Pure original artwork — geometric gradients + text — so we ship
 * zero copyrighted images.
 */
function posterSvg(title: string, hue: number, type: "movie" | "series" = "movie") {
  const safe = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue}, 70%, 18%)"/>
      <stop offset="0.5" stop-color="hsl(${hue + 30}, 60%, 12%)"/>
      <stop offset="1" stop-color="hsl(${hue + 60}, 65%, 6%)"/>
    </linearGradient>
    <radialGradient id="r" cx="50%" cy="35%" r="55%">
      <stop offset="0" stop-color="hsl(${hue}, 80%, 50%)" stop-opacity="0.45"/>
      <stop offset="1" stop-color="hsl(${hue}, 80%, 30%)" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="500" height="750" fill="url(#g)"/>
  <rect width="500" height="750" fill="url(#r)"/>
  <g opacity="0.18" stroke="white" stroke-width="1">
    <circle cx="250" cy="260" r="180" fill="none"/>
    <circle cx="250" cy="260" r="120" fill="none"/>
    <circle cx="250" cy="260" r="60" fill="none"/>
  </g>
  <text x="250" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="36" fill="white" opacity="0.95">${safe.slice(0, 24)}</text>
  <text x="250" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-weight="600" font-size="14" fill="white" opacity="0.6" letter-spacing="3">${type.toUpperCase()}</text>
  <rect x="40" y="640" width="420" height="3" fill="white" opacity="0.25"/>
  <text x="40" y="680" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="white">${safe.slice(0, 30)}</text>
  <text x="40" y="708" font-family="Arial, sans-serif" font-size="12" fill="white" opacity="0.55">StreamVerse Original</text>
</svg>`;
}

function backdropSvg(title: string, hue: number) {
  const safe = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue}, 60%, 18%)"/>
      <stop offset="1" stop-color="hsl(${hue + 50}, 60%, 4%)"/>
    </linearGradient>
    <radialGradient id="r" cx="50%" cy="40%" r="60%">
      <stop offset="0" stop-color="hsl(${hue + 20}, 80%, 50%)" stop-opacity="0.35"/>
      <stop offset="1" stop-color="hsl(${hue}, 80%, 20%)" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <rect width="1600" height="900" fill="url(#r)"/>
  <g opacity="0.10" stroke="white" stroke-width="1.5">
    ${Array.from({ length: 12 }, (_, i) => `<path d="M ${i * 140} 0 L ${i * 140 + 200} 900" />`).join("\n    ")}
  </g>
  <text x="80" y="780" font-family="Arial, sans-serif" font-weight="800" font-size="80" fill="white" opacity="0.95">${safe.slice(0, 22)}</text>
  <text x="80" y="830" font-family="Arial, sans-serif" font-weight="500" font-size="20" fill="white" opacity="0.6">A StreamVerse Original Presentation</text>
</svg>`;
}

async function writePoster(name: string, svg: string) {
  const postersDir = path.join(process.cwd(), "public", "posters");
  await fs.mkdir(postersDir, { recursive: true });
  await fs.writeFile(path.join(postersDir, `${name}.svg`), svg, "utf8");
  return `/posters/${name}.svg`;
}

async function main() {
  console.log("🌱 Seeding StreamVerse...");

  // -------- Genres --------
  const genres = [
    "Action",
    "Adventure",
    "Animation",
    "Comedy",
    "Crime",
    "Documentary",
    "Drama",
    "Family",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Sports",
    "Thriller",
    "Western",
  ];
  for (const name of genres) {
    await db.genre.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }
  console.log(`  ✓ ${genres.length} genres`);

  // -------- Categories --------
  const categories = [
    "Featured",
    "Trending",
    "Popular",
    "New Releases",
    "Recommended",
    "Top Movies",
    "Top Series",
    "Recently Added",
  ];
  for (const name of categories) {
    await db.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }
  console.log(`  ✓ ${categories.length} categories`);

  // -------- Languages --------
  const languages = [
    "English",
    "Hindi",
    "Telugu",
    "Tamil",
    "Malayalam",
    "Kannada",
    "Bengali",
    "Marathi",
    "Punjabi",
    "Urdu",
  ];
  for (const name of languages) {
    await db.language.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }
  console.log(`  ✓ ${languages.length} languages`);

  // -------- Subscription plans --------
  const plans = [
    {
      name: "Free",
      slug: "free",
      price: 0,
      currency: "INR",
      billingPeriod: "MONTHLY",
      features: JSON.stringify([
        "Limited catalog access",
        "Standard definition streaming",
        "1 device at a time",
        "Ad-supported playback",
      ]),
      isPremium: false,
      active: true,
    },
    {
      name: "Basic",
      slug: "basic",
      price: 199,
      currency: "INR",
      billingPeriod: "MONTHLY",
      features: JSON.stringify([
        "HD streaming",
        "Selected catalog access",
        "2 devices simultaneously",
        "Ad-free experience",
        "Mobile + tablet + web",
      ]),
      isPremium: false,
      active: true,
    },
    {
      name: "Premium",
      slug: "premium",
      price: 649,
      currency: "INR",
      billingPeriod: "MONTHLY",
      features: JSON.stringify([
        "Full premium catalog",
        "4K UHD + HDR streaming",
        "4 devices simultaneously",
        "Ad-free experience",
        "Downloads on mobile",
        "All platforms supported",
      ]),
      isPremium: true,
      active: true,
    },
    {
      name: "Premium Annual",
      slug: "premium-annual",
      price: 6499,
      currency: "INR",
      billingPeriod: "YEARLY",
      features: JSON.stringify([
        "Everything in Premium",
        "17% savings vs monthly",
        "Priority customer support",
        "Early access to new releases",
      ]),
      isPremium: true,
      active: true,
    },
  ];
  for (const plan of plans) {
    await db.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log(`  ✓ ${plans.length} subscription plans`);

  // -------- Users --------
  const adminPw = await bcrypt.hash("admin12345", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@streamverse.local" },
    update: {},
    create: {
      name: "StreamVerse Admin",
      email: "admin@streamverse.local",
      passwordHash: adminPw,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });
  await db.profile.upsert({
    where: { id: `profile-admin-${admin.id}` },
    update: {},
    create: {
      id: `profile-admin-${admin.id}`,
      userId: admin.id,
      name: "Admin",
      avatar: null,
      language: "en",
      maturityLevel: "18+",
      isKids: false,
    },
  });

  const demoPw = await bcrypt.hash("demo12345", 10);
  const demo = await db.user.upsert({
    where: { email: "demo@streamverse.local" },
    update: {},
    create: {
      name: "Demo Viewer",
      email: "demo@streamverse.local",
      passwordHash: demoPw,
      role: "USER",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });
  await db.profile.upsert({
    where: { id: `profile-demo-${demo.id}` },
    update: {},
    create: {
      id: `profile-demo-${demo.id}`,
      userId: demo.id,
      name: "Main",
      language: "en",
      maturityLevel: "18+",
      isKids: false,
    },
  });
  await db.profile.upsert({
    where: { id: `profile-kids-${demo.id}` },
    update: {},
    create: {
      id: `profile-kids-${demo.id}`,
      userId: demo.id,
      name: "Kids",
      language: "en",
      maturityLevel: "ALL",
      isKids: true,
    },
  });
  console.log(`  ✓ 2 users (admin + demo), 3 profiles`);

  // -------- Sample Movies (original titles, public-domain test videos) --------
  const movieDefs: Array<{
    title: string;
    year: number;
    duration: number; // seconds
    description: string;
    language: string;
    genres: string[];
    cast: string;
    director: string;
    ageRating: string;
    country: string;
    hue: number;
    flags: { featured?: boolean; trending?: boolean; popular?: boolean; newRelease?: boolean; recommended?: boolean };
    videoIdx: number;
  }> = [
    {
      title: "Crimson Frontier",
      year: 2024,
      duration: 596,
      description:
        "A retired marshal on a distant colonial outpost is pulled back into service when a mysterious syndicate begins attacking outlying settlements. A western-set sci-fi thriller about loyalty, frontier justice, and the price of peace.",
      language: "English",
      genres: ["Action", "Sci-Fi", "Western"],
      cast: "Maya Brennan, Cassius Lane, Daniel Okonkwo",
      director: "Ines Marchetti",
      ageRating: "16+",
      country: "United States",
      hue: 0,
      flags: { featured: true, trending: true, popular: true, newRelease: true, recommended: true },
      videoIdx: 9,
    },
    {
      title: "Echoes of the Marrow",
      year: 2023,
      duration: 634,
      description:
        "A forensic linguist returns to her hometown to investigate a string of disappearances that match a pattern from her childhood. A slow-burn mystery thriller about memory, language, and inherited violence.",
      language: "English",
      genres: ["Mystery", "Thriller", "Drama"],
      cast: "Priyanka Deshmukh, Aria Vance, Tobias Reyes",
      director: "Helena Voss",
      ageRating: "16+",
      country: "United Kingdom",
      hue: 200,
      flags: { trending: true, popular: true, recommended: true },
      videoIdx: 7,
    },
    {
      title: "Tigers of Kodagu",
      year: 2024,
      duration: 712,
      description:
        "A coffee-estate heiress must broker peace between two warring families when a land dispute threatens to consume the Western Ghats. A sprawling multilingual drama about inheritance, ecology, and chosen family.",
      language: "Kannada",
      genres: ["Drama", "Family"],
      cast: "Deepika Nayak, Ravi Shastri, Anjali Menon",
      director: "Karthik Bhat",
      ageRating: "13+",
      country: "India",
      hue: 120,
      flags: { featured: true, newRelease: true, popular: true },
      videoIdx: 2,
    },
    {
      title: "Bullet Flowers",
      year: 2023,
      duration: 685,
      description:
        "Two hitwomen on opposite sides of a Mumbai turf war are forced into an uneasy alliance when they discover they're hunting the same target. A stylized action-thriller with a sharp emotional core.",
      language: "Hindi",
      genres: ["Action", "Crime", "Thriller"],
      cast: "Rhea Kapoor, Meera Iyer, Arjun Malhotra",
      director: "Anurag Khanna",
      ageRating: "18+",
      country: "India",
      hue: 320,
      flags: { trending: true, popular: true, recommended: true },
      videoIdx: 5,
    },
    {
      title: "Letters from Aldebaran",
      year: 2022,
      duration: 948,
      description:
        "The first interstellar colony loses contact with Earth. As supplies run low, a junior archivist uncovers a hidden archive that rewrites everything they believed about the mission. Quiet, character-driven science fiction.",
      language: "English",
      genres: ["Sci-Fi", "Drama", "Adventure"],
      cast: "Naomi Whitfield, Hideo Tanaka, Lucas Park",
      director: "Ines Marchetti",
      ageRating: "13+",
      country: "Canada",
      hue: 260,
      flags: { featured: true, popular: true },
      videoIdx: 8,
    },
    {
      title: "The Comedian's Last Set",
      year: 2024,
      duration: 540,
      description:
        "An aging stand-up comedian embarks on one final national tour after a cancer diagnosis, confronting the audiences, jokes, and ghosts of a lifetime on stage. Bittersweet comedy-drama.",
      language: "English",
      genres: ["Comedy", "Drama"],
      cast: "Marcus Bell, Frida Andersen, Jamil Haddad",
      director: "Samuel Okoro",
      ageRating: "16+",
      country: "United States",
      hue: 40,
      flags: { newRelease: true, recommended: true },
      videoIdx: 6,
    },
    {
      title: "Coral Tides",
      year: 2023,
      duration: 612,
      description:
        "A marine biologist and a small-town fisherman fight to save their reef from an offshore drilling operation. A romantic ecological drama about love, loss, and what we owe the sea.",
      language: "Malayalam",
      genres: ["Romance", "Drama", "Adventure"],
      cast: "Meera Iyer, Joseph Mathew, Anita Nair",
      director: "Karthik Bhat",
      ageRating: "13+",
      country: "India",
      hue: 180,
      flags: { popular: true, recommended: true },
      videoIdx: 1,
    },
    {
      title: "Subarashii Circuit",
      year: 2022,
      duration: 580,
      description:
        "A retired rally driver agrees to mentor a young protege across the most dangerous mountain passes of Japan. High-speed sports drama about mentorship, rivalry, and redemption.",
      language: "English",
      genres: ["Sports", "Drama", "Action"],
      cast: "Hideo Tanaka, Naomi Whitfield, Marcus Bell",
      director: "Yuki Tanaka",
      ageRating: "13+",
      country: "Japan",
      hue: 30,
      flags: { popular: true },
      videoIdx: 11,
    },
    {
      title: "Whispers in the Static",
      year: 2024,
      duration: 720,
      description:
        "A late-night radio host begins receiving calls from a voice claiming to be a long-dead caller. As the calls multiply, the host races to uncover a secret buried in her station's analog archives.",
      language: "English",
      genres: ["Horror", "Mystery", "Thriller"],
      cast: "Frida Andersen, Lucas Park, Aria Vance",
      director: "Helena Voss",
      ageRating: "18+",
      country: "Ireland",
      hue: 280,
      flags: { newRelease: true, trending: true, recommended: true },
      videoIdx: 4,
    },
    {
      title: "Lanterns of Lahore",
      year: 2023,
      duration: 660,
      description:
        "Three generations of women prepare for the annual festival of lights as old family wounds resurface. A sweeping generational drama about migration, food, and forgiveness.",
      language: "Urdu",
      genres: ["Drama", "Family"],
      cast: "Anjali Menon, Meera Iyer, Rhea Kapoor",
      director: "Samuel Okoro",
      ageRating: "ALL",
      country: "Pakistan",
      hue: 50,
      flags: { popular: true, recommended: true },
      videoIdx: 3,
    },
    {
      title: "Anya's Garden",
      year: 2022,
      duration: 540,
      description:
        "A young girl inherits her grandmother's overgrown garden and discovers it holds the key to a family secret. A gentle animated family drama about memory and growing up.",
      language: "English",
      genres: ["Animation", "Family", "Fantasy"],
      cast: "Anya Petrov, Mira Saito, Felix Lindgren",
      director: "Yuki Tanaka",
      ageRating: "ALL",
      country: "France",
      hue: 100,
      flags: { popular: true, recommended: true },
      videoIdx: 10,
    },
    {
      title: "Ferramentas",
      year: 2024,
      duration: 600,
      description:
        "In a near-future Lisbon, a black-market mechanic builds illegal augmentations for migrants hiding from the regime. A neon-soaked dystopian crime thriller about craft, class, and survival.",
      language: "English",
      genres: ["Crime", "Sci-Fi", "Thriller"],
      cast: "Jamil Haddad, Tobias Reyes, Maya Brennan",
      director: "Anurag Khanna",
      ageRating: "18+",
      country: "Portugal",
      hue: 220,
      flags: { newRelease: true, trending: true },
      videoIdx: 0,
    },
  ];

  for (const def of movieDefs) {
    const slug = slugify(def.title);
    const existing = await db.movie.findUnique({ where: { slug } });
    const posterPath = await writePoster(
      `movie-${slug}`,
      posterSvg(def.title, def.hue, "movie"),
    );
    const backdropPath = await writePoster(
      `backdrop-${slug}`,
      backdropSvg(def.title, def.hue),
    );
    const language = await db.language.findUnique({
      where: { slug: slugify(def.language) },
    });
    if (!language) continue;
    const movieGenres = await db.genre.findMany({
      where: { slug: { in: def.genres.map(slugify) } },
    });

    const data = {
      title: def.title,
      slug,
      description: def.description,
      releaseYear: def.year,
      duration: def.duration,
      ageRating: def.ageRating,
      posterUrl: posterPath,
      backdropUrl: backdropPath,
      trailerUrl: PUBLIC_MP4S[def.videoIdx % PUBLIC_MP4S.length],
      videoUrl: PUBLIC_MP4S[def.videoIdx % PUBLIC_MP4S.length],
      hlsUrl: PUBLIC_HLS,
      videoProvider: "demo",
      languageId: language.id,
      country: def.country,
      cast: def.cast,
      director: def.director,
      status: "PUBLISHED",
      isFeatured: def.flags.featured ?? false,
      isTrending: def.flags.trending ?? false,
      isPopular: def.flags.popular ?? false,
      isNewRelease: def.flags.newRelease ?? false,
      isRecommended: def.flags.recommended ?? false,
      publishedAt: new Date(),
    };

    if (existing) {
      await db.movie.update({
        where: { slug },
        data: { ...data, genres: { set: movieGenres } },
      });
    } else {
      await db.movie.create({
        data: { ...data, genres: { connect: movieGenres } },
      });
    }
  }
  console.log(`  ✓ ${movieDefs.length} movies`);

  // -------- Sample Series --------
  const seriesDefs = [
    {
      title: "Quanta",
      year: 2024,
      description:
        "A team of researchers at a particle accelerator begin receiving messages from themselves, dated three weeks in the future. As the predictions come true, they race to stop a catastrophe only they can see. Smart, intimate science fiction.",
      language: "English",
      genres: ["Sci-Fi", "Mystery", "Thriller"],
      cast: "Naomi Whitfield, Lucas Park, Maya Brennan",
      director: "Ines Marchetti",
      ageRating: "16+",
      country: "United States",
      hue: 280,
      flags: { featured: true, trending: true, popular: true, newRelease: true, recommended: true },
      seasons: [
        {
          seasonNumber: 1,
          title: "Season 1",
          description: "The team receives the first messages.",
          episodes: 6,
        },
      ],
    },
    {
      title: "Madras Diaries",
      year: 2023,
      description:
        "Four twenty-somethings share a Chennai flat, navigating careers, families, and the daily comedy of urban life. A warm, funny slice-of-life series in Tamil and English.",
      language: "Tamil",
      genres: ["Comedy", "Drama", "Family"],
      cast: "Meera Iyer, Karthik Bhat, Anjali Menon, Ravi Shastri",
      director: "Karthik Bhat",
      ageRating: "13+",
      country: "India",
      hue: 60,
      flags: { popular: true, recommended: true, trending: true },
      seasons: [
        {
          seasonNumber: 1,
          title: "Season 1",
          description: "The flatmates move in together.",
          episodes: 8,
        },
        {
          seasonNumber: 2,
          title: "Season 2",
          description: "A wedding. A layoff. A new flatmate.",
          episodes: 8,
        },
      ],
    },
    {
      title: "The Long Dark",
      year: 2024,
      description:
        "A small Arctic research outpost loses contact with the rest of the world during a six-month night. As winter closes in, the crew discovers something is moving in the dark. Slow-burn horror-thriller.",
      language: "English",
      genres: ["Horror", "Thriller", "Mystery"],
      cast: "Frida Andersen, Marcus Bell, Tobias Reyes",
      director: "Helena Voss",
      ageRating: "18+",
      country: "Norway",
      hue: 210,
      flags: { newRelease: true, trending: true, popular: true, recommended: true },
      seasons: [
        {
          seasonNumber: 1,
          title: "Polar Night",
          description: "The sun sets for the last time.",
          episodes: 6,
        },
      ],
    },
    {
      title: "Petal & Steel",
      year: 2022,
      description:
        "In an alternative 1920s Shanghai, a botanist and a blacksmith fall in love against the backdrop of an industrial revolution that threatens to swallow both their worlds. Romantic steampunk drama.",
      language: "English",
      genres: ["Romance", "Drama", "Fantasy"],
      cast: "Mira Saito, Daniel Okonkwo, Aria Vance",
      director: "Yuki Tanaka",
      ageRating: "13+",
      country: "Singapore",
      hue: 340,
      flags: { popular: true, recommended: true },
      seasons: [
        {
          seasonNumber: 1,
          title: "Season 1",
          description: "First meetings and first sparks.",
          episodes: 8,
        },
      ],
    },
  ];

  for (const def of seriesDefs) {
    const slug = slugify(def.title);
    const existing = await db.series.findUnique({ where: { slug } });
    const posterPath = await writePoster(
      `series-${slug}`,
      posterSvg(def.title, def.hue, "series"),
    );
    const backdropPath = await writePoster(
      `backdrop-series-${slug}`,
      backdropSvg(def.title, def.hue),
    );
    const language = await db.language.findUnique({
      where: { slug: slugify(def.language) },
    });
    if (!language) continue;
    const seriesGenres = await db.genre.findMany({
      where: { slug: { in: def.genres.map(slugify) } },
    });

    const data = {
      title: def.title,
      slug,
      description: def.description,
      releaseYear: def.year,
      posterUrl: posterPath,
      backdropUrl: backdropPath,
      trailerUrl: PUBLIC_MP4S[(def.hue % PUBLIC_MP4S.length)] ?? PUBLIC_MP4S[0],
      languageId: language.id,
      ageRating: def.ageRating,
      country: def.country,
      cast: def.cast,
      director: def.director,
      status: "PUBLISHED",
      isFeatured: def.flags.featured ?? false,
      isTrending: def.flags.trending ?? false,
      isPopular: def.flags.popular ?? false,
      isNewRelease: def.flags.newRelease ?? false,
      isRecommended: def.flags.recommended ?? false,
      publishedAt: new Date(),
    };

    let series: { id: string };
    if (existing) {
      series = await db.series.update({
        where: { slug },
        data: { ...data, genres: { set: seriesGenres } },
      });
    } else {
      series = await db.series.create({
        data: { ...data, genres: { connect: seriesGenres } },
      });
    }

    for (const seasonDef of def.seasons) {
      const season = await db.season.upsert({
        where: { seriesId_seasonNumber: { seriesId: series.id, seasonNumber: seasonDef.seasonNumber } },
        update: {
          title: seasonDef.title,
          description: seasonDef.description,
        },
        create: {
          seriesId: series.id,
          seasonNumber: seasonDef.seasonNumber,
          title: seasonDef.title,
          description: seasonDef.description,
          releaseDate: new Date(def.year, 0, 1),
        },
      });
      // Episodes
      for (let i = 1; i <= seasonDef.episodes; i++) {
        const epTitle = `Episode ${i}`;
        const epSlug = `${slug}-s${seasonDef.seasonNumber}e${i}`;
        const epPoster = await writePoster(
          `ep-${epSlug}`,
          posterSvg(`${def.title} — ${epTitle}`, (def.hue + i * 20) % 360, "movie"),
        );
        const video = PUBLIC_MP4S[(i + def.hue) % PUBLIC_MP4S.length];
        await db.episode.upsert({
          where: { seasonId_episodeNumber: { seasonId: season.id, episodeNumber: i } },
          update: {
            title: epTitle,
            description: `Episode ${i} of ${def.title} — ${seasonDef.title}.`,
            thumbnailUrl: epPoster,
            videoUrl: video,
            hlsUrl: PUBLIC_HLS,
            videoProvider: "demo",
            skipIntroStart: 5,
            skipIntroEnd: 35,
          },
          create: {
            seasonId: season.id,
            episodeNumber: i,
            title: epTitle,
            description: `Episode ${i} of ${def.title} — ${seasonDef.title}.`,
            duration: 600,
            thumbnailUrl: epPoster,
            videoUrl: video,
            hlsUrl: PUBLIC_HLS,
            videoProvider: "demo",
            releaseDate: new Date(def.year, i - 1, 1),
            skipIntroStart: 5,
            skipIntroEnd: 35,
          },
        });
      }
    }
  }
  console.log(`  ✓ ${seriesDefs.length} series with seasons & episodes`);

  // -------- Banners --------
  const featured = await db.movie.findFirst({ where: { isFeatured: true } });
  if (featured) {
    await db.banner.upsert({
      where: { id: `banner-featured-${featured.id}` },
      update: {},
      create: {
        id: `banner-featured-${featured.id}`,
        title: featured.title,
        imageUrl: featured.backdropUrl,
        videoUrl: featured.trailerUrl,
        contentId: featured.id,
        contentType: "movie",
        active: true,
        displayOrder: 0,
      },
    });
  }
  const featuredSeries = await db.series.findFirst({ where: { isFeatured: true } });
  if (featuredSeries) {
    await db.banner.upsert({
      where: { id: `banner-series-${featuredSeries.id}` },
      update: {},
      create: {
        id: `banner-series-${featuredSeries.id}`,
        title: featuredSeries.title,
        imageUrl: featuredSeries.backdropUrl,
        videoUrl: featuredSeries.trailerUrl,
        contentId: featuredSeries.id,
        contentType: "series",
        active: true,
        displayOrder: 1,
      },
    });
  }
  console.log(`  ✓ banners`);

  // -------- Default notification preferences for users --------
  for (const u of [admin, demo]) {
    await db.notificationPreference.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id },
    });
  }

  console.log("\n✅ StreamVerse seed complete.");
  console.log("   Admin login : admin@streamverse.local / admin12345");
  console.log("   Demo login  : demo@streamverse.local / demo12345");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
