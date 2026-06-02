import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import JobBoard from './JobBoard';
import { DEFAULT_SUBJECTS, monthKey, dateKey } from './utils/studyMath';
import { AiCoach } from './AiCoach';
import { StudyAnalytics } from './StudyAnalytics';
import { StudyHistory } from './StudyHistory';
import { StudyLog } from './StudyLog';

export default function Study({ STUDY = {}, syncStudy, STUDY_SETTINGS, isReport, activeRange: propRange, profileInfo }) {
  const now = new Date();
  
  const subjects = STUDY_SETTINGS?.subjects?.length ? STUDY_SETTINGS.subjects : DEFAULT_SUBJECTS;
  const dailyTarget = Number(STUDY_SETTINGS?.dailyTarget || 4);

  const [activeRange, setActiveRange] = useState(propRange || 'Weekly');
  const [selectedMonth, setSelectedMonth] = useState(monthKey(now));
  const [activeSpace, setActiveSpace] = useState('learning');

  useEffect(() => {
    if (propRange) setActiveRange(propRange);
  }, [propRange]);

  return (
    <div id="study-content" style={{ padding: '0 0 20px' }}>
      
      {/* PrepHub Study Card Banner */}
      {!isReport && (
        <div 
          className="scroll-reveal" 
          style={{
            margin: '0 20px 24px',
            padding: '24px 20px',
            borderRadius: 'var(--radius)',
            backgroundImage: 'linear-gradient(to right, rgba(18, 18, 20, 0.95) 45%, rgba(18, 18, 20, 0.45) 100%), url(https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
            PrepHub Career Accelerator
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>Learning Space</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Log study hours, track mock coding interviews, and review target role jobs.</div>
        </div>
      )}

      {/* Sleek Sub-space Switcher */}
      {!isReport && (
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg3)', 
            borderRadius: '16px', 
            padding: '4px', 
            border: '1px solid var(--border2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <button 
              onClick={() => setActiveSpace('learning')}
              style={{ 
                flex: 1, 
                padding: '10px', 
                borderRadius: '12px', 
                border: 'none', 
                background: activeSpace === 'learning' ? 'var(--accent)' : 'transparent',
                color: activeSpace === 'learning' ? '#000' : 'var(--text2)',
                fontWeight: 700, 
                fontSize: '12px', 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                transition: 'all 0.2s ease-in-out' 
              }}
            >
              <BookOpen size={15} /> Learning Space
            </button>
            <button 
              onClick={() => setActiveSpace('interview')}
              style={{ 
                flex: 1, 
                padding: '10px', 
                borderRadius: '12px', 
                border: 'none', 
                background: activeSpace === 'interview' ? 'var(--accent)' : 'transparent',
                color: activeSpace === 'interview' ? '#000' : 'var(--text2)',
                fontWeight: 700, 
                fontSize: '12px', 
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                transition: 'all 0.2s ease-in-out' 
              }}
            >
              <Sparkles size={15} /> Interview Prep
            </button>
          </div>
        </div>
      )}

      {/* 📖 LEARNING SPACE */}
      {(activeSpace === 'learning' || isReport) && (
        <>
          <StudyAnalytics 
            STUDY={STUDY}
            activeRange={activeRange}
            setActiveRange={setActiveRange}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            subjects={subjects}
            dailyTarget={dailyTarget}
            isReport={isReport}
          />
          
          {!isReport && (
            <StudyLog 
              STUDY={STUDY}
              syncStudy={syncStudy}
              subjects={subjects}
            />
          )}

          <StudyHistory 
            STUDY={STUDY}
            syncStudy={syncStudy}
            subjects={subjects}
            dailyTarget={dailyTarget}
            activeRange={activeRange}
            selectedMonth={selectedMonth}
          />
        </>
      )}

      {/* 💼 INTERVIEW PREP & JOBS */}
      {(activeSpace === 'interview' && !isReport) && (
        <>
          <AiCoach profileInfo={profileInfo} />
          <JobBoard profileInfo={profileInfo} />
        </>
      )}

      <div style={{ height: '40px' }} />
    </div>
  );
}
