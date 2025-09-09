import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, RotateCcw, Award, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import styles from './styles.module.css';

// --- Helper Functions ---

/**
 * Mendeteksi apakah teks mengandung karakter Arab.
 * @param {string} text - Teks input.
 * @returns {boolean}
 */
const containsArabic = (text) => /[\u0600-\u06FF]/.test(text);

/**
 * Menentukan arah teks (LTR, RTL, atau auto) berdasarkan dominasi karakter.
 * @param {string} text - Teks input.
 * @returns {'ltr' | 'rtl' | 'auto'}
 */
const getTextDirection = (text) => {
  if (!text) return 'ltr';
  const arabicChars = text.match(/[\u0600-\u06FF]/g)?.length || 0;
  const latinChars = text.match(/[a-zA-Z]/g)?.length || 0;

  if (arabicChars > latinChars) return 'rtl';
  if (latinChars > arabicChars) return 'ltr';
  return 'auto'; // Untuk konten campuran
};

/**
 * Utility untuk menggabungkan nama kelas secara kondisional.
 * @param  {...any} classes - Daftar kelas.
 * @returns {string}
 */
const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- Sub-Components ---

/**
 * Komponen untuk merender teks dengan deteksi arah otomatis.
 */
const DynamicText = ({ text, className = '', autoDetectDirection = true }) => {
  const direction = autoDetectDirection ? getTextDirection(text) : 'auto';

  const textClass = cn(
    styles.dynamicText,
    direction === 'rtl' && styles.arabicDominant,
    direction === 'ltr' && styles.latinDominant,
    direction === 'auto' && styles.mixedContent,
    className
  );

  return (
    <span className={textClass} dir={direction}>
      {text}
    </span>
  );
};

/**
 * Indikator progres kuis dalam bentuk lingkaran.
 */
