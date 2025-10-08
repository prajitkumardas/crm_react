"use client";

import { useState, useEffect, useMemo, memo, useCallback, Suspense, lazy } from "react";
import { supabase } from "../lib/supabase";

// Lazy load components for better performance
const AuthForm = lazy(() => import("../components/AuthForm"));
const WorkspaceSetup = lazy(() => import("../components/WorkspaceSetup"));
const Layout = lazy(() => import("../components/Layout"));
const Dashboard = lazy(() => import("../components/Dashboard"));
const ClientList = lazy(() => import("../components/ClientList"));
const ClientProfile = lazy(() => import("../components/ClientProfile"));
const PackageList = lazy(() => import("../components/PackageList"));
const RemindersPanel = lazy(() => import("../components/RemindersPanel"));
const Analytics = lazy(() => import("../components/Analytics"));
const Settings = lazy(() => import("../components/Settings"));
const HelpSection = lazy(() => import("../components/HelpSection"));
import { getDashboardStats } from "../lib/packageUtils";

// Loading component
function PageLoader({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// Error boundary component
function ErrorFallback({ error, resetError }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={resetError}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

const Home = memo(function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalClients: 0,
    expired: 0,
    newThisMonth: 0,
  });
  const [sessionExpired, setSessionExpired] = useState(false);
  const [navigating, setNavigating] = useState(false);

  // Improved session check function with timeout and better error handling
  const checkSession = async (retryCount = 0) => {
    if (sessionExpired) {
      return false;
    }

    // If no user, assume session is invalid but don't block navigation
    if (!user) {
      return true; // Allow navigation, let auth state change handle it
    }

    try {
      // Add timeout to session check
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session check timeout')), 1500)
      );

      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);

      if (error) {
        console.warn('Session check error:', error.message);
        // Don't set session as expired for timeout errors, just return true to allow navigation
        if (error.message !== 'Session check timeout' && retryCount < 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return checkSession(retryCount + 1);
        }
        return true; // Allow navigation even if session check fails
      }

      if (!session) {
        console.log('No active session found');
        // Don't immediately expire session, let auth state change handle it
        return true; // Allow navigation
      }

      // Check if token is close to expiry (within 2 minutes)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt && (expiresAt - now) < 120) {
        console.log('Token expiring soon, attempting refresh');
        try {
          const refreshPromise = supabase.auth.refreshSession();
          const refreshTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Refresh timeout')), 1000)
          );

          const { data: refreshData, error: refreshError } = await Promise.race([refreshPromise, refreshTimeout])
            .catch(error => {
              console.warn('Token refresh timed out:', error.message);
              return { data: null, error: error };
            });

          if (refreshError || !refreshData?.session) {
            console.warn('Token refresh failed, but allowing navigation');
            return true; // Allow navigation even if refresh fails
          }
          console.log('Token refreshed successfully');
        } catch (refreshError) {
          console.warn('Token refresh failed, but allowing navigation');
          return true; // Allow navigation
        }
      }

      return true;
    } catch (error) {
      console.warn('Session check failed:', error.message);
      return true; // Allow navigation even on failure
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          // Check if user has a profile/workspace
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*, organizations(*)")
            .eq("id", session.user.id)
            .single();

          if (mounted) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Session fetch error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes with error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);

      if (!mounted) return;

      // Handle session expiration
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
        setSessionExpired(false);
      } else if (event === 'SIGNED_OUT' || (!session && user)) {
        console.log('Session expired or user signed out');
        setSessionExpired(true);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          // Check if user has a profile/workspace
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*, organizations!profiles_organization_id_fkey(*)")
            .eq("id", session.user.id)
            .single();

          if (mounted) {
            setProfile(profileData);
            setSessionExpired(false);
          }
        } catch (error) {
          console.error('Profile fetch error:', error);
          if (mounted) {
            setProfile(null);
          }
        }
      } else {
        if (mounted) {
          setProfile(null);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    });


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = (user) => {
    setUser(user);
  };

  const handleWorkspaceCreated = async (organization) => {
    console.log("Workspace created:", organization);
    // Refetch profile data instead of reloading
    try {
      // First check if profile exists
      const { data: existingProfiles, error: checkError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id);

      console.log("Existing profiles check:", existingProfiles, checkError);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*, organizations!profiles_organization_id_fkey(*)")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("User ID:", user.id);
        // Try without .single() to see what we get
        const { data: allProfiles, error: allError } = await supabase
          .from("profiles")
          .select("*, organizations!profiles_organization_id_fkey(*)")
          .eq("id", user.id);
        console.log("All profiles query result:", allProfiles, allError);
        return;
      }

      console.log("Refetched profile:", profileData);
      setProfile(profileData);
    } catch (error) {
      console.error("Error refetching profile:", error);
      // Fallback to reload if refetch fails
      window.location.reload();
    }
  };


  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSessionRefresh = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      setSessionExpired(false);
      console.log('Session refreshed manually');
    } catch (error) {
      console.error('Manual session refresh failed:', error);
      // Force sign out if refresh fails
      await handleSignOut();
    }
  };

  // Memoized handlers for better performance
  const handleViewClient = useMemo(() => (client) => {
    setSelectedClient(client);
  }, []);

  const handleCloseClientProfile = useMemo(() => () => {
    setSelectedClient(null);
  }, []);

  const handleTabChange = useMemo(() => async (tab) => {
    if (navigating) {
      console.log('Navigation already in progress, ignoring');
      return;
    }

    console.log('Navigating to tab:', tab);

    // Handle help tab like other tabs
    // No special handling needed - it will navigate normally

    setNavigating(true);

    // Set a timeout for navigation to prevent getting stuck
    const navigationTimeout = setTimeout(() => {
      console.log('Navigation timeout reached, forcing completion');
      setNavigating(false);
      setActiveTab(tab); // Allow navigation even if session check fails
    }, 3000); // 3 second timeout

    try {
      // Check session with timeout
      const sessionCheckPromise = checkSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session check timeout')), 2000)
      );

      const sessionValid = await Promise.race([sessionCheckPromise, timeoutPromise])
        .catch(error => {
          console.warn('Session check failed or timed out:', error.message);
          return true; // Allow navigation if session check fails
        });

      clearTimeout(navigationTimeout);

      if (!sessionValid) {
        console.log('Session expired, but allowing navigation');
        // Still allow navigation, but user will see session expired screen
      }

      setActiveTab(tab);
    } catch (error) {
      console.error('Navigation failed:', error);
      // Still allow navigation on error
      setActiveTab(tab);
    } finally {
      clearTimeout(navigationTimeout);
      setNavigating(false);
    }
  }, [checkSession, navigating]);

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.organization_id) return;

    try {
      // Fetch clients and client packages in parallel
      const [clientsResult, packagesResult] = await Promise.all([
        supabase
          .from("clients")
          .select("*")
          .eq("organization_id", profile.organization_id),
        supabase
          .from("client_packages")
          .select(
            `
            *,
            clients:client_id (id, name),
            packages:package_id (id, name)
          `
          )
          .eq("clients.organization_id", profile.organization_id)
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (packagesResult.error) throw packagesResult.error;

      // Calculate statistics
      const stats = getDashboardStats(packagesResult.data || [], clientsResult.data || []);
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, [profile?.organization_id]);

  // Fetch dashboard data when profile is available
  useEffect(() => {
    if (profile?.organization_id) {
      fetchDashboardData();
    }
  }, [profile?.organization_id, fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (!profile || !profile.organization_id) {
    return (
      <WorkspaceSetup user={user} onWorkspaceCreated={handleWorkspaceCreated} />
    );
  }

  // Show session expired banner
  if (sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Session Expired</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your session has expired due to inactivity. Please refresh your session to continue.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSessionRefresh}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Session
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }


  // User is authenticated and has a workspace
  return (
    <Suspense fallback={<PageLoader message="Loading application..." />}>
      <Layout
        profile={profile}
        onSignOut={handleSignOut}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navigating={navigating}
      >
        <Suspense fallback={<PageLoader message="Loading page..." />}>
          {activeTab === "dashboard" && (
            <Dashboard organizationId={profile.organization_id} />
          )}

          {activeTab === "clients" && (
            <div className="p-6">
              <ClientList
                organizationId={profile.organization_id}
                onClientSelect={handleViewClient}
              />
            </div>
          )}

          {selectedClient && (
            <ClientProfile
              clientId={selectedClient.id}
              organizationId={profile.organization_id}
              onClose={handleCloseClientProfile}
            />
          )}

          {activeTab === "plans" && (
            <div className="p-6">
              <PackageList organizationId={profile.organization_id} />
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h2>
                <p className="text-gray-600">Attendance tracking feature coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="p-6">
              <Analytics organizationId={profile.organization_id} />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-6">
              <Settings
                profile={profile}
                organization={profile.organizations}
                onUpdate={() => window.location.reload()}
              />
            </div>
          )}

          {activeTab === "help" && (
            <div className="p-6">
              <HelpSection
                isOpen={true}
                onClose={() => {}}
              />
            </div>
          )}
        </Suspense>
      </Layout>
    </Suspense>
  );
});

export default Home;
