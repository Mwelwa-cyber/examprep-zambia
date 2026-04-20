/**
 * Seed data for the `games` Firestore collection.
 *
 * Shape matches the agreed document schema exactly:
 *   {
 *     title, subject, grade, type, difficulty, description, timer,
 *     points, active, cbc_topic, questions[]
 *   }
 *
 * Import these into Firestore using the admin button at /admin/games-seed
 * (wired to `upsertGame` in gamesService.js).
 *
 * Document IDs use the convention `<subject>_<slug>_g<grade>` so they are
 * stable across environments and easy to reason about in URLs / logs.
 */

/* ────────────────────────────────────────────────────────────────────
 *  GRADE 4 — MATHEMATICS — Speed Tables Challenge
 *  This is the "first complete working module" we are testing end-to-end.
 * ──────────────────────────────────────────────────────────────────── */
const SPEED_TABLES_G4 = {
  id: 'math_speed_tables_g4',
  title: 'Speed Tables Challenge',
  subject: 'mathematics',
  grade: 4,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Answer multiplication questions before time runs out.',
  timer: 60,
  points: 10,
  active: true,
  cbc_topic: 'Multiplication',
  questions: [
    { question: '6 × 7 = ?',  options: ['42', '36', '48', '56'], answer: '42' },
    { question: '8 × 5 = ?',  options: ['30', '35', '40', '45'], answer: '40' },
    { question: '9 × 6 = ?',  options: ['52', '54', '56', '63'], answer: '54' },
    { question: '7 × 7 = ?',  options: ['42', '47', '49', '56'], answer: '49' },
    { question: '4 × 9 = ?',  options: ['32', '36', '40', '45'], answer: '36' },
    { question: '5 × 8 = ?',  options: ['35', '40', '45', '48'], answer: '40' },
    { question: '3 × 12 = ?', options: ['24', '30', '33', '36'], answer: '36' },
    { question: '6 × 8 = ?',  options: ['42', '46', '48', '54'], answer: '48' },
    { question: '7 × 9 = ?',  options: ['56', '63', '72', '81'], answer: '63' },
    { question: '2 × 11 = ?', options: ['20', '21', '22', '24'], answer: '22' },
    { question: '8 × 8 = ?',  options: ['56', '60', '64', '72'], answer: '64' },
    { question: '9 × 9 = ?',  options: ['72', '81', '90', '99'], answer: '81' },
    { question: '4 × 6 = ?',  options: ['20', '22', '24', '28'], answer: '24' },
    { question: '5 × 5 = ?',  options: ['20', '25', '30', '35'], answer: '25' },
    { question: '7 × 8 = ?',  options: ['54', '56', '58', '64'], answer: '56' },
    { question: '6 × 9 = ?',  options: ['48', '54', '56', '63'], answer: '54' },
    { question: '3 × 7 = ?',  options: ['18', '21', '24', '27'], answer: '21' },
    { question: '11 × 4 = ?', options: ['40', '42', '44', '48'], answer: '44' },
    { question: '12 × 5 = ?', options: ['55', '60', '65', '70'], answer: '60' },
    { question: '8 × 9 = ?',  options: ['64', '72', '81', '89'], answer: '72' },
  ],
}

/* ────────────────────────────────────────────────────────────────────
 *  GRADE 4 — MATHEMATICS — Fraction Match
 * ──────────────────────────────────────────────────────────────────── */
