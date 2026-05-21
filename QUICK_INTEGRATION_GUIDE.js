/**
 * QUICK INTEGRATION: Copy these code blocks into Study.jsx
 * 
 * This replaces simulated jobs with real API job fetching
 */

// ============================================
// 1. ADD THIS IMPORT AT THE TOP OF Study.jsx
// ============================================
import { fetchJobsForMultipleRoles } from '../services/jobAPI';


// ============================================
// 2. ADD THIS STATE (around line 130, with other useState)
// ============================================
const [jobsLoading, setJobsLoading] = useState(false);


// ============================================
// 3. REPLACE generateSimulatedJobs() function WITH THIS:
// ============================================
const fetchLiveJobs = async () => {
  try {
    setJobsLoading(true);
    
    // Fetch real jobs from APIs
    const allJobs = await fetchJobsForMultipleRoles(
      selectedRoles,
      activeSearchLoc,
      activeSearchMode,
      activeSearchExp
    );
    
    // Format for display
    const formattedJobs = allJobs.slice(0, 5).map((job) => ({
      id: job.id,
      company: job.company,
      title: job.title,
      type: job.type,
      location: job.location,
      ago: job.postedDate,
      color: job.color,
      link: job.url,
      salary: job.salary,
      source: job.source,
      isFallback: job.isFallback,
      description: job.description
    }));
    
    setJobs(formattedJobs);
    setJobsLoading(false);
    
    // Show toast notification for first real job
    const newJob = formattedJobs.find(j => !j.isFallback);
    if (newJob) {
      setJobToast(newJob);
      setTimeout(() => setJobToast(null), 5000);
      
      // Browser push notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`💼 New Job Match: ${newJob.title}`, {
            body: `${newJob.company} • ${newJob.location}${newJob.salary ? ' • ' + newJob.salary : ''}`,
            icon: '/favicon.svg'
          });
        } catch(err) { 
          console.error("Browser notification failed", err); 
        }
      }
    }
    
  } catch (error) {
    console.error('Error fetching live jobs:', error);
    setJobsLoading(false);
    
    // Show fallback message
    setJobs([{
      id: 'error-fallback',
      title: 'Unable to load jobs',
      company: 'Try refreshing',
      location: activeSearchLoc,
      type: 'Error',
      ago: 'Now',
      color: '#F472B6',
      link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(selectedRoles[0])}`,
      isFallback: true
    }]);
  }
};


// ============================================
// 4. REPLACE THE JOBS useEffect (around line 150-180) WITH THIS:
// ============================================
useEffect(() => {
  // Initial fetch on mount
  fetchLiveJobs();
  
  // Request notification permission
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Auto-refresh every 2 minutes (respects API rate limits)
  const interval = setInterval(() => {
    fetchLiveJobs();
  }, 120000); // 120000ms = 2 minutes
  
  return () => clearInterval(interval);
}, [profileInfo, activeSearchLoc, activeSearchMode, activeSearchExp]);


// ============================================
// 5. UPDATE THE JOB SECTION HEADER (around line 580) TO ADD REFRESH BUTTON:
// ============================================
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Calendar size={18} color="var(--blue)" />
    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
      💼 Live Job Matches ({preferredLocs.join(', ')})
    </div>
  </div>
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    {jobsLoading && (
      <span style={{ fontSize: '10px', color: 'var(--accent)' }}>Scanning...</span>
    )}
    <button 
      onClick={fetchLiveJobs} 
      disabled={jobsLoading}
      style={{ 
        padding: '6px 12px', 
        background: jobsLoading ? 'var(--bg3)' : 'var(--accent)', 
        color: jobsLoading ? 'var(--text3)' : '#000', 
        border: 'none', 
        borderRadius: '8px', 
        fontSize: '10px', 
        fontWeight: 'bold', 
        cursor: jobsLoading ? 'not-allowed' : 'pointer',
        opacity: jobsLoading ? 0.6 : 1,
        transition: 'all 0.2s'
      }}>
      {jobsLoading ? '⏳ Loading' : '🔄 Refresh'}
    </button>
  </div>
</div>


// ============================================
// 6. UPDATE JOB CARDS SECTION (around line 595) TO SHOW LOADING STATE:
// ============================================
<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
  {jobsLoading ? (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px 20px', 
      background: 'var(--bg3)', 
      borderRadius: '14px',
      border: '1px solid var(--border2)'
    }}>
      <div className="spinner" style={{ 
        width: '24px', 
        height: '24px', 
        margin: '0 auto 12px',
        border: '2px solid rgba(255,255,255,0.1)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}></div>
      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
        Scanning RemoteOK, Remotive, and Adzuna...
      </div>
    </div>
  ) : jobs.length === 0 ? (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px 20px', 
      background: 'var(--bg3)', 
      borderRadius: '14px',
      border: '1px dashed var(--border2)',
      color: 'var(--text3)' 
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
      <div style={{ fontSize: '13px', fontWeight: 600 }}>No jobs found</div>
      <div style={{ fontSize: '11px', marginTop: '4px' }}>
        Try adjusting your target roles or location
      </div>
    </div>
  ) : (
    jobs.map(job => (
      <a 
        key={job.id} 
        href={job.link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="job-card"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '14px 16px', 
          background: 'var(--bg3)', 
          border: `1px solid ${job.isFallback ? 'var(--border2)' : job.color}33`, 
          borderRadius: '14px', 
          textDecoration: 'none', 
          transition: 'all 0.2s',
          borderLeft: `3px solid ${job.color}`
        }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ 
              fontSize: '9px', 
              fontWeight: 'bold', 
              padding: '2px 8px', 
              background: `${job.color}15`, 
              color: job.color, 
              borderRadius: '6px', 
              border: `1px solid ${job.color}33`,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {job.type}
            </span>
            <span style={{ 
              fontSize: '8px', 
              color: 'var(--text3)',
              background: 'rgba(255,255,255,0.03)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {job.source}
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
            {job.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
            {job.company} • {job.location}
            {job.salary && <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>• {job.salary}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{job.ago}</span>
          <span style={{ 
            fontSize: '10px', 
            color: job.isFallback ? 'var(--blue)' : 'var(--accent)', 
            fontWeight: 'bold',
            padding: '4px 8px',
            background: job.isFallback ? 'rgba(77, 159, 255, 0.1)' : 'rgba(200, 241, 53, 0.1)',
            borderRadius: '6px'
          }}>
            {job.isFallback ? 'Search ➔' : 'Apply ➔'}
          </span>
        </div>
      </a>
    ))
  )}
</div>


// ============================================
// 7. ADD THIS CSS TO index.css or App.css FOR SPINNER ANIMATION:
// ============================================
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.job-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}


// ============================================
// THAT'S IT! 🎉
// ============================================

/**
 * TESTING CHECKLIST:
 * 
 * ✅ Import jobAPI service at top
 * ✅ Add jobsLoading state
 * ✅ Replace generateSimulatedJobs with fetchLiveJobs
 * ✅ Update useEffect for jobs
 * ✅ Add refresh button to UI
 * ✅ Update job cards with loading states
 * ✅ Add spinner CSS animation
 * 
 * OPTIONAL: Get Adzuna API key for more results
 * Sign up: https://developer.adzuna.com/
 */
