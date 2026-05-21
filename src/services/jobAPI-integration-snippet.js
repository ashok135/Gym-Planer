// Add this import at the top of your Study.jsx file
import { fetchRealJobs, fetchJobsForMultipleRoles } from '../services/jobAPI';

// Replace the existing generateSimulatedJobs function and job fetching logic with this:

/**
 * Fetch real jobs using the API service
 */
const fetchLiveJobs = async () => {
  try {
    setJobsLoading(true);
    
    // Fetch jobs for all target roles
    const allJobs = await fetchJobsForMultipleRoles(
      selectedRoles,
      activeSearchLoc,
      activeSearchMode,
      activeSearchExp
    );
    
    // Format for display
    const formattedJobs = allJobs.slice(0, 5).map((job, idx) => ({
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
      isFallback: job.isFallback
    }));
    
    setJobs(formattedJobs);
    setJobsLoading(false);
    
    // Show notification for first non-fallback job
    const newJob = formattedJobs.find(j => !j.isFallback);
    if (newJob) {
      setJobToast(newJob);
      setTimeout(() => setJobToast(null), 5000);
      
      // Browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`💼 New Job: ${newJob.title}`, {
            body: `${newJob.company} • ${newJob.location}`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3256/3256093.png'
          });
        } catch(err) { 
          console.error("Web Push failed", err); 
        }
      }
    }
    
  } catch (error) {
    console.error('Error fetching live jobs:', error);
    setJobsLoading(false);
  }
};

// Update the useEffect that fetches jobs on component mount
useEffect(() => {
  // Initial fetch
  fetchLiveJobs();
  
  // Request notification permission
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Auto-refresh every 2 minutes (120000ms) instead of 25 seconds to respect API rate limits
  const interval = setInterval(() => {
    fetchLiveJobs();
  }, 120000);
  
  return () => clearInterval(interval);
}, [profileInfo, activeSearchLoc, activeSearchMode, activeSearchExp]);

// Add manual refresh button handler
const handleRefreshJobs = () => {
  fetchLiveJobs();
};
