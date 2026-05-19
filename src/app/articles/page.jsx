'use client';
import './articles.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import PageTitle from '@/Components/PageTitle/PageTitle';
import Spinner from '@/Components/Spinner/Spinner';
import InputSearch from '@/Components/InputSearch/InputSearch';
import { host } from '@/Components/utils/Host';
import { useRouter } from 'next/navigation';
import { showToast } from '@/Components/Toast/Toast';
import articleImage from '../../assets/images/articles/articles.avif';
import { getLikedIds, toggleFavorite } from '@/lib/favoritesManager';

export default function Articles() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [activeTab, setActiveTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [likedIds, setLikedIds] = useState([]);
  const [searchValues, setSearchValues] = useState({
    title: '',
    author: '',
    tags: '',
    category: '',
  });

  useEffect(() => {
    getArticles();
    setLikedIds(getLikedIds('articles', '_id'));
  }, []);

  // Tab change: filter existing data client-side — no API call
  useEffect(() => {
    const hasSearch = Object.values(searchValues).some((v) => v);
    if (hasSearch) {
      handleSearch(searchValues);
    } else {
      setFilteredData(data.filter((item) => item.isFeatured === activeTab));
    }
  }, [activeTab]);

  const getArticles = async () => {
    const cacheKey = 'articles_cache_v2';
    const cached = sessionStorage.getItem(cacheKey);
    const hasCached = !!cached;
    if (cached) {
      const rows = JSON.parse(cached);
      setData(rows);
      setFilteredData(rows.filter((item) => item.isFeatured === activeTab));
    }
    if (!hasCached) setLoading(true);
    try {
      const res = await axios.get(`${host}/article/getAll`, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      const rows = res.data.data.rows || [];
      setData(rows);
      setFilteredData(rows.filter((item) => item.isFeatured === activeTab));
      sessionStorage.setItem(cacheKey, JSON.stringify(rows));
    } catch (err) {
      if (!hasCached) showToast('No articles found. Please try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters) => {
    setSearchValues(filters);
    setLoading(true);

    const params = new URLSearchParams();
    if (filters.title) params.append('title', filters.title);
    if (filters.author) params.append('author', filters.author);
    if (filters.tags) params.append('tags', filters.tags);
    if (filters.category) params.append('category', filters.category);

    const apiParams = new URLSearchParams(params);
    apiParams.append('isFeatured', activeTab);

    const visibleParams = new URLSearchParams(params);
    router.push(`/articles?${visibleParams.toString()}`);

    try {
      const res = await axios.get(
        `${host}/article/search?${apiParams.toString()}`,
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      const rows = res.data.data.rows || [];

      const looseMatch = (text = '', input = '') => {
        if (!input) return true;
        text = text.toLowerCase();
        input = input.toLowerCase();
        return [...input].every((char) => text.includes(char));
      };

      const filtered = rows.filter(
        (item) =>
          looseMatch(item.title, filters.title) &&
          looseMatch(item.author, filters.author) &&
          looseMatch(item.tags?.join(',') || '', filters.tags) &&
          looseMatch(item.category, filters.category)
      );

      setData(filtered);
      setFilteredData(filtered);
    } catch (err) {
      showToast('No articles found matching your search criteria.', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchValues({
      title: '',
      author: '',
      tags: '',
      category: '',
    });
    router.push('/articles');
    getArticles();
  };

  const handleClickHeart = (item) => {
    toggleFavorite('articles', item, '_id');
    setLikedIds(getLikedIds('articles', '_id'));
  };

  return (
    <div className="articles page-section">
      <div className="container">
        <PageTitle text="Medical Articles & Advice" subtext="Read through valuable insights and recommendations for your child's health." />
        <div className="page-tabs">
          <button
            className={activeTab ? 'active-tab' : ''}
            onClick={() => setActiveTab(true)}
          >
            Basic
          </button>
          <button
            className={!activeTab ? 'active-tab' : ''}
            onClick={() => setActiveTab(false)}
          >
            Additional
          </button>
        </div>
        <div className="page-search">
          <InputSearch onSearch={handleSearch} onReset={handleReset} />
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
        ) : (
          <div className="content">
            {filteredData.length > 0 ? (
              <div>
                {filteredData.map((item) => (
                  <div key={item._id} className="ds-list-card">
                    <Image
                      src={item.image || articleImage}
                      alt="Article Image"
                      width={120}
                      height={120}
                      className="ds-list-img"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="ds-list-body">
                      <h4>{item.title}</h4>
                      <p>Status: <span className="meta-text">{item.status}</span></p>
                    </div>
                    <div className="ds-list-actions">
                      {likedIds.includes(item._id)
                        ? <MdFavorite className="heart-icon liked" onClick={() => handleClickHeart(item)} />
                        : <MdFavoriteBorder className="heart-icon" onClick={() => handleClickHeart(item)} />
                      }
                      <Link href={`/articles/${item._id}`} className="btn-action">
                        Read More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No articles found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
