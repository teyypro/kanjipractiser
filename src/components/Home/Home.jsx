// Home.jsx
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VocabularyContext } from '../Context/VocabularyContext';
import './stylehere.css';
function Home() {
  const navigate = useNavigate();
  const { 
    parseVocabularyData, 
    setVocabularyArray,
    inputText,
    setInputText 
  } = useContext(VocabularyContext);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleParse = () => {
    if (!inputText.trim()) {
      setError('Vui lòng nhập dữ liệu từ vựng!');
      setSuccess('');
      return;
    }

    const parsed = parseVocabularyData(inputText);

    if (parsed.length === 0) {
      setError('Không tìm thấy từ vựng hợp lệ. Kiểm tra định dạng!');
      setSuccess('');
      return;
    }

    setVocabularyArray(parsed);
    setError('');
    setSuccess(`Đã tải thành công ${parsed.length} từ vựng!`);

    // Tùy chọn: nếu bạn muốn làm trống textarea sau khi parse thành công
    // setInputText('');
  };

  return (
    <div className="home-container">
      <h1>Practise日本語</h1>

      <div className="input-section">
        <h2>Nhập dữ liệu từ vựng</h2>
 
        <pre className="example">
                <p className="format-info">
          Định dạng mỗi dòng: <code>kanji - (hiragana, romaji) - nghĩa</code>
        </p>
          Ví dụ: <br />
大きい - (おおきい, ookii) - to, lớn<br></br>
大学 - (だいがく, daigaku) - trường đại học
        </pre>
        <a target="_blank" href = "https://teyypro.github.io/512kanjilookandlearnfilter/">512KanjiLookAndLearn</a>
        <br></br>
        <br></br>
        <textarea spellCheck = "false"
          className="vocab-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="大きい - (おおきい, ookii) - to, lớn
大学 - (だいがく, daigaku) - trường đại học"
          rows={10}
        />

        <div className="actions">
          <button className="parse-btn" onClick={handleParse}>
            Xử lý dữ liệu
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>

      <div className="game-buttons">
        <button className="game-btn" onClick={() => navigate("/TracNghiem")}>
          Trắc nghiệm
        </button>
        <button className="game-btn" onClick={() => navigate("/GhepCap")}>
          Ghép cặp
        </button>
      </div>
    </div>
  );
}

export default Home;