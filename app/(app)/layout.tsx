import { getServerSupabase } from "@/lib/supabase/server";
import UserBadge from "@/components/UserBadge";
import SetPasswordModal from "@/components/SetPasswordModal";
import ProfileEditor from "@/components/ProfileEditor";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  const needsPassword = !Boolean(data.user?.user_metadata?.password_set);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <nav>
          <ul>
            <li><a href="#search">search</a></li>
            <li><a href="#dms">dms</a></li>
            <li><a href="#profile">profile</a></li>
            <li><a href="#top">top</a></li>
            <li><a href="#manifesto">manifesto</a></li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <UserBadge email={email} />
        </div>
      </aside>
      <main className="main">
        <div className="main-actions">
          <button className="bell-btn" aria-label="notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 3a6 6 0 00-6 6v2.586l-.707.707A1 1 0 006 14h12a1 1 0 00.707-1.707L18 11.586V9a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <path d="M9.5 18a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <section id="search" />
        <section id="dms" />
        <section id="profile" />
        <section id="top" />
        <section id="manifesto" />
        {children}
        <div className="manifesto-content">
          <p className="manifesto-text">5 seconds that&apos;s all it takes to find anyone</p>
        </div>
        <div className="profile-content">
          <div className="profile-wrap">
            <ProfileEditor />
          </div>
        </div>
      </main>
      {needsPassword && <SetPasswordModal />}
    </div>
  );
}


