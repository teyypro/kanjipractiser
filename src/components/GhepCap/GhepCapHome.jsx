import { useContext, useState, useEffect } from "react";
import { VocabularyContext } from "../Context/VocabularyContext";
import './stylehere.css';

export default function GhepCapHome() {
  const { vocabularyArray } = useContext(VocabularyContext);
  const vocab_list = vocabularyArray || [];

  const modes = [
    { id: 0, name: "Hiragana - Nghĩa", stemKey: "hiragana", pairKey: "meaning" },
    { id: 1, name: "Kanji - Nghĩa", stemKey: "kanji", pairKey: "meaning" },
    { id: 2, name: "Kanji - Hiragana", stemKey: "kanji", pairKey: "hiragana" },
  ];

  const timeOptions = [
    { value: 20, label: "20 giây" },
    { value: 30, label: "30 giây" },
    { value: 45, label: "45 giây" },
    { value: 60, label: "60 giây" },
  ];

  const [mode, setMode] = useState(0);
  const [timeLimit, setTimeLimit] = useState(30);
  const [page, setPage] = useState("choose");
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [tempWrong, setTempWrong] = useState([]);
  const [timer, setTimer] = useState(timeLimit);
  const [totalScore, setTotalScore] = useState(0);
  const [loseReason, setLoseReason] = useState("");

  const MAX_WRONG = 3;
  const NUMBER_OF_PAIRS = 6;
  const currentMode = modes[mode];

  const speakHiragana = (text) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voices = speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang === "ja-JP") || voices.find(v => v.lang.startsWith("ja"));
    if (jaVoice) utterance.voice = jaVoice;
    speechSynthesis.speak(utterance);
  };

  const prepareGame = () => {
    if (vocab_list.length < NUMBER_OF_PAIRS) return;

    const selectedVocabs = [];
    const used = new Set();
    while (selectedVocabs.length < NUMBER_OF_PAIRS && used.size < vocab_list.length) {
      const idx = Math.floor(Math.random() * vocab_list.length);
      if (!used.has(idx)) {
        used.add(idx);
        selectedVocabs.push(vocab_list[idx]);
      }
    }

    const cardList = [];
    selectedVocabs.forEach((voca, i) => {
      const pairId = i;
      cardList.push({ id: `${pairId}-a`, pairId, content: voca[currentMode.stemKey], type: "stem", rawVoca: voca });
      cardList.push({ id: `${pairId}-b`, pairId, content: voca[currentMode.pairKey], type: "pair", rawVoca: voca });
    });

    setCards(shuffleArray(cardList));
    setSelected([]);
    setMatchedPairs(new Set());
    setWrongCount(0);
    setTempWrong([]);
    setTimer(timeLimit);
    //setTotalScore(0); // reset nếu muốn, hoặc bỏ dòng này nếu giữ tổng điểm vô hạn
    setLoseReason("");
  };

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startNewGame = () => {
    prepareGame();
    setPage("playing");
  };

  useEffect(() => {
    if (page !== "playing") return;
    const interval = setInterval(() => {
      setTimer(prev => prev <= 1 ? (setLoseReason("time"), setPage("summary"), 0) : prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [page]);

  const handleCardClick = (card) => {
    const { id, pairId } = card;

    // Block nếu đang hiển thị sai (tempWrong) hoặc thẻ đã match hoặc hết giờ
    if (tempWrong.length > 0 || matchedPairs.has(pairId) || timer <= 0) return;

    // Không cho chọn quá 2 thẻ cùng lúc
    if (selected.length === 2) return;

    const newSelected = [...selected, card];
    setSelected(newSelected);

    if (newSelected.length === 1) return;

    const first = newSelected[0];
    const second = newSelected[1];

    if (first.pairId === second.pairId) {
      // MATCH - xử lý nhanh
      const voca = first.rawVoca || second.rawVoca;
      if (voca?.hiragana) setTimeout(() => speakHiragana(voca.hiragana), 200);

      const timeBonus = Math.round((timer / timeLimit) * 100);
      const pairScore = 100 + timeBonus;
      setTotalScore(prev => prev + pairScore);

      // Ẩn thẻ nhanh hơn (400ms)
      setTimeout(() => {
        setMatchedPairs(prev => new Set([...prev, first.pairId]));
        setSelected([]);
      }, 400);
    } else {
      // MISMATCH - lật ngược nhanh hơn
      setTempWrong([first.id, second.id]);
      setWrongCount(prev => {
        const nextWrong = prev + 1;
        if (nextWrong >= MAX_WRONG) {
          setLoseReason("wrong");
          setPage("summary");
        }
        return nextWrong;
      });

      // Xóa hiệu ứng sai và cho click tiếp nhanh (600ms)
      setTimeout(() => {
        setTempWrong([]);
        setSelected([]);
      }, 600);
    }
  };

  const isWon = matchedPairs.size === NUMBER_OF_PAIRS;

  useEffect(() => {
    if (page === "playing" && isWon) {
      setTimeout(startNewGame, 1200); // giảm delay giữa round
    }
  }, [matchedPairs, page]);

  const progress = timer > 0 ? (timer / timeLimit) * 100 : 0;

  return (
    <div className="ghep-cap-home">
    {page === "choose" && (
  <div className="choose-container">
    <h2>Chế độ ghép cặp</h2>

    <div className="options-group">
      {modes.map((m) => (
        <div key={m.id} className="option-item">
          <input
            type="radio"
            id={`mode-${m.id}`}
            name="mode"
            checked={mode === m.id}
            onChange={() => setMode(m.id)}
          />
          <label htmlFor={`mode-${m.id}`}>{m.name}</label>
        </div>
      ))}
    </div>

    <h3>Thời gian mỗi ván</h3>

    <div className="time-group">
      {timeOptions.map((opt) => (
        <div key={opt.value} className="time-item">
          <input
            type="radio"
            id={`time-${opt.value}`}
            name="timeLimit"
            value={opt.value}
            checked={timeLimit === opt.value}
            onChange={() => setTimeLimit(opt.value)}
          />
          <label htmlFor={`time-${opt.value}`}>{opt.label}</label>
        </div>
      ))}
    </div>

    <button
      onClick={startNewGame}
      disabled={!vocab_list?.length}
      className="start-btn"
    >
      Go Go
    </button>
  </div>
)}

      {page === "playing" && (
        <div className="game-container">
          <div className="game-info">
            <div className="timer-bar-container">
              <div
                className="timer-bar"
                style={{
                  width: `${progress}%`,
                  backgroundColor: progress > 50 ? "#28a745" : progress > 20 ? "#ffc107" : "#dc3545",
                }}
              />
            </div>

            <div className="status">
              <span>❤️‍🔥 <strong className={wrongCount >= 2 ? "warning" : ""}>{MAX_WRONG - wrongCount}</strong></span>
              <span className="score"><strong>{totalScore}</strong></span>
            </div>
          </div>

          <div className="cards-grid">
            {cards.map(card => {
              const isMatched = matchedPairs.has(card.pairId);
              const isSelected = selected.some(s => s.id === card.id);
              const isTempWrong = tempWrong.includes(card.id);

              let cardClass = "card";
              if (isMatched) cardClass += " matched hidden";
              if (isSelected) cardClass += " selected";
              if (isTempWrong) cardClass += " wrong-temp";

              return (
                <div
                  key={card.id}
                  className={cardClass}
                  onClick={() => handleCardClick(card)}
                >
                  {card.content}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {page === "summary" && (
        <div className="summary-container">
          <h1>🚀🥹🚀</h1>
          {loseReason === "time" && <p className="lose-reason time">HẾT GIỜ!</p>}
          {loseReason === "wrong" && <p className="lose-reason wrong">Sai quá {MAX_WRONG} lần!</p>}

          <p>Tổng điểm:<br></br><strong>{totalScore}</strong></p>

          <div className="summary-buttons">
            <button onClick={startNewGame} className="continue-btn">Chơi lại</button>
            <button onClick={() => setPage("choose")} className="stop-btn">Chọn chế độ</button>
          </div>
        </div>
      )}
    </div>
  );
}