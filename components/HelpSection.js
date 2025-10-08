'use client'

import { useState, useEffect } from 'react'
import { Search, X, HelpCircle, Book, MessageSquare, Package, BarChart3, Settings, AlertTriangle, ChevronRight, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react'

// Help content data structure
const helpContent = {
  categories: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Book,
      description: 'Intro guides for new users',
      articles: [
        {
          id: 'first-client',
          title: 'How to add your first client',
          content: `
# How to Add Your First Client

Welcome to Smart Client Management! Adding your first client is easy. Follow these steps:

## Step 1: Navigate to Clients
Click on the "Clients" tab in the sidebar to access the client management section.

## Step 2: Click "Add Client"
Look for the blue "Add Client" button in the top-right corner of the page.

## Step 3: Fill in Client Details
Complete the client form with:
- **Personal Information**: First name, last name, date of birth, gender
- **Contact Details**: Phone number, WhatsApp number, email, address
- **Emergency Contact**: Name and phone number of emergency contact
- **Package Assignment**: Select a package category and plan name

## Step 4: Save the Client
Click "Add Client" to save the new client to your system.

## Tips
- All fields marked with * are required
- Phone numbers must be 10 digits
- You can assign packages later if needed
- Client IDs are automatically generated

Need help with packages? Check out our [Package Management guide](#packages).
          `,
          tags: ['clients', 'add', 'first-time', 'basics']
        },
        {
          id: 'workspace-setup',
          title: 'Setting up your workspace',
          content: `
# Setting Up Your Workspace

Before you start managing clients, let's set up your workspace properly.

## Organization Setup
1. **Create Organization**: Enter your business/organization name
2. **Business Details**: Add address, contact information
3. **Team Members**: Invite colleagues to join your workspace

## Package Configuration
1. **Create Packages**: Define your service offerings
2. **Set Pricing**: Configure prices and durations
3. **Categories**: Organize packages by type (Gym, Fitness, etc.)

## Integration Setup
1. **WhatsApp Business**: Connect your WhatsApp Business API
2. **Chatwoot**: Set up customer support integration
3. **Email Settings**: Configure automated email templates

## Security & Access
1. **User Roles**: Define team member permissions
2. **Two-Factor Auth**: Enable additional security
3. **Data Backup**: Set up automatic backups
          `,
          tags: ['setup', 'workspace', 'organization', 'packages']
        }
      ]
    },
    {
      id: 'client-management',
      title: 'Client Management',
      icon: HelpCircle,
      description: 'Managing client profiles and data',
      articles: [
        {
          id: 'edit-client',
          title: 'Editing client details',
          content: `
# Editing Client Details

You can update client information anytime. Here's how:

## Accessing Client Edit
1. Go to the Clients page
2. Find the client you want to edit
3. Click the three dots (⋮) menu next to the client
4. Select "Edit" from the dropdown

## What You Can Edit
- **Personal Information**: Name, date of birth, gender
- **Contact Details**: Phone, WhatsApp, email, address
- **Emergency Contact**: Emergency contact name and phone
- **Package Assignment**: Change or assign packages

## Important Notes
- Client ID cannot be changed once created
- Age is automatically calculated from date of birth
- Package changes may affect billing and renewals
- All changes are saved automatically

## Bulk Operations
For editing multiple clients at once:
1. Use the search and filter options
2. Select multiple clients (checkboxes)
3. Use bulk actions for common updates
          `,
          tags: ['clients', 'edit', 'update', 'profile']
        },
        {
          id: 'client-search',
          title: 'Searching and filtering clients',
          content: `
# Searching and Filtering Clients

Find clients quickly using our advanced search and filter system.

## Basic Search
- **Search Bar**: Type client name, email, or phone number
- **Real-time Results**: Results update as you type
- **Multiple Fields**: Searches across name, email, phone, and WhatsApp

## Advanced Filters
Click the "Filters" button to access advanced options:

### Package Filters
- **Category**: Filter by package category (Gym, Fitness, etc.)
- **Plan Type**: Filter by specific plan types (Monthly, Quarterly, etc.)

### Client Filters
- **Status**: Active, Expired, Expiring Soon, No Package
- **Join Status**: Recently Joined (last 1-7 days)
- **Gender**: Male, Female, Other
- **Age Group**: 18-25, 26-35, 36-45, 46+

## Filter Combinations
- Combine multiple filters for precise results
- Filter count shows active filters
- Clear individual filters or all at once

## Export Filtered Results
- Apply your filters first
- Click "Export Data" to download filtered results
- Excel file includes all visible columns
          `,
          tags: ['search', 'filter', 'clients', 'export']
        }
      ]
    },
    {
      id: 'messaging-automation',
      title: 'Messaging & Automation',
      icon: MessageSquare,
      description: 'Automated WhatsApp and email messages',
      articles: [
        {
          id: 'bulk-messages',
          title: 'Sending bulk marketing messages',
          content: `
# Sending Bulk Marketing Messages

Reach multiple clients at once with personalized bulk messages.

## Creating Bulk Messages
1. **Access Bulk Messaging**: Click "Bulk Message" button on Clients page
2. **Select Recipients**: Choose clients by filters or manual selection
3. **Choose Message Type**: WhatsApp or SMS
4. **Compose Message**: Write your message with personalization

## Personalization Options
Use these variables in your messages:
- **{{name}}**: Client's full name
- **{{first_name}}**: Client's first name
- **{{package_name}}**: Current package name
- **{{expiry_date}}**: Package expiry date

## Message Scheduling
- **Send Now**: Immediate delivery
- **Schedule Later**: Choose specific date and time
- **Recurring Messages**: Set up automated recurring campaigns

## Best Practices
- **Timing**: Send during business hours (9 AM - 8 PM)
- **Frequency**: Limit to 2-3 messages per week
- **Personalization**: Always use client's name
- **Opt-out**: Include clear unsubscribe instructions

## Message Status Tracking
- **Sent**: Successfully delivered
- **Delivered**: Received by recipient
- **Read**: Opened by recipient
- **Failed**: Delivery failed (check number validity)
          `,
          tags: ['bulk', 'messages', 'whatsapp', 'marketing', 'automation']
        },
        {
          id: 'birthday-reminders',
          title: 'Setting up birthday reminders',
          content: `
# Birthday Reminder Automation

Automatically send birthday wishes to your clients.

## Setting Up Birthday Reminders
1. **Go to Settings**: Navigate to Settings > Automation
2. **Enable Birthday Reminders**: Toggle the birthday reminder feature
3. **Configure Timing**: Choose when to send (day before, on birthday, etc.)
4. **Select Template**: Choose or create a birthday message template

## Message Templates
Create personalized birthday messages:
- Use **{{name}}** for personalization
- Include special offers or discounts
- Keep messages warm and celebratory

## Automation Rules
- **Trigger**: Automatically triggered on client's birthday
- **Channels**: WhatsApp, SMS, or Email
- **Frequency**: Once per year
- **Conditions**: Only for active clients

## Managing Birthday Messages
- **View Sent Messages**: Check Automation > Message History
- **Edit Templates**: Update message templates anytime
- **Disable for Specific Clients**: Use client preferences
- **Analytics**: Track delivery and response rates

## Best Practices
- Send messages 1-2 days before or on birthday
- Include a small special offer
- Personalize with client's name and package details
- Respect client communication preferences
          `,
          tags: ['birthday', 'reminders', 'automation', 'messages']
        }
      ]
    },
    {
      id: 'packages-billing',
      title: 'Packages & Billing',
      icon: Package,
      description: 'Managing packages and renewals',
      articles: [
        {
          id: 'create-package',
          title: 'Creating new package plans',
          content: `
# Creating New Package Plans

Set up service packages for your clients.

## Package Creation Process
1. **Access Packages**: Go to Plans section
2. **Click "Add Package"**: Use the + button to create new packages
3. **Fill Package Details**:
   - **Name**: Package name (e.g., "Monthly Gym Pass")
   - **Description**: Detailed package description
   - **Duration**: Length in days (30, 90, 180, 365)
   - **Price**: Package price in rupees
   - **Category**: Group packages (Gym, Fitness, Personal Training)

## Package Categories
Organize packages by type:
- **Gym**: General gym access packages
- **Fitness**: Specialized fitness programs
- **Personal Training**: One-on-one training sessions
- **Nutrition**: Diet and nutrition plans

## Advanced Settings
- **Auto-renewal**: Enable/disable automatic renewal
- **Grace Period**: Days allowed after expiry
- **Discounts**: Set up promotional pricing
- **Visibility**: Control package visibility to clients

## Package Management
- **Edit Packages**: Update pricing and details anytime
- **Duplicate Packages**: Copy existing packages as templates
- **Archive Packages**: Hide old packages without deleting
- **Analytics**: Track package popularity and revenue
          `,
          tags: ['packages', 'create', 'plans', 'billing']
        },
        {
          id: 'renewal-reminders',
          title: 'Setting up renewal reminders',
          content: `
# Renewal Reminder Automation

Keep clients engaged with timely renewal notifications.

## Configuring Renewal Reminders
1. **Go to Automation Settings**: Settings > Automation > Renewals
2. **Set Reminder Timing**:
   - **First Reminder**: 7 days before expiry
   - **Second Reminder**: 3 days before expiry
   - **Final Reminder**: 1 day before expiry
3. **Choose Channels**: WhatsApp, SMS, Email
4. **Select Templates**: Use pre-built or custom templates

## Reminder Templates
Customize renewal messages:
- Include package details and pricing
- Add renewal incentives or discounts
- Clear call-to-action for renewal
- Contact information for support

## Automation Rules
- **Trigger Conditions**: Based on package expiry date
- **Client Status**: Only active clients
- **Frequency Control**: Prevent over-messaging
- **Manual Override**: Skip reminders for specific clients

## Tracking and Analytics
- **Delivery Reports**: Track message delivery status
- **Response Rates**: Monitor renewal conversions
- **Revenue Impact**: Calculate renewal revenue
- **Optimization**: A/B test different reminder strategies

## Best Practices
- Start reminders early (7-10 days before expiry)
- Include clear renewal instructions
- Offer incentives for early renewal
- Provide multiple contact options
- Respect client preferences
          `,
          tags: ['renewals', 'reminders', 'automation', 'billing']
        }
      ]
    },
    {
      id: 'reports-analytics',
      title: 'Reports & Analytics',
      icon: BarChart3,
      description: 'Viewing performance and client data',
      articles: [
        {
          id: 'dashboard-overview',
          title: 'Understanding the dashboard',
          content: `
# Dashboard Overview

Your command center for business insights and client management.

## Key Performance Indicators (KPIs)

### Primary Metrics
- **New Joined**: Clients added in selected time period
- **Active Clients**: Clients with active packages
- **Revenue**: Total revenue from active packages
- **Renewed**: Packages renewed in the period

### Growth Indicators
- **Percentage Change**: Compare with previous period
- **Trend Arrows**: ↑ (increasing) or ↓ (decreasing)
- **Color Coding**: Green (positive), Red (negative)

## Dashboard Sections

### Package Distribution
- **Pie Chart**: Visual breakdown of package types
- **Category Filter**: Focus on specific package categories
- **Interactive**: Click segments for detailed views

### Recent Activity
- **Recently Joined**: New clients in the last period
- **Today's Attendance**: Check-ins for current day
- **Expired Plans**: Clients needing renewal attention

### Charts and Trends
- **Weekly Client Growth**: Daily client additions
- **Revenue Trends**: Income patterns over time
- **Package Performance**: Most popular offerings

## Date Range Filtering
- **Default**: Last 30 days
- **Custom Ranges**: Select specific date periods
- **Quick Options**: This month, last month, etc.
- **Real-time Updates**: All metrics update instantly

## Export Options
- **Client Data**: Download filtered client lists
- **Package Reports**: Export package performance
- **PDF Reports**: Formatted summary reports
          `,
          tags: ['dashboard', 'analytics', 'kpi', 'reports']
        },
        {
          id: 'monthly-reports',
          title: 'Generating monthly client reports',
          content: `
# Monthly Client Reports

Generate comprehensive reports for business analysis.

## Report Types Available

### Client Summary Report
- **Total Clients**: Overall client count
- **New Additions**: Clients added this month
- **Active vs Inactive**: Package status breakdown
- **Demographics**: Age, gender distribution

### Package Performance Report
- **Popular Packages**: Most subscribed plans
- **Revenue by Package**: Income per package type
- **Renewal Rates**: Package retention statistics
- **Expiry Trends**: Upcoming expirations

### Financial Reports
- **Monthly Revenue**: Total income for the period
- **Package Sales**: Revenue by package category
- **Payment Methods**: Transaction type breakdown
- **Outstanding Payments**: Pending collections

## Generating Reports
1. **Go to Analytics**: Navigate to Reports & Analytics section
2. **Select Report Type**: Choose from available templates
3. **Set Date Range**: Select month or custom period
4. **Apply Filters**: Category, package type, client status
5. **Generate Report**: Click "Generate" button

## Export Options
- **Excel Format**: For data analysis and manipulation
- **PDF Format**: For sharing and presentation
- **CSV Format**: For importing into other systems
- **Scheduled Reports**: Set up automatic monthly reports

## Report Customization
- **Custom Fields**: Add specific data points
- **Branding**: Include company logo and colors
- **Date Ranges**: Flexible period selection
- **Filters**: Apply multiple filter combinations

## Best Practices
- Generate reports monthly for trend analysis
- Compare periods to identify growth patterns
- Use filters to focus on specific segments
- Schedule automated report delivery
          `,
          tags: ['reports', 'monthly', 'analytics', 'export']
        }
      ]
    },
    {
      id: 'settings-roles',
      title: 'Settings & Roles',
      icon: Settings,
      description: 'Managing workspace and access',
      articles: [
        {
          id: 'team-management',
          title: 'Adding team members and managing roles',
          content: `
# Team Management and Roles

Collaborate effectively with your team using role-based access control.

## User Roles Available

### Admin
- **Full Access**: All features and settings
- **User Management**: Add/remove team members
- **System Configuration**: Modify all settings
- **Financial Access**: View all revenue data

### Manager
- **Client Management**: Full client CRUD operations
- **Package Management**: Create and modify packages
- **Reports Access**: View all analytics and reports
- **Bulk Operations**: Send bulk messages and updates

### Staff
- **Client View**: Read-only client information
- **Basic Operations**: Add new clients, update details
- **Message Sending**: Send individual and bulk messages
- **Attendance Tracking**: Record client check-ins

### Viewer
- **Read-Only Access**: View clients, packages, and reports
- **No Modifications**: Cannot edit or delete data
- **Export Access**: Download reports and client lists

## Adding Team Members
1. **Go to Settings**: Navigate to Settings > Team
2. **Click "Add Member"**: Use the invitation system
3. **Enter Details**: Email address and role assignment
4. **Send Invitation**: Member receives email with setup link

## Role Management
- **Change Roles**: Update permissions as needed
- **Bulk Role Updates**: Modify multiple users at once
- **Role Templates**: Save common permission sets
- **Audit Trail**: Track role changes and access

## Security Features
- **Two-Factor Authentication**: Optional 2FA for all users
- **Session Management**: Automatic logout for inactive sessions
- **Access Logs**: Track user activity and changes
- **Data Encryption**: Secure data storage and transmission
          `,
          tags: ['team', 'roles', 'permissions', 'security']
        },
        {
          id: 'workspace-settings',
          title: 'Configuring workspace settings',
          content: `
# Workspace Configuration

Customize your workspace to match your business needs.

## Organization Settings
- **Business Name**: Your company/organization name
- **Contact Information**: Phone, email, address
- **Business Hours**: Operating hours and timezone
- **Logo and Branding**: Custom logo and color scheme

## Communication Settings
- **WhatsApp Integration**: Connect WhatsApp Business API
- **Email Templates**: Customize automated emails
- **SMS Gateway**: Configure SMS sending
- **Chatwoot Integration**: Customer support system

## Package Settings
- **Default Categories**: Pre-defined package categories
- **Pricing Rules**: Automatic pricing calculations
- **Renewal Policies**: Auto-renewal and grace periods
- **Discount Management**: Promotional pricing rules

## Security & Compliance
- **Data Retention**: How long to keep client data
- **Backup Settings**: Automatic data backups
- **Audit Logs**: Track all system changes
- **GDPR Compliance**: Data protection settings

## Notification Settings
- **Email Notifications**: System alerts and updates
- **In-App Notifications**: Real-time system messages
- **Client Notifications**: Automated client communications
- **Team Notifications**: Team activity alerts

## Integration Settings
- **API Access**: Third-party system integrations
- **Webhook Configuration**: Real-time data sync
- **Export Settings**: Automated data exports
- **Import Tools**: Bulk data import capabilities
          `,
          tags: ['settings', 'workspace', 'configuration', 'integration']
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: AlertTriangle,
      description: 'Common issues and quick fixes',
      articles: [
        {
          id: 'messages-not-sending',
          title: 'Messages not sending - troubleshooting',
          content: `
# Messages Not Sending - Troubleshooting Guide

Resolve common messaging issues quickly.

## Common Issues and Solutions

### WhatsApp Messages Not Delivering
**Problem**: Messages show as "Failed" or "Not Delivered"

**Solutions**:
1. **Check Phone Number**: Ensure number format is correct (+91XXXXXXXXXX)
2. **WhatsApp Business API**: Verify API connection in Settings
3. **Rate Limits**: Check if you've exceeded sending limits
4. **Opt-in Status**: Confirm client has opted in for messages

### SMS Delivery Issues
**Problem**: SMS messages not reaching recipients

**Solutions**:
1. **Gateway Configuration**: Check SMS gateway settings
2. **Credits Balance**: Verify sufficient SMS credits
3. **Number Format**: Ensure 10-digit Indian mobile numbers
4. **DND Settings**: Check if number is in DND registry

### Bulk Message Failures
**Problem**: Bulk campaigns failing partially or completely

**Solutions**:
1. **Recipient List**: Verify all numbers are valid
2. **Message Template**: Check for prohibited content
3. **Timing**: Avoid sending during restricted hours
4. **Batch Size**: Reduce batch size for large campaigns

## Diagnostic Steps
1. **Test Individual Message**: Send test message to your own number
2. **Check Logs**: Review message delivery logs
3. **Contact Support**: If issues persist, contact our support team
4. **API Status**: Verify third-party service status

## Prevention Tips
- Regularly update contact information
- Monitor delivery rates and success metrics
- Set up automated alerts for delivery failures
- Maintain opt-in compliance for marketing messages
          `,
          tags: ['messages', 'troubleshooting', 'whatsapp', 'sms', 'delivery']
        },
        {
          id: 'client-not-showing',
          title: 'Client not showing in dashboard',
          content: `
# Client Not Showing in Dashboard

Troubleshoot missing client data issues.

## Possible Causes

### Data Synchronization Issues
- **Real-time Updates**: Dashboard updates may be delayed
- **Cache Issues**: Browser cache causing display problems
- **Network Connectivity**: Poor internet affecting data loading

### Filter and Search Issues
- **Applied Filters**: Check if filters are hiding the client
- **Search Terms**: Verify search query matches client data
- **Date Range**: Ensure client was added within selected period

### Permission and Access Issues
- **User Role**: Check if your role allows viewing this client
- **Organization Access**: Verify client belongs to your organization
- **Data Visibility**: Some clients may be archived or hidden

## Troubleshooting Steps

### 1. Clear Filters and Search
- Remove all applied filters
- Clear search bar
- Check "All Clients" view

### 2. Refresh Data
- Use browser refresh (F5 or Ctrl+R)
- Clear browser cache if needed
- Try incognito/private browsing mode

### 3. Check Client Details
- Verify client was added to correct organization
- Check if client status is "Active"
- Confirm contact information is complete

### 4. Technical Checks
- Check browser console for errors
- Verify internet connectivity
- Try different browser or device

## Advanced Solutions
- **Re-sync Data**: Contact support for data synchronization
- **Database Check**: Admin can verify database records
- **Export Verification**: Export data to confirm client exists

## Prevention
- Always verify client addition was successful
- Use consistent data entry practices
- Regularly review and clean up client data
- Set up automated data validation rules
          `,
          tags: ['clients', 'dashboard', 'troubleshooting', 'visibility']
        }
      ]
    }
  ]
}

export default function HelpSection({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [feedback, setFeedback] = useState({})

  // Flatten all articles for search
  const allArticles = helpContent.categories.flatMap(cat =>
    cat.articles.map(article => ({
      ...article,
      categoryId: cat.id,
      categoryTitle: cat.title,
      categoryIcon: cat.icon
    }))
  )

  // Filter articles based on search
  const filteredArticles = searchTerm
    ? allArticles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  // Get popular articles (first 5 from each category)
  const popularArticles = helpContent.categories.flatMap(cat =>
    cat.articles.slice(0, 1)
  ).slice(0, 5)

  const handleFeedback = (articleId, isHelpful) => {
    setFeedback(prev => ({
      ...prev,
      [articleId]: isHelpful
    }))

    // In a real app, this would send feedback to analytics
    console.log(`Feedback for ${articleId}: ${isHelpful ? 'Helpful' : 'Not helpful'}`)
  }

  const handleContactSupport = () => {
    // In a real app, this would open a support ticket or chat
    alert('Support contact feature would open here. In a real implementation, this would create a support ticket or open a chat widget.')
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Content */}
      {searchTerm ? (
        /* Search Results */
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Search Results ({filteredArticles.length})
          </h3>
          {filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map(article => (
                <div
                  key={article.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedArticle(article)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{article.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {article.categoryTitle}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No results found</h4>
              <p className="text-gray-600">
                Try different keywords or browse categories below.
              </p>
            </div>
          )}
        </div>
      ) : selectedArticle ? (
            /* Article View */
            <div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                ← Back to {selectedArticle.categoryTitle}
              </button>

              <div className="prose max-w-none">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedArticle.title}
                </h1>

                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedArticle.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: selectedArticle.content.replace(/\n/g, '<br>').replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
                  }}
                />
              </div>

              {/* Feedback Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Was this article helpful?
                </h4>

                {feedback[selectedArticle.id] === undefined ? (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleFeedback(selectedArticle.id, true)}
                      className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Yes, helpful
                    </button>
                    <button
                      onClick={() => handleFeedback(selectedArticle.id, false)}
                      className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Not helpful
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">
                      Thanks for your feedback! {feedback[selectedArticle.id] ? 'Glad we could help!' : 'Sorry this wasn\'t helpful.'}
                    </p>
                    {!feedback[selectedArticle.id] && (
                      <button
                        onClick={handleContactSupport}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact Support
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : selectedCategory ? (
            /* Category Articles */
            <div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                ← Back to Categories
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedCategory.title}
                </h3>
                <p className="text-gray-600">{selectedCategory.description}</p>
              </div>

              <div className="space-y-4">
                {selectedCategory.articles.map(article => (
                  <div
                    key={article.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{article.title}</h4>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* FAQs by Category */
            <div className="space-y-8">
              {helpContent.categories.map(category => {
                const IconComponent = category.icon
                return (
                  <div key={category.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {category.articles.map(article => (
                        <div
                          key={article.id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedArticle(article)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{article.title}</h4>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {article.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
    </div>
  )
}