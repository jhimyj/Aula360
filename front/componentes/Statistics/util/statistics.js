export const processStatisticsData = (questions) => {
  if (!questions || questions.length === 0) {
    return {
      totalQuestions: 0,
    }
  }

  // Extraer los puntajes de las preguntas
  const scores = questions.map((q) => q.score || 0).filter((score) => score > 0)

  // Calcular la media (promedio)
  const mean = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0

  // Calcular la mediana
  let median = 0
  if (scores.length > 0) {
    const sortedScores = [...scores].sort((a, b) => a - b)
    const mid = Math.floor(sortedScores.length / 2)
    median =
      sortedScores.length % 2 === 0 ? Math.round((sortedScores[mid - 1] + sortedScores[mid]) / 2) : sortedScores[mid]
  }

  // Calcular la moda
  let mode = 0
  if (scores.length > 0) {
    const frequency = {}
    let maxFreq = 0

    scores.forEach((score) => {
      frequency[score] = (frequency[score] || 0) + 1
      if (frequency[score] > maxFreq) {
        maxFreq = frequency[score]
        mode = score
      }
    })
  }

  // Calcular dificultad por nivel
  const difficultyCount = {
    EASY: questions.filter((q) => q.difficulty === "EASY").length,
    MEDIUM: questions.filter((q) => q.difficulty === "MEDIUM").length,
    HARD: questions.filter((q) => q.difficulty === "HARD").length,
  }

  return {
    totalQuestions: questions.length,
    mean,
    median,
    mode,
    difficultyCount,
  }
}
 