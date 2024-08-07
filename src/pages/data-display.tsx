import { useState, useEffect } from "react";
import styles from "../styles/Dashboard.module.css";
import Wordcloud from "../components/wordcloud";

interface ExtractedData {
  dates: { date: string; description: string }[];
  monetary_values: { amount: string; description: string }[];
  citations: { law_title: string; description: string }[];
  wordcloud: string[];
}

const DataDisplay = () => {
  const [data, setData] = useState<ExtractedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState("");

  const fetchData = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/getData?id=${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch data");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching data"
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (documentId) {
      console.log("Submitting document ID:", documentId);
      fetchData(documentId);
    }
  };

  const renderTable = (items: any[], headers: string[]) => (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={styles.tableHeader}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className={styles.tableRow}>
              {Object.values(item).map((value: any, cellIndex) => (
                <td key={cellIndex} className={styles.tableCell}>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Document Data Extractor</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          placeholder="Enter Document ID (e.g., doc_1)"
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Fetch Data
        </button>
      </form>

      {isLoading && <div className={styles.loadingSpinner}>Loading...</div>}
      {error && <div className={styles.error}>Error: {error}</div>}

      {data && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Extracted Data</h2>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Wordcloud</h3>
            {data.wordcloud && data.wordcloud.length > 0 ? (
              <div className={styles.wordcloudWrapper}>
                <Wordcloud words={data.wordcloud} />
              </div>
            ) : (
              <p className={styles.noDataMessage}>
                No wordcloud data available
              </p>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dates</h3>
            {data.dates.length > 0 ? (
              renderTable(data.dates, ["Date", "Description"])
            ) : (
              <p className={styles.noDataMessage}>No dates found</p>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Monetary Values</h3>
            {data.monetary_values.length > 0 ? (
              renderTable(data.monetary_values, ["Amount", "Description"])
            ) : (
              <p className={styles.noDataMessage}>No monetary values found</p>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Citations</h3>
            {data.citations.length > 0 ? (
              renderTable(data.citations, ["Law Title", "Description"])
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
