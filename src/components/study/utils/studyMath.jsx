import React from 'react';
import { Brain, Code, Cpu, Award } from 'lucide-react';

export const DEFAULT_SUBJECTS = [
  { id: 'dsa',      label: 'DSA',             emoji: '🧠', color: '#A78BFA' },
  { id: 'js',       label: 'JavaScript',      emoji: '⚡', color: '#FBBF24' },
  { id: 'react',    label: 'React',           emoji: '⚛️',  color: '#4D9FFF' },
  { id: 'interview',label: 'Interview Prep', emoji: '🤝', color: '#34D399' },
];

export const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

export const renderSubjectIcon = (id, fallback, size = 16, style = {}) => {
  if (id === 'dsa') return <Brain size={size} style={{ verticalAlign: 'middle', ...style }} />;
  if (id === 'js') return <Code size={size} style={{ verticalAlign: 'middle', ...style }} />;
  if (id === 'react') return <Cpu size={size} style={{ verticalAlign: 'middle', ...style }} />;
  if (id === 'interview') return <Award size={size} style={{ verticalAlign: 'middle', ...style }} />;
  return <span style={{ fontSize: `${size}px`, verticalAlign: 'middle', ...style }}>{fallback}</span>;
};
