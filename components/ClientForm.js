'use client'

import { useState, useEffect } from 'react'
import { supabase, supabaseWithRetry } from '../lib/supabase'

export default function ClientForm({ client, organizationId, packages, onClose, onSave }) {
  // Function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return ''
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return Math.max(10, Math.min(80, age))
  }

  const [formData, setFormData] = useState(() => {
    if (client) {
      // Parse existing client data for editing
      const nameParts = client.name?.split(' ') || []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      return {
        firstName,
        lastName,
        gender: client.gender || '',
        dateOfBirth: client.date_of_birth || '',
        mobileNumber: client.phone || '',
        whatsappNumber: client.whatsapp_number || '',
        email: client.email || '',
        address: client.address || '',
        emergencyContactName: client.emergency_contact_name || '',
        emergencyNumber: client.emergency_contact_phone || '',
        category: '',
        planName: '',
        personalTrainer: false, // Not stored in DB
        startDate: new Date().toISOString().split('T')[0]
      }
    } else {
      return {
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        mobileNumber: '',
        whatsappNumber: '',
        email: '',
        address: '',
        emergencyContactName: '',
        emergencyNumber: '',
        category: '',
        planName: '',
        personalTrainer: false,
        startDate: new Date().toISOString().split('T')[0]
      }
    }
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Fetch client's package information when editing
  useEffect(() => {
    if (client) {
      const fetchClientPackage = async () => {
        try {
          const result = await supabaseWithRetry(() =>
            supabase
              .from('client_packages')
              .select(`
                *,
                packages:package_id (id, name, category)
              `)
              .eq('client_id', client.id)
              .eq('status', 'active')
              .single()
          );

          if (result.error && result.error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching client package:', result.error);
            return;
          }

          if (result.data && result.data.packages) {
            const pkg = result.data.packages;
            let category = '';
            let planName = '';

            if (pkg.category && pkg.category.includes(' - ')) {
              // Parse "Category - Type" format
              const [cat, type] = pkg.category.split(' - ');
              category = cat.trim();
              planName = pkg.name || type.trim();
            } else if (pkg.category) {
              // Use category as-is
              category = pkg.category.trim();
              planName = pkg.name || '';
            } else {
              // Fallback
              category = 'Uncategorized';
              planName = pkg.name || '';
            }

            setFormData(prev => ({
              ...prev,
              category,
              planName,
              startDate: result.data.start_date || prev.startDate
            }));
          }
        } catch (error) {
          console.error('Error fetching client package:', error);
        }
      };

      fetchClientPackage();
    }
  }, [client]);

  // Parse packages to get categories and plan names from existing packages
  const packageOptions = packages?.reduce((acc, pkg) => {
    // Skip packages without names
    if (!pkg.name || typeof pkg.name !== 'string') {
      return acc
    }

    let category = 'Uncategorized'
    let planName = pkg.name.trim()

    if (pkg.category && typeof pkg.category === 'string' && pkg.category.includes(' - ')) {
      // Parse "Category - Type" format
      const [cat, type] = pkg.category.split(' - ')
      category = cat.trim()
    } else if (pkg.category && typeof pkg.category === 'string') {
      // Use category as-is if it doesn't have the expected format
      category = pkg.category.trim()
    }

    // Add to categories if not already present
    if (!acc.categories.includes(category)) {
      acc.categories.push(category)
    }

    // Add to plan names for this category
    if (!acc.planNames[category]) {
      acc.planNames[category] = []
    }
    if (!acc.planNames[category].includes(planName)) {
      acc.planNames[category].push(planName)
    }

    // Store package reference
    acc.packages[`${category}-${planName}`] = pkg

    return acc
  }, { categories: [], planNames: {}, packages: {} }) || { categories: [], planNames: {}, packages: {} }

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      // Clear planName when category changes
      if (field === 'category') {
        newData.planName = ''
      }
      return newData
    })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Personal Information
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.gender) newErrors.gender = 'Gender is required'
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
    else {
      const calculatedAge = calculateAge(formData.dateOfBirth)
      if (calculatedAge < 10 || calculatedAge > 80) newErrors.dateOfBirth = 'Age calculated from date of birth must be between 10 and 80'
    }

    // Contact Information
    if (!formData.mobileNumber) newErrors.mobileNumber = 'Mobile number is required'
    else if (!/^\d{10}$/.test(formData.mobileNumber)) newErrors.mobileNumber = 'Mobile number must be 10 digits'
    if (formData.whatsappNumber && !/^\d{10}$/.test(formData.whatsappNumber)) newErrors.whatsappNumber = 'WhatsApp number must be 10 digits'
    if (!formData.address.trim()) newErrors.address = 'Address is required'

    // Emergency Contact
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required'
    if (!formData.emergencyNumber) newErrors.emergencyNumber = 'Emergency number is required'
    else if (!/^\d{10}$/.test(formData.emergencyNumber)) newErrors.emergencyNumber = 'Emergency number must be 10 digits'

    // Package validation
    if (packageOptions.categories.length > 0) {
      if (!formData.category) newErrors.category = 'Category is required'
      if (!formData.planName) newErrors.planName = 'Plan name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`

      if (client) {
        // Update client
        const { error } = await supabase
          .from('clients')
          .update({
            name: fullName,
            email: formData.email,
            phone: formData.mobileNumber,
            whatsapp_number: formData.whatsappNumber,
            address: formData.address,
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyNumber
          })
          .eq('id', client.id)

        if (error) throw error
      } else {
        // Create client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{
            name: fullName,
            email: formData.email,
            phone: formData.mobileNumber,
            whatsapp_number: formData.whatsappNumber,
            address: formData.address,
            date_of_birth: formData.dateOfBirth,
            gender: formData.gender,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyNumber,
            organization_id: organizationId
          }])
          .select()
          .single()

        if (clientError) throw clientError

        // Assign package if category and plan name are selected
        if (formData.category && formData.planName && newClient) {
          const selectedPackage = packageOptions.packages[`${formData.category}-${formData.planName}`]
          if (selectedPackage) {
            const startDate = new Date(formData.startDate)
            const endDate = new Date(startDate)
            endDate.setDate(startDate.getDate() + selectedPackage.duration_days)

            const { error: packageError } = await supabase
              .from('client_packages')
              .insert([{
                client_id: newClient.id,
                package_id: selectedPackage.id,
                start_date: formData.startDate,
                end_date: endDate.toISOString().split('T')[0]
              }])

            if (packageError) throw packageError
          }
        }
      }

      onSave()
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Error saving client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-secondary-900 bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">{client ? 'Edit Client' : 'Add New Client'}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.firstName ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="mt-1 text-sm text-danger-600">{errors.firstName}</p>}
              </div>
              <div>
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.lastName ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="mt-1 text-sm text-danger-600">{errors.lastName}</p>}
              </div>
              <div>
                <label className="form-label">Age</label>
                <div className="form-input bg-gray-50 text-gray-700 cursor-not-allowed">
                  {calculateAge(formData.dateOfBirth) || 'Select date of birth'}
                </div>
                <p className="mt-1 text-xs text-gray-500">Calculated automatically from date of birth</p>
              </div>
              <div>
                <label className="form-label">Gender *</label>
                <select
                  className={`form-input ${errors.gender ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-danger-600">{errors.gender}</p>}
              </div>
              <div>
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  className={`form-input ${errors.dateOfBirth ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-danger-600">{errors.dateOfBirth}</p>}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  className={`form-input ${errors.mobileNumber ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                />
                {errors.mobileNumber && <p className="mt-1 text-sm text-danger-600">{errors.mobileNumber}</p>}
              </div>
              <div>
                <label className="form-label">WhatsApp Number</label>
                <input
                  type="tel"
                  className={`form-input ${errors.whatsappNumber ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.whatsappNumber}
                  onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                  placeholder="Enter 10-digit WhatsApp number"
                  maxLength="10"
                />
                {errors.whatsappNumber && <p className="mt-1 text-sm text-danger-600">{errors.whatsappNumber}</p>}
                <p className="mt-1 text-xs text-gray-500">Leave empty if same as mobile number</p>
              </div>
              <div>
                <label className="form-label">Email ID</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="form-label">Address *</label>
                <textarea
                  rows="3"
                  className={`form-input ${errors.address ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address"
                />
                {errors.address && <p className="mt-1 text-sm text-danger-600">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Emergency Contact Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.emergencyContactName ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  placeholder="Enter emergency contact name"
                />
                {errors.emergencyContactName && <p className="mt-1 text-sm text-danger-600">{errors.emergencyContactName}</p>}
              </div>
              <div>
                <label className="form-label">Emergency Number *</label>
                <input
                  type="tel"
                  className={`form-input ${errors.emergencyNumber ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.emergencyNumber}
                  onChange={(e) => handleInputChange('emergencyNumber', e.target.value)}
                  placeholder="Enter 10-digit emergency number"
                  maxLength="10"
                />
                {errors.emergencyNumber && <p className="mt-1 text-sm text-danger-600">{errors.emergencyNumber}</p>}
              </div>
            </div>
          </div>

          {/* Package Assignment */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Package Assignment</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className={`form-input ${errors.category ? 'border-danger-500 focus:border-danger-500' : ''}`}
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    <option value="">
                      {packageOptions.categories.length === 0 ? 'No categories available' : 'Select category'}
                    </option>
                    {packageOptions.categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-danger-600">{errors.category}</p>}
                  {packageOptions.categories.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      No valid packages found ({packages?.length || 0} total packages loaded).
                      Make sure packages have names and check the Plans section for category setup.
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Plan Name</label>
                  <select
                    className={`form-input ${errors.planName ? 'border-danger-500 focus:border-danger-500' : ''}`}
                    value={formData.planName}
                    onChange={(e) => handleInputChange('planName', e.target.value)}
                    disabled={!formData.category || packageOptions.categories.length === 0}
                  >
                    <option value="">
                      {!formData.category ? 'Select category first' :
                       packageOptions.planNames[formData.category]?.length === 0 ? 'No plans available' :
                       'Select plan name'}
                    </option>
                    {formData.category && packageOptions.planNames[formData.category]?.map(planName => (
                      <option key={planName} value={planName}>
                        {planName}
                      </option>
                    ))}
                  </select>
                  {errors.planName && <p className="mt-1 text-sm text-danger-600">{errors.planName}</p>}
                </div>
              </div>

              {formData.category && formData.planName && (
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                  {(() => {
                    const selectedPackage = packageOptions.packages[`${formData.category}-${formData.planName}`]
                    return selectedPackage ? (
                      <p className="mt-2 text-sm text-gray-600">
                        Duration: {selectedPackage.duration_days} days • Price: ₹{selectedPackage.price}
                      </p>
                    ) : null
                  })()}
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="personalTrainer"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border-light rounded"
                  checked={formData.personalTrainer}
                  onChange={(e) => handleInputChange('personalTrainer', e.target.checked)}
                />
                <label htmlFor="personalTrainer" className="ml-2 text-sm text-text-primary">
                  Would you like to take a Personal Trainer?
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-border-light">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (client ? 'Updating Client...' : 'Adding Client...') : (client ? 'Update Client' : 'Add Client')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}