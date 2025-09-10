import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Check, X, AlertTriangle, ChevronLeft, ChevronRight, Award, RotateCcw, Lightbulb } from 'lucide-react';
import styles from './IrabAnalysisQuiz.module.css';

// Komponen Dropdown Kustom
const IrabSelect = ({ label, options, value, onChange, disabled, isChecked, isCorrect }) => {
    const selectClasses = [styles.irabSelect];
    if (isChecked) {
        selectClasses.push(isCorrect ? styles.selectCorrect : styles.selectIncorrect);
    }

    return (
        <div className={styles.selectWrapper}>
            <label>{label}</label>
            <div className={styles.selectContainer}>
                <select
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={selectClasses.join(' ')}
                >
                    <option value="" disabled>Pilih...</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        </div>
    );
};

// Fungsi utilitas untuk mengecek status jawaban
const getWordStatus = (word, userAnswer) => {
    if (!userAnswer || !userAnswer.kedudukan || !userAnswer.keadaan || !userAnswer.alamat) {
        return 'unanswered';
    }
    const correctCount =
        (userAnswer.kedudukan === word.correctAnswer.kedudukan ? 1 : 0) +
        (userAnswer.keadaan === word.correctAnswer.keadaan ? 1 : 0) +
        (userAnswer.alamat === word.correctAnswer.alamat ? 1 : 0);

    if (correctCount === 3) return 'correct';
    if (correctCount > 0) return 'partial';
    return 'incorrect';
};

// Panel Analisis untuk Satu Kata
const AnalysisPanel = ({ word, userAnswer, onAnswerChange, onCheckAnswer, isChecked }) => {
    const isAnswerComplete = userAnswer.kedudukan && userAnswer.keadaan && userAnswer.alamat;
    const status = isChecked ? getWordStatus(word, userAnswer) : 'unanswered';

    const results = useMemo(() => {
        if (!isChecked) return {};
        return {
            kedudukan: userAnswer.kedudukan === word.correctAnswer.kedudukan,
            keadaan: userAnswer.keadaan === word.correctAnswer.keadaan,
            alamat: userAnswer.alamat === word.correctAnswer.alamat,
        };
    }, [isChecked, userAnswer, word.correctAnswer]);

    const getFeedback = () => {
        switch (status) {
            case 'correct':
                return { icon: <Check size={18} />, text: "Analisis Anda benar!", type: 'feedbackCorrect' };
            case 'partial':
                return {
                    icon: <AlertTriangle size={18} />,
                    text: `Jawaban benar: ${word.correctAnswer.kedudukan}, ${word.correctAnswer.keadaan}, ${word.correctAnswer.alamat}.`,
                    type: 'feedbackPartial'
                };
            case 'incorrect':
                return {
                    icon: <X size={18} />,
                    text: `Jawaban benar: ${word.correctAnswer.kedudukan}, ${word.correctAnswer.keadaan}, ${word.correctAnswer.alamat}.`,
                    type: 'feedbackIncorrect'
                };
            default:
                return null;
        }
    };

    const feedback = getFeedback();

    return (
        <div className={styles.analysisPanel}>
            <div className={styles.dropdownsContainer}>
                <IrabSelect
                    label="1. Kedudukan (الموقع)"
                    options={word.options.kedudukan}
                    value={userAnswer.kedudukan || ''}
                    onChange={(e) => onAnswerChange('kedudukan', e.target.value)}
                    disabled={isChecked}
                    isChecked={isChecked}
                    isCorrect={results.kedudukan}
                />
                <IrabSelect
                    label="2. Keadaan (الحالة)"
                    options={word.options.keadaan}
                    value={userAnswer.keadaan || ''}
                    onChange={(e) => onAnswerChange('keadaan', e.target.value)}
                    disabled={isChecked}
                    isChecked={isChecked}
                    isCorrect={results.keadaan}
                />
                <IrabSelect
                    label="3. Alamat (العلامة)"
                    options={word.options.alamat}
                    value={userAnswer.alamat || ''}
                    onChange={(e) => onAnswerChange('alamat', e.target.value)}
                    disabled={isChecked}
                    isChecked={isChecked}
                    isCorrect={results.alamat}
                />
            </div>
            {!isChecked ? (
                <button
                    className={styles.checkWordButton}
                    onClick={onCheckAnswer}
                    disabled={!isAnswerComplete}
                >
                    Periksa Jawaban Kata Ini
                </button>
            ) : (
                feedback && (
                    <div className={`${styles.feedbackBox} ${styles[feedback.type]}`}> 
                         <div className={styles.feedbackHeader}>{feedback.icon} <strong>Penjelasan</strong></div>
                        <div className={styles.feedbackContent}>{feedback.text}</div>
                    </div>
                )
            )}
        </div>
    );
};

