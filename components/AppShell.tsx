"use client";

import { useState, useEffect } from "react";
import UserBadge from "@/components/UserBadge";

type Props = {
  email: string | null;
  children: React.ReactNode;
};

export default function AppShell({ email, children }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close menu when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {!isMobileMenuOpen && (
        <button 
          className="mobile-menu-trigger"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}
      
      {isMobileMenuOpen && (
        <div className="mobile-overlay mobile-overlay-visible" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <button 
          className={`menu-toggle-btn`}
          onClick={() => {
            if (window.innerWidth <= 768) {
              setIsMobileMenuOpen(!isMobileMenuOpen);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        
        <button 
          className="mobile-close-btn" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="sidebar-header">
          <div 
            className={`blue-square-container ${isCollapsed ? 'clickable' : ''}`}
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
              }
            }}
          >
            <span className="blue-square"></span>
          </div>
        </div>
        <nav>
          <ul>
            <li>
              <a href="#search" onClick={() => setIsMobileMenuOpen(false)} data-tooltip="search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <span className="nav-text">search</span>
              </a>
            </li>
            <li>
              <a href="#dms" onClick={() => setIsMobileMenuOpen(false)} data-tooltip="dms">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="nav-text">dms</span>
              </a>
            </li>
            <li>
              <a href="#profile" onClick={() => setIsMobileMenuOpen(false)} data-tooltip="profile">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="nav-text">profile</span>
              </a>
            </li>
            <li>
              <a href="#top" onClick={() => setIsMobileMenuOpen(false)} data-tooltip="top">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                <span className="nav-text">top</span>
              </a>
            </li>
            <li>
              <a href="#manifesto" onClick={() => setIsMobileMenuOpen(false)} data-tooltip="manifesto">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span className="nav-text">manifesto</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <UserBadge email={email} />
        </div>
      </aside>
      
      {children}
    </>
  );
}


