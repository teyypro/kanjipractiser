// TracNghiemHome.jsx
import React, { useState } from "react";
import Reading from "./Reading";
import Listening from "./Listening";
import "./TracNghiemHome.css"; // bạn có thể tạo file css riêng

export default function TracNghiemHome() {
  const [mode, setMode] = useState("read"); // "read" hoặc "listen"
  const [selected, setSelected] = useState(0); // index của lựa chọn
  const [page, setPage] = useState("choose"); // "choose" | "reading" | "listening"

  // Danh sách chế độ Đọc
  const readingPairs = [
    { label: "Nghĩa → Kanji", value: 0 },
    { label: "Nghĩa → Hiragana", value: 1 },
    { label: "Kanji → Hiragana", value: 2 },
    { label: "Kanji → Nghĩa", value: 3 },
    { label: "Hiragana → Kanji", value: 4 },
    { label: "Hiragana → Nghĩa", value: 5 },
  ];

  // Danh sách chế độ Nghe (có thể mở rộng sau)
  const listeningOptions = [
    { label: "Nghe → Kanji", value: 0 },
    { label: "Nghe → Nghĩa", value: 1 },
    { label: "Nghe → Hiragana", value: 2 },
  ];

  const currentOptions = mode === "read" ? readingPairs : listeningOptions;

  const handleStart = () => {
    if (mode === "read") {
      setPage("reading");
    } else {
      setPage("listening");
    }
  };

  const handleBackToMenu = () => {
    setPage("choose");
  };

  const handleChangeMode = (newMode) => {
    setMode(newMode);
    setSelected(0); // reset lựa chọn khi đổi mode
    setPage("choose");
  };

  const isStartDisabled = currentOptions.length === 0; // phòng trường hợp rỗng

  return (
    <div className="trac-nghiem-home">
      {/* Trang chọn chế độ */}
      {page === "choose" && (
        <div className="choose-container">

          <div className="mode-buttons">
            <button
              className={`mode-btn ${mode === "read" ? "active" : ""}`}
              onClick={() => handleChangeMode("read")}
            >
             Reading
            </button>
            <button
              className={`mode-btn ${mode === "listen" ? "active" : ""}`}
              onClick={() => handleChangeMode("listen")}
            >
              Listening
            </button>
          </div>

          <div className="option-list">
            <h3>Chọn kiểu câu hỏi:</h3>
            {currentOptions.map((option) => (
              <label key={option.value} className="option-label">
                <input
                  type="radio"
                  name="question-type"
                  checked={selected === option.value}
                  onChange={() => setSelected(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>

          <div className="action-buttons">
            <button
              className="start-btn"
              onClick={handleStart}
              disabled={isStartDisabled}
            >
              Go Go
            </button>
          </div>
        </div>
      )}

      {/* Trang Reading */}
      {page === "reading" && (
        <div className="game-page">

            <button className="back-btn" onClick={handleBackToMenu}>
              ← Back
            </button>

          <Reading selected={selected} />

          {/* Nút chơi lại nếu cần (có thể thêm trong Reading component) */}
        </div>
      )}

      {/* Trang Listening */}
      {page === "listening" && (
        <div className="game-page">
  
            <button className="back-btn" onClick={handleBackToMenu}>
              ← Back
            </button>
   

          <Listening selected={selected} />
        </div>
      )}
    </div>
  );
}