// Official Zambian CDC syllabi catalog.
// `s` is the PDF size in bytes; `e` flags PDFs that have an embedded preview.
// PDFs themselves live in Firebase Storage and are loaded by the viewer modal
// — see SyllabiLibrary.jsx for the no-download viewer.

export const SYLLABI_CATALOG = {
  new: [
    { k: 'new-framework',  t: '2023 Approved National School Curriculum',                                g: 'All grades',             l: 'Framework',             s: 1336532, e: true, file: '/syllabi/2023-approved-national-school-curriculum.pdf' },
    { k: 'new-ece-syllabi',t: 'Early Childhood Education Syllabi 3 to 5 Year Corrected',                g: 'Ages 3-5',               l: 'ECE',                   s:  791294, e: true, file: '/syllabi/early-childhood-education-syllabi-3-to-5-year-corrected.pdf' },
    { k: 'new-ece-math',   t: 'ECE 5-6 Mathematics',                                                    g: 'Ages 5-6',               l: 'ECE',                   s: 2756061, e: true, file: '/syllabi/ece-5-6-mathematics.pdf' },
    { k: 'new-ece-jan2025',t: 'Finalised ECE Syllabus, Jan. 2025',                                      g: 'Ages 3-5',               l: 'ECE',                   s: 3706262, e: true, file: '/syllabi/finalised-ece-syllabus-jan-2025.pdf' },
    { k: 'new-sp-id-ece',  t: 'Intellectual Disability ECE Syllabus 1',                                 g: 'Special Ed · ECE',       l: 'ECE',                   s:  972799, e: true, file: '/syllabi/intellectual-disability-ece-syllabus-1.pdf' },
    { k: 'new-lp-syllabi', t: 'Lower Primary Syllabi Grade 1-3 Final Camera Ready 1',                   g: 'Grades 1-3',             l: 'Lower Primary',         s: 1913157, e: true, file: '/syllabi/lower-primary-syllabi-grade-1-3-final-camera-redy-1.pdf' },
    { k: 'new-lp-sign',    t: 'Zambian Sign Languages Grades 1-3',                                       g: 'Grades 1-3',             l: 'Lower Primary',         s:  916594, e: true, file: '/syllabi/zambian-sign-languages-grades-1-3.pdf' },
    { k: 'new-up-arts-a',  t: 'Expressive Arts Upper Primary Finalised 31-01-25',                        g: 'Grades 4-6',             l: 'Upper Primary',         s:  547725, e: true, file: '/syllabi/expressive-arts-upper-primary-finalised-31-01-25.pdf' },
    { k: 'new-up-arts-b',  t: 'Expressive Arts Upper Primary 2',                                         g: 'Grades 4-6',             l: 'Upper Primary',         s: 1243664, e: true, file: '/syllabi/expressive-arts-upper-primary-2.pdf' },
    { k: 'new-up-heh',     t: 'Home Economics and Hospitality (G4-6) Upper Primary',                     g: 'Grades 4-6',             l: 'Upper Primary',         s: 1457802, e: true, file: '/syllabi/home-economics-and-hospitality-g4-6-upper-primary.pdf' },
    { k: 'new-up-math',    t: 'Mathematics Syllabus For Upper Primary (G4-6)',                           g: 'Grades 4-6',             l: 'Upper Primary',         s: 1393181, e: true, file: '/syllabi/mathematics-syllabus-for-upper-primary-g4-6.pdf' },
    { k: 'new-up-science', t: 'Science Upper Primary Syllabus (G4-5)',                                   g: 'Grades 4-5',             l: 'Upper Primary',         s: 1468816, e: true, file: '/syllabi/science-upper-primary-syllabus-g4-5.pdf' },
    { k: 'new-up-social',  t: 'Social Studies Upper Primary (G4-6)',                                     g: 'Grades 4-6',             l: 'Upper Primary',         s: 1465143, e: true, file: '/syllabi/social-studies-upper-primary-g4-6.pdf' },
    { k: 'new-up-tech-a',  t: 'Technology Studies Upper Primary',                                        g: 'Grades 4-6',             l: 'Upper Primary',         s:  799080, e: true, file: '/syllabi/technology-studies-upper-primary.pdf' },
    { k: 'new-up-tech-b',  t: 'Technology Studies Upper Primary (G4-6)',                                 g: 'Grades 4-6',             l: 'Upper Primary',         s: 2297876, e: true, file: '/syllabi/technology-studies-upper-primary-g4-6.pdf' },
    { k: 'new-sec-agri',   t: 'Agricultural Science O-Level Syllabus Forms 1-4',                         g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1033424, e: true, file: '/syllabi/agricultural-science-o-level-syllabus-form-1-4.pdf' },
    { k: 'new-sec-art',    t: 'Art and Design Syllabus Final',                                           g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1610614, e: true, file: '/syllabi/art-and-design-syllabus-final.pdf' },
    { k: 'new-sec-bio',    t: 'Biology Syllabus O-Level Forms 1-4',                                      g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  870477, e: true, file: '/syllabi/biology-sylabus-o-level-form-1-4.pdf' },
    { k: 'new-sec-chem',   t: 'Chemistry Syllabus',                                                      g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  731338, e: true, file: '/syllabi/chemistry-syllabus.pdf' },
    { k: 'new-sec-civic',  t: 'Civic Education Syllabus Science O-Level Syllabus Forms 1-4',            g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  895123, e: true, file: '/syllabi/civic-education-syllabus-science-o-level-syllabus-form-1-4.pdf' },
    { k: 'new-sec-comm',   t: 'Commerce and Principles Of Accounts Syllabus Camera Ready O-Level Forms 1-4', g: 'Forms 1-4',         l: 'O-Level (Secondary)',   s:  534037, e: true, file: '/syllabi/commerce-and-principles-of-accounts-sylabus-camera-ready-o-level-form-1-4.pdf' },
    { k: 'new-sec-comp',   t: 'Computer Science Ordinary Syllabi Forms 1-4',                             g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  871754, e: true, file: '/syllabi/computer-science-ordinary-syllabi-form-1-4.pdf' },
    { k: 'new-sec-dt',     t: 'Design and Technology Studies',                                           g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  883567, e: true, file: '/syllabi/design-and-technology-studies.pdf' },
    { k: 'new-sec-eng',    t: 'English Syllabus Forms 1-4 O-Level Camera Ready',                         g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1758301, e: true, file: '/syllabi/english-sylabus-form-1-4-o-levelcamera-ready.pdf' },
    { k: 'new-sec-fash',   t: 'Fashion and Fabrics Syllabus O-Level Forms 1-4',                          g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1173727, e: true, file: '/syllabi/fashion-and-fabrics-sylabus-o-level-form-1-4.pdf' },
    { k: 'new-sec-food',   t: 'Food and Nutrition Syllabus Final 07-02-2024',                            g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  649185, e: true, file: '/syllabi/food-and-nutrition-syllabus-final-07-02-2024.pdf' },
    { k: 'new-sec-french', t: 'French Language',                                                         g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1015461, e: true, file: '/syllabi/french-language.pdf' },
    { k: 'new-sec-geog',   t: 'Geography Syllabus',                                                      g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1568271, e: true, file: '/syllabi/geography-syllabus.pdf' },
    { k: 'new-sec-hist',   t: 'History Syllabus Forms 1-4',                                              g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1142375, e: true, file: '/syllabi/history-syllabus-forms-1-4.pdf' },
    { k: 'new-sec-hosp',   t: 'Hospitality Management',                                                  g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  620887, e: true, file: '/syllabi/hospitality-management.pdf' },
    { k: 'new-sec-ict',    t: 'ICT Ordinary Level Syllabus Forms 1-4',                                   g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1205223, e: true, file: '/syllabi/ict-ordinary-level-syllabus-forms-1-4.pdf' },
    { k: 'new-sec-lit',    t: 'Literature In English Syllabus O-Level Forms 1-4',                        g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  993543, e: true, file: '/syllabi/literature-in-english-sylabus-o-level-form-1-4.pdf' },
    { k: 'new-sec-math-a', t: 'Mathematics O-Level Forms 1-4',                                           g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  868348, e: true, file: '/syllabi/mathematics-o-level-forms-1-4.pdf' },
    { k: 'new-sec-math-b', t: 'Mathematics II Syllabus',                                                 g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  844866, e: true, file: '/syllabi/mathematics-ii-syllabus.pdf' },
    { k: 'new-sec-music',  t: 'Music Arts O-Level Syllabus Forms 1-4 Camera Ready 1',                   g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1432141, e: true, file: '/syllabi/music-arts-o-level-syllabus-form-1-4-camera-ready-1.pdf' },
    { k: 'new-sec-pe',     t: 'Physical Education Syllabus Forms 1-4',                                   g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 2354896, e: true, file: '/syllabi/physical-education-syllabus-form-1-4.pdf' },
    { k: 'new-sec-phys',   t: 'Physics Syllabus O-Level Forms 1-4',                                      g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1899208, e: true, file: '/syllabi/physics-syllabus-o-level-form-1-4.pdf' },
    { k: 'new-sec-relig',  t: 'Religious Education Syllabus',                                            g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  911427, e: true, file: '/syllabi/religious-education-syllabus.pdf' },
    { k: 'new-sec-tour',   t: 'Travel and Tourism Syllabus',                                             g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s:  631524, e: true, file: '/syllabi/travel-and-tourism-syllabus.pdf' },
    { k: 'new-sec-zamb',   t: 'Zambian Languages Ordinary Level Syllabus Forms 1-4 Final',              g: 'Forms 1-4',              l: 'O-Level (Secondary)',   s: 1246466, e: true, file: '/syllabi/zambian-languages-ordinary-level-syllabus-form-1-4-final.pdf' },
    { k: 'new-sp-id-eng',  t: 'Intellectual Disability English Language Syllabus Level I-3',            g: 'Special Ed Levels I-III',l: 'Special Education',     s:  323108, e: true, file: '/syllabi/intellectual-disability-english-language-syllabus-level-i-3.pdf' },
  ],
  old: [
    { k: 'old-math-g5-7',  t: 'Mathematics',                  g: 'Grades 1-7',  l: 'Upper Primary G5-7',     s:  529364, e: true  },
    { k: 'old-eng-g2-7',   t: 'English Language',             g: 'Grades 2-7',  l: 'Upper Primary G5-7',     s:  658441, e: true },
    { k: 'old-sci-g1-7',   t: 'Integrated Science',           g: 'Grades 1-7',  l: 'Upper Primary G5-7',     s: 1296435, e: true },
    { k: 'old-soc-g1-7',   t: 'Social Studies',               g: 'Grades 1-7',  l: 'Upper Primary G5-7',     s:  733389, e: true },
    { k: 'old-zamb-g5-7',  t: 'Zambian Languages',            g: 'Grades 5-7',  l: 'Upper Primary G5-7',     s:  838453, e: true },
    { k: 'old-home-g5-7',  t: 'Home Economics',               g: 'Grades 5-7',  l: 'Upper Primary G5-7',     s:  800932, e: true },
    { k: 'old-tech-g5-7',  t: 'Technology Studies',           g: 'Grades 5-7',  l: 'Upper Primary G5-7',     s:  858517, e: true },
    { k: 'old-cts',        t: 'Creative and Technology Studies', g: 'Grades 1-4', l: 'Lower Primary G1-4',   s:  925897, e: true },
    { k: 'old-math-g10',   t: 'Mathematics',                  g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  821097, e: true },
    { k: 'old-amath-g10',  t: 'Additional Mathematics',       g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  894982, e: true },
    { k: 'old-bio-g10',    t: 'Biology',                      g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  638032, e: true },
    { k: 'old-chem-g10',   t: 'Chemistry',                    g: 'Grades 10-12', l: 'Senior Secondary G10-12', s: 1155613, e: true },
    { k: 'old-phys-g10',   t: 'Physics',                      g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  925338, e: true },
    { k: 'old-sci-g10',    t: 'Science 5124',                 g: 'Grades 10-12', l: 'Senior Secondary G10-12', s: 1621024, e: true },
    { k: 'old-geog-g10',   t: 'Geography',                    g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  534813, e: true },
    { k: 'old-history',    t: 'History',                      g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  543520, e: true  },
    { k: 'old-lit-g10',    t: 'Literature in English',        g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  552623, e: true },
    { k: 'old-home-g10',   t: 'Home Management',              g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  609685, e: true },
    { k: 'old-food-g10',   t: 'Food and Nutrition',           g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  675605, e: true },
    { k: 'old-fash-g10',   t: 'Fashion and Fabrics',          g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  776018, e: true },
    { k: 'old-dt-g10',     t: 'Design and Technology',        g: 'Grades 10-12', l: 'Senior Secondary G10-12', s: 1045822, e: true },
    { k: 'old-agri-g10',   t: 'Agricultural Science',         g: 'Grades 10-12', l: 'Senior Secondary G10-12', s:  998295, e: true },
  ],
}