const FRACTION_MATCH_G4 = {
  id: 'math_fraction_match_g4',
  title: 'Fraction Match',
  subject: 'mathematics',
  grade: 4,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Pick the equivalent fraction before the timer beats you.',
  timer: 90,
  points: 10,
  active: true,
  cbc_topic: 'Fractions',
  questions: [
    { question: 'Which is equal to 1/2?',     options: ['2/3', '3/6', '4/10', '5/9'],   answer: '3/6' },
    { question: 'Simplify 4/8.',              options: ['1/2', '1/3', '2/3', '3/4'],    answer: '1/2' },
    { question: '2/3 of 12 is…',              options: ['4', '6', '8', '10'],           answer: '8' },
    { question: 'Which is largest?',          options: ['1/2', '1/3', '1/4', '1/5'],    answer: '1/2' },
    { question: 'Simplify 6/9.',              options: ['2/3', '3/4', '4/5', '5/6'],    answer: '2/3' },
    { question: '1/4 + 1/4 = ?',              options: ['1/8', '2/4', '2/8', '1/2'],    answer: '2/4' },
    { question: '3/5 of 20 is…',              options: ['8', '10', '12', '15'],         answer: '12' },
    { question: 'Simplify 10/15.',            options: ['1/2', '2/3', '3/4', '4/5'],    answer: '2/3' },
    { question: 'Which is smallest?',         options: ['3/4', '3/5', '3/6', '3/7'],    answer: '3/7' },
    { question: '1 − 1/3 = ?',                options: ['1/3', '2/3', '3/3', '4/3'],    answer: '2/3' },
    { question: '3/4 + 1/4 = ?',              options: ['2/4', '3/4', '1', '4/4'],      answer: '1' },
    { question: 'Simplify 8/12.',             options: ['1/2', '2/3', '3/4', '4/5'],    answer: '2/3' },
  ],
}

/* ────────────────────────────────────────────────────────────────────
 *  GRADE 4 — ENGLISH — Spell It Right
 * ──────────────────────────────────────────────────────────────────── */
const SPELL_IT_RIGHT_G4 = {
  id: 'english_spell_it_right_g4',
  title: 'Spell It Right',
  subject: 'english',
  grade: 4,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Pick the correct spelling of the underlined word.',
  timer: 90,
  points: 10,
  active: true,
  cbc_topic: 'Spelling',
  questions: [
    { question: 'Choose the correct spelling:',   options: ['recieve', 'receive', 'receeve', 'receve'],   answer: 'receive' },
    { question: 'Choose the correct spelling:',   options: ['becuase', 'because', 'becouse', 'becaus'],    answer: 'because' },
    { question: 'Choose the correct spelling:',   options: ['which', 'wich', 'whch', 'witch'],             answer: 'which' },
    { question: 'Choose the correct spelling:',   options: ['frend', 'freind', 'friend', 'freand'],        answer: 'friend' },
    { question: 'Choose the correct spelling:',   options: ['beautifull', 'beutiful', 'beautiful', 'beautifl'], answer: 'beautiful' },
    { question: 'Choose the correct spelling:',   options: ['happened', 'happend', 'hapenned', 'hapened'], answer: 'happened' },
    { question: 'Choose the correct spelling:',   options: ['seperate', 'separate', 'seprate', 'separete'], answer: 'separate' },
    { question: 'Choose the correct spelling:',   options: ['tomorrow', 'tommorow', 'tommorrow', 'tomorow'], answer: 'tomorrow' },
    { question: 'Choose the correct spelling:',   options: ['begining', 'beggining', 'beginning', 'begginning'], answer: 'beginning' },
    { question: 'Choose the correct spelling:',   options: ['definately', 'definitely', 'definitley', 'definitly'], answer: 'definitely' },
  ],
}

/* ────────────────────────────────────────────────────────────────────
 *  GRADE 5 — SCIENCE — Human Body Explorer
 * ──────────────────────────────────────────────────────────────────── */
const HUMAN_BODY_G5 = {
  id: 'science_human_body_g5',
  title: 'Human Body Explorer',
  subject: 'science',
  grade: 5,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Learn about organs, senses and body systems.',
  timer: 90,
  points: 10,
  active: true,
  cbc_topic: 'The Human Body',
  questions: [
    { question: 'Which organ pumps blood around the body?',  options: ['Lungs', 'Heart', 'Liver', 'Stomach'],  answer: 'Heart' },
    { question: 'We breathe in oxygen through the…',         options: ['Stomach', 'Skin', 'Lungs', 'Kidneys'], answer: 'Lungs' },
    { question: 'The sense organ for smelling is the…',      options: ['Ear', 'Eye', 'Tongue', 'Nose'],        answer: 'Nose' },
    { question: 'Which part supports the body?',             options: ['Muscles', 'Skeleton', 'Blood', 'Skin'], answer: 'Skeleton' },
    { question: 'Food is broken down in the…',               options: ['Heart', 'Digestive system', 'Lungs', 'Brain'], answer: 'Digestive system' },
    { question: 'How many senses does a human have?',        options: ['3', '4', '5', '6'],                    answer: '5' },
    { question: 'Which organ controls thinking?',            options: ['Heart', 'Kidney', 'Brain', 'Liver'],   answer: 'Brain' },
    { question: 'A balanced diet gives our body…',           options: ['Sugar', 'Nutrients', 'Water only', 'Salt'], answer: 'Nutrients' },
    { question: 'Blood is carried around the body by…',      options: ['Nerves', 'Bones', 'Veins and arteries', 'Muscles'], answer: 'Veins and arteries' },
    { question: 'The skin helps us sense…',                  options: ['Sound', 'Touch', 'Smell', 'Taste'],    answer: 'Touch' },
  ],
}

