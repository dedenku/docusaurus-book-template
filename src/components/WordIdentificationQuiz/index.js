import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Award, RotateCcw, Lightbulb } from 'lucide-react';
import styles from './WordIdentificationQuiz.module.css';

// -- Komponen Utama Kuis --
const WordIdentificationQuiz = ({ title, questionParts, correctWords, feedback }) => {
    const [selectedIndices, setSelectedIndices] = useState(new Set());
    const [isSubmitted, setIsSubmitted] = useState(false);
    const quizContainerRef = React.useRef(null);

    const handleWordClick = (index) => {
        if (isSubmitted) return;

        setSelectedIndices(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(index)) {
                newSelected.delete(index);
            } else {
                newSelected.add(index);
            }
            return newSelected;
        });
    };

    // DIUBAH: useMemo sekarang juga menghitung statistik detail
    const { score, totalPossible, stats } = useMemo(() => {
        const defaultStats = { score: 0, totalPossible: correctWords.length, stats: { correct: 0, incorrect: 0, missed: 0 } };
        if (!isSubmitted) return defaultStats;

        let truePositives = 0;
        let falsePositives = 0;

        selectedIndices.forEach(index => {
            const word = questionParts[index].text;
            if (correctWords.includes(word)) {
                truePositives++;
            } else {
                falsePositives++;
            }
        });

        const missedCount = correctWords.length - truePositives;
        const calculatedScore = Math.max(0, truePositives - falsePositives);

        return {
            score: calculatedScore,
            totalPossible: correctWords.length,
            stats: {
                correct: truePositives,
                incorrect: falsePositives,
                missed: missedCount
            }
        };

    }, [isSubmitted, selectedIndices, correctWords, questionParts]);

    const getWordClass = (word, index) => {
        const isSelected = selectedIndices.has(index);
        const isCorrect = correctWords.includes(word);

        if (isSubmitted) {
            if (isSelected && isCorrect) return styles.correctSelection;
            if (isSelected && !isCorrect) return styles.incorrectSelection;
            if (!isSelected && isCorrect) return styles.missedAnswer;
        }

        if (isSelected) return styles.selected;

        return styles.clickableWord;
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        if (quizContainerRef.current) {
            quizContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleReset = () => {
        setSelectedIndices(new Set());
        setIsSubmitted(false);
    };

    return (
        <div className={styles.quizWrapper} ref={quizContainerRef}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
            </div>

            <div className={styles.sentenceContainer}>
                {questionParts.map((part, index) =>
                    part.isWord ? (
                        <button
                            key={index}
                            className={getWordClass(part.text, index)}
                            onClick={() => handleWordClick(index)}
                            disabled={isSubmitted}
                        >
                            {part.text}
                        </button>
                    ) : (
                        <span key={index}>{part.text}</span>
                    )
                )}
            </div>

            {isSubmitted && (
                <div className={styles.resultsCard}>
                    <div className={styles.scoreDisplay}>
                        <Award size={40} />
                        <span>Skor Anda: {score} / {totalPossible}</span>
                    </div>
                    <p className={styles.scoreExplanation}>
                        Skor dihitung berdasarkan jawaban benar dikurangi jawaban salah.
                    </p>
                    <div className={styles.legend}>
                        {/* DIUBAH: Menampilkan jumlah hitungan untuk setiap kategori */}
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.correctIcon}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            Jawaban Benar ({stats.correct})
                        </span>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.incorrectIcon}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            Jawaban Salah ({stats.incorrect})
                        </span>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.missedIcon}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            Jawaban Terlewat ({stats.missed})
                        </span>
                    </div>
                </div>
            )}

            {isSubmitted && feedback && (
                <div className={styles.feedbackContainer}>
                    <div className={styles.feedbackHeader}><Lightbulb size={18} /><strong>Penjelasan</strong></div>
                    <div className={styles.feedbackContent}>{feedback}</div>
                </div>
            )}

            <div className={styles.actions}>
                {!isSubmitted ? (
                    selectedIndices.size > 0 && (
                        <button onClick={handleSubmit} className={styles.mainButton}>
                            Periksa Jawaban
                        </button>
                    )
                ) : (
                    <button onClick={handleReset} className={`${styles.mainButton} ${styles.resetButton}`}>
                        <RotateCcw size={18} /> Ulangi Kuis
                    </button>
                )}
            </div>
        </div>
    );
};

WordIdentificationQuiz.propTypes = {
    title: PropTypes.string.isRequired,
    questionParts: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        isWord: PropTypes.bool.isRequired,
    })).isRequired,
    correctWords: PropTypes.arrayOf(PropTypes.string).isRequired,
    feedback: PropTypes.string,
};

export default WordIdentificationQuiz;

