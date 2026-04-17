import assert from 'node:assert/strict'
import { processImportedQuestionBlocks } from './documentQuizParserCore.js'
import { richTextToPlainText } from '../../utils/quizRichText.js'

const punctuationInstruction = 'For questions 26-30, each sentence has one punctuation error. Choose the sentence with the correct punctuation.'
const completionInstruction = 'For questions 31-38, choose the correct word or phrase to complete each sentence.'
const paragraphInstruction = 'Look at questions 39-45. Each question has four paragraphs. Choose the one which has the sentences in the best order.'
const comprehensionInstruction = 'This part has three stories with questions on each. Read each story and answer the questions which follow.'

function block(text, overrides = {}) {
  return {
    text,
    assets: [],
    source: 'docx',
    numberedList: false,
    ...overrides,
  }
}

function makeOptionOnlyQuestion(number, options) {
  return block(
    `${number}. A. ${options[0]} B. ${options[1]} C. ${options[2]} D. ${options[3]}`,
  )
}

function makeInlineQuestion(number, text, options) {
  return block(
    `${number}. ${text} A. ${options[0]} B. ${options[1]} C. ${options[2]} D. ${options[3]}`,
  )
}

function makeParaOrderingQuestion(number, topic) {
  return [
    block(String(number)),
    block(`AFirst, ${topic} began in the classroom.`),
    block(`Then the class moved outside for practice.`),
    block(`BThe class moved outside for practice before the activity began.`),
    block(`Then the teacher explained the task in the classroom.`),
    block(`CFirst, ${topic} began in the classroom.`),
    block(`Finally, the pupils checked their work together.`),
    block(`DFinally, the pupils checked their work together.`),
    block(`Then ${topic} began in the classroom.`),
  ]
}

function makePassage(storyNumber, heading, firstQuestionNumber) {
  const storyLabel = `Story ${storyNumber}`
  const rangeLabel = storyNumber === 2
    ? `Now do questions ${firstQuestionNumber}-${firstQuestionNumber + 4}`
    : `Questions ${firstQuestionNumber}-${firstQuestionNumber + 4}`

  const questions = Array.from({ length: 5 }, (_, index) => {
    const questionNumber = firstQuestionNumber + index
    return makeInlineQuestion(
      questionNumber,
      `What is the best answer for ${heading.toLowerCase()} question ${index + 1}?`,
      [
        `${heading} option A${index + 1}`,
        `${heading} option B${index + 1}`,
        `${heading} option C${index + 1}`,
        `${heading} option D${index + 1}`,
      ],
    )
  })

  return [
    block(storyLabel),
    block(heading),
    block(`${heading} begins with a short paragraph that sets the scene for the reader.`),
    block(`A second paragraph gives more detail about ${heading.toLowerCase()} and the children in the story.`),
    block(rangeLabel),
    ...questions,
  ]
}

function makeAnswerKeyLine(numbers) {
  return block(numbers.map(number => `${number} A`).join(' '))
}

function makeFixtureBlocks() {
  const punctuationQuestions = Array.from({ length: 5 }, (_, index) =>
    makeOptionOnlyQuestion(26 + index, [
      `The pupil ${index + 1} forgot the full stop`,
      `The pupil ${index + 1} used the comma correctly.`,
      `The pupil ${index + 1} asked the question?`,
      `The pupil ${index + 1} shouted loudly!`,
    ]),
  )

  const completionQuestions = Array.from({ length: 8 }, (_, index) =>
    makeInlineQuestion(31 + index, `Choose the best word to complete sentence ${index + 1}.`, [
      `word A${index + 1}`,
      `word B${index + 1}`,
      `word C${index + 1}`,
      `word D${index + 1}`,
    ]),
  )

  const paragraphQuestions = Array.from({ length: 7 }, (_, index) =>
    makeParaOrderingQuestion(39 + index, `activity ${index + 1}`),
  ).flat()

  const comprehensionStories = [
    ...makePassage(1, 'The Clever Hare', 46),
    ...makePassage(2, 'The Lost Calf', 51),
    ...makePassage(3, 'A Visit to the River', 56),
  ]

  return [
    block('PART 3'),
    block(punctuationInstruction),
    ...punctuationQuestions,
    block('PART 4'),
    block(completionInstruction),
    ...completionQuestions,
    block('PART 5'),
    block(paragraphInstruction),
    block('Example'),
    block('The answer is A.'),
    block('Now do questions 39-45'),
    ...paragraphQuestions,
    block('READING COMPREHENSION'),
    block(comprehensionInstruction),
    ...comprehensionStories,
    block('Answer Key'),
    makeAnswerKeyLine([26, 27, 28, 29, 30, 31, 32, 33, 34, 35]),
    makeAnswerKeyLine([36, 37, 38, 39, 40, 41, 42, 43, 44, 45]),
    makeAnswerKeyLine([46, 47, 48, 49, 50, 51, 52, 53, 54, 55]),
    makeAnswerKeyLine([56, 57, 58, 59, 60]),
  ]
}

function allQuestionsFromSections(sections) {
  return sections.flatMap(section =>
    section.kind === 'passage'
      ? (section.passage?.questions || [])
      : [section.question],
  )
}

function findQuestion(sections, sourceQuestionNumber) {
  return allQuestionsFromSections(sections).find(
    question => String(question?.sourceQuestionNumber) === String(sourceQuestionNumber),
  )
}

function plainRichText(value) {
  return richTextToPlainText(value).replace(/\s+/g, ' ').trim()
}

function runRegressionTest() {
  const warnings = []
  const { sections, summary } = processImportedQuestionBlocks(makeFixtureBlocks(), warnings)

  assert.equal(warnings.length, 0)
  assert.equal(summary.questions, 35)
  assert.equal(summary.passages, 3)
  assert.equal(summary.needsReview, 0)

  const passageSections = sections.filter(section => section.kind === 'passage')
  assert.deepEqual(
    passageSections.map(section => section.passage.title),
    ['Story 1', 'Story 2', 'Story 3'],
  )
  passageSections.forEach(section => {
    assert.equal(section.passage.questions.length, 5)
    assert.match(plainRichText(section.passage.instructions), /three stories with questions on each/i)
  })
  assert.doesNotMatch(passageSections[0].passage.passageText, /Questions 46-50/i)
  assert.doesNotMatch(passageSections[1].passage.passageText, /Story 3/i)

  const q26 = findQuestion(sections, 26)
  const q31 = findQuestion(sections, 31)
  const q39 = findQuestion(sections, 39)
  const q45 = findQuestion(sections, 45)

  assert.ok(q26)
  assert.ok(q31)
  assert.ok(q39)
  assert.ok(q45)

  assert.equal(plainRichText(q26.sharedInstruction), punctuationInstruction)
  assert.equal(q26.options.length, 4)

  assert.equal(plainRichText(q31.sharedInstruction), completionInstruction)
  assert.equal(q31.options.length, 4)

  assert.equal(plainRichText(q39.sharedInstruction), paragraphInstruction)
  assert.equal(q39.options.length, 4)
  assert.match(q39.options[0], /activity 1 began in the classroom/i)
  assert.match(q39.options[0], /moved outside for practice/i)

  assert.equal(plainRichText(q45.sharedInstruction), paragraphInstruction)
  assert.equal(q45.options.length, 4)
  assert.doesNotMatch(q45.options[3], /reading comprehension/i)
}

runRegressionTest()
console.log('documentQuizParserCore regression test passed')
