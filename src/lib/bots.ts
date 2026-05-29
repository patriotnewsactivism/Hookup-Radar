// ============================================================
// Surge Bot System
// - 25+ diverse bots across all orientations
// - AI-powered contextual replies via /api/bot-reply
// - Realistic response delays with typing indicators
// - Never reveal bot status
// ============================================================

import { SurgeUser, Orientation } from '../types';

// ── Bot pool ──────────────────────────────────────────────────

export const ALL_BOT_PROFILES: Omit<SurgeUser, 'id' | 'distance'>[] = [

  // ── GAY MALE ─────────────────────────────────────────────
  {
    username: 'jake_atl',
    display_name: 'Jake',
    age: 28,
    bio: "Just moved here 6 months ago, still learning the city. Work in tech, gym 4x/week, decent cook. Here for a good time not a long time 😈 DDF, PrEP, ask me anything.",
    gender: 'Man',
    orientation: 'Gay',
    position: 'Top',
    body_type: 'Athletic',
    ethnicity: 'White',
    height: "6'1\"",
    weight: '185 lbs',
    lifestyle: 'Single',
    health_status: 'PrEP',
    looking_for: ['Right Now', 'NSA', 'FWB'],
    kinks: ['Oral', 'Rough', 'Foreplay'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=12',
    photo_urls: ['https://i.pravatar.cc/400?img=12', 'https://i.pravatar.cc/400?img=13'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: true, is_premium: true,
    blocked_users: [], favorite_users: [],
    profile_views: 847,
    show_distance: true, show_on_map: true,
    tags: ['verified', 'popular'],
    auth_email: undefined,
  },
  {
    username: 'nate_otter',
    display_name: 'Nate',
    age: 26,
    bio: "Otter looking for his pack 🦦 Software dev by day, chaos gremlin by night. Into board games, horror movies, hiking, and making bad decisions with the right person.",
    gender: 'Man',
    orientation: 'Gay',
    position: 'Vers',
    body_type: 'Otter',
    ethnicity: 'Asian',
    height: "5'9\"",
    weight: '155 lbs',
    lifestyle: 'Single',
    health_status: 'PrEP',
    looking_for: ['Friends', 'FWB', 'Right Now'],
    kinks: ['Puppy Play', 'Bondage', 'Foreplay'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=22',
    photo_urls: ['https://i.pravatar.cc/400?img=22'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 275,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },
  {
    username: 'chris_bear',
    display_name: 'Chris',
    age: 38,
    bio: "Big teddy bear energy. Love football, BBQ, Sunday farmers markets. Not looking for hookup-only — want something real-ish with someone I actually like. 6'2, 240.",
    gender: 'Man',
    orientation: 'Gay',
    position: 'Dom',
    body_type: 'Bear',
    ethnicity: 'White',
    height: "6'2\"",
    weight: '240 lbs',
    lifestyle: 'Single',
    health_status: 'Vaccinated (Mpox)',
    looking_for: ['FWB', 'Dates', 'NSA'],
    kinks: ['Leather', 'Bears', 'Bondage'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=52',
    photo_urls: ['https://i.pravatar.cc/400?img=52'],
    lat: 0, lng: 0,
    last_seen: new Date(Date.now() - 1800000).toISOString(),
    is_online: false, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 688,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },
  {
    username: 'dom_dc',
    display_name: 'Dominic',
    age: 34,
    bio: "Attorney. Gym 5x/wk. Competitive by nature, generous in private. Looking for someone who can keep up. DDF, tested monthly.",
    gender: 'Man',
    orientation: 'Gay',
    position: 'Top',
    body_type: 'Muscular',
    ethnicity: 'Latino',
    height: "5'11\"",
    weight: '195 lbs',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['NSA', 'Right Now', 'Ongoing'],
    kinks: ['Dom / Sub', 'Bondage', 'Discipline'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=61',
    photo_urls: ['https://i.pravatar.cc/400?img=61'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: true, is_premium: true,
    blocked_users: [], favorite_users: [],
    profile_views: 1203,
    show_distance: true, show_on_map: true,
    tags: ['verified'],
    auth_email: undefined,
  },
  {
    username: 'eli_twink',
    display_name: 'Eli',
    age: 23,
    bio: "Art student, perpetually broke but thriving. I talk too much on the first date and I'm fine with that 😂 Vers, fun, no strings — unless it's a good string.",
    gender: 'Man',
    orientation: 'Gay',
    position: 'Vers Bottom',
    body_type: 'Slim',
    ethnicity: 'Mixed',
    height: "5'8\"",
    weight: '145 lbs',
    lifestyle: 'Single',
    health_status: 'PrEP',
    looking_for: ['Chat', 'Dates', 'FWB'],
    kinks: ['Sensual', 'Roleplay', 'Foreplay'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=67',
    photo_urls: ['https://i.pravatar.cc/400?img=67'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 432,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },

  // ── LESBIAN ──────────────────────────────────────────────
  {
    username: 'lex_vibe',
    display_name: 'Lex',
    age: 27,
    bio: "Soft butch, big feelings. Hiking, plants, terrible reality TV, and girls who know what they want 🌿 Looking for someone who can match my energy (which is chaotic good).",
    gender: 'Woman',
    orientation: 'Lesbian',
    position: 'Dom',
    body_type: 'Athletic',
    ethnicity: 'Mixed',
    height: "5'7\"",
    weight: '',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['Dates', 'FWB', 'NSA'],
    kinks: ['Sensual', 'Dom / Sub', 'Roleplay'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=44',
    photo_urls: ['https://i.pravatar.cc/400?img=44'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: true, is_premium: true,
    blocked_users: [], favorite_users: [],
    profile_views: 612,
    show_distance: true, show_on_map: true,
    tags: ['verified'],
    auth_email: undefined,
  },
  {
    username: 'riley_wlw',
    display_name: 'Riley',
    age: 24,
    bio: "Femme 4 femme, honestly 💅 Musician, overthinker, makes incredible pasta. I will absolutely send you a voice memo instead of typing. Slide in if you vibe.",
    gender: 'Woman',
    orientation: 'Lesbian',
    position: 'N/A',
    body_type: 'Slim',
    ethnicity: 'White',
    height: "5'5\"",
    weight: '',
    lifestyle: 'Single',
    health_status: 'Ask Me',
    looking_for: ['NSA', 'Dates', 'FWB'],
    kinks: ['Sensual', 'Foreplay', 'Voyeurism'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=49',
    photo_urls: ['https://i.pravatar.cc/400?img=49'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 389,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },
  {
    username: 'bex_boston',
    display_name: 'Bex',
    age: 31,
    bio: "Butch. Nurse. Weekend trail runner. I have two cats and they'll judge you harshly. Zero patience for flakers. Looking for fun with someone who shows up.",
    gender: 'Woman',
    orientation: 'Lesbian',
    position: 'Dom',
    body_type: 'Athletic',
    ethnicity: 'White',
    height: "5'6\"",
    weight: '',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['FWB', 'Dates', 'Ongoing'],
    kinks: ['Rough', 'Oral', 'Bondage'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=56',
    photo_urls: ['https://i.pravatar.cc/400?img=56'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 541,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },

  // ── STRAIGHT WOMEN ───────────────────────────────────────
  {
    username: 'cass_htx',
    display_name: 'Cassandra',
    age: 29,
    bio: "Houston girl, zero drama. Finance by day, bad decisions by weekend. DDF, vaccinated, expect the same 😊 Not here for pen pals — let's actually make a plan.",
    gender: 'Woman',
    orientation: 'Straight',
    position: 'N/A',
    body_type: 'Curvy',
    ethnicity: 'Latina',
    height: "5'6\"",
    weight: '',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['NSA', 'FWB', 'Right Now'],
    kinks: ['Roleplay', 'Sensual', 'Rough'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=47',
    photo_urls: ['https://i.pravatar.cc/400?img=47'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: true, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 1102,
    show_distance: true, show_on_map: true,
    tags: ['verified'],
    auth_email: undefined,
  },
  {
    username: 'maya_nola',
    display_name: 'Maya',
    age: 31,
    bio: "New Orleans girl, big energy. Love good food, live music, and uncomplicated fun. Ask me about my tattoos 🌙 Not looking for anything serious right now.",
    gender: 'Woman',
    orientation: 'Straight',
    position: 'N/A',
    body_type: 'Toned',
    ethnicity: 'Black',
    height: "5'8\"",
    weight: '',
    lifestyle: 'Single',
    health_status: 'PrEP',
    looking_for: ['Right Now', 'NSA', 'Chat'],
    kinks: ['Rough', 'Oral', 'Exhibitionism'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=39',
    photo_urls: ['https://i.pravatar.cc/400?img=39'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 734,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },
  {
    username: 'tara_pdx',
    display_name: 'Tara',
    age: 26,
    bio: "Portland. Tattoos, coffee snob, rescue dog mom. I'm very much a night person and barely functional before noon. Situationship-free zone, but fun is welcome.",
    gender: 'Woman',
    orientation: 'Straight',
    position: 'N/A',
    body_type: 'Average',
    ethnicity: 'White',
    height: "5'4\"",
    weight: '',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['NSA', 'FWB', 'Tonight'],
    kinks: ['Sensual', 'Foreplay', 'Bondage'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=35',
    photo_urls: ['https://i.pravatar.cc/400?img=35'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: false, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 318,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },

  // ── STRAIGHT MEN ─────────────────────────────────────────
  {
    username: 'derek_pdx',
    display_name: 'Derek',
    age: 33,
    bio: "Portland. Lumberjack by look, software engineer by trade. I grill on Sundays, hike on Saturdays, don't flake — ever. 6'2, ask for pics 🤙",
    gender: 'Man',
    orientation: 'Straight',
    position: 'Dom',
    body_type: 'Athletic',
    ethnicity: 'White',
    height: "6'2\"",
    weight: '210 lbs',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['NSA', 'FWB', 'Right Now'],
    kinks: ['Rough', 'Dom / Sub', 'Oral'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=57',
    photo_urls: ['https://i.pravatar.cc/400?img=57'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: true, is_premium: true,
    blocked_users: [], favorite_users: [],
    profile_views: 541,
    show_distance: true, show_on_map: true,
    tags: ['verified'],
    auth_email: undefined,
  },
  {
    username: 'jay_chi',
    display_name: 'Jay',
    age: 29,
    bio: "Chicago. Real one. No games, no flaking, no half-ass energy. Here for the no-strings thing done right — your comfort matters.",
    gender: 'Man',
    orientation: 'Straight',
    position: 'N/A',
    body_type: 'Muscular',
    ethnicity: 'Black',
    height: "5'11\"",
    weight: '195 lbs',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['Right Now', 'NSA'],
    kinks: ['Oral', 'Rough', 'Dom / Sub'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=15',
    photo_urls: ['https://i.pravatar.cc/400?img=15'],
    lat: 0, lng: 0,
    last_seen: new Date(Date.now() - 900000).toISOString(),
    is_online: false, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 312,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },
  {
    username: 'marco_nyc',
    display_name: 'Marco',
    age: 36,
    bio: "New York. Restaurant owner, former Marine. Built for comfort, used for sport. Not ghosting you — I'm just actually busy. Patience rewarded.",
    gender: 'Man',
    orientation: 'Straight',
    position: 'Dom',
    body_type: 'Muscular',
    ethnicity: 'Latino',
    height: "6'0\"",
    weight: '220 lbs',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['NSA', 'Ongoing', 'Right Now'],
    kinks: ['Dom / Sub', 'Rough', 'Bondage'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=63',
    photo_urls: ['https://i.pravatar.cc/400?img=63'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: true, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 876,
    show_distance: true, show_on_map: true,
    tags: ['verified'],
    auth_email: undefined,
  },

  // ── BISEXUAL / PAN ────────────────────────────────────────
  {
    username: 'marcus_d',
    display_name: 'Marcus',
    age: 31,
    bio: "Laid back, no drama. Gym 5x/week, love the outdoors, lowkey foodie. Bi, vers, open to whatever feels right. Looking for real connections, not just screen time.",
    gender: 'Man',
    orientation: 'Bisexual',
    position: 'Vers',
    body_type: 'Muscular',
    ethnicity: 'Black',
    height: "5'11\"",
    weight: '200 lbs',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['NSA', 'FWB', 'Chat'],
    kinks: ['BDSM', 'Dom / Sub', 'Muscle Worship'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=21',
    photo_urls: ['https://i.pravatar.cc/400?img=21'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 312,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },
  {
    username: 'diana_bb',
    display_name: 'Diana',
    age: 27,
    bio: "Bi girl looking for fun 💚 Into women mostly but genuinely open. Graphic designer, 420 friendly, no judgment zone here. Good vibes or nothing.",
    gender: 'Woman',
    orientation: 'Bisexual',
    position: 'N/A',
    body_type: 'Curvy',
    ethnicity: 'Black',
    height: "5'5\"",
    weight: '',
    lifestyle: 'Single',
    health_status: 'Ask Me',
    looking_for: ['NSA', 'FWB', 'Dates'],
    kinks: ['Sensual', 'Roleplay', 'Exhibitionism'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=30',
    photo_urls: ['https://i.pravatar.cc/400?img=30'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 902,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },
  {
    username: 'sasha_q',
    display_name: 'Sasha',
    age: 29,
    bio: "Non-binary, pansexual, here for a vibe ✨ Art hoe who also lifts. Come correct or don't come at all 🖤 Poly, ethically so, communication required.",
    gender: 'Non-Binary',
    orientation: 'Pansexual',
    position: 'Switch',
    body_type: 'Toned',
    ethnicity: 'Mixed',
    height: "5'7\"",
    weight: '',
    lifestyle: 'Polyamorous',
    health_status: 'Tested Negative',
    looking_for: ['Chat', 'Friends', 'NSA', 'Dates'],
    kinks: ['BDSM', 'Roleplay', 'Sensual'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=38',
    photo_urls: ['https://i.pravatar.cc/400?img=38'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: true, is_premium: true,
    blocked_users: [], favorite_users: [],
    profile_views: 1456,
    show_distance: true, show_on_map: true,
    tags: ['verified'],
    auth_email: undefined,
  },
  {
    username: 'cam_bi',
    display_name: 'Cameron',
    age: 25,
    bio: "Bi and figuring it out — in the best way. Photographer, coffee addict, definitely too emotionally available for this app but here we are lol.",
    gender: 'Man',
    orientation: 'Bisexual',
    position: 'Vers Bottom',
    body_type: 'Slim',
    ethnicity: 'White',
    height: "5'10\"",
    weight: '160 lbs',
    lifestyle: 'Single',
    health_status: 'PrEP',
    looking_for: ['Chat', 'Dates', 'FWB'],
    kinks: ['Sensual', 'Foreplay', 'Oral'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=70',
    photo_urls: ['https://i.pravatar.cc/400?img=70'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 198,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },

  // ── QUEER / TRANS ─────────────────────────────────────────
  {
    username: 'quinn_trans',
    display_name: 'Quinn',
    age: 28,
    bio: "Trans masc, he/him. Queer and very much here. Bookstore employee, cyclist, dog person. Looking for genuine connection — dates, friends, or whatever unfolds.",
    gender: 'Trans Man',
    orientation: 'Queer',
    position: 'N/A',
    body_type: 'Average',
    ethnicity: 'White',
    height: "5'5\"",
    weight: '',
    lifestyle: 'Single',
    health_status: 'Ask Me',
    looking_for: ['Dates', 'Friends', 'FWB'],
    kinks: ['Sensual', 'Foreplay'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=59',
    photo_urls: ['https://i.pravatar.cc/400?img=59'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 267,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },
  {
    username: 'nova_enby',
    display_name: 'Nova',
    age: 24,
    bio: "They/them. Queer, femme, loud about it. Barista, amateur roller derby, extremely good at parallel parking. Here for women and enbies mostly, occasionally a very hot exception.",
    gender: 'Genderfluid',
    orientation: 'Queer',
    position: 'N/A',
    body_type: 'Curvy',
    ethnicity: 'Mixed',
    height: "5'4\"",
    weight: '',
    lifestyle: 'Single',
    health_status: 'Tested Negative',
    looking_for: ['Chat', 'Dates', 'NSA'],
    kinks: ['Sensual', 'Roleplay', 'Voyeurism'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=43',
    photo_urls: ['https://i.pravatar.cc/400?img=43'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: false, is_anonymous: false, is_verified: false, is_premium: false,
    blocked_users: [], favorite_users: [],
    profile_views: 441,
    show_distance: true, show_on_map: true,
    tags: [],
    auth_email: undefined,
  },

  // ── COUPLE ────────────────────────────────────────────────
  {
    username: 'alex_ryan',
    display_name: 'Alex & Ryan',
    age: 33,
    bio: "Couple (MM) looking for a third 🔥 Both bi, both attractive, zero drama. We have our own thing sorted — you'd be joining something fun, not fixing something broken.",
    gender: 'Couple (MM)',
    orientation: 'Bisexual',
    position: 'Vers',
    body_type: 'Athletic',
    ethnicity: 'Mixed',
    height: "5'10\" / 6'0\"",
    weight: '',
    lifestyle: 'Open Relationship',
    health_status: 'Tested Negative',
    looking_for: ['Third', 'NSA', 'FWB'],
    kinks: ['Voyeurism', 'Group', 'BDSM'],
    fantasies: '',
    photo_url: 'https://i.pravatar.cc/400?img=33',
    photo_urls: ['https://i.pravatar.cc/400?img=33'],
    lat: 0, lng: 0,
    last_seen: new Date().toISOString(),
    is_online: true, is_anonymous: false, is_verified: true, is_premium: true,
    blocked_users: [], favorite_users: [],
    profile_views: 1203,
    show_distance: true, show_on_map: true,
    tags: ['verified', 'couple'],
    auth_email: undefined,
  },
];

// ── Orientation compatibility map ─────────────────────────────
const ORIENTATION_COMPAT: Record<string, string[]> = {
  Gay:           ['Gay', 'Bisexual', 'Queer'],
  Lesbian:       ['Lesbian', 'Bisexual', 'Queer', 'Pansexual'],
  Straight:      ['Straight', 'Bisexual'],
  Bisexual:      ['Gay', 'Straight', 'Bisexual', 'Queer', 'Pansexual', 'Lesbian'],
  Bi:            ['Gay', 'Straight', 'Bisexual', 'Bi', 'Queer', 'Pansexual', 'Lesbian'],
  Pansexual:     ['Gay', 'Straight', 'Bisexual', 'Pansexual', 'Queer', 'Lesbian'],
  Queer:         ['Queer', 'Bisexual', 'Pansexual', 'Gay', 'Lesbian'],
  Questioning:   ['Bisexual', 'Pansexual', 'Queer'],
  Heteroflexible:['Straight', 'Bisexual'],
  Homoflexible:  ['Gay', 'Lesbian', 'Bisexual', 'Queer'],
  Fluid:         ['Bisexual', 'Pansexual', 'Queer', 'Gay', 'Lesbian', 'Straight'],
};

/** Deterministically seed bots for a geographic tile */
function tileKey(lat: number, lng: number): number {
  return Math.floor(lat * 10) * 10000 + Math.floor(lng * 10);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function jitter(base: number, rand: () => number, spread: number): number {
  return base + (rand() - 0.5) * spread;
}

export function getBotsForArea(
  lat: number,
  lng: number,
  userOrientation: Orientation | undefined
): (Omit<SurgeUser, 'id' | 'distance'> & { id: string })[] {
  const orient = userOrientation ?? 'Bisexual';
  const compat = ORIENTATION_COMPAT[orient] ?? ['Bisexual', 'Pansexual'];

  const pool = ALL_BOT_PROFILES.filter(b => compat.includes(b.orientation));
  if (pool.length === 0) return [];

  const rand = seededRandom(tileKey(lat, lng));
  const count = 3 + Math.floor(rand() * 6); // 3–8

  const shuffled = [...pool].sort(() => rand() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((bot, i) => ({
    ...bot,
    id: `bot_${bot.username}_${tileKey(lat, lng)}`,
    lat: jitter(lat, rand, 0.04),
    lng: jitter(lng, rand, 0.04),
    is_online: i < Math.ceil(count * 0.6),
    last_seen: new Date(Date.now() - Math.floor(rand() * 7200000)).toISOString(),
  }));
}

/** Look up bot profile from a bot ID (format: bot_{username}_{tileKey}) */
export function getBotProfileById(botId: string) {
  const withoutPrefix = botId.replace(/^bot_/, '');
  return ALL_BOT_PROFILES.find(b =>
    withoutPrefix === b.username ||
    withoutPrefix.startsWith(b.username + '_')
  ) ?? null;
}

// ── AI-powered bot reply ──────────────────────────────────────

export async function getAIBotReply(
  botId: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  const botProfile = getBotProfileById(botId);
  if (!botProfile) return pick(BOT_REPLIES.default);

  const response = await fetch('/api/bot-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      botProfile: {
        display_name: botProfile.display_name,
        bio: botProfile.bio,
        age: botProfile.age,
        gender: botProfile.gender,
        orientation: botProfile.orientation,
        position: botProfile.position,
        body_type: botProfile.body_type,
        looking_for: botProfile.looking_for,
        kinks: botProfile.kinks,
      },
      conversationHistory,
      userMessage,
    }),
  });

  if (!response.ok) throw new Error('API unavailable');
  const data = await response.json() as { reply?: string };
  if (!data.reply) throw new Error('Empty reply');
  return data.reply;
}

// ── Bot reply system ──────────────────────────────────────────

export function botReplyDelay(): number {
  const min = 4000;
  const max = 18000;
  return min + Math.floor(Math.random() * (max - min));
}

export const BOT_REPLIES: Record<string, string[]> = {
  greeting: [
    "hey! what's good?",
    "oh hey! wasn't expecting a message. what's up?",
    "heyyy 👀 how are you?",
    "well look who it is lol. what's good",
    "hey you! was literally just about to get off this app. good timing.",
    "omg hi! been a second, what's up",
  ],
  interest: [
    "okay ngl you caught my eye",
    "I'm lowkey into this conversation already",
    "you seem interesting tbh",
    "not gonna lie, glad you messaged",
    "honestly didn't expect to find someone worth talking to tonight lol",
  ],
  busy: [
    "ugh I'm at work rn but text me later tonight?",
    "sorry just saw this! been slammed all day",
    "hey! can we chat in like an hour? in the middle of something",
    "omg sorry just got this notif 😭",
    "just got out of a meeting omg hi, what'd I miss",
  ],
  maybe: [
    "maybe… what did you have in mind? 😏",
    "depends on what you're offering lol",
    "tell me more first 👀",
    "hmm. convince me",
    "that depends… are you close?",
    "idk, you'd have to sell me on it a bit more",
  ],
  flirt: [
    "okay okay I see you 😏",
    "that's bold lol. I respect it",
    "you're funny. I like that",
    "okay you definitely got my attention 🔥",
    "smooth lol. points for that",
  ],
  location: [
    "yeah I'm close actually, like 10 min away",
    "not far at all tbh",
    "close enough 😏 why?",
    "closer than you think lol",
    "pretty close actually — same neighborhood basically",
  ],
  nsfw: [
    "lol okay getting right to it huh 😂",
    "bold. I like bold.",
    "ha okay slow down just a little bit first 😂",
    "that's… a choice to open with 😂 but I'm not mad at it",
    "okay slow your roll 😏 tell me a little about yourself first",
  ],
  meetup: [
    "yeah let's figure something out, what's your schedule like?",
    "I'm down, what did you have in mind?",
    "yes but tonight might be tight — can you do tomorrow?",
    "okay I'm intrigued. where/when?",
    "let's make a plan then 🔥 I hate vague \"let's hang\" stuff",
  ],
  default: [
    "lol facts",
    "ha okay I feel that",
    "that's actually kinda fair tbh",
    "I mean… yeah, same",
    "right?? honestly",
    "haha okay okay",
    "I actually love that",
    "ngl that's a good point",
    "fr though",
  ],
};

export function getBotReply(messageText: string): string {
  const lower = messageText.toLowerCase();

  if (/^(hey|hi|hello|sup|yo|heyy|heyyy|what'?s up|wassup|morning|good morning|evening)/.test(lower)) {
    return pick(BOT_REPLIES.greeting);
  }
  if (/\b(busy|work|later|tonight|free|available)\b/.test(lower)) {
    return pick(BOT_REPLIES.busy);
  }
  if (/\b(where|close|nearby|location|far|area|distance|how far|miles?)\b/.test(lower)) {
    return pick(BOT_REPLIES.location);
  }
  if (/\b(sex|fuck|suck|dick|cock|ass|naked|nude|pic|send pic|nudes|horny)\b/.test(lower)) {
    return pick(BOT_REPLIES.nsfw);
  }
  if (/\b(cute|hot|sexy|attractive|handsome|beautiful|gorgeous|pretty)\b/.test(lower)) {
    return pick(BOT_REPLIES.flirt);
  }
  if (/\b(meet|hookup|hook up|come over|your place|my place|hang out|come through)\b/.test(lower)) {
    return pick(BOT_REPLIES.meetup);
  }
  if (/\b(maybe|not sure|idk|depends|possibly|kinda|hmm)\b/.test(lower)) {
    return pick(BOT_REPLIES.maybe);
  }
  if (/\b(interesting|cool|nice|wow|really|seriously|no way|facts)\b/.test(lower)) {
    return pick(BOT_REPLIES.interest);
  }

  return pick(BOT_REPLIES.default);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const BOT_IDS_PREFIX = 'bot_';
export const isBot = (userId: string) => userId.startsWith(BOT_IDS_PREFIX);
