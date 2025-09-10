import React, { useState, useMemo, useRef } from 'react'; // BARU: Impor useRef
import PropTypes from 'prop-types';
import { RotateCcw, Award, Lightbulb, Info } from 'lucide-react';
import styles from './ClickableWrittenExpressionQuiz.module.css';

// Komponen helper untuk mem-parsing kalimat (tidak ada perubahan)
const parseSentence = (sentence, options) => {
  const optionsRegex = new RegExp(`(${options.map(opt => opt.text).join('|')})`, 'g');
  const parts = sentence.split(optionsRegex).filter(part => part);

  return parts.map((partText) => {
    const matchingOption = options.find(opt => opt.text === partText);
    if (matchingOption) {
      return {
        isOption: true,
        text: partText,
        optionKey: matchingOption.key,
      };
    }
    return {
      isOption: false,
      text: partText,
    };
  });
};


// Komponen QuestionCard (tidak ada perubahan)
const QuestionCard = ({ question, questionNumber, userAnswerKey, isSubmitted, onAnswerSelect }) => {
  const sentenceParts = useMemo(() => {
    if (question.sentenceParts) {
      return question.sentenceParts;
    }
    return parseSentence(question.sentence, question.options);
  }, [question]);

  const getOptionClasses = (part) => {
    if (!part.isOption) return null;

    let classes = [styles.clickableOption];
    const isSelected = userAnswerKey === part.optionKey;
    const isCorrectAnswer = part.optionKey === question.correctAnswerKey;

    if (isSubmitted) {
      if (isCorrectAnswer) {
        classes.push(styles.correct);
      } else if (isSelected) {
        classes.push(styles.incorrect);
      }
    } else if (isSelected) {
      classes.push(styles.selected);
    }

    return classes.join(' ');
  };

  const sentenceElements = sentenceParts.map((part, index) => (
    part.isOption ? (
      <button
        key={`${question.id}-${part.optionKey}`}
        className={getOptionClasses(part)}
        onClick={() => !isSubmitted && onAnswerSelect(question.id, part.optionKey)}
        disabled={isSubmitted}
      >
        {part.text}
      </button>
    ) : (
      <span key={index}>{part.text}</span>
    )
  ));

  return (
    <div className={styles.questionCard}>
      <div className={styles.questionHeader}>
        <span className={styles.questionNumber}>{questionNumber}</span>
        <p className={styles.sentenceContainer}>
          {sentenceElements}
        </p>
      </div>

      {isSubmitted && question.feedback && (
        <div className={styles.feedback}>
          <div className={styles.feedbackHeader}><Lightbulb size={18} /><strong>Penjelasan</strong></div>
          <div className={styles.feedbackContent}>{question.feedback}</div>
        </div>
      )}
    </div>
  );
};


// -- Komponen Utama Kuis --
const ClickableWrittenExpressionQuiz = ({ questions, title }) => {
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  // BARU: Buat ref untuk kontainer kuis
  const quizContainerRef = useRef(null);

  const totalQuestions = questions.length;

  const { totalScore, scorePercentage } = useMemo(() => {
    if (!isSubmitted) return { totalScore: 0, scorePercentage: 0 };

    const score = questions.reduce((acc, q) => {
      return userAnswers[q.id] === q.correctAnswerKey ? acc + 1 : acc;
    }, 0);

    return {
      totalScore: score,
      scorePercentage: totalQuestions > 0 ? (score / totalQuestions) * 100 : 0,
    };
  }, [isSubmitted, userAnswers, questions, totalQuestions]);

  const handleAnswerSelect = (questionId, optionKey) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  // FUNGSI UNTUK MENGGULIR KE ATAS KONTENER
  const scrollToTop = () => {
    // DIUBAH: Gunakan ref.current, bukan document.querySelector
    if (quizContainerRef.current) {
      quizContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Panggil fungsi scroll yang sudah diperbaiki
    scrollToTop();
  };

  const handleReset = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    // Panggil fungsi scroll yang sudah diperbaiki
    scrollToTop();
  };

  const allQuestionsAnswered = Object.keys(userAnswers).length === totalQuestions;

  const getScoreLevel = () => {
    if (scorePercentage >= 80) return 'excellent';
    if (scorePercentage >= 60) return 'good';
    return 'needsImprovement';
  };

  return (
    // BARU: Tambahkan ref ke elemen kontainer utama
    <div className={styles.quizContainer} ref={quizContainerRef}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {isSubmitted && (
          <p className={styles.scoreInfo}>Skor Anda: {totalScore} / {totalQuestions}</p>
        )}
      </div>

      {isSubmitted && (
        <div className={styles.resultsCard}>
          <div className={`${styles.scoreDisplay} ${styles[getScoreLevel()]}`}>
            <Award size={48} />
            <span>{totalScore}/{totalQuestions}</span>
          </div>
          <p className={styles.scoreMessage}>Anda menemukan {totalScore} dari {totalQuestions} kesalahan dengan benar.</p>
        </div>
      )}

      <div className={styles.questionsList}>
        {questions.map((q, index) => (
          <QuestionCard
            key={q.id}
            question={q}
            questionNumber={index + 1}
            userAnswerKey={userAnswers[q.id]}
            isSubmitted={isSubmitted}
            onAnswerSelect={handleAnswerSelect}
          />
        ))}
      </div>

      <div className={styles.actions}>
        {!isSubmitted ? (
          <div className={styles.submitContainer}>
            <button
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered}
              className={`${styles.button} ${styles.submitButton}`}
              aria-describedby="submit-help"
            >
              Periksa Jawaban
            </button>
            {!allQuestionsAnswered && (
              <p id="submit-help" className={styles.submitHelpText}>
                <Info size={14} /> Jawab semua pertanyaan untuk memeriksa.
              </p>
            )}
          </div>
        ) : (
          <button onClick={handleReset} className={`${styles.button} ${styles.resetButton}`}>
            <RotateCcw size={18} /> Ulangi Kuis
          </button>
        )}
      </div>
    </div>
  );
};

ClickableWrittenExpressionQuiz.propTypes = {
  title: PropTypes.string,
  questions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sentence: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })),
    sentenceParts: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string.isRequired,
      isOption: PropTypes.bool.isRequired,
      optionKey: PropTypes.string,
    })),
    correctAnswerKey: PropTypes.string.isRequired,
    feedback: PropTypes.string.isRequired,
  })).isRequired,
};

ClickableWrittenExpressionQuiz.defaultProps = {
  title: "Kuis Analisis Kesalahan",
};

export default ClickableWrittenExpressionQuiz;
