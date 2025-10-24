import { getServerSupabase } from "@/lib/supabase/server";
import UserBadge from "@/components/UserBadge";
import SetPasswordModal from "@/components/SetPasswordModal";
import ProfileEditor from "@/components/ProfileEditor";
import NotificationsBell from "@/components/NotificationsBell";
import DmsThread from "@/components/DmsThread";
import DmsList from "@/components/DmsList";

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
      <div className="dms-pane">
        <DmsList />
      </div>
      <main className="main">
        <div className="main-actions">
          <NotificationsBell />
        </div>
        <section id="search" />
        <section id="dms" />
        <div id="profile" className="profile-content">
          <div className="profile-wrap">
            <ProfileEditor />
          </div>
        </div>
        
        <section id="top" />
        <section id="manifesto" />
        {children}
        <DmsThread />
        <div className="manifesto-content">
          <p className="manifesto-text">5 seconds that&apos;s all it takes to find anyone</p>
        </div>
      </main>
      {needsPassword && <SetPasswordModal />}
    </div>
  );
}


