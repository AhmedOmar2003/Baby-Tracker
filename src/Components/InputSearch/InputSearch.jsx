"use client";
import "./inputSearch.css";
import { useState, useEffect } from "react";
export default function InputSearch({ onSearch, onReset }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const allEmpty = !title && !author && !tags && !category;
      if (allEmpty) {
        onReset(); 
      } else {
        onSearch({ title, author, tags, category });
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [title, author, tags, category]);
  return (
    <div className="inputSearch">
      <div className="container">
        <input
          type="search"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="search"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          type="search"
          placeholder="Tags (e.g: cardio,medical)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <input
          type="search"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
    </div>
  );
}