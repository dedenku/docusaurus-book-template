import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Award, RotateCcw, Lightbulb, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
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
        const classes = [styles.clickableWord];

        if (isSubmitted) {
            if (isSelected && isCorrect) classes.push(styles.correctSelection);
            else if (isSelected && !isCorrect) classes.push(styles.incorrectSelection);
            else if (!isSelected && isCorrect) classes.push(styles.missedAnswer);
        } else if (isSelected) {
            classes.push(styles.selected);
        }

        return classes.join(' ');
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
        <div className={styles.quizContainer} ref={quizContainerRef}>
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
                        <span className={styles.legendItem}>
                            <CheckCircle2 size={16} className="quiz-correct" />
                            Jawaban Benar ({stats.correct})
                        </span>
                        <span className={styles.legendItem}>
                            <XCircle size={16} className="quiz-incorrect" />
                            Jawaban Salah ({stats.incorrect})
                        </span>
                        <span className={styles.legendItem}>
                            <AlertTriangle size={16} className="quiz-good" />
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
                        <button onClick={handleSubmit} className={styles.primaryButton}>
                            Periksa Jawaban
                        </button>
                    )
                ) : (
                    <button onClick={handleReset} className={styles.secondaryButton}>
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

