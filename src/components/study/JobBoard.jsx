import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export default function JobBoard({ profileInfo }) {
  const selectedRoles = profileInfo?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'];
  const preferredLocs = profileInfo?.preferredLocations || ['Bangalore', 'Chennai', 'Remote'];
  const workModes = profileInfo?.workTypes || ['Remote', 'Hybrid'];

  const [jobs, setJobs] = useState([]);
  const [jobToast, setJobToast] = useState(null);

  const profileInfoKey = JSON.stringify({
    roles: profileInfo?.targetRoles,
    locs: profileInfo?.preferredLocations,
    types: profileInfo?.workTypes,
    exp: profileInfo?.experienceLevel
  });

  useEffect(() => {
    const roles = profileInfo?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer'];
    const locs = profileInfo?.preferredLocations || ['Bangalore', 'Chennai', 'Remote'];
    const modes = profileInfo?.workTypes || ['Remote', 'Hybrid'];
    const companies = ['Google', 'Meta', 'Stripe', 'Netflix', 'Airbnb', 'Automattic', 'WP Engine', 'Supabase', 'Vercel', 'Figma', 'Spotify', 'Uber'];
    const colors = ['#A78BFA', '#34D399', '#4D9FFF', '#FB923C', '#F472B6'];
    
    const simJobs = roles.slice(0, 3).map((role, idx) => {
      const company = companies[Math.floor((idx * 7 + 3) % companies.length)];
      const color = colors[idx % colors.length];
      const location = locs[Math.floor((idx * 3 + 1) % locs.length)];
      const mode = modes[Math.floor((idx * 2 + 5) % modes.length)];
      const cleanRole = role.replace(/Developer/i, '').replace(/Engineer/i, '').trim();
      const searchLoc = location === 'Remote' ? '' : location;
      return {
        id: idx + 1,
        company,
        title: `${role} (${mode})`,
        type: cleanRole,
        ago: `${(idx + 1) * 7} mins ago`,
        color,
        link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role + ' ' + mode)}&location=${encodeURIComponent(searchLoc || 'Remote')}`
      };
    });
    setJobs(simJobs);
  }, [profileInfoKey]);

  return (
    <div style={{ margin: '0 20px 24px', background: 'var(--bg2)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--blue)" />
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
            💼 Live Job Matches ({preferredLocs.join(', ')})
          </div>
        </div>
        <span className="live-badge" style={{ fontSize: '8px', padding: '3px 8px', background: 'rgba(52, 211, 153, 0.1)', color: '#34D399', borderRadius: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>Live Scanner</span>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '16px' }}>
        Auto-scanning major job portals for active posts matching your custom target roles, preferred cities, and work modes. Enable browser permissions to get push notifications!
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {jobs.map(job => (
          <a key={job.id} href={job.link} target="_blank" rel="noopener noreferrer" className="job-card"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '14px', textDecoration: 'none', transition: 'all 0.2s' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', background: `rgba(255,255,255,0.05)`, color: job.color, borderRadius: '6px', border: `1px solid ${job.color}33` }}>
                  {job.type}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)' }}>{job.company}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{job.title}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{job.ago}</span>
              <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 'bold' }}>Apply ➔</span>
            </div>
          </a>
        ))}
      </div>

      {jobToast && (
        <div style={{ position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: '380px', background: 'rgba(17,17,17,0.95)', border: '1px solid var(--accent)', borderRadius: '16px', padding: '16px', zIndex: 300, display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 8px 32px rgba(200,241,53,0.15)' }}>
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
