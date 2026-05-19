"use client";
import "./articleDetails.css";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MdFavoriteBorder, MdLink, MdArrowBack, MdPerson, MdAccessTime, MdMenuBook } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import { host } from "@/Components/utils/Host";
import Spinner from "@/Components/Spinner/Spinner";

function estimateReadTime(text) {
  const words = (text || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function renderContent(content) {
  if (!content) return null;

  if (content.includes("After Vaccination:")) {
    const parts = content.split("After Vaccination:");
    const beforeRaw = parts[0].replace(/Before Vaccination:?/i, '');
    const afterRaw = parts[1] || '';
    const toList = (raw) => raw.split(/[\n\-]/).map(s => s.trim()).filter(Boolean);
    const beforeList = toList(beforeRaw);
    const afterList = toList(afterRaw);

    return (
      <>
        {beforeList.length > 0 && (
          <div className="content-section">
            <h4 className="content-section-title">Before Vaccination</h4>
            <ul className="content-list">
              {beforeList.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        )}
        <div className="content-section">
          <h4 className="content-section-title">After Vaccination</h4>
          <ul className="content-list">
            {afterList.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </div>
      </>
    );
  }

  const paragraphs = content.split(/\n+/).map(s => s.trim()).filter(Boolean);
  return (
    <div className="content-paragraphs">
      {paragraphs.map((p, idx) => (
        <p key={idx} className="content-paragraph">{p}</p>
      ))}
    </div>
  );
}

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const authorList = Array.isArray(data?.author) ? data.author : data?.author ? [data.author] : [];
  const referenceList = Array.isArray(data?.references) ? data.references : data?.references ? [data.references] : [];

  useEffect(() => {
    axios
      .get(`${host}/article/articleById/${params.id}`, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      })
      .then((res) => { setData(res.data.data.rows[0]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading || !data) {
    return <div className="loading"><Spinner /></div>;
  }

  const readTime = estimateReadTime(data.content);

  return (
    <div className="article-detail-page page-section">
      <div className="container" style={{ maxWidth: '780px' }}>

        {/* Back */}
        <button className="article-back-btn" onClick={() => router.back()}>
          <MdArrowBack /> Back to Articles
        </button>

        {/* Hero Image */}
        {data.image?.trim() && (
          <div className="article-image-wrapper">
            <Image src={data.image} alt={data.title || "Article"} fill style={{ objectFit: 'cover' }} />
          </div>
        )}

        {/* Header Card */}
        <div className="article-header-card">
          {data.status && (
            <div className="article-tags">
              <span className="tag">{data.status}</span>
            </div>
          )}
          <h1 className="article-title">{data.title}</h1>
          <div className="article-meta">
            <div className="meta-left">
              <span className="meta-item">
                <MdPerson />
                {authorList.join(', ') || 'Medical Board'}
              </span>
              <span className="meta-item">
                <MdAccessTime />
                {readTime} min read
              </span>
              {data.content && (
                <span className="meta-item">
                  <MdMenuBook />
                  {data.content.split(/\s+/).filter(Boolean).length} words
                </span>
              )}
            </div>
            <MdFavoriteBorder className="heart-action" />
          </div>
        </div>

        {/* Body Card */}
        {data.content && (
          <div className="article-body-card">
            {renderContent(data.content)}
          </div>
        )}

        {/* References */}
        {referenceList.length > 0 && (
          <div className="article-references">
            <h3><MdLink /> References &amp; Sources</h3>
            <ul>
              {referenceList.map((item, index) => {
                let displayUrl = item;
                try { displayUrl = new URL(item).hostname; } catch {}
                return (
                  <li key={index}>
                    <Link href={item} target="_blank" className="ref-link">
                      <MdLink /> {displayUrl}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
