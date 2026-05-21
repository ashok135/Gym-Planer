/**
 * Real Job API Integration Service
 * Fetches live job postings from multiple sources
 */

// API Configuration
const API_SOURCES = {
  // Adzuna - Free API with 1000 calls/month
  ADZUNA: {
    baseUrl: 'https://api.adzuna.com/v1/api/jobs',
    appId: '454edbff', // Configured successfully!
    appKey: '18b4fdf776f113705de906d23ad8b5ba',
    countries: {
      India: 'in',
      US: 'us',
      UK: 'gb',
      Remote: 'us'
    }
  },
  
  // RemoteOK - No auth required for basic usage
  REMOTEOK: {
    baseUrl: 'https://corsproxy.io/?https://remoteok.com/api',
  },
  
  // GitHub Jobs Alternative - Remotive API
  REMOTIVE: {
    baseUrl: 'https://corsproxy.io/?https://remotive.com/api/remote-jobs',
  }
};

/**
 * Normalize location to country code
 */
const normalizeLocation = (location) => {
  const locationMap = {
    'bangalore': 'in',
    'bengaluru': 'in', 
    'chennai': 'in',
    'hyderabad': 'in',
    'mumbai': 'in',
    'pune': 'in',
    'delhi': 'in',
    'noida': 'in',
    'gurgaon': 'in',
    'india': 'in',
    'remote': 'remote',
    'usa': 'us',
    'united states': 'us',
    'uk': 'gb',
    'united kingdom': 'gb',
    'london': 'gb',
  };
  
  const lower = location.toLowerCase().trim();
  return locationMap[lower] || 'in';
};

/**
 * Normalize role/title for search
 */
const normalizeRole = (role) => {
  return role
    .replace(/developer|engineer|specialist|architect/gi, '')
    .trim()
    .toLowerCase();
};

/**
 * Fetch jobs from Adzuna API
 */
const fetchFromAdzuna = async (role, location, workMode) => {
  try {
    const country = normalizeLocation(location);
    const { appId, appKey } = API_SOURCES.ADZUNA;
    
    // Skip if credentials not configured
    if (appId.includes('YOUR_') || appKey.includes('YOUR_')) {
      console.log('Adzuna API not configured');
      return [];
    }

    const searchTerm = `${role} ${workMode}`.trim();
    const url = `${API_SOURCES.ADZUNA.baseUrl}/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(searchTerm)}&results_per_page=10`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Adzuna API failed');
    
    const data = await response.json();
    
    return (data.results || []).map(job => ({
      id: job.id || `adzuna-${Date.now()}-${Math.random()}`,
      title: job.title,
      company: job.company?.display_name || 'Company',
      location: job.location?.display_name || location,
      type: extractJobType(job.title),
      description: job.description?.substring(0, 200) || '',
      url: job.redirect_url,
      postedDate: job.created ? new Date(job.created).toLocaleDateString() : 'Recently',
      salary: job.salary_min ? `₹${formatSalary(job.salary_min)} - ₹${formatSalary(job.salary_max)}` : null,
      source: 'Adzuna',
      color: '#4D9FFF'
    }));
  } catch (error) {
    console.error('Adzuna fetch error:', error);
    return [];
  }
};

/**
 * Fetch jobs from RemoteOK API (Remote jobs only)
 */
