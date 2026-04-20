import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore'

const DELETE_BATCH_LIMIT = 450

function chunk(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

export async function deleteQuizWithQuestions(db, quizId) {
  const questionsSnap = await getDocs(collection(db, 'quizzes', quizId, 'questions'))

  for (const docsChunk of chunk(questionsSnap.docs, DELETE_BATCH_LIMIT)) {
    const batch = writeBatch(db)
    docsChunk.forEach(questionDoc => batch.delete(questionDoc.ref))
    await batch.commit()
  }

  await deleteDoc(doc(db, 'quizzes', quizId))

  return {
    quizId,
    questionsDeleted: questionsSnap.size,
  }
}
