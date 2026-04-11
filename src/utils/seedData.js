import { collection, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore'

const grade5Math = {
  title: 'Grade 5 Mathematics - Term 1',
  subject: 'Mathematics', grade: '5', term: '1', year: '2024',
  type: 'quiz', duration: 30, totalMarks: 10, isPublished: true, questionCount: 10,
}

const grade5MathQs = [
  { text: 'What is 247 + 385?', options: ['622','632','612','642'], correctAnswer: 1, topic: 'Addition', marks: 1 },
  { text: 'What is 503 - 178?', options: ['325','315','335','305'], correctAnswer: 0, topic: 'Subtraction', marks: 1 },
  { text: 'What is 6 × 8?', options: ['42','46','48','54'], correctAnswer: 2, topic: 'Multiplication', marks: 1 },
  { text: 'What is 9 × 7?', options: ['54','63','72','56'], correctAnswer: 1, topic: 'Multiplication', marks: 1 },
  { text: 'A farmer has 456 chickens. He sells 129. How many are left?', options: ['327','337','317','347'], correctAnswer: 0, topic: 'Subtraction', marks: 1 },
  { text: 'What is 1000 - 375?', options: ['615','635','625','645'], correctAnswer: 2, topic: 'Subtraction', marks: 1 },
  { text: 'What is 12 × 5?', options: ['50','55','60','65'], correctAnswer: 2, topic: 'Multiplication', marks: 1 },
  { text: 'Bupe has 234 mangoes. Chanda gives her 189 more. How many in total?', options: ['413','423','433','403'], correctAnswer: 1, topic: 'Addition', marks: 1 },
  { text: 'What is 72 ÷ 8?', options: ['8','9','7','6'], correctAnswer: 1, topic: 'Division', marks: 1 },
  { text: 'What is 156 + 244?', options: ['390','400','410','380'], correctAnswer: 1, topic: 'Addition', marks: 1 },
]

const grade6English = {
  title: 'Grade 6 English - Term 1',
  subject: 'English', grade: '6', term: '1', year: '2024',
  type: 'quiz', duration: 25, totalMarks: 10, isPublished: true, questionCount: 10,
}

const grade6EnglishQs = [
  { text: 'Which word is a noun?', options: ['Run','Beautiful','Table','Quickly'], correctAnswer: 2, topic: 'Grammar', marks: 1 },
  { text: 'Choose the correct past tense: "She ___ to school yesterday."', options: ['go','went','goed','going'], correctAnswer: 1, topic: 'Grammar', marks: 1 },
  { text: 'What is the plural of "child"?', options: ['Childs','Children','Childes','Childrens'], correctAnswer: 1, topic: 'Vocabulary', marks: 1 },
  { text: 'Which sentence is correct?', options: ['She don\'t like it.','She doesn\'t like it.','She not like it.','She no like it.'], correctAnswer: 1, topic: 'Grammar', marks: 1 },
  { text: 'What does "enormous" mean?', options: ['Tiny','Colourful','Very big','Fast'], correctAnswer: 2, topic: 'Vocabulary', marks: 1 },
  { text: 'Choose the correct spelling:', options: ['Beautifull','Beutiful','Beautiful','Beautful'], correctAnswer: 2, topic: 'Spelling', marks: 1 },
  { text: 'Which is an adjective?', options: ['Walk','Bright','Slowly','Above'], correctAnswer: 1, topic: 'Grammar', marks: 1 },
  { text: '"The cat sat on the mat." What is the subject?', options: ['Sat','Mat','On','Cat'], correctAnswer: 3, topic: 'Comprehension', marks: 1 },
  { text: 'Which word means the opposite of "happy"?', options: ['Glad','Sad','Angry','Excited'], correctAnswer: 1, topic: 'Vocabulary', marks: 1 },
  { text: 'Fill in: "I have ___ seen that movie."', options: ['ever','never','all','good'], correctAnswer: 1, topic: 'Grammar', marks: 1 },
]

export async function seedFirestore(db) {
  // Quiz 1
  const q1Ref = doc(collection(db, 'quizzes'))
  const batch1 = writeBatch(db)
  batch1.set(q1Ref, { ...grade5Math, createdBy: 'seed', createdAt: serverTimestamp() })
  grade5MathQs.forEach((q, i) => {
    const qRef = doc(collection(db, 'quizzes', q1Ref.id, 'questions'))
    batch1.set(qRef, { ...q, order: i + 1 })
  })
  await batch1.commit()

  // Quiz 2
  const q2Ref = doc(collection(db, 'quizzes'))
  const batch2 = writeBatch(db)
  batch2.set(q2Ref, { ...grade6English, createdBy: 'seed', createdAt: serverTimestamp() })
  grade6EnglishQs.forEach((q, i) => {
    const qRef = doc(collection(db, 'quizzes', q2Ref.id, 'questions'))
    batch2.set(qRef, { ...q, order: i + 1 })
  })
  await batch2.commit()
}
