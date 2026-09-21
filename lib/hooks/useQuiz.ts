'use client'

import { useState, useCallback } from 'react'
import type { Birthday } from '@/types'
import type { Language } from '@/lib/i18n/types'
import { translate } from '@/lib/i18n/resolveLocale'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

interface UseQuizReturn {
  questions: QuizQuestion[]
  currentQuestion: number
  score: number
  isComplete: boolean
  isPlaying: boolean
  selectedAnswer: number | null
  answerQuestion: (answerIndex: number) => void
  nextQuestion: () => void
  startQuiz: (birthdays: Birthday[], language?: Language) => void
  resetQuiz: () => void
}

function generateQuestions(birthdays: Birthday[], language: Language = 'ja'): QuizQuestion[] {
  if (birthdays.length < 4) return []

  const questions: QuizQuestion[] = []
  const shuffled = [...birthdays].sort(() => Math.random() - 0.5)
  const months = translate(language, 'months', 'ja').split(',')

  // 質問タイプ1: Xの誕生日はいつ？
  for (let i = 0; i < Math.min(3, shuffled.length); i++) {
    const person = shuffled[i]
    const correctMonth = months[person.month - 1]
    const wrongMonths = months
      .filter((_, idx) => idx !== person.month - 1)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const options = [correctMonth, ...wrongMonths].sort(() => Math.random() - 0.5)
    const correctAnswer = options.indexOf(correctMonth)

    const question = translate(language, 'quizBirthdayMonthQuestion', 'ja', { name: person.name })

    questions.push({
      id: questions.length,
      question,
      options,
      correctAnswer,
    })
  }

  // 質問タイプ2: X月に誕生日があるのは誰？
  for (let i = 0; i < Math.min(2, shuffled.length); i++) {
    const person = shuffled[i]
    const wrongPeople = shuffled
      .filter((p) => p.id !== person.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => p.name)

    const options = [person.name, ...wrongPeople].sort(() => Math.random() - 0.5)
    const correctAnswer = options.indexOf(person.name)

    const question = translate(language, 'quizWhoHasBirthday', 'ja', { month: months[person.month - 1] })

    questions.push({
      id: questions.length,
      question,
      options,
      correctAnswer,
    })
  }

  return questions.sort(() => Math.random() - 0.5).slice(0, 5)
}

export function useQuiz(initialLanguage: Language = 'ja'): UseQuizReturn {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  const isComplete = isPlaying && currentQuestion >= questions.length

  const startQuiz = useCallback(
    (birthdays: Birthday[], language?: Language) => {
      const generatedQuestions = generateQuestions(birthdays, language ?? initialLanguage)
      setQuestions(generatedQuestions)
      setCurrentQuestion(0)
      setScore(0)
      setSelectedAnswer(null)
      setIsPlaying(true)
    },
    [initialLanguage]
  )

  const resetQuiz = useCallback(() => {
    setQuestions([])
    setCurrentQuestion(0)
    setScore(0)
    setSelectedAnswer(null)
    setIsPlaying(false)
  }, [])

  const answerQuestion = useCallback(
    (answerIndex: number) => {
      if (selectedAnswer !== null || !isPlaying) return

      setSelectedAnswer(answerIndex)
      const question = questions[currentQuestion]
      if (question && answerIndex === question.correctAnswer) {
        setScore((prev) => prev + 20)
      }
    },
    [questions, currentQuestion, selectedAnswer, isPlaying]
  )

  const nextQuestion = useCallback(() => {
    setSelectedAnswer(null)
    setCurrentQuestion((prev) => prev + 1)
  }, [])

  return {
    questions,
    currentQuestion,
    score,
    isComplete,
    isPlaying,
    selectedAnswer,
    answerQuestion,
    nextQuestion,
    startQuiz,
    resetQuiz,
  }
}
