// Utility functions for package status calculations and reminders

export const PACKAGE_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  EXPIRED: 'expired'
}

export const REMINDER_TYPES = {
  THREE_DAYS_BEFORE: '3_days_before',
  ON_EXPIRY: 'on_expiry',
  THREE_DAYS_AFTER: '3_days_after'
}

/**
 * Calculate package status based on dates
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {string} - Status from PACKAGE_STATUS
 */
export function calculatePackageStatus(startDate, endDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > today) {
    return PACKAGE_STATUS.UPCOMING
  } else if (end < today) {
    return PACKAGE_STATUS.EXPIRED
  } else {
    return PACKAGE_STATUS.ACTIVE
  }
}

/**
 * Get packages that need reminders
 * @param {Array} clientPackages - Array of client_package objects with package details
 * @returns {Object} - Object with reminder types as keys and arrays of packages as values
 */
export function getPackagesNeedingReminders(clientPackages) {
  const reminders = {
    [REMINDER_TYPES.THREE_DAYS_BEFORE]: [],
    [REMINDER_TYPES.ON_EXPIRY]: [],
    [REMINDER_TYPES.THREE_DAYS_AFTER]: []
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  clientPackages.forEach(cp => {
    const endDate = new Date(cp.end_date)
    const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))

    // Check for reminders based on days until/days after expiry
    if (daysDiff === 3) {
      reminders[REMINDER_TYPES.THREE_DAYS_BEFORE].push(cp)
    } else if (daysDiff === 0) {
      reminders[REMINDER_TYPES.ON_EXPIRY].push(cp)
    } else if (daysDiff === -3) {
      reminders[REMINDER_TYPES.THREE_DAYS_AFTER].push(cp)
    }
  })

  return reminders
}

/**
 * Get dashboard statistics
 * @param {Array} clientPackages - Array of client_package objects
 * @param {Array} clients - Array of client objects
 * @returns {Object} - Dashboard statistics
 */
export function getDashboardStats(clientPackages, clients) {
  const stats = {
    totalClients: clients.length,
    expired: 0,
    newThisMonth: 0
  }

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  clientPackages.forEach(cp => {
    const status = calculatePackageStatus(cp.start_date, cp.end_date)

    if (status === PACKAGE_STATUS.EXPIRED) {
      stats.expired++
    }

    // Count new clients this month
    const createdAt = new Date(cp.created_at)
    if (createdAt >= thisMonth) {
      stats.newThisMonth++
    }
  })

  return stats
}

/**
 * Format reminder message
 * @param {Object} clientPackage - Client package object with client and package details
 * @param {string} reminderType - Type of reminder
 * @returns {string} - Formatted reminder message
 */
export function formatReminderMessage(clientPackage, reminderType) {
  const { clients, packages } = clientPackage
  const clientName = clients?.name || 'Client'
  const packageName = packages?.name || 'Package'
  const endDate = new Date(clientPackage.end_date).toLocaleDateString()

  switch (reminderType) {
    case REMINDER_TYPES.THREE_DAYS_BEFORE:
      return `${clientName}'s ${packageName} expires on ${endDate}. Please follow up for renewal.`
    case REMINDER_TYPES.ON_EXPIRY:
      return `${clientName}'s ${packageName} has expired today (${endDate}). Please contact them for renewal.`
    case REMINDER_TYPES.THREE_DAYS_AFTER:
      return `${clientName}'s ${packageName} expired 3 days ago (${endDate}). Follow up urgently for renewal.`
    default:
      return `Reminder for ${clientName}'s ${packageName}`
  }
}

/**
 * Get status color for UI display
 * @param {string} status - Package status
 * @returns {string} - Tailwind CSS color class
 */
export function getStatusColor(status) {
  switch (status) {
    case PACKAGE_STATUS.UPCOMING:
      return 'text-blue-600 bg-blue-100'
    case PACKAGE_STATUS.ACTIVE:
      return 'text-green-600 bg-green-100'
    case PACKAGE_STATUS.EXPIRED:
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

/**
 * Get status label for display
 * @param {string} status - Package status
 * @returns {string} - Human-readable status label
 */
export function getStatusLabel(status) {
  switch (status) {
    case PACKAGE_STATUS.UPCOMING:
      return 'Upcoming'
    case PACKAGE_STATUS.ACTIVE:
      return 'Active'
    case PACKAGE_STATUS.EXPIRED:
      return 'Expired'
    default:
      return 'Unknown'
  }
}