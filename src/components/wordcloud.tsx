// Wordcloud.tsx
import React from 'react';
import ReactWordcloud, { Word, Options } from 'react-wordcloud';
import styles from '../styles/Dashboard.module.css';

interface WordcloudProps {
  words: string[];
}

const Wordcloud: React.FC<WordcloudProps> = ({ words }) => {
  // Convert the array of words to the format expected by react-wordcloud
  const wordcloudData: Word[] = words.map(word => ({ text: word, value: Math.floor(Math.random() * 100) + 1 }));

  const options: Options = {
    rotations: 2,
    rotationAngles: [-90, 0],
    fontSizes: [12, 60],
    fontFamily: 'Arial',
    fontWeight: 'bold',
    padding: 5,
    scale: 'sqrt' as const,
    spiral: 'archimedean',
    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
    deterministic: false,
    enableOptimizations: true,
    enableTooltip: true,
    fontStyle: 'normal',
    svgAttributes: { role: 'img', 'aria-label': 'Wordcloud' },
    textAttributes: { 'font-family': 'Arial, sans-serif' },
    tooltipOptions: {
      placement: 'top',
      trigger: 'hover',
    },
    transitionDuration: 300
  };

  return (
    <div className={styles.wordcloudContainer}>
      <ReactWordcloud words={wordcloudData} options={options} />
    </div>
  );
};

export default Wordcloud;