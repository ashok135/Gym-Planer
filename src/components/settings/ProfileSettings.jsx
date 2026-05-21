import React, { useState, useEffect } from 'react';
import Accordion from '../shared/Accordion';

const getJobSuggestions = (input) => {
  const clean = input.trim();
  if (!clean) {
    return [
      'React Developer', 'WordPress Developer', 'Frontend Developer', 
      'Fullstack Developer', 'Node.js Developer', 'Django Developer', 
      'UI/UX Designer', 'Mobile App Developer'
    ];
  }
  const lower = clean.toLowerCase();
  if (lower.startsWith('re') || lower.includes('react')) {
    return ['React Developer', 'React Engineer', 'React Frontend Developer', 'React Native Developer', 'React.js Specialist', 'Senior React Developer', 'Fullstack React Developer'];
  }
  if (lower.startsWith('wo') || lower.includes('word') || lower.includes('wp')) {
    return ['WordPress Developer', 'WordPress Plugin Developer', 'WordPress Theme Developer', 'WordPress Web Designer', 'WordPress Elementor Specialist', 'WordPress WooCommerce Developer', 'WordPress Theme Architect'];
  }
  if (lower.startsWith('fr') || lower.includes('front')) {
    return ['Frontend Developer', 'Frontend Engineer', 'Frontend React Developer', 'Frontend UI Developer', 'Senior Frontend Engineer'];
  }
  if (lower.startsWith('py') || lower.includes('python') || lower.includes('dj')) {
    return ['Python Developer', 'Django Developer', 'Python Django Engineer', 'Python Backend Developer', 'Python Data Scientist'];
  }
  if (lower.startsWith('no') || lower.includes('node')) {
    return ['Node.js Developer', 'Node.js Backend Developer', 'Fullstack Node.js Developer', 'Node.js Software Engineer'];
  }
  if (lower.startsWith('ph') || lower.includes('php') || lower.includes('lar')) {
    return ['PHP Developer', 'Laravel Developer', 'PHP Laravel Developer', 'Fullstack PHP Developer', 'Laravel Web Developer'];
  }
  if (lower.startsWith('ui') || lower.includes('ux') || lower.includes('des')) {
    return ['UI/UX Designer', 'User Interface Designer', 'User Experience Designer', 'Web Designer', 'Product Designer'];
  }
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return [
    `${capitalized} Developer`,
    `${capitalized} Engineer`,
    `Senior ${capitalized} Developer`,
    `Junior ${capitalized} Developer`,
    `${capitalized} Consultant`,
    `Fullstack ${capitalized} Developer`,
    `${capitalized} Technical Specialist`
  ];
};

const getCitySuggestions = (input) => {
  const clean = input.trim();
  if (!clean) {
    return ['Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Noida', 'Remote'];
  }
  const lower = clean.toLowerCase();
  const list = ['Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Delhi', 'Noida', 'Gurgaon', 'Kolkata', 'San Francisco', 'New York', 'London', 'Remote'];
  return list.filter(item => item.toLowerCase().includes(lower));
};

