import { useContext, useState, useEffect, useRef } from "react";
import { VocabularyContext } from "../Context/VocabularyContext";
import './stylehere.css'; // giả sử bạn dùng chung file css

export default function Listening({ selected }) {
  const { vocabularyArray } = useContext(VocabularyContext);
  const vocab_list = vocabularyArray || [];

  const options = ["kanji", "meaning", "hiragana"];
  const currentOption = options[selected];

  const TIME_PER_QUESTION = 10; // giây

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
    const used = new Set();
    const arr = [...array];
    while (result.length < n && used.size < arr.length) {
      const idx = Math.floor(Math.random() * arr.length);
      if (!used.has(idx)) {
        used.add(idx);
        result.push(arr[idx]);
      }
    }
    return result;
  };

  const createQuestions = () => {
    const randomList = shuffleArray(vocab_list);
    return randomList.map((voca, i) => {
      const stemValue = voca.hiragana;
      const correctAnswer = voca[currentOption];
      const wrongItems = pickRandomItems(
        randomList.filter((item) => item[currentOption] !== correctAnswer),
        3
      );
      const wrongChoices = wrongItems.map((item) => item[currentOption]);
      const choices = [...wrongChoices];
      const correctIndex = Math.floor(Math.random() * 4);
      choices.splice(correctIndex, 0, correctAnswer);

      return {
        id: i + 1,
        stem: stemValue,
        fullWord: voca,
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
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);

  const currentQuestion = questions[currentIndex] || null;
  const timerRef = useRef(null);

  // Web Speech API
  const speak = (text) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Trình duyệt không hỗ trợ Web Speech API");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = speechSynthesis.getVoices();
    const japaneseVoice = voices.find((v) => v.lang === "ja-JP") || voices.find((v) => v.lang.startsWith("ja"));
    if (japaneseVoice) utterance.voice = japaneseVoice;

    speechSynthesis.speak(utterance);
  };

  // Tự động phát âm khi vào câu mới
  useEffect(() => {
    if (currentQuestion && !showResult) {
      speak(currentQuestion.stem);
    }
  }, [currentIndex, currentQuestion, showResult]);

  // Quản lý đếm ngược thời gian
  useEffect(() => {
    if (showResult || !currentQuestion) return;

    setTimeLeft(TIME_PER_QUESTION);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Hết giờ → coi như sai và chuyển câu
          setQuestions((prevQs) =>
            prevQs.map((q, idx) =>
              idx === currentIndex ? { ...q, userAnswer: 0, isCorrect: false } : q
            )
          );
          setSelectedAnswer(0); // 0 = chưa chọn / hết giờ
          setShowResult(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, showResult, currentQuestion]);

  const handleSelect = (index) => {
    if (showResult) return;

    clearInterval(timerRef.current);

    const isCorrectChoice = index === currentQuestion.correctIndex;

    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === currentIndex
          ? { ...q, userAnswer: index, isCorrect: isCorrectChoice }
          : q
      )
    );

    setSelectedAnswer(index);
    setShowResult(true);

    // Nếu đúng → phát âm lại 1 lần
    if (isCorrectChoice) {
      setTimeout(() => {
        speak(currentQuestion.stem);
      }, 600); // delay nhẹ để không bị chồng âm thanh
    }
  };

  // Tự động chuyển câu sau 3 giây khi đã có kết quả
  useEffect(() => {
    let autoNextTimer;
    if (showResult) {
      if (currentIndex < questions.length - 1) {
        autoNextTimer = setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setShowResult(false);
        }, 3400);
      } else {
        autoNextTimer = setTimeout(() => {
          setCurrentIndex(questions.length);
        }, 3400);
      }
    }
    return () => clearTimeout(autoNextTimer);
  }, [showResult, currentIndex, questions.length]);

  const isFinished = currentIndex >= questions.length;

  if (isFinished) {
    const correctCount = questions.filter((q) => q.isCorrect).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="reading-quiz summary">
        <h2>Kết quả Listening</h2>
        <div className="summary-stats">
          <p>Đúng: <strong>{correctCount}</strong> / {total} câu</p>
          <p>Tỷ lệ đúng: <strong>{percentage}%</strong></p>
        </div>
        <table className="result-table">
          <thead>
            <tr>
              <th>Câu</th>
              <th>Hiragana</th>
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
                <td>{q.userAnswer && q.userAnswer !== 0 ? q.choices[q.userAnswer - 1] : "—"}</td>
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
            setTimeLeft(TIME_PER_QUESTION);
          }}
        >
          もういちど
        </button>
      </div>
    );
  }

  if (!currentQuestion) return <div>Không có từ vựng để luyện nghe</div>;

  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

  return (
    <div className="reading-quiz listening">
      <h2>
        {currentQuestion.id} / {questions.length}
      </h2>

      {/* Thanh đếm ngược */}
      <div className="timer-bar-container">
        <div
          className="timer-bar"
          style={{
            width: `${(timeLeft / TIME_PER_QUESTION) * 100}%`,
            backgroundColor: timeLeft <= 3 ? "#ff4d4f" : "#4caf50",
          }}
        />
        <span className="timer-text">{timeLeft}s</span>
      </div>

      <div className="question-stem">
        <div>
          <strong>{currentQuestion.stem}</strong>
        </div>
        <div className="speak-controls">
          <button
            className="speak-button"
            onClick={() => speak(currentQuestion.stem)}
            disabled={showResult}
          >
            🔊
          </button>
        </div>
      </div>


     {showResult && (
  <div className="result">
 <strong>{currentQuestion.fullWord.kanji}</strong> ({currentQuestion.fullWord.hiragana}, {currentQuestion.fullWord.romaji})<br/><em>{currentQuestion.fullWord.meaning}</em>
  </div>
)}
      <div className="options">
        {currentQuestion.choices.map((choice, idx) => {
          const optionNumber = idx + 1;
          let optionClass = "option";

          if (showResult) {
            if (optionNumber === currentQuestion.correctIndex) {
              optionClass += " correct";
            }
            if (optionNumber === selectedAnswer) {
              optionClass += selectedAnswer === currentQuestion.correctIndex ? " correct" : " wrong";
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



      {showResult && currentIndex < questions.length - 1 && (
        <button
          className="next-button"
          onClick={() => {
            clearInterval(timerRef.current);
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
          Hoàn thành tất cả câu hỏi!
        </div>
      )}
    </div>
  );
}