/* ────────────────────────────────────────────────────────────────────
 *  GRADE 6 — MATHEMATICS — Math Memory (memory_match type placeholder)
 *  Left in the seed so teachers can see the shape for non-quiz games.
 * ──────────────────────────────────────────────────────────────────── */
const MATH_MEMORY_G6 = {
  id: 'math_memory_g6',
  title: 'Math Memory',
  subject: 'mathematics',
  grade: 6,
  type: 'memory_match',
  difficulty: 'medium',
  description: 'Match each multiplication to its answer.',
  timer: 120,
  points: 10,
  active: true,
  cbc_topic: 'Multiplication',
  questions: [
    { question: '7 × 6', options: [], answer: '42' },
    { question: '7 × 8', options: [], answer: '56' },
    { question: '8 × 4', options: [], answer: '32' },
    { question: '8 × 9', options: [], answer: '72' },
    { question: '7 × 7', options: [], answer: '49' },
    { question: '8 × 8', options: [], answer: '64' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════
 *  LOWER PRIMARY — Grades 1 to 3
 * ═══════════════════════════════════════════════════════════════════ */

const COUNTING_G1 = {
  id: 'math_counting_g1',
  title: 'Counting Fun',
  subject: 'mathematics',
  grade: 1,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Count objects and pick the right number.',
  timer: 60,
  points: 10,
  active: true,
  cbc_topic: 'Numbers 1-20',
  questions: [
    { question: 'How many? 🍎🍎🍎',               options: ['2', '3', '4', '5'],   answer: '3' },
    { question: 'How many? 🐸🐸🐸🐸🐸',           options: ['4', '5', '6', '7'],   answer: '5' },
    { question: 'What comes after 7?',              options: ['6', '8', '9', '10'],  answer: '8' },
    { question: 'What comes before 10?',            options: ['8', '9', '11', '12'], answer: '9' },
    { question: '2 + 1 = ?',                        options: ['2', '3', '4', '5'],   answer: '3' },
    { question: '5 + 5 = ?',                        options: ['8', '9', '10', '11'], answer: '10' },
    { question: 'How many? 🌟🌟🌟🌟🌟🌟🌟',       options: ['5', '6', '7', '8'],   answer: '7' },
    { question: '3 − 1 = ?',                        options: ['1', '2', '3', '4'],   answer: '2' },
    { question: 'Which is biggest?',                options: ['1', '5', '3', '9'],   answer: '9' },
    { question: 'Which is smallest?',               options: ['4', '7', '2', '8'],   answer: '2' },
  ],
}

const ABC_WORDS_G1 = {
  id: 'english_abc_words_g1',
  title: 'ABC Words',
  subject: 'english',
  grade: 1,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Match pictures to the right word.',
  timer: 60,
  points: 10,
  active: true,
  cbc_topic: 'Reading',
  questions: [
    { question: 'Which word matches 🐱?', options: ['CAT', 'DOG', 'HAT', 'BAT'], answer: 'CAT' },
    { question: 'Which word matches 🐶?', options: ['CAT', 'DOG', 'COW', 'PIG'], answer: 'DOG' },
    { question: 'Which word matches ☀️?', options: ['SUN', 'RUN', 'FUN', 'BUN'], answer: 'SUN' },
    { question: 'Which word matches 🐟?', options: ['FISH', 'DISH', 'WISH', 'MISS'], answer: 'FISH' },
    { question: 'Which word matches 🚗?', options: ['BAR', 'CAR', 'EAR', 'JAR'], answer: 'CAR' },
    { question: 'Which word matches 🌳?', options: ['TREE', 'FREE', 'KNEE', 'BEE'], answer: 'TREE' },
    { question: 'Which letter starts "Ball"?', options: ['A', 'B', 'D', 'P'], answer: 'B' },
    { question: 'Which letter starts "Egg"?', options: ['A', 'E', 'I', 'O'], answer: 'E' },
  ],
}

const ADD_SUB_G2 = {
  id: 'math_add_sub_g2',
  title: 'Add & Subtract within 20',
  subject: 'mathematics',
  grade: 2,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Sums and take-aways — answer before the clock runs out.',
  timer: 75,
  points: 10,
  active: true,
  cbc_topic: 'Addition & Subtraction',
  questions: [
    { question: '7 + 4 = ?',   options: ['10', '11', '12', '13'], answer: '11' },
    { question: '13 − 5 = ?',  options: ['6', '7', '8', '9'],     answer: '8'  },
    { question: '9 + 6 = ?',   options: ['13', '14', '15', '16'], answer: '15' },
    { question: '18 − 9 = ?',  options: ['7', '8', '9', '10'],    answer: '9'  },
    { question: '6 + 7 = ?',   options: ['11', '12', '13', '14'], answer: '13' },
    { question: '20 − 8 = ?',  options: ['11', '12', '13', '14'], answer: '12' },
    { question: '5 + 9 = ?',   options: ['13', '14', '15', '16'], answer: '14' },
    { question: '16 − 7 = ?',  options: ['7', '8', '9', '10'],    answer: '9'  },
    { question: '8 + 8 = ?',   options: ['15', '16', '17', '18'], answer: '16' },
    { question: '12 − 4 = ?',  options: ['6', '7', '8', '9'],     answer: '8'  },
    { question: '3 + 9 = ?',   options: ['11', '12', '13', '14'], answer: '12' },
    { question: '17 − 9 = ?',  options: ['6', '7', '8', '9'],     answer: '8'  },
  ],
}

const SIGHT_WORDS_G2 = {
  id: 'english_sight_words_g2',
  title: 'Sight Words',
  subject: 'english',
  grade: 2,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Pick the correctly-spelt common word.',
  timer: 60,
  points: 10,
  active: true,
  cbc_topic: 'Spelling',
  questions: [
    { question: 'Pick the correct word:', options: ['wen',   'when',  'whin', 'whan'], answer: 'when' },
    { question: 'Pick the correct word:', options: ['tje',   'the',   'ther', 'teh'],  answer: 'the'  },
    { question: 'Pick the correct word:', options: ['thay',  'they',  'thei', 'thay'], answer: 'they' },
    { question: 'Pick the correct word:', options: ['bicuz', 'beacuz','becuz','because'], answer: 'because' },
    { question: 'Pick the correct word:', options: ['from',  'frum',  'forom','fram'], answer: 'from' },
    { question: 'Pick the correct word:', options: ['ther',  'there', 'their','tere'], answer: 'there' },
    { question: 'Pick the correct word:', options: ['who',   'hoo',   'whoo', 'woh'],  answer: 'who'  },
    { question: 'Pick the correct word:', options: ['wod',   'would', 'wud',  'wouod'], answer: 'would' },
  ],
}

const TIMES_TABLES_G3 = {
  id: 'math_times_tables_g3',
  title: 'Times Tables 2 to 5',
  subject: 'mathematics',
  grade: 3,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Multiplication tables 2, 3, 4 and 5.',
  timer: 60,
  points: 10,
  active: true,
  cbc_topic: 'Multiplication',
  questions: [
    { question: '2 × 5 = ?',  options: ['8', '10', '12', '15'], answer: '10' },
    { question: '3 × 4 = ?',  options: ['10', '11', '12', '14'], answer: '12' },
    { question: '4 × 6 = ?',  options: ['18', '22', '24', '28'], answer: '24' },
    { question: '5 × 7 = ?',  options: ['30', '35', '40', '45'], answer: '35' },
    { question: '3 × 8 = ?',  options: ['21', '24', '27', '32'], answer: '24' },
    { question: '2 × 9 = ?',  options: ['16', '17', '18', '19'], answer: '18' },
    { question: '4 × 4 = ?',  options: ['12', '14', '16', '18'], answer: '16' },
    { question: '5 × 5 = ?',  options: ['20', '25', '30', '35'], answer: '25' },
    { question: '3 × 6 = ?',  options: ['15', '18', '21', '24'], answer: '18' },
    { question: '4 × 9 = ?',  options: ['32', '36', '40', '42'], answer: '36' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════
 *  MIDDLE PRIMARY — Grades 4 to 6 (beyond the existing ones above)
 * ═══════════════════════════════════════════════════════════════════ */

const PLANT_PARTS_G4 = {
  id: 'science_plant_parts_g4',
  title: 'Plant Parts',
  subject: 'science',
  grade: 4,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Roots, stems, leaves and flowers — do you know what each part does?',
  timer: 75,
  points: 10,
  active: true,
  cbc_topic: 'Plants',
  questions: [
    { question: 'Which part holds the plant in the soil?', options: ['Leaf', 'Root', 'Stem', 'Flower'], answer: 'Root' },
    { question: 'Which part makes food for the plant?',    options: ['Roots', 'Flowers', 'Leaves', 'Seeds'], answer: 'Leaves' },
    { question: 'The process leaves use to make food is…', options: ['Digestion', 'Respiration', 'Photosynthesis', 'Evaporation'], answer: 'Photosynthesis' },
    { question: 'Which gas do plants take in?',            options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], answer: 'Carbon dioxide' },
    { question: 'Which part carries water up the plant?',  options: ['Leaf', 'Stem', 'Root hair', 'Seed'], answer: 'Stem' },
    { question: 'Bees help plants by…',                    options: ['Eating leaves', 'Pollinating flowers', 'Breaking stems', 'Drinking roots'], answer: 'Pollinating flowers' },
    { question: 'A seed grows into a new…',                options: ['Rock', 'Plant', 'Animal', 'Cloud'], answer: 'Plant' },
  ],
}

const ZAMBIA_BASICS_G4 = {
  id: 'social_zambia_basics_g4',
  title: 'Zambia Basics',
  subject: 'social',
  grade: 4,
  type: 'timed_quiz',
  difficulty: 'easy',
  description: 'Flag, capital, currency — the essentials.',
  timer: 60,
  points: 10,
  active: true,
  cbc_topic: 'Zambia',
  questions: [
    { question: 'The capital city of Zambia is…',    options: ['Ndola', 'Kitwe', 'Lusaka', 'Kabwe'], answer: 'Lusaka' },
    { question: 'Zambia\u2019s currency is called the…', options: ['Rand', 'Shilling', 'Kwacha', 'Dollar'], answer: 'Kwacha' },
    { question: 'Zambia got independence in…',       options: ['1960', '1962', '1964', '1980'],   answer: '1964' },
    { question: 'Zambia\u2019s first President was…', options: ['Sata', 'Kaunda', 'Chiluba', 'Lungu'], answer: 'Kaunda' },
    { question: 'The famous waterfall is…',           options: ['Niagara', 'Victoria', 'Angel', 'Iguazu'], answer: 'Victoria' },
    { question: 'How many provinces?',                options: ['8', '9', '10', '11'], answer: '10' },
    { question: 'Which metal is Zambia famous for?',  options: ['Gold', 'Silver', 'Copper', 'Iron'], answer: 'Copper' },
  ],
}

const DECIMALS_G5 = {
  id: 'math_decimals_g5',
  title: 'Decimal Drills',
  subject: 'mathematics',
  grade: 5,
  type: 'timed_quiz',
  difficulty: 'medium',
  description: 'Add, compare and round decimal numbers.',
  timer: 90,
  points: 12,
  active: true,
  cbc_topic: 'Decimals',
  questions: [
    { question: '0.5 + 0.25 = ?',           options: ['0.55', '0.70', '0.75', '0.80'], answer: '0.75' },
    { question: 'Which is largest?',         options: ['0.4', '0.39', '0.45', '0.409'], answer: '0.45' },
    { question: '0.1 × 10 = ?',              options: ['0.01', '1', '10', '100'],       answer: '1' },
    { question: '0.6 rounded to nearest whole is…', options: ['0', '1', '6', '10'],    answer: '1' },
    { question: '2.5 + 1.5 = ?',             options: ['3.5', '4', '4.5', '5'],         answer: '4' },
    { question: '3.2 − 1.1 = ?',             options: ['2.0', '2.1', '2.2', '2.3'],     answer: '2.1' },
    { question: '1/2 as a decimal is…',      options: ['0.02', '0.1', '0.25', '0.5'],   answer: '0.5' },
    { question: 'Which is smallest?',        options: ['0.7', '0.07', '0.77', '0.707'], answer: '0.07' },
  ],
}

const AFRICA_CAPITALS_G5 = {
  id: 'social_africa_capitals_g5',
  title: 'African Capitals',
  subject: 'social',
  grade: 5,
  type: 'memory_match',
  difficulty: 'medium',
  description: 'Match each country to its capital city.',
  timer: 150,
  points: 12,
  active: true,
  cbc_topic: 'Africa',
  questions: [
    { question: 'Zambia',        options: [], answer: 'Lusaka' },
    { question: 'Kenya',         options: [], answer: 'Nairobi' },
    { question: 'Zimbabwe',      options: [], answer: 'Harare' },
    { question: 'Malawi',        options: [], answer: 'Lilongwe' },
    { question: 'Tanzania',      options: [], answer: 'Dodoma' },
    { question: 'Nigeria',       options: [], answer: 'Abuja' },
    { question: 'Egypt',         options: [], answer: 'Cairo' },
    { question: 'Ghana',         options: [], answer: 'Accra' },
  ],
}

const PERCENT_G6 = {
  id: 'math_percent_g6',
  title: 'Percent Sprint',
  subject: 'mathematics',
  grade: 6,
  type: 'timed_quiz',
  difficulty: 'medium',
  description: 'Find percentages of numbers in seconds.',
  timer: 75,
  points: 12,
  active: true,
  cbc_topic: 'Percentages',
  questions: [
    { question: '10% of 200 = ?',  options: ['10', '20', '50', '100'], answer: '20' },
    { question: '25% of 80 = ?',   options: ['15', '20', '25', '30'],  answer: '20' },
    { question: '50% of 150 = ?',  options: ['50', '75', '100', '125'], answer: '75' },
    { question: '75% of 40 = ?',   options: ['20', '25', '30', '35'],   answer: '30' },
    { question: '20% of 60 = ?',   options: ['10', '12', '15', '20'],   answer: '12' },
    { question: '1% of 500 = ?',   options: ['1', '5', '50', '500'],    answer: '5'  },
    { question: '5% of 200 = ?',   options: ['5', '10', '15', '20'],    answer: '10' },
    { question: '90% of 100 = ?',  options: ['9', '90', '99', '100'],   answer: '90' },
  ],
}

const GRAMMAR_G6 = {
  id: 'english_grammar_g6',
  title: 'Grammar Fixer',
  subject: 'english',
  grade: 6,
  type: 'timed_quiz',
  difficulty: 'medium',
  description: 'Spot the correct sentence.',
  timer: 90,
  points: 12,
  active: true,
  cbc_topic: 'Grammar',
  questions: [
    { question: 'Which is correct?',  options: ['He go to school.', 'He goes to school.', 'He going to school.', 'He gone to school.'], answer: 'He goes to school.' },
    { question: 'Which is correct?',  options: ['The boys is here.', 'The boys are here.', 'The boys am here.', 'The boys be here.'], answer: 'The boys are here.' },
    { question: 'Which is correct?',  options: ['I done my work.', 'I have did my work.', 'I have done my work.', 'I am done my work.'], answer: 'I have done my work.' },
    { question: 'Pick the plural:',   options: ['Child', 'Childs', 'Children', 'Childes'], answer: 'Children' },
    { question: 'Pick the past tense:', options: ['Run', 'Running', 'Ran', 'Runs'], answer: 'Ran' },
    { question: 'Pick the adjective:', options: ['Car', 'Fast', 'Drive', 'Quickly'], answer: 'Fast' },
    { question: 'Pick the verb:',      options: ['Beautiful', 'Happily', 'Happiness', 'Dance'], answer: 'Dance' },
    { question: 'Which punctuation is right for: "What is your name"?', options: ['.', '!', '?', ','], answer: '?' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════
 *  UPPER PRIMARY — Grades 7 to 9
 * ═══════════════════════════════════════════════════════════════════ */

const INTEGERS_G7 = {
  id: 'math_integers_g7',
  title: 'Integer Battle',
  subject: 'mathematics',
  grade: 7,
  type: 'timed_quiz',
  difficulty: 'medium',
  description: 'Positives, negatives, and everything in between.',
  timer: 90,
  points: 12,
  active: true,
  cbc_topic: 'Integers',
  questions: [
    { question: '(−5) + 3 = ?',      options: ['−8', '−2', '2', '8'],    answer: '−2' },
    { question: '(−4) × (−6) = ?',   options: ['−24', '−10', '10', '24'], answer: '24' },
    { question: '7 + (−9) = ?',      options: ['−16', '−2', '2', '16'],  answer: '−2' },
    { question: '(−12) ÷ 4 = ?',     options: ['−3', '3', '−4', '4'],    answer: '−3' },
    { question: 'Which is smallest?', options: ['−7', '−2', '0', '4'],    answer: '−7' },
    { question: '|−8| = ?',           options: ['−8', '0', '8', '16'],    answer: '8'  },
    { question: '(−3) × 5 = ?',       options: ['−15', '−8', '8', '15'],   answer: '−15' },
    { question: '6 − 10 = ?',         options: ['−4', '4', '−16', '16'],   answer: '−4' },
  ],
}

const VOCAB_SPRINT_G8 = {
  id: 'english_vocab_g8',
  title: 'Vocabulary Sprint',
  subject: 'english',
  grade: 8,
  type: 'timed_quiz',
  difficulty: 'medium',
  description: 'Pick the word with the matching meaning.',
  timer: 90,
  points: 12,
  active: true,
  cbc_topic: 'Vocabulary',
  questions: [
    { question: 'What does "abundant" mean?',     options: ['rare', 'plenty', 'sad',   'angry'],  answer: 'plenty'  },
    { question: 'What does "fragile" mean?',      options: ['strong', 'heavy', 'easily broken', 'soft'], answer: 'easily broken' },
    { question: 'What does "reluctant" mean?',    options: ['eager', 'unwilling', 'fast', 'lazy'], answer: 'unwilling' },
    { question: 'What does "vivid" mean?',        options: ['dull', 'bright/clear', 'quiet', 'old'], answer: 'bright/clear' },
    { question: 'What does "generous" mean?',     options: ['stingy', 'kind & giving', 'selfish', 'angry'], answer: 'kind & giving' },
    { question: 'The opposite of "ancient" is…',  options: ['new', 'old', 'broken', 'heavy'], answer: 'new' },
    { question: 'The opposite of "expand" is…',   options: ['grow', 'shrink', 'burst', 'stretch'], answer: 'shrink' },
    { question: 'Which means "very tired"?',      options: ['exhausted', 'energetic', 'excited', 'alert'], answer: 'exhausted' },
  ],
}

const CELLS_G8 = {
  id: 'science_cells_g8',
  title: 'Cells & Life',
  subject: 'science',
  grade: 8,
  type: 'timed_quiz',
  difficulty: 'medium',
  description: 'The building blocks of living things.',
  timer: 90,
  points: 12,
  active: true,
  cbc_topic: 'Cells',
  questions: [
    { question: 'The basic unit of life is the…',  options: ['Atom', 'Cell', 'Molecule', 'Organ'], answer: 'Cell' },
    { question: 'The cell\u2019s control centre is the…', options: ['Membrane', 'Nucleus', 'Cytoplasm', 'Ribosome'], answer: 'Nucleus' },
    { question: 'Plant cells have a cell…',         options: ['Coat', 'Wall', 'Skin', 'Shell'],     answer: 'Wall' },
    { question: 'Which organelle produces energy?', options: ['Nucleus', 'Mitochondria', 'Wall', 'Vacuole'], answer: 'Mitochondria' },
    { question: 'Plants make food in their…',      options: ['Mitochondria', 'Nuclei', 'Chloroplasts', 'Vacuoles'], answer: 'Chloroplasts' },
    { question: 'Which is NOT in animal cells?',    options: ['Nucleus', 'Mitochondria', 'Cell wall', 'Membrane'], answer: 'Cell wall' },
    { question: 'Cells group together to form…',    options: ['Organs', 'Tissues', 'Atoms', 'Bones'], answer: 'Tissues' },
  ],
}

const ALGEBRA_G9 = {
  id: 'math_algebra_g9',
  title: 'Algebra Racer',
  subject: 'mathematics',
  grade: 9,
  type: 'timed_quiz',
  difficulty: 'hard',
  description: 'Solve for x — basic linear equations.',
  timer: 100,
  points: 15,
  active: true,
  cbc_topic: 'Algebra',
  questions: [
    { question: 'Solve: x + 5 = 12',   options: ['5', '7', '12', '17'],  answer: '7' },
    { question: 'Solve: 3x = 21',       options: ['3', '7', '14', '21'], answer: '7' },
    { question: 'Solve: x − 4 = 9',    options: ['5', '9', '13', '14'], answer: '13' },
    { question: 'Solve: 2x + 1 = 11',  options: ['4', '5', '6', '10'],  answer: '5'  },
    { question: 'Solve: x / 4 = 3',    options: ['3', '7', '12', '16'], answer: '12' },
    { question: 'Solve: 5x − 3 = 17',  options: ['2', '3', '4', '5'],   answer: '4'  },
    { question: 'Simplify: 3x + 2x',   options: ['x', '5x', '6x', 'x²'], answer: '5x' },
    { question: 'If x = 3, then 2x + 4 = ?', options: ['6', '8', '10', '12'], answer: '10' },
  ],
}

/* ═══════════════════════════════════════════════════════════════════
 *  WORD BUILDER showcase — exercises the word_builder engine
 * ═══════════════════════════════════════════════════════════════════ */
const WORD_BUILDER_G3 = {
  id: 'english_word_builder_g3',
  title: 'Spell the Animal',
  subject: 'english',
  grade: 3,
  type: 'word_builder',
  difficulty: 'easy',
  description: 'Tap the letters to spell the animal in the clue.',
  timer: 90,
  points: 10,
  active: true,
  cbc_topic: 'Spelling',
  questions: [
    { question: '🦁 King of the jungle.',       options: [], answer: 'LION' },
    { question: '🦓 Black-and-white stripes.',  options: [], answer: 'ZEBRA' },
    { question: '🐒 Swings from trees.',        options: [], answer: 'MONKEY' },
    { question: '🦒 Very long neck.',           options: [], answer: 'GIRAFFE' },
    { question: '🐘 Biggest land animal.',      options: [], answer: 'ELEPHANT' },
    { question: '🐊 Big reptile in rivers.',    options: [], answer: 'CROCODILE' },
    { question: '🐇 Long ears, hops fast.',     options: [], answer: 'RABBIT' },
    { question: '🦛 Big river animal.',         options: [], answer: 'HIPPO' },
  ],
}

/* ────────────────────────────────────────────────────────────────────
 *  Manifest
 * ──────────────────────────────────────────────────────────────────── */
export const GAMES_SEED = [
  // Middle primary (already had content here)
  SPEED_TABLES_G4,
  FRACTION_MATCH_G4,
  SPELL_IT_RIGHT_G4,
  HUMAN_BODY_G5,
  MATH_MEMORY_G6,
  // Lower primary
  COUNTING_G1,
  ABC_WORDS_G1,
  ADD_SUB_G2,
  SIGHT_WORDS_G2,
  TIMES_TABLES_G3,
  WORD_BUILDER_G3,
  // More middle primary
  PLANT_PARTS_G4,
  ZAMBIA_BASICS_G4,
  DECIMALS_G5,
  AFRICA_CAPITALS_G5,
  PERCENT_G6,
  GRAMMAR_G6,
  // Upper primary
  INTEGERS_G7,
  VOCAB_SPRINT_G8,
  CELLS_G8,
  ALGEBRA_G9,
]

/**
 * A "fallback" games list for the UI when Firestore is empty / unreachable.
 * Lets the site render meaningful content before the admin seeds the DB.
 * The ids match the seed so deep-links keep working after seeding.
 */
export function getFallbackGames(filter = {}) {
  let games = GAMES_SEED.slice()
  if (filter.grade != null) games = games.filter((g) => g.grade === Number(filter.grade))
  if (filter.subject) games = games.filter((g) => g.subject === filter.subject)
  return games
}

export function getFallbackGame(id) {
  return GAMES_SEED.find((g) => g.id === id) || null
}
