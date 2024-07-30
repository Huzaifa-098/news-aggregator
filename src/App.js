import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NewsAggregator from "./component/newsAggregator";
import Dummy from "./component/dummy";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewsAggregator />} />
          <Route path="/dummy" element={<Dummy />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
