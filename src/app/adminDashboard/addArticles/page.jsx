'use client';
import { useState } from 'react';
import '../addDoctor/addDoctor.css';
import './addArticle.css';
import PageTitle from '@/Components/PageTitle/PageTitle';
import { showToast } from '@/Components/Toast/Toast';
import axios from 'axios';
import { host } from '@/Components/utils/Host';
import { useRouter } from 'next/navigation';

export default function AddArticles() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [views, setViews] = useState('');
  const [references, setReferences] = useState('');
  const [isFeatured, setIsFeatured] = useState('');
  const router = useRouter();
  const parseInputToArray = (input) => {
    return input
      .split(/[,\n;\-–\\_]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleSubmitData = (e) => {
    e.preventDefault();

    if (
      !title ||
      !content ||
      !author ||
      !publicationDate ||
      !tags ||
      !category ||
      !status ||
      !views ||
      !references ||
      !isFeatured
    ) {
      showToast(`Please Complete The Data`, 'warning');
      return;
    }
    const tagsArray = parseInputToArray(tags);
    const authorsArray = parseInputToArray(author);
    const authorsString = authorsArray.join(', ');
    const referencesArray = parseInputToArray(references);
    const formattedDate = new Date(publicationDate).toISOString().split('T')[0];
    const params = {
      title,
      content,
      author: authorsString,
      publicationDate: formattedDate,
      tags: tagsArray,
      category,
      status,
      views,
      references: referencesArray,
      isFeatured,
    };

    axios
      .post(`${host}/article/create`, params, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      })
      .then((response) => {
        showToast(`Add New Article Successfully`, 'success');
        router.push('/adminDashboard');
      })
      .catch((error) => {
        showToast(`${error.message}`, 'error');
      });
  };

  return (
    <div className="addArticles">
      <div className="container">
        <PageTitle text="Add New Article" />
        <form>
          <div className="inputs">
            <div>
              <label>Title</label>
              <input
                type="text"
                required
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label>Content</label>
              <input
                type="text"
                required
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Category</label>
              <input
                type="text"
                required
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label>Publication Date</label>
              <input
                type="date"
                required
                onChange={(e) => setPublicationDate(e.target.value)}
              />
            </div>
          </div>
          <div className="inputs">
            <div className="input">
              <label>Status</label>
              <br />
              <select
                value={status}
                required
                onChange={(e) => setStatus(e.target.value)}
              >
                <option disabled value="">
                  Choose
                </option>
                <option>published</option>
              </select>
            </div>
            <div>
              <label>Views</label>
              <input
                type="number"
                required
                onChange={(e) => setViews(e.target.value)}
              />
            </div>
          </div>
          <div className="inputs">
            <div>
              <label>Is Featured</label>
              <br />
              <select
                value={isFeatured}
                className="selectFeatured"
                onChange={(e) => setIsFeatured(e.target.value)}
              >
                <option disabled value="">
                  Choose
                </option>
                <option>true</option>
                <option>false</option>
              </select>
            </div>
            <div>
              <label>Authors</label>
              <br />
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </div>
          <div className="inputs">
            <div className="input">
              <label>References</label>
              <br />
              <textarea
                required
                rows={3}
                placeholder="e.g. https://example.com - Book Name _ Journal"
                onChange={(e) => setReferences(e.target.value)}
              ></textarea>
            </div>
            <div>
              <label>Tags</label>
              <br />
              <textarea
                required
                rows={2}
                placeholder="e.g. Health, Medicine - Tips _ Care"
                onChange={(e) => setTags(e.target.value)}
              ></textarea>
            </div>
          </div>
          <button className="submit" onClick={handleSubmitData}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
