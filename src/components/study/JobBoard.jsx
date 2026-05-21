import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, Briefcase, ExternalLink, MapPin } from 'lucide-react';
import { fetchRealJobs } from '../../services/jobAPI';

export default function JobBoard({ profileInfo }) {
  const selectedRoles = profileInfo?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'];
  const preferredLocs = profileInfo?.preferredLocations || ['Bangalore', 'Chennai', 'Remote'];
  const workModes = profileInfo?.workTypes || ['Remote', 'Hybrid'];
  const expLevel = profileInfo?.experienceLevel || 'Fresher';

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobToast, setJobToast] = useState(null);

  const profileInfoKey = JSON.stringify({
    roles: selectedRoles,
    locs: preferredLocs,
    types: workModes,
    exp: expLevel
  });

  useEffect(() => {
    let active = true;
    const scanJobs = async () => {
      setLoading(true);
      try {
        // Fetch jobs for the primary target role
        const primaryRole = selectedRoles[0] || 'React Developer';
        const primaryLoc = preferredLocs[0] || 'Remote';
        const primaryMode = workModes[0] || 'Remote';
        
        console.log(`Live Job Board scanning for: ${primaryRole} in ${primaryLoc}`);
        const realJobs = await fetchRealJobs(primaryRole, primaryLoc, primaryMode, expLevel);
        
        if (active) {
          // Normalize structure for presentation
          const normalized = realJobs.map(job => ({
            id: job.id,
            company: job.company,
            title: job.title,
            type: job.type || primaryRole.replace(/Developer|Engineer/i, '').trim(),
            ago: job.postedDate || 'Recently',
            color: job.color || '#4D9FFF',
            link: job.url,
            location: job.location || primaryLoc,
            source: job.source || 'Jobs Portal',
            isFallback: job.isFallback || false
          }));
          setJobs(normalized);
        }
      } catch (err) {
        console.error('Error scanning live jobs:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    scanJobs();
    
    // Simulate periodic job matches discovery for push alerts simulation
    const interval = setInterval(() => {
      if (jobs.length > 0 && Math.random() > 0.7) {
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
        setJobToast(randomJob);
        // Auto dismiss toast after 6s
        setTimeout(() => setJobToast(null), 6000);
      }
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [profileInfoKey]);

  return (
    <div style={{ margin: '0 20px 24px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={18} color="var(--blue)" />
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
            💼 Live Job Search Matches
          </div>
        </div>
        <span className="live-badge" style={{ 
          fontSize: '9px', 
          padding: '3px 8px', 
          background: loading ? 'rgba(77, 159, 255, 0.1)' : 'rgba(52, 211, 153, 0.1)', 
          color: loading ? '#4D9FFF' : '#34D399', 
          borderRadius: '10px', 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          letterSpacing: '0.5px', 
          border: loading ? '1px solid rgba(77, 159, 255, 0.2)' : '1px solid rgba(52, 211, 153, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {loading && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />}
          {loading ? 'Scanning API...' : 'Live Scanner'}
        </span>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '16px' }}>
        Scanning real-time API integrations (RemoteOK, Remotive, Adzuna) for open positions matching: <strong style={{ color: 'var(--text2)' }}>{selectedRoles[0] || 'developer'}</strong> in <strong style={{ color: 'var(--text2)' }}>{preferredLocs.join('/')}</strong>.
      </div>

      {loading && jobs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px' }}>
          <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1.2s linear infinite' }} />
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Scanning portals for live positions...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {jobs.map(job => (
            <a key={job.id} href={job.link} target="_blank" rel="noopener noreferrer" className="job-card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '14px', textDecoration: 'none', transition: 'all 0.2s', outline: 'none' }}>
              <div style={{ flex: 1, marginRight: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', background: `rgba(255,255,255,0.05)`, color: job.color, borderRadius: '6px', border: `1px solid ${job.color}33` }}>
                    {job.type}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)' }}>{job.company}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text3)', background: 'rgba(255,255,255,0.02)', padding: '1px 5px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <MapPin size={8} /> {job.location}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {job.title}
                  {job.isFallback && <ExternalLink size={11} color="var(--text3)" />}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 600 }}>{job.ago}</span>
                <span style={{ 
                  fontSize: '9px', 
                  color: job.isFallback ? 'var(--orange)' : 'var(--accent)', 
                  fontWeight: 'bold', 
                  background: job.isFallback ? 'rgba(251, 146, 60, 0.1)' : 'rgba(200, 241, 53, 0.1)', 
                  padding: '2px 8px', 
                  borderRadius: '6px',
                  border: job.isFallback ? '1px solid rgba(251, 146, 60, 0.2)' : '1px solid rgba(200, 241, 53, 0.2)'
                }}>
                  {job.isFallback ? 'Search' : 'Apply ➔'}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {jobToast && (
        <div style={{ position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: '380px', background: 'rgba(17,17,17,0.95)', border: '1px solid var(--accent)', borderRadius: '16px', padding: '16px', zIndex: 300, display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 8px 32px rgba(200,241,53,0.15)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '40px', height: '40px', background: 'rgba(200,241,53,0.1)', color: 'var(--accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>💼</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase' }}>New Job Discovered!</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{jobToast.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>at {jobToast.company} • Matching profile</div>
          </div>
          <a href={jobToast.link} target="_blank" rel="noopener noreferrer" onClick={() => setJobToast(null)}
            style={{ padding: '6px 12px', background: 'var(--accent)', color: '#000', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none' }}>
            Apply
          </a>
        </div>
      )}
    </div>
  );
}
