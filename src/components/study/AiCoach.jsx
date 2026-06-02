import React, { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

export const AiCoach = ({ profileInfo }) => {
  // AI Study Companion States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState(null);

  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState(null);

  const startMockInterview = async () => {
    setAiLoading(true);
    setAiContent(null);
    setInterviewFeedback(null);
    setUserAnswer('');
    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_api_key') : localStorage.getItem('openrouter_api_key');
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-2.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');

      if (!apiKey) throw new Error('No API Key');

      const targetRolesStr = profileInfo?.targetRoles?.join(', ') || 'Frontend Developer';
      const resumeStr = profileInfo?.resume || 'Student ready to work';

      const prompt = `Act as an expert technical interviewer for roles: ${targetRolesStr}.
Candidate Resume: ${resumeStr}.

Generate a single challenging technical interview question tailored to the candidate's target roles and experience.
Be direct and ask only the question. Avoid greetings or conversational filler. Ask about specific technical concepts, patterns, architecture, coding tradeoffs, or performance optimizations.`;

      let resultText = '';
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await res.json();
        resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        resultText = data?.choices?.[0]?.message?.content || '';
      }

      setInterviewQuestion(resultText.trim());
      setAiContent({ type: 'interview' });
    } catch(e) {
      console.error(e);
      setAiContent({
        type: 'error',
        text: '⚠️ Make sure you have configured a valid API Key in the AI Coach settings first!'
      });
    }
    setAiLoading(false);
  };

  const evaluateAnswer = async () => {
    if (!userAnswer.trim()) return;
    setInterviewLoading(true);
    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_api_key') : localStorage.getItem('openrouter_api_key');
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-2.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');

      if (!apiKey) throw new Error('No API Key');

      const prompt = `Evaluate this candidate's technical interview answer.
Question: ${interviewQuestion}
Candidate's Answer: ${userAnswer}

Provide a detailed evaluation in this strict JSON format:
{
  "grade": "A|B|C|D|F",
  "score": "Out of 100",
  "strengths": "What they explained well...",
  "weaknesses": "What concepts or keywords they missed or got wrong...",
  "modelAnswer": "How a perfect senior engineer would answer this question...",
  "critique": "A brief encouraging mentoring note..."
}`;

      let resultText = '';
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await res.json();
        resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        resultText = data?.choices?.[0]?.message?.content || '';
      }

      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setInterviewFeedback(parsed);
    } catch(e) {
      console.error(e);
      alert('Failed to evaluate answer. Make sure response is standard JSON. Please try again!');
    }
    setInterviewLoading(false);
  };

  const generateQuiz = async () => {
    setAiLoading(true);
    setAiContent(null);
    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_api_key') : localStorage.getItem('openrouter_api_key');
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-2.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');
      
      if (!apiKey) throw new Error('No API Key');

      let profileText = '';
      try {
        const prof = JSON.parse(localStorage.getItem('gprofileInfo'));
        if (prof) profileText = `for a student named ${prof.name || 'User'} who has resume: ${prof.resume || ''}`;
      } catch(e) {}

      const prompt = `Generate a single challenging multiple choice quiz question about advanced JavaScript or React ${profileText}. 
Return the output strictly in the following JSON format:
{
  "question": "The question text...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Option A", 
  "explanation": "Detailed explanation of why this answer is correct..."
}`;

      let resultText = '';
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await res.json();
        resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        resultText = data?.choices?.[0]?.message?.content || '';
      }

      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setAiContent({
        type: 'quiz',
        question: parsed.question,
        options: parsed.options,
        answer: parsed.answer,
        explanation: parsed.explanation,
        selectedOption: null,
        showExplanation: false
      });
    } catch(e) {
      console.error(e);
      setAiContent({
        type: 'error',
        text: '⚠️ Make sure you have configured a valid API Key in the AI Coach settings first!'
      });
    }
    setAiLoading(false);
  };

  const generateTip = async () => {
    setAiLoading(true);
    setAiContent(null);
    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      const apiKey = provider === 'gemini' ? localStorage.getItem('gemini_api_key') : localStorage.getItem('openrouter_api_key');
      const model = provider === 'gemini' ? (localStorage.getItem('ai_model') || 'gemini-2.5-flash') : (localStorage.getItem('openrouter_model') || 'openrouter/free');

      if (!apiKey) throw new Error('No API Key');

      let profileText = '';
      try {
        const prof = JSON.parse(localStorage.getItem('gprofileInfo'));
        if (prof) profileText = `Customize it for a candidate named ${prof.name || 'User'} with resume details: ${prof.resume || ''}`;
      } catch(e) {}

      const prompt = `Give a single highly practical and unique interview preparation tip for JavaScript or React developers. ${profileText} Keep it encouraging and direct. Speak as a career mentor. Try to make it feel fresh and highly actionable. Max 4 sentences.`;

      let resultText = '';
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await res.json();
        resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        resultText = data?.choices?.[0]?.message?.content || '';
      }

      setAiContent({
        type: 'tip',
        text: resultText.trim()
      });
    } catch(e) {
      console.error(e);
      setAiContent({
        type: 'error',
        text: '⚠️ Make sure you have configured a valid API Key in the AI Coach settings first!'
      });
    }
    setAiLoading(false);
  };

  return (
    <div style={{ margin: '0 20px 24px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <BookOpen size={18} color="var(--accent)" />
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>🧠 AI Study Companion</div>
      </div>
      
      <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '16px' }}>
        Generate custom quizzes, get expert tips, or start an AI Mock Interview tailored to your resume!
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={generateQuiz} disabled={aiLoading}
          style={{ flex: 1, minWidth: '100px', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--accent)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', outline: 'none' }}>
          ⚡ JS/React Quiz
        </button>
        <button onClick={generateTip} disabled={aiLoading}
          style={{ flex: 1, minWidth: '100px', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--accent)', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', outline: 'none' }}>
          🤝 Interview Tip
        </button>
        <button onClick={startMockInterview} disabled={aiLoading || interviewLoading}
          style={{ flex: 1, minWidth: '120px', padding: '10px 12px', background: 'var(--accent)', border: 'none', borderRadius: '12px', color: '#000', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', outline: 'none' }}>
          🎯 Mock Interview
        </button>
      </div>

      {(aiLoading || interviewLoading) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '10px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}></div>
          <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Consulting Lucy...</div>
        </div>
      )}

      {aiContent && aiContent.type === 'interview' && (
        <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '16px', border: '1px solid var(--border2)' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>💬 Question from Lucy</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px', lineHeight: 1.4 }}>
            {interviewQuestion}
          </div>

          {!interviewFeedback ? (
            <>
              <textarea placeholder="Type your detailed answer here... (explain concepts, mention keywords, discuss trade-offs)" value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)} rows={4}
                style={{ width: '100%', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '12px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', marginBottom: '12px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={evaluateAnswer} disabled={!userAnswer.trim() || interviewLoading}
                style={{ width: '100%', padding: '12px', background: 'var(--accent)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', fontSize: '13px', cursor: userAnswer.trim() ? 'pointer' : 'not-allowed', opacity: userAnswer.trim() ? 1 : 0.6 }}>
                Submit Answer & Get Grade
              </button>
            </>
          ) : (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900 }}>
                  {interviewFeedback.grade}
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Evaluation Score</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{interviewFeedback.score}%</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                <div style={{ color: '#34D399', fontWeight: 700, marginBottom: '4px' }}>🟢 Strengths:</div>
                <p style={{ color: 'var(--text2)', margin: '0 0 10px 0' }}>{interviewFeedback.strengths}</p>

                <div style={{ color: '#F472B6', fontWeight: 700, marginBottom: '4px' }}>🔴 Areas to Improve:</div>
                <p style={{ color: 'var(--text2)', margin: '0 0 10px 0' }}>{interviewFeedback.weaknesses}</p>

                <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>💡 Model Answer:</div>
                <p style={{ color: 'var(--text2)', margin: '0 0 12px 0', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid var(--accent)', fontStyle: 'italic' }}>
                  {interviewFeedback.modelAnswer}
                </p>

                <div style={{ color: 'var(--text3)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                  👩‍🏫 <strong>Lucy's Mentoring Note:</strong> {interviewFeedback.critique}
                </div>
              </div>

              <button onClick={startMockInterview}
                style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '10px', color: 'var(--text)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                🔄 Try Another Question
              </button>
            </div>
          )}
        </div>
      )}

      {aiContent && aiContent.type === 'quiz' && (
        <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '16px', border: '1px solid var(--border2)' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>❓ {aiContent.question}</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {aiContent.options.map((opt, idx) => {
              const isSelected = aiContent.selectedOption === opt;
              const isAnswer = opt === aiContent.answer;
              const showCorrect = aiContent.selectedOption !== null && isAnswer;
              const showWrong = isSelected && !isAnswer;

              let optBg = 'var(--bg)';
              let optBorder = 'var(--border2)';
              let optColor = 'var(--text)';

              if (isSelected) {
                optBg = 'rgba(200, 241, 53, 0.1)';
                optBorder = 'var(--accent)';
              }
              if (aiContent.selectedOption !== null) {
                if (isAnswer) {
                  optBg = 'rgba(52, 211, 153, 0.15)';
                  optBorder = '#34D399';
                  optColor = '#34D399';
                } else if (isSelected) {
                  optBg = 'rgba(244, 114, 182, 0.15)';
                  optBorder = '#F472B6';
                  optColor = '#F472B6';
                }
              }

              return (
                <button key={idx} disabled={aiContent.selectedOption !== null}
                  onClick={() => setAiContent(prev => ({ ...prev, selectedOption: opt, showExplanation: true }))}
                  style={{ width: '100%', padding: '10px 14px', background: optBg, border: `1px solid ${optBorder}`, borderRadius: '10px', color: optColor, fontSize: '12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontWeight: isSelected ? 'bold' : 'normal', outline: 'none' }}>
                  {opt} {showCorrect && ' ✓'} {showWrong && ' ✗'}
                </button>
              );
            })}
          </div>

          {aiContent.showExplanation && (
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
              💡 <strong>Explanation:</strong> {aiContent.explanation}
            </div>
          )}
        </div>
      )}

      {aiContent && aiContent.type === 'tip' && (
        <div style={{ padding: '16px', background: 'var(--bg3)', borderRadius: '16px', border: '1px solid var(--border2)', borderLeft: '4px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={14} color="var(--accent)" />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase' }}>Expert Interview Prep Tip</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
            {aiContent.text}
          </div>
        </div>
      )}

      {aiContent && aiContent.type === 'error' && (
        <div style={{ padding: '12px', background: 'rgba(244,114,182,0.1)', border: '1px solid #F472B6', borderRadius: '12px', fontSize: '12px', color: '#F472B6' }}>
          {aiContent.text}
        </div>
      )}
    </div>
  );
};
