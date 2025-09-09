import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, CheckCircle, XCircle, Award, Lightbulb } from 'lucide-react';
import styles from './MultipleChoiceQuiz.module.css';

// Komponen utama untuk Kuis
const MultipleChoiceQuiz = ({ questions, title = "Kuis Nahwu", shuffleQuestions = false }) => {
  const [processedQuestions, setProcessedQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Ref untuk container kuis agar dapat di-scroll
  const quizContainerRef = useRef(null);

  // Fungsi untuk scroll ke atas, berguna setelah submit atau reset
  const scrollToTop = () => {
    if (quizContainerRef.current) {
      quizContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Fungsi untuk mengacak array (algoritma Fisher-Yates)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // REFAKTOR: Inisialisasi dan pemrosesan kuis dijadikan satu fungsi
  // Menggunakan useCallback agar fungsi ini tidak dibuat ulang di setiap render
  const initializeQuiz = useCallback(() => {
    let initialQuestions = questions.map((question, index) => ({
      ...question,
      id: index, // ID asli untuk tracking jawaban
      shuffledOptions: shuffleArray(question.options.map((option, optIndex) => ({
        ...option,
        originalIndex: optIndex
      })))
    }));

    if (shuffleQuestions) {
      initialQuestions = shuffleArray(initialQuestions);
    }

    // Menambahkan displayIndex untuk penomoran yang konsisten di UI
    initialQuestions = initialQuestions.map((question, index) => ({
      ...question,
      displayIndex: index
    }));

    setProcessedQuestions(initialQuestions);
  }, [questions, shuffleQuestions]);


  // Efek untuk inisialisasi kuis saat komponen pertama kali dimuat
  useEffect(() => {
    initializeQuiz();
  }, [initializeQuiz]);

  // Handler untuk memilih jawaban
  const handleAnswerSelect = (questionId, selectedOptionIndex) => {
    if (isSubmitted) return; // Mencegah perubahan setelah kuis disubmit

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: selectedOptionIndex
    }));
  };

  // Handler untuk submit kuis
  const handleSubmit = () => {
    let correctCount = 0;
    processedQuestions.forEach(question => {
      const selectedOptionIndex = selectedAnswers[question.id];
      if (selectedOptionIndex !== undefined) {
        const selectedOption = question.shuffledOptions[selectedOptionIndex];
        if (selectedOption.isCorrect) {
          correctCount++;
        }
      }
    });

    setScore(correctCount);
    setIsSubmitted(true);
    setTimeout(scrollToTop, 100); // Scroll ke atas untuk melihat hasil
  };

  // Handler untuk mereset kuis
  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
    initializeQuiz(); // Memanggil fungsi inisialisasi yang sudah direfaktor
    setTimeout(scrollToTop, 100);
  };

  // PERBAIKAN UX: Logika status jawaban diperjelas
  const getAnswerStatus = (questionId, optionIndex) => {
    if (!isSubmitted) return 'unanswered';

    const question = processedQuestions.find(q => q.id === questionId);
    const option = question.shuffledOptions[optionIndex];
    const isSelected = selectedAnswers[questionId] === optionIndex;

    if (option.isCorrect) {
      return 'correct'; // Ini adalah jawaban yang benar
    }
    if (isSelected && !option.isCorrect) {
      return 'incorrect'; // Pengguna memilih ini, dan ini salah
    }
    // Jika tidak dipilih dan bukan jawaban benar
    return 'neutral';
  };

  // Mendapatkan kelas CSS berdasarkan level skor
  const getScoreLevel = () => {
    const percentage = (score / processedQuestions.length) * 100;
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    return 'needsImprovement';
  };

  // Mendapatkan pesan motivasi berdasarkan skor
  const getScoreMessage = () => {
    const percentage = (score / processedQuestions.length) * 100;
    if (percentage >= 80) return 'ممتاز! (Luar biasa!) 🎉';
    if (percentage >= 60) return 'جيد! (Bagus!) 👍';
    return 'يحتاج إلى مزيد من الدراسة (Perlu belajar lagi) 📚';
  };

  if (processedQuestions.length === 0) {
    return <div className={styles.loading}>جاري التحميل... (Loading...)</div>;
  }

  return (
    <div className={styles.quizContainer} ref={quizContainerRef}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.info}>
          <span>{processedQuestions.length} أسئلة (soal)</span>
          {isSubmitted && (
            <span className={styles.scoreInfo}>
              <Award size={16} />
              النتيجة (Skor): {score}/{processedQuestions.length}
            </span>
          )}
        </div>
      </div>

      {/* PERBAIKAN UI: Tampilan hasil kuis dibuat lebih menarik */}
      {isSubmitted && (
        <div className={styles.resultsCard}>
          <div className={styles.resultsContent}>
            <div className={`${styles.scoreDisplay} ${styles[getScoreLevel()]}`}>
              <Award size={48} className={styles.scoreIcon} />
              <span>{score}/{processedQuestions.length}</span>
            </div>
            <div className={styles.scoreMessage}>
              {getScoreMessage()}
            </div>
            <div className={styles.percentage}>
              Persentase Benar: {Math.round((score / processedQuestions.length) * 100)}%
            </div>
          </div>
        </div>
      )}

      <div className={styles.questions}>
        {processedQuestions.map((question) => {
          const userAnswerIndex = selectedAnswers[question.id];
          const isQuestionAnsweredCorrectly = userAnswerIndex !== undefined && question.shuffledOptions[userAnswerIndex].isCorrect;

          return (
            <div key={question.id} className={`${styles.questionCard} ${isSubmitted ? (isQuestionAnsweredCorrectly ? styles.cardCorrect : styles.cardIncorrect) : ''}`}>
              <div className={styles.questionHeader}>
                <div className={styles.questionContent}>
                  <span className={styles.questionNumber}>
                    {question.displayIndex + 1}
                  </span>
                  <div className={styles.questionTextContainer}>
                    <h3 className={styles.questionText}>
                      {question.question}
                    </h3>
                    {question.arabicText && (
                      <div className={styles.arabicText}>
                        {question.arabicText}
                      </div>
                    )}
                    {question.instruction && (
                      <div className={styles.instruction}>
                        {question.instruction}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.options}>
                {question.shuffledOptions.map((option, optionIndex) => {
                  const status = getAnswerStatus(question.id, optionIndex);
                  const isSelected = selectedAnswers[question.id] === optionIndex;

                  let optionClasses = styles.option;
                  if (isSubmitted) {
                    if (status === 'correct') optionClasses += ` ${styles.correct}`;
                    else if (status === 'incorrect') optionClasses += ` ${styles.incorrect}`;
                    else optionClasses += ` ${styles.disabled}`;
                  } else {
                    if (isSelected) optionClasses += ` ${styles.selected}`;
                    else optionClasses += ` ${styles.selectable}`;
                  }

                  return (
                    <div
                      key={optionIndex}
                      className={optionClasses}
                      onClick={() => handleAnswerSelect(question.id, optionIndex)}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <div className={styles.optionContent}>
                        <div className={styles.optionLeft}>
                          <div className={`${styles.radio} ${isSelected ? styles.radioSelected : ''}`}>
                            {isSelected && <div className={styles.radioInner}></div>}
                          </div>
                          <span className={styles.optionLabel}>
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <div className={styles.optionTextContainer}>
                            <span className={styles.optionText}>{option.text}</span>
                            {option.arabicText && (
                              <span className={styles.optionArabicText}>{option.arabicText}</span>
                            )}
                          </div>
                        </div>
                        {isSubmitted && status === 'correct' && (
                          <CheckCircle size={20} className={styles.statusIcon} />
                        )}
                        {isSubmitted && status === 'incorrect' && (
                          <XCircle size={20} className={styles.statusIcon} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PERBAIKAN UI/UX: Feedback dibuat lebih menonjol */}
              {isSubmitted && question.feedback && (
                <div className={styles.feedback}>
                  <div className={styles.feedbackHeader}>
                    <Lightbulb size={18} />
                    <strong>Penjelasan</strong>
                  </div>
                  <div className={styles.feedbackContent}>
                    {question.feedback}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < processedQuestions.length}
            className={`${styles.button} ${styles.submitButton}`}
            title={Object.keys(selectedAnswers).length < processedQuestions.length ? 'Harap jawab semua pertanyaan' : 'Periksa Jawaban'}
          >
            فحص الإجابات (Periksa Jawaban)
          </button>
        ) : (
          <button
            onClick={handleReset}
            className={`${styles.button} ${styles.resetButton}`}
          >
            <RotateCcw size={18} />
            إعادة الاختبار (Ulangi Kuis)
          </button>
        )}
      </div>
    </div>
  );
};

export default MultipleChoiceQuiz;
