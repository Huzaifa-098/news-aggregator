import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./newsAggregator.css";
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
  TextField,
  CircularProgress,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const API_KEYS = {
  guardian: "b4d3425c-e063-4186-b300-69db8026d6d9",
  newsapi: "a825e1fa290f4c708a42b1c4286633fd",
};

const NewsAggregator = () => {
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
  const [newsApiSource, setNewsApiSource] = useState([]);
  const [newsApiAuthor, setNewsApiAuthor] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [guardianTypes, setGuardianTypes] = useState([]);
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);
  const [guardianPillarName, setGuardianPillarName] = useState([]);
  const [guardianSectionId, setGuardianSectionId] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const [selectedGuardianTypes, setSelectedGuardianTypes] = useState("all");
  const [selectedGuardianPillarName, setSelectedGuardianPillarName] =
    useState("all");
  const [selectedGuardianSectionId, setSelectedGuardianSectionId] =
    useState("all");

  useEffect(() => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    if (dateFromRef.current && dateToRef.current) {
      dateFromRef.current.setAttribute(
        "max",
        today.toISOString().split("T")[0]
      );
      dateFromRef.current.setAttribute(
        "min",
        oneMonthAgo.toISOString().split("T")[0]
      );
      dateToRef.current.setAttribute("max", today.toISOString().split("T")[0]);
      dateToRef.current.setAttribute(
        "min",
        oneMonthAgo.toISOString().split("T")[0]
      );
    }
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
      const guardianTypes = extractValuesFromKey(
        response.data.response.results,
        "type"
      );
      setGuardianTypes(guardianTypes);
      const guardianPillarName = extractValuesFromKey(
        response.data.response.results,
        "pillarName"
      );
      setGuardianPillarName(guardianPillarName);
      const guardianSectionId = extractValuesFromKey(
        response.data.response.results,
        "sectionId"
      );
      setGuardianSectionId(guardianSectionId);
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
          selectedGuardianPillarName !== "all" &&
          article.pillarName !== selectedGuardianPillarName
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
    }
  };

  const generateDropdownOptions = (array) => {
    if (!array || array.length === 0) {
      return [{ value: "", label: "No records found" }];
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

    setLoading(true);
    setError(null);
    try {
      const fetchedArticles =
        selectedAPI === "guardian"
          ? await fetchGuardianArticles()
          : await fetchNewsAPIArticles();

      setArticles(fetchedArticles);

      setCurrentPage(1); // Reset to first page on new search
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const filteredArticles = filterArticlesByAuthorAndSource(articles);

  const indexOfLastArticle = currentPage * itemsPerPage;
  const indexOfFirstArticle = indexOfLastArticle - itemsPerPage;
  const currentArticles = filteredArticles.slice(
    indexOfFirstArticle,
    indexOfLastArticle
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(parseInt(event.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="news-aggregator">
      <Typography variant="h4" gutterBottom>
        News Aggregator
      </Typography>
      <div className="menu-container">
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => setDrawerOpen(true)}
        >
          <MenuIcon />
        </IconButton>
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <div className="drawer-content">
            <FormControl fullWidth margin="normal">
              <InputLabel id="api-select-label">Select API</InputLabel>
              <Select
                labelId="api-select-label"
                value={selectedAPI}
                onChange={(e) => setSelectedAPI(e.target.value)}
              >
                <MenuItem value="guardian">The Guardian</MenuItem>
                <MenuItem value="newsapi">NewsAPI</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <TextField
                label="Keyword"
                value={keyword}
                onChange={handleKeywordChange}
                error={!!keywordError}
                helperText={keywordError}
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
              <TextField
                id="dateFrom"
                label="From"
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateChange(e, "from")}
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!dateError}
                helperText={dateError}
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
              <TextField
                id="dateTo"
                label="To"
                type="date"
                value={dateTo}
                onChange={(e) => handleDateChange(e, "to")}
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!dateError}
                helperText={dateError}
              />
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="sort-order-label">Sort Order</InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="oldest">Oldest</MenuItem>
                <MenuItem value="relevance">Relevance</MenuItem>
              </Select>
            </FormControl>

            {selectedAPI === "newsapi" && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="author-select-label">Author</InputLabel>
                  <Select
                    labelId="author-select-label"
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                  >
                    {generateDropdownOptions(newsApiAuthor).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel id="source-select-label">Source</InputLabel>
                  <Select
                    labelId="source-select-label"
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                  >
                    {generateDropdownOptions(newsApiSource).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            {selectedAPI === "guardian" && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="guardian-type-select-label">Type</InputLabel>
                  <Select
                    labelId="guardian-type-select-label"
                    value={selectedGuardianTypes}
                    onChange={(e) => setSelectedGuardianTypes(e.target.value)}
                  >
                    {generateDropdownOptions(guardianTypes).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel id="pillar-name-select-label">
                    Pillar Name
                  </InputLabel>
                  <Select
                    labelId="pillar-name-select-label"
                    value={selectedGuardianPillarName}
                    onChange={(e) =>
                      setSelectedGuardianPillarName(e.target.value)
                    }
                  >
                    {generateDropdownOptions(guardianPillarName).map(
                      (option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel id="section-id-select-label">
                    Section ID
                  </InputLabel>
                  <Select
                    labelId="section-id-select-label"
                    value={selectedGuardianSectionId}
                    onChange={(e) =>
                      setSelectedGuardianSectionId(e.target.value)
                    }
                  >
                    {generateDropdownOptions(guardianSectionId).map(
                      (option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Search"}
            </Button>
          </div>
        </Drawer>
      </div>

      {error && (
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      )}

      <div className="articles-container">
        {loading && <CircularProgress />}
        {!loading &&
          currentArticles.map((article, index) => (
            <Grid
              key={index}
              item
              xs={12}
              sm={6}
              md={4}
              className="article-card"
            >
              <div className="card-content">
                <div className="card-image">
                  <img
                    src={article.fields?.thumbnail || article.urlToImage}
                    alt={article.webTitle || article.title}
                    className="article-image"
                  />
                </div>
                <div className="card-title">
                  <Typography variant="h6">
                    {article.webTitle || article.title}
                  </Typography>
                </div>

                <div className="card-description">
                  <Typography variant="body2">
                    {article.fields?.headline || article.description}
                  </Typography>
                </div>
                <div className="card-footer">
                  <Button
                    variant="contained"
                    color="primary"
                    href={article.webUrl || article.url}
                    target="_blank"
                  >
                    Read more
                  </Button>
                </div>
              </div>
            </Grid>
          ))}
      </div>
      <div className="pagination-container">
        <div className="d-flex align-items-center justify-content-center mt-3">
          <Typography variant="body1" sx={{ marginRight: "10px" }}>
            Showing{" "}
            {Math.min(
              (currentPage - 1) * itemsPerPage + 1,
              filteredArticles.length
            )}{" "}
            - {Math.min(currentPage * itemsPerPage, filteredArticles.length)} of{" "}
            {filteredArticles.length} items
          </Typography>
          <InputLabel id="items-per-page-label">Items per page</InputLabel>
          <FormControl margin="normal" sx={{ marginLeft: "5px" }}>
            <Select
              labelId="items-per-page-label"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              {[5, 10, 20, 50, 100].map((number) => (
                <MenuItem key={number} value={number}>
                  {number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>
    </div>
  );
};

export default NewsAggregator;
