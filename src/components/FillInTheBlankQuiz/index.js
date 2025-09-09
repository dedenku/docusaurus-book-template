import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Award, Lightbulb, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import styles from './FillInTheBlankQuiz.module.css';

// Komponen untuk kuis isian singkat
const FillInTheBlankQuiz = ({ questions, title = "Kuis Isian Singkat" }) => {
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [processedQuestions, setProcessedQuestions] = useState([]);

    const quizContainerRef = useRef(null);

    // Fungsi normalisasi untuk membersihkan jawaban sebelum divalidasi
    const normalizeAnswer = (str) => {
        if (typeof str !== 'string') return '';
        // Hapus harakat dari teks Arab
        const withoutHarakat = str.replace(/[ًٌٍَُِّْ~]/g, '');
        // Hapus spasi di awal/akhir dan ubah ke huruf kecil
        return withoutHarakat.trim().toLowerCase();
    };

    // Inisialisasi pertanyaan saat komponen dimuat
    useEffect(() => {
        const initialQuestions = questions.map((q, index) => ({ ...q, id: index, displayIndex: index }));
        setProcessedQuestions(initialQuestions);
        // Siapkan state jawaban dengan string kosong
        const initialAnswers = {};
        initialQuestions.forEach(q => {
            initialAnswers[q.id] = '';
        });
        setUserAnswers(initialAnswers);
    }, [questions]);

    const scrollToTop = () => {
        if (quizContainerRef.current) {
            quizContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleInputChange = (questionId, value) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    // Fungsi untuk memeriksa apakah jawaban user benar
    const isAnswerCorrect = useCallback((question, userAnswer) => {
        const normalizedUserAnswer = normalizeAnswer(userAnswer);
        if (normalizedUserAnswer === '') return false;
        // Bandingkan dengan setiap kemungkinan jawaban benar yang sudah dinormalisasi
        return question.correctAnswers.some(correct => normalizeAnswer(correct) === normalizedUserAnswer);
    }, []);

    const handleSubmit = () => {
        let correctCount = 0;
        processedQuestions.forEach(question => {
            const userAnswer = userAnswers[question.id] || '';
            if (isAnswerCorrect(question, userAnswer)) {
                correctCount++;
            }
        });
        setScore(correctCount);
        setIsSubmitted(true);
        setTimeout(scrollToTop, 100);
    };

    const handleReset = () => {
        const initialAnswers = {};
        processedQuestions.forEach(q => {
            initialAnswers[q.id] = '';
        });
        setUserAnswers(initialAnswers);
        setIsSubmitted(false);
        setScore(0);
        setTimeout(scrollToTop, 100);
    };

    const getScoreLevel = () => {
        const percentage = (score / processedQuestions.length) * 100;
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        return 'needsImprovement';
    };

    const getScoreMessage = () => {
        const percentage = (score / processedQuestions.length) * 100;
        if (percentage >= 80) return 'ممتاز! (Luar biasa!) 🎉';
        if (percentage >= 60) return 'جيد! (Bagus!) 👍';
        return 'يحتاج إلى مزيد من الدراسة (Perlu belajar lagi) 📚';
    };

    const areAllQuestionsAnswered = () => {
        return processedQuestions.every(q => (userAnswers[q.id] || '').trim() !== '');
    };

    if (processedQuestions.length === 0) {
        return <div className={styles.loading}>Memuat kuis...</div>;
    }

    return (
        <div className={styles.quizContainer} ref={quizContainerRef}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <div className={styles.info}>
                    <span>{processedQuestions.length} Pertanyaan</span>
                    {isSubmitted && (
                        <span className={styles.scoreInfo}>
                            <Award size={16} />
                            Skor: {score}/{processedQuestions.length}
                        </span>
                    )}
                </div>
            </div>

            {isSubmitted && (
                <div className={styles.resultsCard}>
                    <div className={styles.resultsContent}>
                        <div className={`${styles.scoreDisplay} ${styles[getScoreLevel()]}`}>
                            <Award size={48} className={styles.scoreIcon} />
                            <span>{score}/{processedQuestions.length}</span>
                        </div>
                        <div className={styles.scoreMessage}>{getScoreMessage()}</div>
                        <div className={styles.percentage}>
                            Persentase Benar: {Math.round((score / processedQuestions.length) * 100)}%
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.questions}>
                {processedQuestions.map((question) => {
                    const isCorrect = isAnswerCorrect(question, userAnswers[question.id] || '');
                    const inputClasses = [styles.answerInput];
                    if (question.answerType !== 'indonesia') {
                        inputClasses.push(styles.arabicInput);
                    }
                    if (isSubmitted) {
                        inputClasses.push(isCorrect ? styles.correctInput : styles.incorrectInput);
                    }

                    return (
                        <div key={question.id} className={`${styles.questionCard} ${isSubmitted ? (isCorrect ? styles.cardCorrect : styles.cardIncorrect) : ''}`}>
                            <div className={styles.questionHeader}>
                                <div className={styles.questionContent}>
                                    <span className={styles.questionNumber}>{question.displayIndex + 1}</span>
                                    <div className={styles.questionTextContainer}>
                                        <h3 className={styles.questionText}>{question.question}</h3>
                                        {question.arabicText && <div className={styles.arabicText}>{question.arabicText}</div>}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.answerSection}>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        className={inputClasses.join(' ')}
                                        value={userAnswers[question.id] || ''}
                                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                                        placeholder={question.placeholder || 'Ketik jawaban Anda di sini...'}
                                        disabled={isSubmitted}
                                        dir={question.answerType !== 'indonesia' ? 'rtl' : 'ltr'}
                                    />
                                    {isSubmitted && (
                                        <div className={styles.validationIcon}>
                                            {isCorrect ? <CheckCircle size={20} className={styles.correctIcon} /> : <XCircle size={20} className={styles.incorrectIcon} />}
                                        </div>
                                    )}
                                </div>
                                {question.hint && !isSubmitted && (
                                    <div className={styles.hint}>
                                        <AlertCircle size={14} />
                                        <span>{question.hint}</span>
                                    </div>
                                )}
                            </div>

                            {isSubmitted && (
                                <div className={styles.feedback}>
                                    <div className={styles.feedbackHeader}>
                                        <Lightbulb size={18} />
                                        <strong>Penjelasan</strong>
                                    </div>
                                    <div className={styles.feedbackContent}>
                                        {question.feedback}
                                        {!isCorrect &&
                                            <div className={styles.correctAnswerInfo}>
                                                Jawaban yang benar: <strong>{question.correctAnswers[0]}</strong>
                                            </div>
                                        }
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
                        disabled={!areAllQuestionsAnswered()}
                        title={!areAllQuestionsAnswered() ? "Harap jawab semua pertanyaan terlebih dahulu" : "Periksa Jawaban"}
                        className={`${styles.button} ${styles.submitButton}`}
                    >
                        Periksa Jawaban
                    </button>
                ) : (
                    <button onClick={handleReset} className={`${styles.button} ${styles.resetButton}`}>
                        <RotateCcw size={18} />
                        Ulangi Kuis
                    </button>
                )}
            </div>
        </div>
    );
};

export default FillInTheBlankQuiz;
