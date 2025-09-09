import React, { useState, useEffect, useMemo } from 'react';
import { RotateCcw, Award, Lightbulb, CheckCircle, ArrowLeftCircle, ArrowRightCircle } from 'lucide-react';
import styles from './SentenceScrambleQuiz.module.css';

// -- Komponen untuk satu soal --
const ScrambleQuestion = ({ question, onQuestionSubmit }) => {
    const [wordPool, setWordPool] = useState([]);
    const [constructedSentence, setConstructedSentence] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);

    useEffect(() => {
        // Inisialisasi atau reset soal ketika data pertanyaan berubah
        const shuffledWords = [...question.words].sort(() => Math.random() - 0.5);
        setWordPool(shuffledWords.map((word, index) => ({ id: `${question.id}-pool-${index}`, text: word })));
        setConstructedSentence([]);
        setIsSubmitted(false);
        setIsCorrect(null);
    }, [question]);

    const handleMoveToSentence = (word) => {
        if (isSubmitted) return;
        setWordPool(prev => prev.filter(w => w.id !== word.id));
        setConstructedSentence(prev => [...prev, word]);
    };

    const handleMoveToPool = (word) => {
        if (isSubmitted) return;
        setConstructedSentence(prev => prev.filter(w => w.id !== word.id));
        setWordPool(prev => [...prev, word]);
    };

    const handleSubmit = () => {
        const userAnswer = constructedSentence.map(w => w.text).join(' ');
        // Memeriksa apakah jawaban pengguna cocok dengan salah satu jawaban benar
        const correct = question.correctAnswers.includes(userAnswer);

        setIsCorrect(correct);
        setIsSubmitted(true);
        onQuestionSubmit(question.id, correct);
    };

    const getSentenceBoxStatus = () => {
        if (!isSubmitted) return '';
        return isCorrect ? styles.sentenceBoxCorrect : styles.sentenceBoxIncorrect;
    };

    return (
        <div className={styles.slide}>
            <p className={styles.instruction}>{question.instruction}</p>

            <div className={`${styles.sentenceBox} ${getSentenceBoxStatus()}`}>
                {constructedSentence.length === 0 && !isSubmitted && (
                    <span className={styles.placeholder}>Klik kata di bawah untuk memulai...</span>
                )}
                {constructedSentence.map((word) => (
                    <button key={word.id} onClick={() => handleMoveToPool(word)} className={`${styles.wordTile} ${styles.inSentence}`} disabled={isSubmitted}>
                        {word.text}
                    </button>
                ))}
            </div>

            <div className={styles.wordPoolBox}>
                {wordPool.map((word) => (
                    <button key={word.id} onClick={() => handleMoveToSentence(word)} className={styles.wordTile} disabled={isSubmitted}>
                        {word.text}
                    </button>
                ))}
            </div>

            <div className={styles.questionActions}>
                <button onClick={handleSubmit} disabled={wordPool.length > 0 || isSubmitted} className={`${styles.button} ${styles.submitButton}`}>
                    <CheckCircle size={18} /> Periksa Jawaban
                </button>
            </div>

            {isSubmitted && question.feedback && (
                <div className={styles.feedback}>
                    <div className={styles.feedbackHeader}><Lightbulb size={18} /><strong>Penjelasan</strong></div>
                    <div className={styles.feedbackContent}>
                        {question.feedback}
                        <div className={styles.correctAnswerInfo}>
                            <strong>Jawaban Benar:</strong> {question.correctAnswers[0]}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// -- Komponen Utama Kuis (Slider) --
const SentenceScrambleQuiz = ({ questions, title = "Kuis Menyusun Kalimat" }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const [resetCounter, setResetCounter] = useState(0); // State untuk memicu reset

    const totalScore = useMemo(() => {
        return Object.values(answers).filter(isCorrect => isCorrect).length;
    }, [answers]);

    const handleQuestionSubmit = (questionId, isCorrect) => {
        setAnswers(prev => ({ ...prev, [questionId]: isCorrect }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleShowResults = () => {
        setIsQuizFinished(true);
    };

    const handleResetQuiz = () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setIsQuizFinished(false);
        setResetCounter(prev => prev + 1); // Menaikkan counter untuk me-reset komponen anak
    };

    const allQuestionsAnswered = Object.keys(answers).length === questions.length;
    const getScoreLevel = () => (totalScore / questions.length) * 100 >= 80 ? 'excellent' : (totalScore / questions.length) * 100 >= 60 ? 'good' : 'needsImprovement';

    if (isQuizFinished) {
        return (
            <div className={styles.quizContainer}>
                <div className={styles.resultsCard}>
                    <div className={styles.header}>
                        <h2 className={styles.title}>Hasil Kuis</h2>
                    </div>
                    <div className={`${styles.scoreDisplay} ${styles[getScoreLevel()]}`}>
                        <Award size={48} />
                        <span>{totalScore}/{questions.length}</span>
                    </div>
                    <p className={styles.scoreMessage}>Anda menjawab benar {totalScore} dari {questions.length} soal.</p>
                    <button onClick={handleResetQuiz} className={`${styles.button} ${styles.resetButton}`}>
                        <RotateCcw size={18} /> Ulangi Kuis
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.quizContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <p className={styles.progressIndicator}>Soal {currentQuestionIndex + 1} dari {questions.length}</p>
            </div>

            <div className={styles.sliderContainer}>
                <div className={styles.slider} style={{ transform: `translateX(-${currentQuestionIndex * 100}%)` }}>
                    {questions.map((q, index) => (
                        <ScrambleQuestion
                            key={`${q.id}-${resetCounter}`} // Kunci sekarang bergantung pada resetCounter
                            question={q}
                            onQuestionSubmit={handleQuestionSubmit}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.navigation}>
                <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className={styles.navButton}>
                    <ArrowLeftCircle size={24} />
                    <span>Sebelumnya</span>
                </button>
                {currentQuestionIndex < questions.length - 1 ? (
                    <button
                        onClick={handleNext}
                        disabled={answers[questions[currentQuestionIndex].id] === undefined}
                        title={answers[questions[currentQuestionIndex].id] === undefined ? "Jawab soal ini terlebih dahulu" : ""}
                        className={`${styles.button} ${styles.navButton}`}
                    >
                        <span>Berikutnya</span>
                        <ArrowRightCircle size={24} />
                    </button>
                ) : (
                    <button onClick={handleShowResults} disabled={!allQuestionsAnswered} title={!allQuestionsAnswered ? "Selesaikan semua soal untuk melihat hasil" : ""} className={`${styles.button} ${styles.submitButton}`}>
                        Lihat Hasil
                    </button>
                )}
            </div>
        </div>
    );
};

export default SentenceScrambleQuiz;

