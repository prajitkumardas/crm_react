"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AuthForm from "../components/AuthForm";
import WorkspaceSetup from "../components/WorkspaceSetup";
import Layout from "../components/Layout";
import Dashboard from "../components/Dashboard";
import ClientList from "../components/ClientList";
import ClientProfile from "../components/ClientProfile";
import PackageList from "../components/PackageList";
import RemindersPanel from "../components/RemindersPanel";
import Analytics from "../components/Analytics";
import Settings from "../components/Settings";
import { getDashboardStats } from "../lib/packageUtils";

export default function Home() {
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

  const handleViewClient = (client) => {
    setSelectedClient(client);
  };


  const handleCloseClientProfile = () => {
    setSelectedClient(null);
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
    <Layout
      profile={profile}
      onSignOut={handleSignOut}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
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
    </Layout>
  );
}
