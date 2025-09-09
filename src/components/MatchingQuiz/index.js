import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Award, Lightbulb, CheckCircle, Package, ArrowRightCircle } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styles from './MatchingQuiz.module.css';

// Tipe item yang bisa diseret
const ItemTypes = {
  CARD: 'card',
};

// -- KOMPONEN TERPISAH UNTUK ITEM YANG BISA DISERET --
const DraggableItem = ({ item, source, sourceId, isSubmitted }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CARD,
    item: { ...item, source, sourceId },
    canDrag: !isSubmitted,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`${styles.item} ${isDragging ? styles.dragging : ''} ${isSubmitted && source !== 'pool' ? (item.matchId === sourceId ? styles.itemCorrect : styles.itemIncorrect) : ''}`}
    >
      {item.text}
    </div>
  );
};

// -- KOMPONEN TERPISAH UNTUK TARGET PELEPASAN (DROP TARGET) --
const DropTarget = ({ target, droppedItems, handleMoveItem, isSubmitted, targetMap }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.CARD,
    drop: (item) => handleMoveItem(item, target.id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop} className={`${styles.target} ${isOver ? styles.dragOver : ''}`}>
      <div className={styles.targetHeader}>{target.text}</div>
      <div className={styles.dropZone}>
        {droppedItems.map(item => {
          const isIncorrect = isSubmitted && item.matchId !== target.id;
          return (
            <div key={item.id} className={styles.itemWrapper}>
              <DraggableItem item={item} source="target" sourceId={target.id} isSubmitted={isSubmitted} />
              {isIncorrect && (
                <div className={styles.correctionHint}>
                  <ArrowRightCircle size={14} />
                  <span>{targetMap[item.matchId]}</span>
                </div>
              )}
            </div>
          );
        })}
        {droppedItems.length === 0 && <span className={styles.dropHint}>Jatuhkan di sini</span>}
      </div>
    </div>
  );
};


// -- KOMPONEN UTAMA KUIS --
const MatchingQuizComponent = ({ data, title }) => {
  const [itemsPool, setItemsPool] = useState([]);
  const [targets, setTargets] = useState([]);
  const [droppedItems, setDroppedItems] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [targetMap, setTargetMap] = useState({});

  const initializeQuiz = useCallback(() => {
    const initialItems = data.shuffleLeft ? shuffleArray(data.items) : [...data.items];
    const initialTargets = data.shuffleRight ? shuffleArray(data.targets) : [...data.targets];
    setItemsPool(initialItems);
    setTargets(initialTargets);
    const initialDropped = {};
    const newTargetMap = {};
    initialTargets.forEach(t => {
      initialDropped[t.id] = [];
      newTargetMap[t.id] = t.text;
    });
    setDroppedItems(initialDropped);
    setTargetMap(newTargetMap);
  }, [data]);

  useEffect(() => {
    initializeQuiz();
  }, [initializeQuiz]);
  
  const handleMoveItem = useCallback((draggedItem, dropTargetId) => {
    const { id: itemId, source: fromSource, sourceId: fromTargetId } = draggedItem;
    if (fromTargetId === dropTargetId) return;

    const itemToMove = data.items.find(i => i.id === itemId);
    if (!itemToMove) return;

    if (fromSource === 'pool') {
      setItemsPool(prev => prev.filter(i => i.id !== itemId));
    } else {
      setDroppedItems(prev => ({
        ...prev,
        [fromTargetId]: prev[fromTargetId].filter(i => i.id !== itemId),
      }));
    }

    if (dropTargetId === 'pool') {
      setItemsPool(prev => [...prev, itemToMove].sort((a, b) => a.id.localeCompare(b.id)));
    } else {
      setDroppedItems(prev => ({
        ...prev,
        [dropTargetId]: [...prev[dropTargetId], itemToMove],
      }));
    }
  }, [data.items]);

  const [{ isOver: isPoolOver }, dropInPool] = useDrop(() => ({
    accept: ItemTypes.CARD,
    drop: (item) => handleMoveItem(item, 'pool'),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const handleSubmit = () => {
    let correctTargets = 0;
    targets.forEach(target => {
      const expectedItemIds = data.items.filter(i => i.matchId === target.id).map(i => i.id);
      const droppedItemIds = droppedItems[target.id]?.map(i => i.id) || [];
      const isCorrect = expectedItemIds.length === droppedItemIds.length && expectedItemIds.every(id => droppedItemIds.includes(id));
      if (isCorrect) correctTargets++;
    });
    setScore(correctTargets);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setScore(0);
    initializeQuiz();
  };
  
  const getScoreLevel = () => (score / targets.length) * 100 >= 80 ? 'excellent' : (score / targets.length) * 100 >= 60 ? 'good' : 'needsImprovement';
  const getScoreMessage = () => {
    const percentage = (score / targets.length) * 100;
    if (percentage >= 80) return 'Luar biasa! 🎉';
    if (percentage >= 60) return 'Bagus! 👍';
    return 'Perlu belajar lagi 📚';
  };

  return (
    <div className={styles.quizContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.instruction}>{data.instruction}</p>
        {isSubmitted && <div className={styles.scoreInfo}><Award size={16} />Skor: {score}/{targets.length}</div>}
      </div>

      {isSubmitted && (
        <div className={styles.resultsCard}>
          <div className={`${styles.scoreDisplay} ${styles[getScoreLevel()]}`}><Award size={48} /><span>{score}/{targets.length}</span></div>
          <div className={styles.scoreMessage}>{getScoreMessage()}</div>
        </div>
      )}

      <div className={styles.matchingArea}>
        <div ref={dropInPool} className={`${styles.sourceColumn} ${isPoolOver ? styles.dragOver : ''}`}>
          <div className={styles.columnHeader}><Package size={20} /> Opsi Jawaban</div>
          <div className={styles.itemPool}>
            {itemsPool.length === 0 && <div className={styles.poolEmpty}>Semua opsi telah dipasangkan.</div>}
            {itemsPool.map(item => (
              <DraggableItem key={item.id} item={item} source="pool" isSubmitted={isSubmitted} />
            ))}
          </div>
        </div>

        <div className={styles.targetColumn}>
          {targets.map(target => (
            <DropTarget
              key={target.id}
              target={target}
              droppedItems={droppedItems[target.id] || []}
              handleMoveItem={handleMoveItem}
              isSubmitted={isSubmitted}
              targetMap={targetMap}
            />
          ))}
        </div>
      </div>
      
      {isSubmitted && data.feedback && (
        <div className={styles.feedback}>
          <div className={styles.feedbackHeader}><Lightbulb size={18} /><strong>Penjelasan</strong></div>
          <div className={styles.feedbackContent}>{data.feedback}</div>
        </div>
      )}

      <div className={styles.actions}>
        {!isSubmitted ? (
          <button onClick={handleSubmit} disabled={itemsPool.length > 0} className={`${styles.button} ${styles.submitButton}`}>
            <CheckCircle size={18} /> Periksa Jawaban
          </button>
        ) : (
          <button onClick={handleReset} className={`${styles.button} ${styles.resetButton}`}>
            <RotateCcw size={18} /> Ulangi Kuis
          </button>
        )}
      </div>
    </div>
  );
};

// Fungsi bantuan untuk mengacak array
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Komponen Pembungkus untuk menyediakan DND Context
const MatchingQuiz = (props) => (
  <DndProvider backend={HTML5Backend}>
    <MatchingQuizComponent {...props} />
  </DndProvider>
);

export default MatchingQuiz;

