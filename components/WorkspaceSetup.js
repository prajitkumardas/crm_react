'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function WorkspaceSetup({ user, onWorkspaceCreated }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      let profileData = existingProfile

      if (!existingProfile) {
        // Create user profile if it doesn't exist
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              full_name: user.user_metadata?.full_name || name,
              role: 'admin',
            },
          ])
          .select()
          .single()

        if (profileError) throw profileError
        profileData = newProfile
      }

      // Check if user already has an organization
      if (profileData.organization_id) {
        // User already has a workspace, just refresh
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single()

        if (onWorkspaceCreated) {
          onWorkspaceCreated(orgData)
        }
        return
      }

      // Create organization with owner_id
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name,
            owner_id: profileData.id,
          },
        ])
        .select()
        .single()

      if (orgError) throw orgError

      // Update profile with organization_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ organization_id: orgData.id })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw updateError
      }

      console.log('Profile updated with organization_id:', orgData.id)

      if (onWorkspaceCreated) {
        onWorkspaceCreated(orgData)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set up your workspace
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your organization to get started with Smart Client Manager
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div>
              <input
                id="workspace-name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Organization Name (e.g., FitLife Gym)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating workspace...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}