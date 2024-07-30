import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NewsAggregator from "./component/newsAggregator";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewsAggregator />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
