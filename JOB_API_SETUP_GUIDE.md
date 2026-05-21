# Real Job API Integration Guide

## 🎯 Overview
This integration fetches **real job listings** from multiple job APIs instead of simulated data.

## 📦 APIs Integrated

### 1. **Adzuna API** (Requires Free API Key)
- **What**: Job search API with 1000 calls/month free
- **Coverage**: India, US, UK, and 20+ countries
- **Sign up**: https://developer.adzuna.com/
- **Steps**:
  1. Create account at https://developer.adzuna.com/signup
  2. Get your `app_id` and `app_key`
  3. Add them to `src/services/jobAPI.js`:
     ```javascript
     appId: 'YOUR_ADZUNA_APP_ID',
     appKey: 'YOUR_ADZUNA_APP_KEY',
     ```

### 2. **RemoteOK API** (No Auth Required)
- **What**: Remote job listings from major companies
- **Coverage**: Global remote positions
- **Rate Limit**: Be respectful, don't spam
- **Already configured** ✅

### 3. **Remotive API** (No Auth Required)
- **What**: Curated remote tech jobs
- **Coverage**: Global remote positions
- **Already configured** ✅

### 4. **LinkedIn Jobs** (Fallback)
- Generates direct search URLs when APIs fail
- No API key needed

### 5. **Naukri.com** (Fallback for India)
- Direct search URLs for Indian locations
- No API key needed

---

## 🚀 Setup Instructions

### Step 1: Install the Job API Service
The service file is already created at:
```
src/services/jobAPI.js
```

### Step 2: Get Adzuna API Credentials (Optional but Recommended)
1. Go to: https://developer.adzuna.com/signup
2. Create a free account
3. Create an application
4. Copy your `Application ID` and `Application Key`
5. Update `src/services/jobAPI.js`:
   ```javascript
   ADZUNA: {
     baseUrl: 'https://api.adzuna.com/v1/api/jobs',
     appId: 'YOUR_APP_ID_HERE',      // ← Paste your App ID
     appKey: 'YOUR_APP_KEY_HERE',    // ← Paste your App Key
     // ... rest stays same
   }
   ```

### Step 3: Update Study.jsx Component

#### Add the import at the top:
```javascript
import { fetchRealJobs, fetchJobsForMultipleRoles } from '../services/jobAPI';
```

#### Add state for loading indicator:
```javascript
const [jobsLoading, setJobsLoading] = useState(false);
```

#### Replace the `generateSimulatedJobs()` function with:
```javascript
const fetchLiveJobs = async () => {
  try {
    setJobsLoading(true);
    
    const allJobs = await fetchJobsForMultipleRoles(
      selectedRoles,
      activeSearchLoc,
      activeSearchMode,
      activeSearchExp
    );
    
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
    
    const newJob = formattedJobs.find(j => !j.isFallback);
    if (newJob) {
      setJobToast(newJob);
      setTimeout(() => setJobToast(null), 5000);
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`💼 New Job: ${newJob.title}`, {
            body: `${newJob.company} • ${newJob.location}`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3256/3256093.png'
          });
        } catch(err) { console.error("Web Push failed", err); }
      }
    }
  } catch (error) {
    console.error('Error fetching live jobs:', error);
    setJobsLoading(false);
  }
};
```

#### Replace the jobs useEffect:
```javascript
useEffect(() => {
  fetchLiveJobs();
  
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Refresh every 2 minutes (respect API rate limits)
  const interval = setInterval(() => {
    fetchLiveJobs();
  }, 120000);
  
  return () => clearInterval(interval);
}, [profileInfo, activeSearchLoc, activeSearchMode, activeSearchExp]);
```

#### Add manual refresh button in the job section UI:
```javascript
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <Calendar size={18} color="var(--blue)" />
    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
      💼 Live Job Matches
    </div>
  </div>
  <button 
    onClick={fetchLiveJobs} 
    disabled={jobsLoading}
    style={{ 
      padding: '4px 12px', 
      background: 'var(--accent)', 
      color: '#000', 
      border: 'none', 
      borderRadius: '8px', 
      fontSize: '10px', 
      fontWeight: 'bold', 
      cursor: jobsLoading ? 'not-allowed' : 'pointer',
      opacity: jobsLoading ? 0.5 : 1
    }}>
    {jobsLoading ? '⏳' : '🔄'} Refresh
  </button>
</div>
```

#### Update the job cards to show loading state:
```javascript
{jobsLoading ? (
  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
    <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 10px' }}></div>
    <div style={{ fontSize: '12px' }}>Scanning job boards...</div>
  </div>
) : jobs.length === 0 ? (
  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)', fontSize: '12px' }}>
    No jobs found. Try adjusting your search criteria.
  </div>
) : (
  jobs.map(job => (
    // ... existing job card JSX
  ))
)}
```

---

## 🧪 Testing

### Test with Browser Console:
```javascript
// Open browser console and test the API
import { fetchRealJobs } from './services/jobAPI';

// Test single role
const jobs = await fetchRealJobs('React Developer', 'Bangalore', 'Remote');
console.log(jobs);

// Test multiple roles
import { fetchJobsForMultipleRoles } from './services/jobAPI';
const allJobs = await fetchJobsForMultipleRoles(
  ['React Developer', 'Frontend Developer'], 
  'Chennai', 
  'Hybrid'
);
console.log(allJobs);
```

---

## 📊 Features

✅ **Real-time job listings** from multiple sources  
✅ **Automatic fallback** to LinkedIn/Naukri if APIs fail  
✅ **Smart deduplication** removes duplicate listings  
✅ **Location awareness** (India-specific sources)  
✅ **Work mode filtering** (Remote/Hybrid/Office)  
✅ **Role matching** with fuzzy keyword search  
✅ **Salary display** when available  
✅ **Source attribution** (shows which API returned each job)  
✅ **Browser notifications** for new matches  
✅ **Rate limit friendly** (2-minute refresh instead of 25 seconds)  

---

## 🔧 Customization

### Add More Job APIs:

1. **Indeed API** (Paid): https://www.indeed.com/publisher
2. **GitHub Jobs** (Discontinued, but archives available)
3. **AngelList/Wellfound**: For startup jobs
4. **SimplyHired**: Aggregator API

Add them to `jobAPI.js` following the same pattern:
```javascript
const fetchFromNewAPI = async (role, location, workMode) => {
  // Your API call here
  return formattedJobs;
};

// Then add to Promise.all in fetchRealJobs()
```

### Change Refresh Interval:
In Study.jsx, update the interval:
```javascript
setInterval(() => {
  fetchLiveJobs();
}, 300000); // 5 minutes = 300000ms
```

---

## 🐛 Troubleshooting

### "No jobs found"
- Check your Adzuna API credentials
- Try broader role keywords ("Developer" instead of "Senior React Developer")
- Test with "Remote" location first

### "API rate limit exceeded"
- Increase refresh interval to 5+ minutes
- Use fewer role searches
- Adzuna free tier: 1000 calls/month

### CORS errors
- Some APIs may need a backend proxy
- Consider using a Vercel/Netlify function as proxy

### Jobs not refreshing
- Check browser console for errors
- Verify network tab shows API calls
- Test API endpoints directly in browser

---

## 🎉 Done!

Your app now fetches **real job listings** from live APIs! The fallback system ensures users always see relevant results even if APIs fail.

**Next Steps:**
- Add application tracking
- Save favorite jobs
- Email notifications for new matches
- Job alert scheduling
