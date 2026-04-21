/**
 * Hand-crafted sample Zambian CBC lesson plans.
 *
 * These are the marketing asset for /teachers/samples. Each one is a fully
 * populated lesson plan in the schema our Cloud Function returns, so the
 * existing LessonPlanView component renders them identically to a live
 * generation.
 *
 * When you add more samples:
 *  - Keep the `slug` URL-safe and SEO-friendly (grade-subject-topic).
 *  - Pick topics that have high Google search volume from Zambian teachers.
 *  - Review with a real Zambian teacher before publishing.
 */

export const SAMPLE_LESSON_PLANS = [
  /* ═══════════════════════════════════════════════════════════════
   *  Grade 5 Mathematics — Adding Fractions with Unlike Denominators
   * ═══════════════════════════════════════════════════════════════ */
  {
    slug: 'grade-5-mathematics-fractions',
    seo: {
      title: 'Grade 5 Mathematics Lesson Plan — Adding Fractions with Unlike Denominators | Zambian CBC',
      description: 'Free ready-to-use Zambian CBC lesson plan for Grade 5 Mathematics on Adding Fractions with Unlike Denominators. Includes Specific Outcomes, Key Competencies, Values, Pupils\' and Teacher\'s Activities, and Assessment. Download as Word.',
    },
    meta: {
      grade: 'G5',
      subject: 'mathematics',
      topic: 'Fractions',
      subtopic: 'Adding Fractions with Unlike Denominators',
    },
    plan: {
      schemaVersion: '1.0',
      header: {
        school: '',
        teacherName: '',
        date: '',
        time: '08:40–09:20',
        durationMinutes: 40,
        class: 'Grade 5',
        subject: 'Mathematics',
        topic: 'Fractions',
        subtopic: 'Adding Fractions with Unlike Denominators',
        termAndWeek: 'Term 2, Week 4',
        numberOfPupils: 42,
        mediumOfInstruction: 'English',
      },
      specificOutcomes: [
        'By the end of the lesson, pupils should be able to identify the Lowest Common Denominator (LCD) of two unlike denominators.',
        'By the end of the lesson, pupils should be able to add two fractions with unlike denominators and give the answer in simplest form.',
        'By the end of the lesson, pupils should be able to apply fraction addition to solve a simple real-life problem involving market quantities.',
      ],
      keyCompetencies: [
        'Critical thinking and problem solving',
        'Numeracy',
        'Communication and collaboration',
      ],
      values: ['Accuracy', 'Perseverance', 'Cooperation'],
      prerequisiteKnowledge: [
        'Pupils can identify the numerator and denominator of a fraction.',
        'Pupils can find the Lowest Common Multiple (LCM) of two numbers up to 20.',
        'Pupils can add fractions with the same denominator.',
      ],
      teachingLearningMaterials: [
        'Fraction strips (paper)',
        'Chalkboard and chalk',
        "Pupils' exercise books",
        "Grade 5 Mathematics Pupil's Book (CDC), pages 54–57",
      ],
      references: [
        { title: "Zambia Grade 5 Mathematics Pupil's Book", publisher: 'CDC', pages: '54–57' },
        { title: "Grade 5 Mathematics Teacher's Guide", publisher: 'CDC', pages: '32' },
      ],
      lessonDevelopment: {
        introduction: {
          durationMinutes: 5,
          teacherActivities: [
            'Greets pupils and settles the class.',
            'Revises addition of fractions with like denominators using two quick examples on the board (1/4 + 2/4 and 2/5 + 1/5).',
            'Asks: "What happens if the denominators are different?" to introduce today\'s topic.',
          ],
          pupilActivities: [
            'Greet the teacher and settle down.',
            'Solve the two revision examples in their exercise books.',
            'Respond to the teacher\'s question and share ideas with their neighbour.',
          ],
        },
        development: [
          {
            stepNumber: 1,
            title: 'Demonstration with fraction strips',
            durationMinutes: 10,
            teacherActivities: [
              'Distributes paper fraction strips and models 1/2 + 1/3 physically.',
              'Guides pupils to discover that the strips must be cut into equal-sized pieces before they can be added.',
              'Introduces the term "Lowest Common Denominator (LCD)" on the board and links it to LCM.',
            ],
            pupilActivities: [
              'Manipulate the fraction strips in pairs.',
              'Describe what they observe to their partner.',
              'Copy the LCD definition into their exercise books.',
            ],
          },
          {
            stepNumber: 2,
            title: 'Guided practice',
            durationMinutes: 12,
            teacherActivities: [
              'Works through 2/3 + 1/4 on the board, narrating each step: find LCD, convert each fraction, add, simplify.',
              'Poses 3/4 + 1/6 and calls three pupils to complete it at the board while the rest work in books.',
              'Moves around the class, correcting common misconceptions (e.g. adding denominators together).',
            ],
            pupilActivities: [
              'Copy the worked example into their books.',
              'Attempt 3/4 + 1/6 independently then compare answers with a neighbour.',
              'Raise hands when they reach a difficulty.',
            ],
          },
          {
            stepNumber: 3,
            title: 'Independent practice',
            durationMinutes: 8,
            teacherActivities: [
              'Writes 4 problems on the board of mixed difficulty: 1/2 + 1/4, 2/5 + 1/3, 3/4 + 1/8, 5/6 + 1/2.',
              'Circulates, asking higher-order questions to faster pupils (e.g. "Can you write a word problem that uses this?").',
            ],
            pupilActivities: [
              'Solve the 4 problems silently in their exercise books.',
              'Mark a neighbour\'s work when the teacher instructs.',
            ],
          },
        ],
        conclusion: {
          durationMinutes: 5,
          teacherActivities: [
            'Invites 2 pupils to summarise the LCD method in their own words.',
            'Writes one home-practice problem on the board (2/3 + 3/5) and explains the home task.',
            'Links the lesson to tomorrow\'s topic: subtracting fractions with unlike denominators.',
          ],
          pupilActivities: [
            'Summarise the method aloud in their own words.',
            'Copy the home-practice problem into their homework books.',
            'Ask any final questions.',
          ],
        },
      },
      assessment: {
        formative: [
          'Observation during paired fraction-strip work.',
          'Monitoring of the 4 independent practice problems.',
          'Oral questioning during the conclusion.',
        ],
        summative: {
          description: 'Mark the 4 independent-practice problems (out of 4).',
          successCriteria: 'A pupil is considered to have met the outcome if they solve at least 3 of the 4 problems correctly with working shown.',
        },
      },
      differentiation: {
        forStruggling: [
          'Pair with a stronger neighbour during guided practice.',
          'Provide pre-drawn fraction strips instead of cutting them.',
          'Focus only on the first two independent-practice problems.',
        ],
        forAdvanced: [
          'Challenge with a mixed-number addition: 1 1/2 + 2/3.',
          'Ask them to create one word-problem about Lusaka market for a partner to solve.',
        ],
      },
      homework: {
        description: 'Solve 5 problems on page 57 of the Pupil\'s Book, showing all working.',
        estimatedMinutes: 15,
      },
      teacherReflection: {
        whatWentWell: '',
        whatToImprove: '',
        pupilsWhoNeedFollowUp: [],
      },
    },
  },

  /* ═══════════════════════════════════════════════════════════════
   *  Grade 9 English — Argumentative Composition
   * ═══════════════════════════════════════════════════════════════ */
  {
    slug: 'grade-9-english-argumentative-composition',
    seo: {
      title: 'Grade 9 English Lesson Plan — Argumentative Composition | Zambian CBC (JSC)',
      description: 'Free Zambian CBC lesson plan for Grade 9 English on Argumentative Composition. JSC exam-aligned, with Specific Outcomes, Key Competencies, Values, Pupils\' and Teacher\'s Activities, and full Assessment.',
    },
    meta: {
      grade: 'G9',
      subject: 'english',
      topic: 'Argumentative Composition',
      subtopic: 'Stating a position and supporting it with evidence',
    },
    plan: {
      schemaVersion: '1.0',
      header: {
        school: '',
        teacherName: '',
        date: '',
        time: '11:20–12:00',
        durationMinutes: 40,
        class: 'Grade 9',
        subject: 'English',
        topic: 'Argumentative Composition',
        subtopic: 'Stating a position and supporting it with evidence',
        termAndWeek: 'Term 2, Week 8',
        numberOfPupils: 36,
        mediumOfInstruction: 'English',
      },
      specificOutcomes: [
        'By the end of the lesson, pupils should be able to define an argumentative composition and distinguish it from a narrative or descriptive one.',
        'By the end of the lesson, pupils should be able to state a clear position on a given topic and provide at least three supporting reasons.',
        'By the end of the lesson, pupils should be able to draft an opening paragraph that states the position and outlines the argument.',
      ],
      keyCompetencies: [
        'Communication and literacy',
        'Critical thinking and reasoning',
        'Digital and research literacy',
      ],
      values: ['Integrity', 'Respect for differing views', 'Perseverance'],
      prerequisiteKnowledge: [
        'Pupils can write a simple and a compound paragraph in English.',
        'Pupils understand the meaning of "opinion" and "fact".',
        'Pupils are familiar with the structure of narrative composition.',
      ],
      teachingLearningMaterials: [
        'Chalkboard and chalk',
        'Sample newspaper article with a clear opinion (from Times of Zambia or Daily Mail)',
        'Handout: "The structure of an argumentative composition"',
        "Grade 9 English Pupil's Book (CDC), pages 104–109",
      ],
      references: [
        { title: "Zambia Grade 9 English Pupil's Book", publisher: 'CDC', pages: '104–109' },
        { title: "Grade 9 English Teacher's Guide", publisher: 'CDC', pages: '52' },
      ],
      lessonDevelopment: {
        introduction: {
          durationMinutes: 5,
          teacherActivities: [
            'Greets the class and settles pupils.',
            'Writes on the board: "School uniforms should be optional." Asks: "Who agrees? Who disagrees? Why?"',
            'Captures 2–3 short responses on the board under "For" and "Against".',
          ],
          pupilActivities: [
            'Greet the teacher.',
            'Share their opinion on the topic, raising hands.',
            'Note down one point from the opposite side they hadn\'t thought of.',
          ],
        },
        development: [
          {
            stepNumber: 1,
            title: 'Defining argumentative writing',
            durationMinutes: 8,
            teacherActivities: [
              'Explains that an argumentative composition takes a clear POSITION on an issue and defends it with REASONS and EVIDENCE.',
              'Contrasts with narrative (tells a story) and descriptive (paints a picture) compositions.',
              'Writes the 3 parts of a good argument on the board: (i) clear position, (ii) three or more reasons with evidence, (iii) acknowledgement of the opposing view.',
            ],
            pupilActivities: [
              'Copy the definition and the three parts into their exercise books.',
              'In pairs, categorise five sample compositions from page 104 as narrative, descriptive, or argumentative.',
            ],
          },
          {
            stepNumber: 2,
            title: 'Analysing a model opening paragraph',
            durationMinutes: 12,
            teacherActivities: [
              'Reads aloud a model argumentative opening from the Pupil\'s Book.',
              'Guides pupils to identify (a) the position statement, (b) the three reasons previewed, (c) the tone.',
              'Writes the prompt on the board: "Mobile phones should not be allowed in schools."',
              'Shows how to plan: write position + three reasons + one opposing point on scrap paper before drafting.',
            ],
            pupilActivities: [
              'Listen and follow along in the Pupil\'s Book.',
              'Underline the position statement and the reasons in the model.',
              'Plan their own response to the mobile-phone prompt on scrap paper (position + three reasons).',
            ],
          },
          {
            stepNumber: 3,
            title: 'Drafting the opening paragraph',
            durationMinutes: 12,
            teacherActivities: [
              'Instructs pupils to draft their opening paragraph (5–8 sentences) in their exercise books.',
              'Circulates to help struggling pupils frame a clear position.',
              'Reminds them: the opening must (a) state the position, (b) preview the three reasons, (c) invite the reader in.',
            ],
            pupilActivities: [
              'Write their opening paragraph independently in English.',
              'Check that they have stated a clear position and previewed three reasons.',
              'Exchange with a partner and give one piece of constructive feedback.',
            ],
          },
        ],
        conclusion: {
          durationMinutes: 3,
          teacherActivities: [
            'Invites 2 volunteers to read their opening paragraph aloud.',
            'Highlights one strong feature of each.',
            'Sets the home task: finish the full composition (250–300 words) with three body paragraphs and a conclusion.',
          ],
          pupilActivities: [
            'Listen respectfully as peers read.',
            'Note one strong feature they want to use in their own writing.',
            'Copy the home task into their homework books.',
          ],
        },
      },
      assessment: {
        formative: [
          'Observation during the pair-feedback stage.',
          'Monitoring of draft opening paragraphs.',
          'Oral questions during the analysis step.',
        ],
        summative: {
          description: 'Mark the opening paragraphs out of 5: 2 marks for a clear position statement, 3 marks for three previewed reasons.',
          successCriteria: 'A pupil meets the outcome if they score at least 4 out of 5 on the opening paragraph.',
        },
      },
      differentiation: {
        forStruggling: [
          'Provide a sentence starter: "I believe that _____ because _____, _____, and _____."',
          'Allow them to use bullet points instead of full sentences for their three reasons.',
        ],
        forAdvanced: [
          'Challenge them to include a direct quotation from a Zambian source (newspaper, radio) in their paragraph.',
          'Ask them to anticipate and briefly rebut one opposing argument in the opening.',
        ],
      },
      homework: {
        description: 'Write the full argumentative composition (250–300 words) on "Mobile phones should not be allowed in schools". Include three body paragraphs and a conclusion. Due next lesson.',
        estimatedMinutes: 40,
      },
      teacherReflection: {
        whatWentWell: '',
        whatToImprove: '',
        pupilsWhoNeedFollowUp: [],
      },
    },
  },
]

export function getSampleBySlug(slug) {
  return SAMPLE_LESSON_PLANS.find((s) => s.slug === slug) || null
}
