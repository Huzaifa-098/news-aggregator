import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Drawer,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Grid,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import "./newsAggregator.css";

const API_KEYS = {
  guardian: "b4d3425c-e063-4186-b300-69db8026d6d9",
  newsapi: "a825e1fa290f4c708a42b1c4286633fd",
};

const Dummy = () => {
  const [selectedAPI, setSelectedAPI] = useState("guardian");
  const [keyword, setKeyword] = useState("microsoft");
  const [dateFrom, setDateFrom] = useState("2024-07-16");
  const [dateTo, setDateTo] = useState("2024-07-22");
  const [source, setSource] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keywordError, setKeywordError] = useState(null);
  const [dateError, setDateError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newsApiSource, setNewsApiSource] = useState([]);
  const [newsApiAuthor, setNewsApiAuthor] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [guardianTypes, setGuardianTypes] = useState([]);
  const [guardianPillerName, setGuardianPillerName] = useState([]);
  const [guardianSectionId, setGuardianSectionId] = useState([]);
  const [selectedGuardianTypes, setSelectedGuardianTypes] = useState("all");
  const [selectedGuardianPillerName, setSelectedGuardianPillerName] =
    useState("all");
  const [selectedGuardianSectionId, setSelectedGuardianSectionId] =
    useState("all");

  useEffect(() => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    document
      .getElementById("dateFrom")
      .setAttribute("max", today.toISOString().split("T")[0]);
    document
      .getElementById("dateFrom")
      .setAttribute("min", oneMonthAgo.toISOString().split("T")[0]);
    document
      .getElementById("dateTo")
      .setAttribute("max", today.toISOString().split("T")[0]);
    document
      .getElementById("dateTo")
      .setAttribute("min", oneMonthAgo.toISOString().split("T")[0]);
  }, []);

  const handleKeywordChange = (e) => {
    let value = e.target.value;
    value = value.replace(/ {2,}/g, " "); // Replace multiple spaces with single space
    if (value.includes(" ")) {
      value = value.replace(/ /g, "-"); // Replace single space with hyphen
    }
    setKeyword(value);
  };

  const handleDateChange = (e, type) => {
    const value = e.target.value;
    const today = new Date();
    const selectedDate = new Date(value);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    if (selectedDate > today || selectedDate < oneMonthAgo) {
      setDateError("Date must be within the past month.");
      if (type === "from") setDateFrom("");
      if (type === "to") setDateTo("");
      return;
    } else {
      setDateError(null);
    }

    if (type === "from") setDateFrom(value);
    if (type === "to") setDateTo(value);
  };

  const fetchGuardianArticles = async () => {
    try {
      const query = `https://content.guardianapis.com/search?q=${keyword}&from-date=${dateFrom}&to-date=${dateTo}&order-by=${sortOrder}&api-key=${API_KEYS.guardian}&show-tags=contributor&show-fields=starRating,headline,thumbnail,short-url&page-size=100`;
      const response = await axios.get(query);
      const guardinaTypes = extractValuesFromKey(
        response.data.response.results,
        "type"
      );
      setGuardianTypes(guardinaTypes);
      const guardinaPillerName = extractValuesFromKey(
        response.data.response.results,
        "pillarName"
      );
      setGuardianPillerName(guardinaPillerName);
      const guardinaSectionId = extractValuesFromKey(
        response.data.response.results,
        "sectionId"
      );
      setGuardianSectionId(guardinaSectionId);
      return response.data.response.results;
    } catch (error) {
      throw new Error("Error fetching Guardian articles");
    }
  };

  const filterArticles = (articles) => {
    return articles.filter((article) => {
      if (article.source.id === null) {
        return false;
      }

      for (let key in article) {
        if (typeof article[key] === "string" && article[key] === "[Removed]") {
          return false;
        }
      }

      if (
        article.source.name === "[Removed]" ||
        article.author === "[Removed]" ||
        article.title === "[Removed]" ||
        article.description === "[Removed]" ||
        article.url === "[Removed]" ||
        article.urlToImage === "[Removed]" ||
        article.content === "[Removed]"
      ) {
        return false;
      }

      return true;
    });
  };

  const fetchNewsAPIArticles = async () => {
    const newSource = source.replace(/\s+/g, "-").toLowerCase();
    try {
      const query = `https://newsapi.org/v2/everything?q=${keyword}&from=${dateFrom}&to=${dateTo}&sources=${newSource}&sortBy=${sortOrder}&apiKey=${API_KEYS.newsapi}&pageSize=100`;
      const response = await axios.get(query);
      const filteredArticles = filterArticles(response.data.articles);
      const sourceNames = extractValuesFromKey(filteredArticles, "source.id");
      setNewsApiSource(sourceNames);
      const author = extractValuesFromKey(filteredArticles, "author");
      setNewsApiAuthor(author);
      return filteredArticles;
    } catch (error) {
      throw new Error("Error fetching NewsAPI articles");
    }
  };

  const filterArticlesByAuthorAndSource = (articles) => {
    if (selectedAPI === "guardian") {
      return articles.filter((article) => {
        if (
          selectedGuardianTypes !== "all" &&
          article.type !== selectedGuardianTypes
        ) {
          return false;
        }
        if (
          selectedGuardianPillerName !== "all" &&
          article.pillarName !== selectedGuardianPillerName
        ) {
          return false;
        }
        if (
          selectedGuardianSectionId !== "all" &&
          article.sectionId !== selectedGuardianSectionId
        ) {
          return false;
        }
        return true;
      });
    } else if (selectedAPI === "newsapi") {
      return articles.filter((article) => {
        if (selectedAuthor !== "all" && article.author !== selectedAuthor) {
          return false;
        }
        if (selectedSource !== "all" && article.source.id !== selectedSource) {
          return false;
        }
        return true;
      });
    } else {
      console.log("third api filter");
    }
  };

  const generateDropdownOptions = (array) => {
    if (!array) {
      return [{ value: "all", label: "All" }];
    }

    const countMap = array.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    const options = Object.keys(countMap).map((key) => ({
      value: key,
      label: `${key} (${countMap[key]})`,
    }));

    options.sort((a, b) => a.label.localeCompare(b.label));
    options.unshift({ value: "all", label: "All" });

    return options;
  };

  const extractValuesFromKey = (array, keyPath) => {
    const keys = keyPath.split(".");
    return array
      .map((item) => {
        let value = item;
        for (let key of keys) {
          value = value[key];
          if (value === undefined) {
            return undefined;
          }
        }
        return value;
      })
      .filter((value) => value !== undefined);
  };

  const handleSearch = async () => {
    if (keywordError || dateError) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let articles = [];

      if (selectedAPI === "guardian") {
        articles = await fetchGuardianArticles();
      } else if (selectedAPI === "newsapi") {
        articles = await fetchNewsAPIArticles();
      }

      articles = filterArticlesByAuthorAndSource(articles);

      setArticles(articles);
    } catch (error) {
      setError("Failed to fetch articles. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const displayedArticles = articles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const guardianTypeDropdown = generateDropdownOptions(guardianTypes);
  const guardianPillerNameDropdown =
    generateDropdownOptions(guardianPillerName);
  const guardianSectionIdDropdown = generateDropdownOptions(guardianSectionId);
  const authorDropdown = generateDropdownOptions(newsApiAuthor);
  const sourceDropdown = generateDropdownOptions(newsApiSource);

  return (
    <div>
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        edge="start"
      >
        <MenuIcon />
      </IconButton>
      <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
        <div className="drawer-content">
          <FormControl fullWidth>
            <InputLabel>Select API</InputLabel>
            <Select
              value={selectedAPI}
              onChange={(e) => setSelectedAPI(e.target.value)}
            >
              <MenuItem value="guardian">The Guardian</MenuItem>
              <MenuItem value="newsapi">NewsAPI</MenuItem>
            </Select>
          </FormControl>
          {selectedAPI === "guardian" && (
            <>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedGuardianTypes}
                  onChange={(e) => setSelectedGuardianTypes(e.target.value)}
                >
                  {guardianTypeDropdown.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Piller Name</InputLabel>
                <Select
                  value={selectedGuardianPillerName}
                  onChange={(e) =>
                    setSelectedGuardianPillerName(e.target.value)
                  }
                >
                  {guardianPillerNameDropdown.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Section Id</InputLabel>
                <Select
                  value={selectedGuardianSectionId}
                  onChange={(e) => setSelectedGuardianSectionId(e.target.value)}
                >
                  {guardianSectionIdDropdown.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          {selectedAPI === "newsapi" && (
            <>
              <FormControl fullWidth>
                <InputLabel>Author</InputLabel>
                <Select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                >
                  {authorDropdown.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                >
                  {sourceDropdown.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </div>
      </Drawer>
      <div className="search-container">
        <h1>News Aggregator</h1>
        <div className="search-inputs">
          <input
            type="text"
            value={keyword}
            onChange={handleKeywordChange}
            placeholder="Keyword"
          />
          <input
            type="date"
            id="dateFrom"
            value={dateFrom}
            onChange={(e) => handleDateChange(e, "from")}
            placeholder="From Date"
          />
          <input
            type="date"
            id="dateTo"
            value={dateTo}
            onChange={(e) => handleDateChange(e, "to")}
            placeholder="To Date"
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="relevance">Relevance</option>
          </select>
          <button onClick={handleSearch} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </button>
        </div>
        {keywordError && <p className="error">{keywordError}</p>}
        {dateError && <p className="error">{dateError}</p>}
        {error && <p className="error">{error}</p>}
      </div>
      <div className="results">
        {articles.length > 0 ? (
          <div className="articles-grid">
            {displayedArticles.map((article, index) => (
              <div key={index} className="article-card">
                <img
                  src={article.urlToImage || article.fields.thumbnail}
                  alt={article.title}
                />
                <div className="article-details">
                  <Typography variant="h6">{article.title}</Typography>
                  <Typography variant="body2">
                    {article.description || article.fields.headline}
                  </Typography>
                  <Typography variant="caption">
                    {new Date(
                      article.publishedAt || article.webPublicationDate
                    ).toLocaleDateString()}
                  </Typography>
                  <a
                    href={article.url || article.fields.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read more
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No articles found.</p>
        )}
        <div className="pagination">
          <Button
            onClick={(e) => handlePageChange(e, currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span>{currentPage}</span>
          <Button
            onClick={(e) => handlePageChange(e, currentPage + 1)}
            disabled={currentPage === Math.ceil(articles.length / itemsPerPage)}
          >
            Next
          </Button>
          <FormControl>
            <InputLabel>Items per page</InputLabel>
            <Select value={itemsPerPage} onChange={handleItemsPerPageChange}>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>
    </div>
  );
};

export default Dummy;