export default function ProfileSettings({ profileInfo, syncProfileInfo }) {
  const [profileName, setProfileName] = useState(profileInfo?.name || '');
  const [profileResume, setProfileResume] = useState(profileInfo?.resume || '');
  const [targetRoles, setTargetRoles] = useState(profileInfo?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer']);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [preferredLocations, setPreferredLocations] = useState(profileInfo?.preferredLocations || ['Bangalore', 'Chennai', 'Remote']);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [workTypes, setWorkTypes] = useState(profileInfo?.workTypes || ['Remote', 'Hybrid']);
  const [experienceLevel, setExperienceLevel] = useState(profileInfo?.experienceLevel || 'Fresher');
  const [profileMsg, setProfileMsg] = useState(false);
  const [roleFocused, setRoleFocused] = useState(false);
  const [locFocused, setLocFocused] = useState(false);

  useEffect(() => {
    setProfileName(profileInfo?.name || '');
    setProfileResume(profileInfo?.resume || '');
    setTargetRoles(profileInfo?.targetRoles || ['React Developer', 'WordPress Developer', 'Frontend Developer']);
    setPreferredLocations(profileInfo?.preferredLocations || ['Bangalore', 'Chennai', 'Remote']);
    setWorkTypes(profileInfo?.workTypes || ['Remote', 'Hybrid']);
    setExperienceLevel(profileInfo?.experienceLevel || 'Fresher');
  }, [profileInfo]);

  return (
    <Accordion title="👤 Profile &amp; Resume Details" subtitle="Set your name and professional background for Lucy">
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Your Name / Nickname</div>
        <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g. Ashok"
          style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Resume / Profile Summary</div>
        <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '6px' }}>
          Paste your skills, experience, education, or achievements. Lucy will read this to customize your interview prep!
        </div>
        <textarea value={profileResume} onChange={e => setProfileResume(e.target.value)} placeholder="e.g. JavaScript, React, Node.js developer with 2 years of experience. Education: B.Tech in CSE..."
          style={{ width: '100%', height: '120px', padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
      </div>

      {/* Preferred Locations Input & Tags */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Preferred Job Locations (Cities / Remote)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {preferredLocations.map(loc => (
            <div key={loc}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', background: 'rgba(77, 159, 255, 0.1)', color: '#4D9FFF', border: '1px solid rgba(77, 159, 255, 0.3)', fontWeight: 700 }}>
              <span>📍 {loc}</span>
              <span onClick={() => {
                if (preferredLocations.length > 1) {
                  setPreferredLocations(preferredLocations.filter(l => l !== loc));
                }
              }} style={{ cursor: 'pointer', color: 'var(--red)', fontSize: '14px', marginLeft: '4px', fontWeight: 'bold' }}>×</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type="text" placeholder="Add location (e.g. Hyderabad, Chennai)" value={newLocationInput} 
              onChange={e => setNewLocationInput(e.target.value)}
              onFocus={() => setLocFocused(true)}
              onBlur={() => setTimeout(() => setLocFocused(false), 200)}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
            {locFocused && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '120px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                {getCitySuggestions(newLocationInput).map(item => (
                  <div key={item} onMouseDown={() => {
                    setNewLocationInput(item);
                    setLocFocused(false);
                  }}
                    style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text2)', cursor: 'pointer', borderBottom: '1px solid var(--border2)', background: 'transparent', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}>
                    📍 {item}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => {
            if (newLocationInput.trim() && !preferredLocations.includes(newLocationInput.trim())) {
              setPreferredLocations([...preferredLocations, newLocationInput.trim()]);
              setNewLocationInput('');
            }
          }}
            style={{ padding: '8px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', height: '37px' }}>
            + Add
          </button>
        </div>
      </div>

      {/* Work Type Checkbox Selector */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Preferred Work Modes</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'Remote', label: '🏠 Remote' },
            { id: 'Hybrid', label: '🤝 Hybrid' },
            { id: 'On-site', label: '🏢 On-site (Office)' }
          ].map(mode => {
            const isSelected = workTypes.includes(mode.id);
            return (
              <div key={mode.id} onClick={() => {
                if (isSelected) {
                  if (workTypes.length > 1) {
                    setWorkTypes(workTypes.filter(t => t !== mode.id));
                  }
                } else {
                  setWorkTypes([...workTypes, mode.id]);
                }
              }}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', textAlign: 'center', cursor: 'pointer', background: isSelected ? 'var(--accent)' : 'var(--bg3)', color: isSelected ? '#000' : 'var(--text2)', border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: 700, transition: 'all 0.2s' }}>
                {mode.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Experience Level Selector */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Experience Level</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'Fresher', label: '🎓 Fresher' },
            { id: '1-2 Years', label: '⚡ 1 to 2 Years' },
            { id: '3+ Years', label: '🚀 3+ Years' }
          ].map(level => {
            const isSelected = experienceLevel === level.id;
            return (
              <div key={level.id} onClick={() => setExperienceLevel(level.id)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12px', textAlign: 'center', cursor: 'pointer', background: isSelected ? 'var(--accent)' : 'var(--bg3)', color: isSelected ? '#000' : 'var(--text2)', border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border2)'}`, fontWeight: 700, transition: 'all 0.2s' }}>
                {level.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Target Roles Tag Box */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Target Job Roles</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          {targetRoles.map(role => (
            <div key={role}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', background: 'rgba(200, 241, 53, 0.1)', color: 'var(--accent)', border: '1px solid rgba(200, 241, 53, 0.3)', fontWeight: 700 }}>
              <span>⚛️ {role}</span>
              <span onClick={() => {
                if (targetRoles.length > 1) {
                  setTargetRoles(targetRoles.filter(r => r !== role));
                }
              }} style={{ cursor: 'pointer', color: 'var(--red)', fontSize: '14px', marginLeft: '4px', fontWeight: 'bold' }}>×</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type="text" placeholder="Add custom role (e.g. Node Developer)" value={newRoleInput} 
              onChange={e => setNewRoleInput(e.target.value)}
              onFocus={() => setRoleFocused(true)}
              onBlur={() => setTimeout(() => setRoleFocused(false), 200)}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', boxSizing: 'border-box' }} />
            {roleFocused && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '120px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                {getJobSuggestions(newRoleInput).map(item => (
                  <div key={item} onMouseDown={() => {
                    setNewRoleInput(item);
                    setRoleFocused(false);
                  }}
                    style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text2)', cursor: 'pointer', borderBottom: '1px solid var(--border2)', background: 'transparent', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}>
                    🔍 {item}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => {
            if (newRoleInput.trim() && !targetRoles.includes(newRoleInput.trim())) {
              setTargetRoles([...targetRoles, newRoleInput.trim()]);
              setNewRoleInput('');
            }
          }}
            style={{ padding: '8px 14px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', height: '37px' }}>
            + Add
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', width: '100%' }}>
        <button className="settings-save" onClick={async () => {
          if (syncProfileInfo) {
            await syncProfileInfo({ 
              name: profileName.trim(), 
              resume: profileResume.trim(),
              targetRoles,
              preferredLocations,
              workTypes,
              experienceLevel
            });
            setProfileMsg(true);
            setTimeout(() => setProfileMsg(false), 2000);
          }
        }} style={{
          flex: 1,
          background: profileMsg ? '#10B981' : 'var(--accent)',
          color: profileMsg ? '#fff' : '#000',
          boxShadow: profileMsg ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: 'bold'
        }}>
          {profileMsg ? 'Saved ✓' : 'Save Profile'}
        </button>
      </div>
    </Accordion>
  );
}