// Kartu Soal
const QuestionCard = ({ question, userAnswers, onAnswerUpdate, onCheckWord }) => {
    const [activeWordKey, setActiveWordKey] = useState(null);

    const createSentence = () => {
        let currentSentence = question.sentence;
        question.words.forEach((word, i) => {
            currentSentence = currentSentence.replace(new RegExp(word.text.replace(/[-\/\\^$*+?.()|[\\]{}]/g, '\\$&'), 'g'), `__WORD_${i}__`);
        });

        return currentSentence.split(/(__WORD_\d+__)/g).map((part, index) => {
            const match = part.match(/__WORD_(\d+)__/);
            if (match) {
                const wordIndex = parseInt(match[1], 10);
                const wordData = question.words[wordIndex];
                const userAnswer = userAnswers[wordData.key] || {};
                const status = userAnswer.isChecked ? getWordStatus(wordData, userAnswer) : 'unanswered';

                let wordClasses = styles.clickableWord;
                if (activeWordKey === wordData.key) wordClasses += ` ${styles.active}`;
                if (userAnswer.isChecked) wordClasses += ` ${styles[status]}`;

                return (
                    <button
                        key={wordData.key}
                        className={wordClasses}
                        onClick={() => setActiveWordKey(prev => prev === wordData.key ? null : wordData.key)}
                    >
                        {wordData.text}
                    </button>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    const activeWordData = question.words.find(w => w.key === activeWordKey);
    const activeUserAnswer = userAnswers[activeWordKey] || {};

    return (
        <div className={styles.questionCard}>
            <div className={styles.sentenceContainer}>{createSentence()}</div>
            {activeWordData && (
                <AnalysisPanel
                    word={activeWordData}
                    userAnswer={activeUserAnswer}
                    onAnswerChange={(part, value) => onAnswerUpdate(activeWordKey, part, value)}
                    onCheckAnswer={() => onCheckWord(activeWordKey)}
                    isChecked={activeUserAnswer.isChecked}
                />
            )}
        </div>
    );
};

// Indikator Soal (Paginasi)
const QuestionIndicator = ({ count, currentIndex, questionStatus, onSelect }) => (
    <div className={styles.indicatorContainer}>
        {Array.from({ length: count }).map((_, index) => (
            <button
                key={index}
                className={`
          ${styles.indicatorDot}
          ${currentIndex === index ? styles.active : ''}
          ${questionStatus[index] === 'completed' ? styles.answered : ''}
        `}
                onClick={() => onSelect(index)}
                aria-label={`Pindah ke soal ${index + 1}`}
                disabled={index > currentIndex && questionStatus[currentIndex] !== 'completed'}
            />
        ))}
    </div>
);

// Komponen Utama Kuis
const IrabAnalysisQuiz = ({ questions, title }) => {
    const [userAnswers, setUserAnswers] = useState({});
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const totalWordsToAnalyze = useMemo(() => questions.flatMap(q => q.words).length, [questions]);

    const handleAnswerUpdate = (wordKey, part, value) => {
        if (userAnswers[wordKey]?.isChecked) return;
        setUserAnswers(prev => ({
            ...prev,
            [wordKey]: { ...prev[wordKey], [part]: value, isChecked: false }
        }));
    };

    const handleCheckWord = (wordKey) => {
        setUserAnswers(prev => ({
            ...prev,
            [wordKey]: { ...prev[wordKey], isChecked: true }
        }));
    };

    const score = useMemo(() => {
        if (!isQuizFinished) return 0;
        let correctWords = 0;
        questions.flatMap(q => q.words).forEach(word => {
            const answer = userAnswers[word.key];
            if (answer && answer.isChecked && getWordStatus(word, answer) === 'correct') {
                correctWords++;
            }
        });
        return correctWords;
    }, [isQuizFinished, userAnswers, questions]);

    const questionStatus = useMemo(() => questions.map(q => {
        const allWordsInQuestionAnswered = q.words.every(w => userAnswers[w.key]?.isChecked === true);
        return allWordsInQuestionAnswered ? 'completed' : 'pending';
    }), [questions, userAnswers]);

    const isCurrentQuestionCompleted = questionStatus[currentQuestionIndex] === 'completed';

    const allQuestionsCompleted = useMemo(() => {
        return questionStatus.every(status => status === 'completed');
    }, [questionStatus]);

    const handleIndicatorSelect = (index) => {
        if (index < currentQuestionIndex) {
            setCurrentQuestionIndex(index);
            return;
        }
        if (index > currentQuestionIndex && isCurrentQuestionCompleted) {
            setCurrentQuestionIndex(index);
        }
    };

    const handleFinishQuiz = () => setIsQuizFinished(true);

    const handleReset = () => {
        setUserAnswers({});
        setIsQuizFinished(false);
        setCurrentQuestionIndex(0);
    };

    return (
        <div className={styles.quizContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                {isQuizFinished && <p className={styles.scoreInfo}>Skor Akhir: {score} / {totalWordsToAnalyze}</p>}
            </div>

            {isQuizFinished ? (
                <div className={styles.resultsCard}>
                    <Award size={48} className={styles.awardIcon} />
                    <p className={styles.scoreMessage}>Anda menganalisis dengan benar {score} dari {totalWordsToAnalyze} kata.</p>
                </div>
            ) : (
                <>
                    <div className={styles.quizBody}>
                        <button
                            onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={styles.navButton}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className={styles.questionContainer}>
                            <QuestionCard
                                question={questions[currentQuestionIndex]}
                                userAnswers={userAnswers}
                                onAnswerUpdate={handleAnswerUpdate}
                                onCheckWord={handleCheckWord}
                            />
                        </div>
                        <button
                            onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
                            disabled={currentQuestionIndex === questions.length - 1 || !isCurrentQuestionCompleted}
                            className={styles.navButton}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                    {questions.length > 1 && (
                        <QuestionIndicator
                            count={questions.length}
                            currentIndex={currentQuestionIndex}
                            questionStatus={questionStatus}
                            onSelect={handleIndicatorSelect}
                        />
                    )}
                </>
            )}

            <div className={styles.actions}>
                {!isQuizFinished ? (
                    allQuestionsCompleted && (
                        <button onClick={handleFinishQuiz} className={styles.primaryButton}>
                            Lihat Skor
                        </button>
                    )
                ) : (
                    <button onClick={handleReset} className={styles.secondaryButton}>
                        <RotateCcw size={18} /> Ulangi
                    </button>
                )}
            </div>
        </div>
    );
};

IrabAnalysisQuiz.propTypes = {
    title: PropTypes.string,
    questions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        sentence: PropTypes.string.isRequired,
        words: PropTypes.arrayOf(PropTypes.shape({
            key: PropTypes.string.isRequired,
            text: PropTypes.string.isRequired,
        })).isRequired
    })).isRequired
};

IrabAnalysisQuiz.defaultProps = {
    title: "Kuis Analisis Irab"
};

export default IrabAnalysisQuiz;
