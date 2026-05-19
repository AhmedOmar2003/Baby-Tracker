
import ArticleCard from './articleCard';
import './articlesSection.css';
import article1 from '../../assets/images/article/1.jpg';
import article2 from '../../assets/images/article/2.jpg';
import article3 from '../../assets/images/article/3.jpg';
import article4 from '../../assets/images/article/4.jpg';

const articles = [
  {
    title: 'Articles about side effects',
    imageSrc: article1,
    link: '/articles',
  },
  {
    title: 'Recommended medications',
    imageSrc: article2,
    link: '/medicine',
  },
  {
    title: 'General articles about Vaccination',
    imageSrc: article3,
    link: '/vaccines',
  },
  {
    title: 'Advice before and after vaccination',
    imageSrc: article4,
    link: '/vaccines',
  },
];

const ArticlesSection = () => {
  return (
    <div className="articlesSection">
      <div className="container">
        <section>
          <div className="page-heading">
            <h2>Articles</h2>
            <p>Discover advice and recommendations for your child's health.</p>
          </div>
          <div className="cards-grid">
            {articles.map((article, index) => (
              <ArticleCard
                key={index}
                title={article.title}
                imageSrc={article.imageSrc}
                link={article.link}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ArticlesSection;
