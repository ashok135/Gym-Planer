import React from 'react';

const tabBackgrounds = {
  today: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
  diet: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop',
  budget: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
  study: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop',
  report: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
  settings: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop'
};

export default function AppBackground({ activeTab }) {
  return (
    <div 
      className="ambient-bg-container"
      style={{
        backgroundImage: `url(${tabBackgrounds[activeTab] || tabBackgrounds.today})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.5s ease-in-out'
      }}
    >
      <video 
        className="ambient-video" 
        src="https://cdn.pixabay.com/video/2021/04/12/70860-536965158_large.mp4" 
        loop 
        muted 
        playsInline 
        autoPlay 
      />
      <div className="ambient-overlay"></div>
    </div>
  );
}
