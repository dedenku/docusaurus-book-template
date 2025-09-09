import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom'; // Diperlukan untuk Portal
import { RotateCcw, Award, Lightbulb, CheckCircle, ArrowLeftCircle, ArrowRightCircle, ChevronDown } from 'lucide-react';
import styles from './HarakatQuiz.module.css';

// Hook untuk mendeteksi klik di luar elemen
// DITINGKATKAN: Kini juga menerima 'triggerRef' agar tidak menutup saat tombol pemicu diklik
const useClickOutside = (popoverRef, triggerRef, handler) => {
    useEffect(() => {
        const listener = (event) => {
            // Abaikan jika klik terjadi di dalam popover
            if (popoverRef.current && popoverRef.current.contains(event.target)) {
                return;
            }
            // Abaikan jika klik terjadi pada tombol pemicu
            if (triggerRef.current && triggerRef.current.contains(event.target)) {
                return;
            }
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [popoverRef, triggerRef, handler]);
};

// --- BARU: Komponen Portal untuk Popover ---
// Ini akan merender popover di akhir <body>, di luar kontainer yang memotong.
const PopoverPortal = ({ children }) => {
    // Pastikan kode ini hanya berjalan di sisi client (browser)
    if (typeof document === 'undefined') {
        return null;
    }
    return createPortal(children, document.body);
};

// -- Komponen untuk satu kata soal yang bisa diklik --
const QuestionWord = ({ word, index, selectedAnswer, isSubmitted, isCorrect, onSelect }) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const popoverRef = useRef(null);
    const buttonRef = useRef(null); // Ref untuk tombol pemicu
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

    useClickOutside(popoverRef, buttonRef, () => setIsPopoverOpen(false));

    // Logika untuk mengacak urutan pilihan jawaban
    const shuffledOptions = useMemo(() => {
        const options = [...word.options];
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        return options;
    }, [word.options]);

    // --- BARU: Logika untuk menghitung posisi popover ---
    const togglePopover = () => {
        if (!isSubmitted) {
            if (!isPopoverOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setPopoverPosition({
                    // Posisi top: di bawah tombol + scrollY + spasi
                    top: rect.bottom + window.scrollY + 8,
                    // Posisi left: di tengah tombol + scrollX
                    left: rect.left + window.scrollX + rect.width / 2,
                });
            }
            setIsPopoverOpen(prev => !prev);
        }
    };

    const handleSelectOption = (option) => {
        onSelect(index, option);
        setIsPopoverOpen(false);
    };

    const getWordClasses = () => {
        let classes = styles.questionWord;
        if (isSubmitted) {
            classes += isCorrect ? ` ${styles.correct}` : ` ${styles.incorrect}`;
        } else if (selectedAnswer) {
            classes += ` ${styles.answered}`;
        }
        return classes;
    };

    return (
        <div className={styles.wordWrapper}>
            <button
                ref={buttonRef}
                className={getWordClasses()}
                onClick={togglePopover}
                disabled={isSubmitted}
                aria-haspopup="true"
                aria-expanded={isPopoverOpen}
            >
                {selectedAnswer || word.text}
                {!isSubmitted && <ChevronDown size={16} className={`${styles.chevron} ${isPopoverOpen ? styles.chevronOpen : ''}`} />}
            </button>
            {isPopoverOpen && (
                <PopoverPortal>
                    <div
                        ref={popoverRef}
                        className={styles.popover}
                        style={{
                            top: `${popoverPosition.top}px`,
                            left: `${popoverPosition.left}px`,
                        }}
                    >
                        {shuffledOptions.map((option, i) => (
                            <button key={i} className={styles.popoverOption} onClick={() => handleSelectOption(option)}>
                                {option}
                            </button>
                        ))}
                    </div>
                </PopoverPortal>
            )}
        </div>
    );
};

// -- Komponen untuk satu soal/kalimat --
const HarakatQuestion = ({ question, onQuestionSubmit }) => {
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [results, setResults] = useState({});

    const questionWords = useMemo(() => question.sentence.filter(w => w.isQuestion), [question]);

    const handleWordSelect = (wordIndex, selectedOption) => {
        setUserAnswers(prev => ({ ...prev, [wordIndex]: selectedOption }));
    };

    const handleSubmit = () => {
        const newResults = {};
        let allCorrect = true;
        question.sentence.forEach((word, index) => {
            if (word.isQuestion) {
                const isCorrect = userAnswers[index] === word.correctAnswer;
                newResults[index] = isCorrect;
                if (!isCorrect) allCorrect = false;
            }
        });
        setResults(newResults);
        setIsSubmitted(true);
        onQuestionSubmit(question.id, allCorrect);
    };

    const allWordsAnswered = Object.keys(userAnswers).length === questionWords.length;

    return (
        <div className={styles.slide}>
            <p className={styles.instruction}>{question.instruction}</p>
            <div className={styles.sentenceContainer}>
                {question.sentence.map((word, index) =>
                    word.isQuestion ? (
                        <QuestionWord
                            key={index}
                            word={word}
                            index={index}
                            selectedAnswer={userAnswers[index]}
                            isSubmitted={isSubmitted}
                            isCorrect={results[index]}
                            onSelect={handleWordSelect}
                        />
                    ) : (
                        <span key={index} className={styles.plainWord}>{word.text}</span>
                    )
                )}
            </div>
            <div className={styles.questionActions}>
                {isSubmitted ? (
                    question.feedback && (
                        <div className={styles.feedback}>
                            <div className={styles.feedbackHeader}><Lightbulb size={18} /><strong>Penjelasan</strong></div>
                            <div className={styles.feedbackContent}>{question.feedback}</div>
                        </div>
                    )
                ) : (
                    <button onClick={handleSubmit} disabled={!allWordsAnswered || isSubmitted} className={`${styles.button} ${styles.primaryButton}`}>
                        <CheckCircle size={18} /> Periksa Jawaban
                    </button>
                )}
            </div>
        </div>
    );
};


// -- Komponen Utama Kuis --
const HarakatQuiz = ({ questions, title = "Kuis Harakat" }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizResults, setQuizResults] = useState({});
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const [resetCounter, setResetCounter] = useState(0);

    const totalScore = useMemo(() => Object.values(quizResults).filter(Boolean).length, [quizResults]);
    const isCurrentQuestionAnswered = quizResults[questions[currentQuestionIndex]?.id] !== undefined;


    const handleQuestionSubmit = (questionId, isCorrect) => {
        setQuizResults(prev => ({ ...prev, [questionId]: isCorrect }));
    };

    const handleNext = () => currentQuestionIndex < questions.length - 1 && setCurrentQuestionIndex(prev => prev + 1);
    const handlePrev = () => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1);
    const handleShowResults = () => setIsQuizFinished(true);

    const handleResetQuiz = () => {
        setQuizResults({});
        setCurrentQuestionIndex(0);
        setIsQuizFinished(false);
        setResetCounter(prev => prev + 1);
    };

    const allQuestionsAnswered = Object.keys(quizResults).length === questions.length;
    const getScoreLevel = () => (totalScore / questions.length) * 100 >= 80 ? 'excellent' : (totalScore / questions.length) * 100 >= 60 ? 'good' : 'needsImprovement';

    if (isQuizFinished) {
        return (
            <div className={styles.quizContainer}>
                <div className={styles.resultsCard}>
                    <div className={styles.header}><h2 className={styles.title}>Hasil Kuis</h2></div>
                    <div className={`${styles.scoreDisplay} ${styles[getScoreLevel()]}`}><Award size={48} /><span>{totalScore}/{questions.length}</span></div>
                    <p className={styles.scoreMessage}>Anda menyelesaikan {totalScore} dari {questions.length} soal dengan benar.</p>
                    <button onClick={handleResetQuiz} className={`${styles.button} ${styles.secondaryButton}`}><RotateCcw size={18} /> Ulangi Kuis</button>
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
                    {questions.map((q) => (
                        <HarakatQuestion key={`${q.id}-${resetCounter}`} question={q} onQuestionSubmit={handleQuestionSubmit} />
                    ))}
                </div>
            </div>

            <div className={styles.navigation}>
                <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className={styles.navButton}>
                    <ArrowLeftCircle size={24} /><span>Sebelumnya</span>
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                    <button onClick={handleNext} disabled={!isCurrentQuestionAnswered} title={!isCurrentQuestionAnswered ? "Jawab soal ini terlebih dahulu" : ""} className={`${styles.button} ${styles.primaryButton} ${styles.navNext}`}>
                        <span>Berikutnya</span><ArrowRightCircle size={24} />
                    </button>
                ) : (
                    <button onClick={handleShowResults} disabled={!allQuestionsAnswered} title={!allQuestionsAnswered ? "Selesaikan semua soal untuk melihat hasil" : ""} className={`${styles.button} ${styles.primaryButton}`}>
                        Lihat Hasil
                    </button>
                )}
            </div>
        </div>
    );
};

export default HarakatQuiz;

