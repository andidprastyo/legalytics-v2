import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';
import Wordcloud from '../components/wordcloud';

interface ExtractedData {
  dates: { date: string; description: string }[];
  monetary_values: { amount: string; description: string }[];
  citations: { law_title: string; description: string }[];
  wordcloud: string[];
}

interface CombinedResults {
  [filename: string]: ExtractedData;
}

const DataDisplay = () => {
  const [data, setData] = useState<CombinedResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/extractPdf');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
        setActiveTab(Object.keys(result)[0]);
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <div className={styles.loadingSpinner}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!data) return <div className={styles.noData}>No data available</div>;

  const renderTable = (items: any[], headers: string[]) => (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={styles.tableHeader}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className={styles.tableRow}>
              {Object.values(item).map((value: any, cellIndex) => (
                <td key={cellIndex} className={styles.tableCell}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Extracted Data</h1>

      <div className={styles.tabContainer}>
        {Object.keys(data).map((filename) => (
          <button
            key={filename}
            className={`${styles.tabButton} ${activeTab === filename ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(filename)}
          >
            {filename}
          </button>
        ))}
      </div>

      {activeTab && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{activeTab}</h2>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Wordcloud</h3>
            {data[activeTab].wordcloud && data[activeTab].wordcloud.length > 0 ? (
              <div className={styles.wordcloudWrapper}>
                <Wordcloud words={data[activeTab].wordcloud} />
              </div>
            ) : (
              <p className={styles.noDataMessage}>No wordcloud data available</p>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dates</h3>
            {data[activeTab].dates.length > 0 ? (
              renderTable(data[activeTab].dates, ['Date', 'Description'])
            ) : (
              <p className={styles.noDataMessage}>No dates found</p>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Monetary Values</h3>
            {data[activeTab].monetary_values.length > 0 ? (
              renderTable(data[activeTab].monetary_values, ['Amount', 'Description'])
            ) : (
              <p className={styles.noDataMessage}>No monetary values found</p>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Citations</h3>
            {data[activeTab].citations.length > 0 ? (
              renderTable(data[activeTab].citations, ['Law Title', 'Description'])
            ) : (
              <p className={styles.noDataMessage}>No citations found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDisplay;