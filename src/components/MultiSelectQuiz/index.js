import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Check, XCircle, Award, Lightbulb, CheckSquare } from 'lucide-react';
import styles from './MultiSelectQuiz.module.css';

// Komponen untuk kuis dengan jawaban benar lebih dari satu
const MultiSelectQuiz = ({ questions, title = "Kuis Pilihan Ganda", shuffleQuestions = false }) => {
    const [processedQuestions, setProcessedQuestions] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const quizContainerRef = useRef(null);

    const scrollToTop = () => {
        if (quizContainerRef.current) {
            quizContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const initializeQuiz = useCallback(() => {
        let initialQuestions = questions.map((question, index) => ({
            ...question,
            id: index,
            shuffledOptions: shuffleArray(question.options.map((option, optIndex) => ({ ...option, originalIndex: optIndex }))),
        }));

        if (shuffleQuestions) {
            initialQuestions = shuffleArray(initialQuestions);
        }

        initialQuestions = initialQuestions.map((question, index) => ({ ...question, displayIndex: index }));
        setProcessedQuestions(initialQuestions);
    }, [questions, shuffleQuestions]);

    useEffect(() => {
        initializeQuiz();
    }, [initializeQuiz]);

    // PERUBAHAN LOGIKA: Handler untuk multi-jawaban (checkbox)
    const handleAnswerSelect = (questionId, selectedOptionIndex) => {
        if (isSubmitted) return;

        setSelectedAnswers(prev => {
            const currentAnswers = prev[questionId] || [];
            const newAnswers = currentAnswers.includes(selectedOptionIndex)
                ? currentAnswers.filter(index => index !== selectedOptionIndex) // Hapus jika sudah ada (toggle off)
                : [...currentAnswers, selectedOptionIndex]; // Tambah jika belum ada (toggle on)

            return { ...prev, [questionId]: newAnswers };
        });
    };

    // PERUBAHAN LOGIKA: Handler submit untuk multi-jawaban
    const handleSubmit = () => {
        let correctCount = 0;
        processedQuestions.forEach(question => {
            const userSelection = (selectedAnswers[question.id] || []).sort();
            const correctAnswers = question.shuffledOptions
                .map((option, index) => (option.isCorrect ? index : null))
                .filter(index => index !== null)
                .sort();

            // Jawaban dianggap benar jika array pilihan pengguna sama persis dengan array jawaban benar
            if (JSON.stringify(userSelection) === JSON.stringify(correctAnswers)) {
                correctCount++;
            }
        });

        setScore(correctCount);
        setIsSubmitted(true);
        setTimeout(scrollToTop, 100);
    };

    const handleReset = () => {
        setSelectedAnswers({});
        setIsSubmitted(false);
        setScore(0);
        initializeQuiz();
        setTimeout(scrollToTop, 100);
    };

    const getAnswerStatus = (questionId, optionIndex) => {
        if (!isSubmitted) return 'unanswered';

        const question = processedQuestions.find(q => q.id === questionId);
        const option = question.shuffledOptions[optionIndex];
        const isSelected = (selectedAnswers[questionId] || []).includes(optionIndex);

        if (option.isCorrect) return 'correct';
        if (isSelected && !option.isCorrect) return 'incorrect';
        return 'neutral';
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
                    const userSelection = (selectedAnswers[question.id] || []).sort();
                    const correctAnswers = question.shuffledOptions
                        .map((option, index) => (option.isCorrect ? index : null))
                        .filter(index => index !== null)
                        .sort();
                    const isQuestionAnsweredCorrectly = isSubmitted && JSON.stringify(userSelection) === JSON.stringify(correctAnswers);

                    return (
                        <div key={question.id} className={`${styles.questionCard} ${isSubmitted ? (isQuestionAnsweredCorrectly ? styles.cardCorrect : styles.cardIncorrect) : ''}`}>
                            <div className={styles.questionHeader}>
                                <div className={styles.questionContent}>
                                    <span className={styles.questionNumber}>{question.displayIndex + 1}</span>
                                    <div className={styles.questionTextContainer}>
                                        <h3 className={styles.questionText}>{question.question}</h3>
                                        {question.arabicText && <div className={styles.arabicText}>{question.arabicText}</div>}
                                        {question.instruction && <div className={styles.instruction}>{question.instruction}</div>}
                                    </div>
                                </div>
                                {/* Info tambahan untuk kuis multi-jawaban */}
                                <div className={styles.multiSelectInfo}>
                                    <CheckSquare size={14} />
                                    <span>Pilih semua jawaban yang benar</span>
                                </div>
                            </div>

                            <div className={styles.options}>
                                {question.shuffledOptions.map((option, optionIndex) => {
                                    const status = getAnswerStatus(question.id, optionIndex);
                                    const isSelected = (selectedAnswers[question.id] || []).includes(optionIndex);

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
                                            role="checkbox"
                                            aria-checked={isSelected}
                                        >
                                            <div className={styles.optionContent}>
                                                <div className={styles.optionLeft}>
                                                    {/* UI Elemen Checkbox */}
                                                    <div className={`${styles.checkbox} ${isSelected ? styles.checkboxSelected : ''}`}>
                                                        {isSelected && <Check size={14} className={styles.checkIcon} />}
                                                    </div>
                                                    <span className={styles.optionLabel}>{String.fromCharCode(65 + optionIndex)}.</span>
                                                    <div className={styles.optionTextContainer}>
                                                        <span className={styles.optionText}>{option.text}</span>
                                                        {option.arabicText && <span className={styles.optionArabicText}>{option.arabicText}</span>}
                                                    </div>
                                                </div>
                                                {isSubmitted && status === 'correct' && <Check size={20} className={styles.statusIcon} />}
                                                {isSubmitted && status === 'incorrect' && <XCircle size={20} className={styles.statusIcon} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {isSubmitted && question.feedback && (
                                <div className={styles.feedback}>
                                    <div className={styles.feedbackHeader}>
                                        <Lightbulb size={18} />
                                        <strong>Penjelasan</strong>
                                    </div>
                                    <div className={styles.feedbackContent}>{question.feedback}</div>
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
                        className={`${styles.button} ${styles.submitButton}`}
                    >
                        فحص الإجابات (Periksa Jawaban)
                    </button>
                ) : (
                    <button onClick={handleReset} className={`${styles.button} ${styles.resetButton}`}>
                        <RotateCcw size={18} />
                        إعادة الاختبار (Ulangi Kuis)
                    </button>
                )}
            </div>
        </div>
    );
};

export default MultiSelectQuiz;
