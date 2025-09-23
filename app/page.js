"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AuthForm from "../components/AuthForm";
import WorkspaceSetup from "../components/WorkspaceSetup";
import ClientList from "../components/ClientList";
import PackageList from "../components/PackageList";
import RemindersPanel from "../components/RemindersPanel";
import ExportPanel from "../components/ExportPanel";
import { getDashboardStats } from "../lib/packageUtils";

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardStats, setDashboardStats] = useState({
    totalClients: 0,
    expired: 0,
    newThisMonth: 0,
  });

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Check if user has a profile/workspace
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*, organizations(*)")
          .eq("id", session.user.id)
          .single();

        setProfile(profileData);
      }

      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Check if user has a profile/workspace
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*, organizations!profiles_organization_id_fkey(*)")
          .eq("id", session.user.id)
          .single();

        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

  const fetchDashboardData = async () => {
    try {
      // Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", profile.organization_id);

      if (clientsError) throw clientsError;

      // Fetch client packages with related data
      const { data: clientPackages, error: packagesError } = await supabase
        .from("client_packages")
        .select(
          `
          *,
          clients:client_id (id, name),
          packages:package_id (id, name)
        `
        )
        .eq("clients.organization_id", profile.organization_id);

      if (packagesError) throw packagesError;

      // Calculate statistics
      const stats = getDashboardStats(clientPackages || [], clients || []);
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Fetch dashboard data when profile is available
  useEffect(() => {
    if (profile?.organization_id) {
      fetchDashboardData();
    }
  }, [profile]);

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

  // User is authenticated and has a workspace
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.organizations?.name || "Smart Client Manager"}
            </h1>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "clients"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Clients
            </button>
            <button
              onClick={() => setActiveTab("packages")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "packages"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Packages
            </button>
            <button
              onClick={() => setActiveTab("exports")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "exports"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Exports
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to {profile.organizations?.name}
              </h2>
              <p className="text-lg text-gray-600">
                Your client management dashboard is ready!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          C
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Clients
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardStats.totalClients}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          X
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Expired Packages
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardStats.expired}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          N
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          New This Month
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {dashboardStats.newThisMonth}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reminders Panel */}
              <div className="mt-8">
                <RemindersPanel organizationId={profile.organization_id} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "clients" && (
          <ClientList organizationId={profile.organization_id} />
        )}

        {activeTab === "packages" && (
          <PackageList organizationId={profile.organization_id} />
        )}

        {activeTab === "exports" && (
          <ExportPanel
            organizationId={profile.organization_id}
            organization={profile.organizations}
            dashboardStats={dashboardStats}
          />
        )}
      </div>
    </main>
  );
}
