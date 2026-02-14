// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Home from './components/Home/Home';
import TracNghiemHome from './components/TracNghiem/TracNghiemHome';
import GhepCapHome from './components/GhepCap/GhepCapHome';
import { VocabularyContext } from './components/Context/VocabularyContext';

function App() {
  const [vocabularyArray, setVocabularyArray] = useState([]);
  const [inputText, setInputText] = useState('');  // ← State này sẽ giữ nội dung textarea

  const parseVocabularyData = (text) => {
    const lines = text.trim().split('\n');
    const result = lines.map(line => {
      const regex = /(.+?)\s*-\s*\((.+?),\s*(.+?)\)\s*-\s*(.+)/;
      const matches = line.match(regex);
      if (matches) {
        return {
          kanji: matches[1].trim(),
          hiragana: matches[2].trim(),
          romaji: matches[3].trim(),
          meaning: matches[4].trim(),
        };
      }
      return null;
    }).filter(item => item !== null);

    return result;
  };

  return (
    <VocabularyContext.Provider 
      value={{ 
        vocabularyArray, 
        setVocabularyArray, 
        parseVocabularyData,
        inputText,          // ← Truyền xuống các component con
        setInputText        // ← Truyền xuống để Home có thể cập nhật
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/TracNghiem" element={<TracNghiemHome />} />
          <Route path="/GhepCap" element={<GhepCapHome />} />
        </Routes>
      </BrowserRouter>
    </VocabularyContext.Provider>
  );
}

export default App;