const ProgressIndicator = ({ questions, currentQuestion, answers, onQuestionClick }) => {
  const getCircleStatus = (index) => {
    if (index === currentQuestion) return 'active';
    if (answers[index] === undefined) return 'unanswered';
    return answers[index] === questions[index].correctAnswer ? 'correct' : 'incorrect';
  };

  return (
    <div className={styles.progressContainer} role="tablist" aria-label="Navigasi soal">
      {questions.map((_, index) => {
        const status = getCircleStatus(index);
        return (
          <button
            key={index}
            className={cn(styles.progressCircle, styles[status])}
            onClick={() => onQuestionClick(index)}
            title={`Soal ${index + 1}`}
            aria-label={`Pindah ke soal ${index + 1}`}
            aria-selected={index === currentQuestion}
            role="tab"
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Komponen utama Kuis Benar/Salah.
 */
const TrueFalseQuiz = ({
  questions: originalQuestions = [],
  shuffleQuestions = false,
  title = "Kuis Benar/Salah",
  autoDetectDirection = true
}) => {
  // Memoize daftar pertanyaan yang sudah diacak atau asli.
  const questions = useMemo(() => {
    if (!shuffleQuestions) return originalQuestions;
    return [...originalQuestions].sort(() => Math.random() - 0.5);
  }, [originalQuestions, shuffleQuestions]);

  // --- State Management ---
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  // --- Derived State (Menghilangkan state yang tidak perlu) ---
  const selectedAnswer = answers[currentQuestion];
  const isAnswered = selectedAnswer !== undefined;
  const isCorrect = isAnswered && selectedAnswer === questions[currentQuestion]?.correctAnswer;

  // --- Handlers ---
  const handleAnswer = (answer) => {
    if (isAnswered) return;
    setAnswers(prev => ({ ...prev, [currentQuestion]: answer }));
  };

  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index);
    }
  }, [questions.length]);

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  // --- Effects ---
  // Reset state jika prop `questions` berubah.
  useEffect(() => {
    resetQuiz();
  }, [questions]);

  // Menambahkan navigasi keyboard (kiri/kanan).
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        goToQuestion(currentQuestion + 1);
      } else if (event.key === 'ArrowLeft') {
        goToQuestion(currentQuestion - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, goToQuestion]);

  // --- Render Logic ---
  const calculateResults = useMemo(() => {
    const total = questions.length;
    const answeredCount = Object.keys(answers).length;
    const correctCount = Object.values(answers).filter(
      (answer, index) => answer === questions[index]?.correctAnswer
    ).length;
    const incorrectCount = answeredCount - correctCount;
    const skippedCount = total - answeredCount;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return { total, correctCount, incorrectCount, skippedCount, percentage };
  }, [answers, questions]);

  const getScoreFeedback = (percentage) => {
    if (percentage >= 90) return { text: "ممتاز! Luar Biasa!", status: "success" };
    if (percentage >= 75) return { text: "جيد جداً! Sangat Baik!", status: "success" };
    if (percentage >= 60) return { text: "جيد! Baik!", status: "warning" };
    return { text: "يحتاج إلى تحسين! Perlu Ditingkatkan!", status: "danger" };
  };

  // Tampilan jika tidak ada pertanyaan
  if (questions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertCircle className={styles.errorIcon} />
          <DynamicText text="Tidak ada pertanyaan yang tersedia." autoDetectDirection={autoDetectDirection} />
        </div>
      </div>
    );
  }

  // Tampilan hasil
  if (showResults) {
    const results = calculateResults;
    const scoreFeedback = getScoreFeedback(results.percentage);

    return (
      <div className={cn(styles.container, styles.resultsContainer)}>
        <div className={styles.resultsHeader}>
          <Award className={cn(styles.resultsIcon, styles[scoreFeedback.status])} />
          <DynamicText text={title} className={styles.title} autoDetectDirection={autoDetectDirection} />
        </div>

        <div className={styles.scoreContainer}>
          <div className={styles.scoreMain}>
            <span className={styles.scoreNumber}>{results.correctCount}</span>
            <span className={styles.scoreTotal}>/ {results.total}</span>
          </div>
          <div className={styles.scorePercentage}>{results.percentage}%</div>
        </div>

        <DynamicText
          text={scoreFeedback.text}
          className={cn(styles.scoreFeedback, styles[scoreFeedback.status])}
          autoDetectDirection={autoDetectDirection}
        />

        <div className={styles.resultStats}>
          <div className={styles.statItem}>
            <span className={cn(styles.statDot, styles.correct)} />
            <DynamicText text={`Benar: ${results.correctCount}`} />
          </div>
          <div className={styles.statItem}>
            <span className={cn(styles.statDot, styles.incorrect)} />
            <DynamicText text={`Salah: ${results.incorrectCount}`} />
          </div>
          {results.skippedCount > 0 && (
            <div className={styles.statItem}>
              <span className={cn(styles.statDot, styles.unanswered)} />
              <DynamicText text={`Dilewati: ${results.skippedCount}`} />
            </div>
          )}
        </div>

        <button className={styles.primaryButton} onClick={resetQuiz}>
          <RotateCcw className={styles.buttonIcon} />
          Ulangi Kuis
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <DynamicText text={title} className={styles.title} autoDetectDirection={autoDetectDirection} />
      </header>

      {questions.length > 1 && (
        <ProgressIndicator
          questions={questions}
          currentQuestion={currentQuestion}
          answers={answers}
          onQuestionClick={goToQuestion}
        />
      )}

      <div className={styles.questionContainer}>
        <div className={styles.questionHeader}>
          <span className={styles.questionNumber}>Soal {currentQuestion + 1} dari {questions.length}</span>
          {!isAnswered && <span className={styles.tag}>Belum dijawab</span>}
        </div>

        <div className={styles.questionText}>
          <DynamicText text={currentQ.question} autoDetectDirection={autoDetectDirection} />
        </div>

        <div className={styles.answersContainer}>
          <button
            className={cn(
              styles.answerButton, styles.trueButton,
              isAnswered && selectedAnswer === true && (isCorrect ? styles.correct : styles.incorrect),
              isAnswered && currentQ.correctAnswer === true && styles.correctAnswer
            )}
            onClick={() => handleAnswer(true)}
            disabled={isAnswered}
          >
            <Check className={styles.buttonIcon} /> Benar
          </button>
          <button
            className={cn(
              styles.answerButton, styles.falseButton,
              isAnswered && selectedAnswer === false && (isCorrect ? styles.correct : styles.incorrect),
              isAnswered && currentQ.correctAnswer === false && styles.correctAnswer
            )}
            onClick={() => handleAnswer(false)}
            disabled={isAnswered}
          >
            <X className={styles.buttonIcon} /> Salah
          </button>
        </div>

        {isAnswered && currentQ.feedback && (
          <div className={cn(styles.feedback, isCorrect ? styles.correctFeedback : styles.incorrectFeedback)}>
            <DynamicText text={currentQ.feedback} autoDetectDirection={autoDetectDirection} />
          </div>
        )}
      </div>

      <footer className={styles.navigation}>
        <button
          className={styles.navButton}
          onClick={() => goToQuestion(currentQuestion - 1)}
          disabled={currentQuestion === 0}
          aria-label="Soal Sebelumnya"
        >
          <ChevronLeft />
        </button>

        <div className={styles.navCenter}>
          {allAnswered && (
            <button className={styles.primaryButton} onClick={() => setShowResults(true)}>
              <Award className={styles.buttonIcon} /> Lihat Hasil
            </button>
          )}
        </div>

        <button
          className={styles.navButton}
          onClick={() => goToQuestion(currentQuestion + 1)}
          disabled={currentQuestion === questions.length - 1}
          aria-label="Soal Berikutnya"
        >
          <ChevronRight />
        </button>
      </footer>
    </div>
  );
};

export default TrueFalseQuiz;