const fetchFromRemoteOK = async (role, workMode) => {
  try {
    // Only fetch if looking for remote work
    if (!workMode.toLowerCase().includes('remote')) {
      return [];
    }

    const response = await fetch(API_SOURCES.REMOTEOK.baseUrl);
    
    if (!response.ok) throw new Error('RemoteOK API failed');
    
    const data = await response.json();
    
    // Filter by role keywords
    const keywords = normalizeRole(role).split(' ');
    const filtered = data
      .filter(job => job && job.position)
      .filter(job => {
        const title = job.position.toLowerCase();
        return keywords.some(kw => title.includes(kw));
      })
      .slice(0, 10);
    
    return filtered.map(job => ({
      id: job.id || `remoteok-${Date.now()}-${Math.random()}`,
      title: job.position,
      company: job.company || 'Remote Company',
      location: 'Remote',
      type: extractJobType(job.position),
      description: job.description?.substring(0, 200) || '',
      url: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
      postedDate: job.date ? new Date(job.date * 1000).toLocaleDateString() : 'Recently',
      salary: job.salary_min ? `$${formatSalary(job.salary_min)} - $${formatSalary(job.salary_max)}` : null,
      tags: job.tags || [],
      source: 'RemoteOK',
      color: '#34D399'
    }));
  } catch (error) {
    console.error('RemoteOK fetch error:', error);
    return [];
  }
};

/**
 * Fetch jobs from Remotive API
 */
const fetchFromRemotive = async (role, workMode) => {
  try {
    // Only for remote positions
    if (!workMode.toLowerCase().includes('remote')) {
      return [];
    }

    const category = mapRoleToCategory(role);
    const url = `${API_SOURCES.REMOTIVE.baseUrl}?category=${category}&limit=10`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Remotive API failed');
    
    const data = await response.json();
    
    // Filter by role keywords
    const keywords = normalizeRole(role).split(' ');
    const filtered = (data.jobs || [])
      .filter(job => {
        const title = job.title.toLowerCase();
        return keywords.some(kw => title.includes(kw));
      })
      .slice(0, 10);
    
    return filtered.map(job => ({
      id: job.id || `remotive-${Date.now()}-${Math.random()}`,
      title: job.title,
      company: job.company_name || 'Remote Company',
      location: 'Remote',
      type: extractJobType(job.title),
      description: job.description?.substring(0, 200) || '',
      url: job.url,
      postedDate: job.publication_date ? new Date(job.publication_date).toLocaleDateString() : 'Recently',
      salary: job.salary || null,
      tags: job.tags || [],
      source: 'Remotive',
      color: '#A78BFA'
    }));
  } catch (error) {
    console.error('Remotive fetch error:', error);
    return [];
  }
};

/**
 * Map role to Remotive category
 */
const mapRoleToCategory = (role) => {
  const lower = role.toLowerCase();
  if (lower.includes('frontend') || lower.includes('react') || lower.includes('vue')) return 'software-dev';
  if (lower.includes('backend') || lower.includes('node') || lower.includes('python')) return 'software-dev';
  if (lower.includes('fullstack') || lower.includes('full stack')) return 'software-dev';
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) return 'design';
  if (lower.includes('marketing')) return 'marketing';
  if (lower.includes('data')) return 'software-dev';
  return 'software-dev';
};

/**
 * Extract job type from title
 */
const extractJobType = (title) => {
  const lower = title.toLowerCase();
  if (lower.includes('react')) return 'React';
  if (lower.includes('wordpress') || lower.includes('wp')) return 'WordPress';
  if (lower.includes('frontend') || lower.includes('front-end')) return 'Frontend';
  if (lower.includes('backend') || lower.includes('back-end')) return 'Backend';
  if (lower.includes('fullstack') || lower.includes('full stack')) return 'Fullstack';
  if (lower.includes('node')) return 'Node.js';
  if (lower.includes('python')) return 'Python';
  if (lower.includes('java')) return 'Java';
  return 'Developer';
};

/**
 * Format salary for display
 */
const formatSalary = (amount) => {
  if (!amount) return '';
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toString();
};

/**
 * Generate LinkedIn search URL as fallback
 */
const generateLinkedInURL = (role, location, workMode) => {
  const keywords = `${role} ${workMode}`.trim();
  const loc = location === 'Remote' ? '' : location;
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(loc)}`;
};

/**
 * Generate Naukri.com search URL (India specific)
 */
const generateNaukriURL = (role, location) => {
  const country = normalizeLocation(location);
  if (country !== 'in') return null;
  
  return `https://www.naukri.com/${encodeURIComponent(role.toLowerCase().replace(/\s+/g, '-'))}-jobs-in-${encodeURIComponent(location.toLowerCase())}`;
};

