// Lead status options
export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'rnr', label: 'RNR' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'junk', label: 'Junk' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

// Lead source options
export const LEAD_SOURCES = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'manual', label: 'Manual' },
  { value: 'other', label: 'Other' },
];

// Activity types
export const ACTIVITY_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
];

// User roles
export const USER_ROLES = [
  { value: 'agency_owner', label: 'Agency Owner' },
  { value: 'agency_admin', label: 'Agency Admin' },
  { value: 'client_admin', label: 'Client Admin' },
  { value: 'client_user', label: 'Client User' },
];

// Integration types
export const INTEGRATION_TYPES = [
  { value: 'facebook', label: 'Facebook Lead Forms' },
  { value: 'google_forms', label: 'Google Forms' },
  { value: 'justdial', label: 'JustDial' },
  { value: 'indiamart', label: 'IndiaMart' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'webchat', label: 'Web Chat' },
];

// Date filter options for dashboard
export const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom Range' },
];

// Application name and branding
export const APP_NAME = 'LeadTrackPro';
export const APP_DESCRIPTION = 'A powerful multi-tenant CRM platform for agencies';