const SUBJECT_ICONS = {
  'Mathematics': '🔢', 'Mathematics I (Validated 2024)': '🔢', 'Mathematics II': '📐', 'Additional Mathematics': '📐',
  'English Language': '📖', 'Literature in English': '📚', 'Zambian Languages': '🗣️', 'Zambian Sign Languages': '🤟', 'French Language': '🇫🇷',
  'Biology': '🧬', 'Chemistry': '⚗️', 'Physics': '⚛️', 'Integrated Science': '🔬', 'Science': '🔬', 'Science 5124': '🔬',
  'Geography': '🗺️', 'History': '📜', 'Civic Education': '⚖️', 'Religious Education': '✝️', 'Social Studies': '🌍',
  'Home Economics': '🍳', 'Home Economics & Hospitality': '🍳', 'Home Economics & Hospitality (2025)': '🍳', 'Home Management': '🏠',
  'Food and Nutrition': '🥗', 'Fashion and Fabrics': '🧵', 'Hospitality Management': '🏨', 'Travel and Tourism': '✈️',
  'Technology Studies': '🔧', 'Technology Studies (alt)': '🔧', 'Technology Studies (Home)': '🔧',
  'Design & Technology Studies': '⚙️', 'Design and Technology': '⚙️', 'Creative and Technology Studies': '🎨',
  'Agricultural Science': '🌾', 'Computer Science': '💻', 'ICT': '💻',
  'Art and Design': '🎨', 'Music & Performing Arts': '🎵', 'Expressive Arts': '🎭', 'Expressive Arts (alt)': '🎭', 'Physical Education': '⚽',
  'Commerce & Principles of Accounts': '💼',
  'Early Childhood Education': '🧒', 'ECE Syllabus (Jan 2025)': '🧒', 'ECE Mathematics': '🧮', 'ECE Lesson Plan Guide': '📝',
  'Lower Primary Syllabi': '📚', 'Mathematics Weekly Plan': '📅', 'National Curriculum Framework': '📋',
  'Intellectual Disability — ECE': '♿', 'Intellectual Disability — English': '♿', 'Intellectual Disability — Learning Materials': '♿',
}

export function syllabusIcon(title) {
  return SUBJECT_ICONS[title] || '📄'
}

export function formatSyllabusSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

export const SYLLABI_TOTAL_COUNT =
  SYLLABI_CATALOG.new.length + SYLLABI_CATALOG.old.length