/**
 * Main function: Fetch jobs from all sources
 */
export const fetchRealJobs = async (role, location = 'Remote', workMode = 'Remote', experienceLevel = 'Fresher') => {
  try {
    console.log(`Fetching jobs for: ${role} in ${location} (${workMode})`);
    
    // Fetch from all sources in parallel
    const [adzunaJobs, remoteOKJobs, remotiveJobs] = await Promise.all([
      fetchFromAdzuna(role, location, workMode),
      fetchFromRemoteOK(role, workMode),
      fetchFromRemotive(role, workMode)
    ]);
    
    // Combine all results
    let allJobs = [...adzunaJobs, ...remoteOKJobs, ...remotiveJobs];
    
    // If no results, create fallback job cards with direct search links
    if (allJobs.length === 0) {
      console.log('No API results, creating fallback links');
      allJobs = [
        {
          id: `fallback-linkedin-${Date.now()}`,
          title: `${role} Opportunities`,
          company: 'LinkedIn Jobs',
          location: location,
          type: extractJobType(role),
          description: `Search for ${role} positions on LinkedIn`,
          url: generateLinkedInURL(role, location, workMode),
          postedDate: 'Search Now',
          source: 'LinkedIn',
          color: '#0A66C2',
          isFallback: true
        }
      ];
      
      // Add Naukri for Indian locations
      if (normalizeLocation(location) === 'in') {
        const naukriUrl = generateNaukriURL(role, location);
        if (naukriUrl) {
          allJobs.push({
            id: `fallback-naukri-${Date.now()}`,
            title: `${role} Jobs in ${location}`,
            company: 'Naukri.com',
            location: location,
            type: extractJobType(role),
            description: `Browse ${role} openings on Naukri`,
            url: naukriUrl,
            postedDate: 'Search Now',
            source: 'Naukri',
            color: '#FF6B35',
            isFallback: true
          });
        }
      }
    }
    
    // Remove duplicates based on title + company
    const uniqueJobs = Array.from(
      new Map(
        allJobs.map(job => [`${job.title}-${job.company}`.toLowerCase(), job])
      ).values()
    );
    
    // Sort by date (most recent first)
    uniqueJobs.sort((a, b) => {
      if (a.isFallback && !b.isFallback) return 1;
      if (!a.isFallback && b.isFallback) return -1;
      return 0;
    });
    
    return uniqueJobs;
    
  } catch (error) {
    console.error('Error fetching real jobs:', error);
    
    // Return fallback on error
    return [
      {
        id: `error-fallback-${Date.now()}`,
        title: `${role} Opportunities`,
        company: 'Job Search',
        location: location,
        type: extractJobType(role),
        description: 'Unable to fetch jobs. Click to search manually.',
        url: generateLinkedInURL(role, location, workMode),
        postedDate: 'Search Now',
        source: 'Fallback',
        color: '#6B7280',
        isFallback: true
      }
    ];
  }
};

/**
 * Batch fetch jobs for multiple roles
 */
export const fetchJobsForMultipleRoles = async (roles, location, workMode, experienceLevel) => {
  try {
    const jobPromises = roles.slice(0, 3).map(role => 
      fetchRealJobs(role, location, workMode, experienceLevel)
    );
    
    const jobsArrays = await Promise.all(jobPromises);
    
    // Flatten and take top 5 from each
    const allJobs = jobsArrays.flat().slice(0, 15);
    
    return allJobs;
  } catch (error) {
    console.error('Error in batch fetch:', error);
    return [];
  }
};

export default {
  fetchRealJobs,
  fetchJobsForMultipleRoles
};
