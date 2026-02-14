import { useContext, useState, useEffect } from "react";
import { VocabularyContext } from "../Context/VocabularyContext";
import './stylehere.css';

export default function Reading({ selected }) {
const { vocabularyArray } = useContext(VocabularyContext);
const vocab_list = vocabularyArray || [];   // đảm bảo luôn là mảng, tránh crash

  const pairs = [
    { stem: "meaning", opt: "kanji", label: "Kanji" },
    { stem: "meaning", opt: "hiragana", label: "Hiragana" },
    { stem: "kanji", opt: "hiragana", label: "Hiragana" },
    { stem: "kanji", opt: "meaning", label: "Nghĩa" },
    { stem: "hiragana", opt: "kanji", label: "Kanji" },
    { stem: "hiragana", opt: "meaning", label: "Nghĩa" },
  ];

  const currentPair = pairs[selected];

  const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const pickRandomItems = (array, n) => {
    const result = [];
    const usedIndices = new Set();
    const arr = [...array];

    while (result.length < n && usedIndices.size < arr.length) {
      const idx = Math.floor(Math.random() * arr.length);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        result.push(arr[idx]);
      }
    }
    return result;
  };

  const createQuestions = () => {
    const randomList = shuffleArray(vocab_list);
    return randomList.map((voca, i) => {
      const stemValue = voca[currentPair.stem];
      const correctAnswer = voca[currentPair.opt];

      const wrongItems = pickRandomItems(
        randomList.filter((item) => item[currentPair.opt] !== correctAnswer),
        3
      );
      const wrongChoices = wrongItems.map((item) => item[currentPair.opt]);

      const choices = [...wrongChoices];
      const correctIndex = Math.floor(Math.random() * 4);
      choices.splice(correctIndex, 0, correctAnswer);

      return {
        id: i + 1,
        stem: stemValue,
        correctAnswer,
        choices,
        correctIndex: correctIndex + 1,
        userAnswer: null,
        isCorrect: null,
      };
    });
  };

  const [questions, setQuestions] = useState(createQuestions);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentIndex] || null;

  const handleSelect = (index) => {
    if (showResult) return;

    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === currentIndex
          ? { ...q, userAnswer: index, isCorrect: index === q.correctIndex }
          : q
      )
    );

    setSelectedAnswer(index);
    setShowResult(true);
  };

// THÊM useEffect NÀY ĐỂ TỰ ĐỘNG CHUYỂN CÂU SAU 2 GIÂY
useEffect(() => {
  let timer;
  if (showResult && currentIndex < questions.length - 1) {
    timer = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }, 2000); // 2000ms = 2 giây
  }
  return () => clearTimeout(timer);
}, [showResult, currentIndex, questions.length]);

// Effect riêng cho câu cuối cùng
useEffect(() => {
  let timer;
  if (showResult && currentIndex === questions.length - 1) {
    timer = setTimeout(() => {
      setCurrentIndex(questions.length); // kết thúc quiz
    }, 2000);
  }
  return () => clearTimeout(timer);
}, [showResult, currentIndex, questions.length]);

  const isFinished = currentIndex >= questions.length;

  if (isFinished) {
    const correctCount = questions.filter((q) => q.isCorrect).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="reading-quiz summary">
        <h2>Kết quả tổng kết</h2>
        <div className="summary-stats">
          <p>
            Đúng: <strong>{correctCount}</strong> / {total} câu
          </p>
          <p>
            Tỷ lệ đúng: <strong>{percentage}%</strong>
          </p>
        </div>

        <table className="result-table">
          <thead>
            <tr>
              <th>Câu</th>
              <th>Câu hỏi</th>
              <th>Bạn chọn</th>
              <th>Đáp án đúng</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className={q.isCorrect ? "row-correct" : "row-wrong"}>
                <td>{q.id}</td>
                <td>{q.stem}</td>
                <td>{q.userAnswer ? q.choices[q.userAnswer - 1] : "—"}</td>
                <td>{q.correctAnswer}</td>
                <td>{q.isCorrect ? "Đúng ✓" : "Sai ✗"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          className="restart-button"
          onClick={() => {
            setQuestions(createQuestions());
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setShowResult(false);
          }}
        >
          もういちど
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>Không có từ vựng hoặc lỗi dữ liệu</div>;
  }

  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

  // Chuẩn bị hiển thị đáp án đúng dạng "Kanji (hiragana) : nghĩa" hoặc tương tự
  const formatCorrectAnswer = () => {
    // Tùy theo loại pair, hiển thị đầy đủ thông tin
    const voca = vocab_list.find((v) => v[currentPair.opt] === currentQuestion.correctAnswer);
    if (!voca) return currentQuestion.correctAnswer;

    if (currentPair.opt === "kanji") {
      return `${voca.kanji} (${voca.hiragana}) : ${voca.meaning}`;
    } else if (currentPair.opt === "hiragana") {
      return `${voca.hiragana} (${voca.kanji || "—"}) : ${voca.meaning}`;
    } else if (currentPair.opt === "meaning") {
      return `${voca.meaning} (${voca.kanji || "—"} / ${voca.hiragana || "—"})`;
    }
    return currentQuestion.correctAnswer;
  };

  const resultText = showResult
    ? isCorrect
      ? "Đúng rồi! 🎉"
      : `Sai! Đáp án đúng là: ${formatCorrectAnswer()}`
    : "";

  return (
    <div className="reading-quiz">
      <h2>
        {currentQuestion.id} / {questions.length}
      </h2>

      <div className="question-stem">{currentQuestion.stem}</div>

      <div className="options">
        {currentQuestion.choices.map((choice, idx) => {
          const optionNumber = idx + 1;
          let optionClass = "option";

          if (showResult) {
            if (optionNumber === currentQuestion.correctIndex) {
              optionClass += " correct";
            }
            if (optionNumber === selectedAnswer && !isCorrect) {
              optionClass += " wrong";
            }
          } else if (optionNumber === selectedAnswer) {
            optionClass += " selected";
          }

          return (
            <button
              key={idx}
              className={optionClass}
              onClick={() => handleSelect(optionNumber)}
              disabled={showResult}
            >
              {optionNumber}. {choice}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="result">
          {resultText}
        </div>
      )}

      {showResult && currentIndex < questions.length - 1 && (
        <button
          className="next-button"
          onClick={() => {
            setCurrentIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
          }}
        >
          Next 🚀 →
        </button>
      )}

      {showResult && currentIndex === questions.length - 1 && (
        <div className="completed">
          Bạn đã hoàn thành tất cả câu hỏi! 
        </div>
      )}
    </div>
  );
}