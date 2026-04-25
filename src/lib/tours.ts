import type { DriveStep } from 'driver.js';

export type TourId =
  | 'events'
  | 'finance'
  | 'registrations'
  | 'churches'
  | 'collaborations'
  | 'organizations'
  | 'users'
  | 'program'
  | 'worship-screen'
  | 'worship-editor';

export interface TourDefinition {
  title: string;
  /** null = no direct navigate link; tour is triggered in-page only */
  path: string | null;
  steps: DriveStep[];
}

export const TOURS: Record<TourId, TourDefinition> = {
  // ─── Events ──────────────────────────────────────────────────────────────
  events: {
    title: 'Events',
    path: '/events',
    steps: [
      {
        popover: {
          title: '👋 Welcome to Events',
          description: 'This is where you create and manage camps, fellowships, seminars, and worship nights. Let\'s walk through it.',
        },
      },
      {
        element: '[data-tour="events-toolbar"]',
        popover: {
          title: 'Search & Filter',
          description: 'Use the search bar to find events by name, venue, or description. Filter by event type (Camp, Fellowship, etc.) or status (Open, Closed, etc.).',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="events-new-btn"]',
        popover: {
          title: 'Create a New Event',
          description: 'Click here to open the event creation form. You\'ll set the title, dates, venue, fee, slot limit, cover image, and participating churches.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="events-grid"]',
        popover: {
          title: 'Event Cards',
          description: 'Each card shows the event cover, status badge, date, venue, and slot count. Click the three-dot menu on any card to edit, delete, or manage collaborators.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  // ─── Finance ─────────────────────────────────────────────────────────────
  finance: {
    title: 'Finance',
    path: '/finance',
    steps: [
      {
        popover: {
          title: '👋 Welcome to Finance',
          description: 'Track your organization\'s income, expenses, and cash-on-hand here. Let\'s explore each section.',
        },
      },
      {
        element: '[data-tour="finance-tabs"]',
        popover: {
          title: 'Navigation Tabs',
          description: 'Switch between Overview (summary), Ledger (all entries), Reports (charts & breakdowns), and Payment Accounts.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="finance-add-btn"]',
        popover: {
          title: 'Add a Finance Entry',
          description: 'Record income or expense entries here. You can attach receipts, link to an event, and specify the category.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="finance-fund-card"]',
        popover: {
          title: 'Cash-on-Hand Summary',
          description: 'This card shows your organization\'s initial balance, total income, total expenses, and current cash-on-hand (COH).',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="finance-event-breakdown"]',
        popover: {
          title: 'Event Breakdown',
          description: 'See income and expense totals per event. Each row links to that event\'s finance detail page.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  // ─── Registrations ───────────────────────────────────────────────────────
  registrations: {
    title: 'Registrations',
    path: '/registrations',
    steps: [
      {
        popover: {
          title: '👋 Welcome to Registrations',
          description: 'Review and approve or reject event registrations submitted by participants.',
        },
      },
      {
        element: '[data-tour="reg-event-filter"]',
        popover: {
          title: 'Select an Event',
          description: 'Choose an event first to load its registrations. The table below will populate with all submissions for that event.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="reg-status-filter"]',
        popover: {
          title: 'Filter by Status',
          description: 'Filter registrations by status: Pending (awaiting review), Approved, Rejected, or Cancelled.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="reg-search"]',
        popover: {
          title: 'Search Registrants',
          description: 'Search by registrant name, email, or confirmation code to quickly find a specific entry.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="reg-table"]',
        popover: {
          title: 'Registration Table',
          description: 'Click any row to open the full registration detail — view payment proof, approve or reject, and add notes.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  // ─── Churches ────────────────────────────────────────────────────────────
  churches: {
    title: 'Churches',
    path: '/churches',
    steps: [
      {
        popover: {
          title: '👋 Welcome to Churches',
          description: 'Manage the local churches and divisions under your organization.',
        },
      },
      {
        element: '[data-tour="churches-toolbar"]',
        popover: {
          title: 'Search & Add',
          description: 'Search churches by name, or click "Add Church" to register a new local church.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="churches-list"]',
        popover: {
          title: 'Church List',
          description: 'Each entry shows the church name and its parent organization. Click the menu icon to edit or remove a church.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  // ─── Collaborations ──────────────────────────────────────────────────────
  collaborations: {
    title: 'Collaborations',
    path: '/collaborations',
    steps: [
      {
        popover: {
          title: '👋 Welcome to Collaborations',
          description: 'View and respond to event collaboration invitations from other organizations.',
        },
      },
      {
        element: '[data-tour="collab-tabs"]',
        popover: {
          title: 'Incoming & Outgoing',
          description: 'Switch between invitations sent to you (Incoming) and invitations you\'ve sent to others (Outgoing).',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="collab-list"]',
        popover: {
          title: 'Invitation Cards',
          description: 'Each card shows the event details and the inviting organization. Accept or Decline using the buttons on the card.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  // ─── Organizations ───────────────────────────────────────────────────────
  organizations: {
    title: 'Organizations',
    path: '/organizations',
    steps: [
      {
        popover: {
          title: '👋 Welcome to Organizations',
          description: 'Super admins manage all registered organizations from here.',
        },
      },
      {
        element: '[data-tour="orgs-toolbar"]',
        popover: {
          title: 'Search & Add',
          description: 'Search organizations or click "Add Organization" to register a new one.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="orgs-list"]',
        popover: {
          title: 'Organization List',
          description: 'Each card shows the org name, logo, and active status. Click to view or edit its details.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  // ─── Users ───────────────────────────────────────────────────────────────
  users: {
    title: 'User Management',
    path: '/users',
    steps: [
      {
        popover: {
          title: '👋 Welcome to User Management',
          description: 'Manage the accounts and roles of people in your organization.',
        },
      },
      {
        element: '[data-tour="users-toolbar"]',
        popover: {
          title: 'Search & Invite',
          description: 'Search users by name or email, or click "Invite User" to send a new invitation.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="users-table"]',
        popover: {
          title: 'User Table',
          description: 'Each row shows the user\'s name, email, role, and status. Use the action menu to change roles or remove users.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  // ─── Program ─────────────────────────────────────────────────────────────
  program: {
    title: 'Program Builder',
    path: null, // no fixed URL — triggered from inside an event's program page
    steps: [
      {
        popover: {
          title: '👋 Welcome to the Program Builder',
          description: 'Build the full agenda for this event — add session headers, program items, assign presenters, and export when ready.',
        },
      },
      {
        element: '[data-tour="program-status"]',
        popover: {
          title: 'Program Status',
          description: 'Track where the program is in its lifecycle: Draft (still editing), Pending (under review), or Final (approved and ready to share).',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="program-export"]',
        popover: {
          title: 'Export the Program',
          description: 'Download the program as a PDF (choose page size, select specific days) or as a CSV spreadsheet. Both include all items, times, churches, and presenters.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="program-day-tabs"]',
        popover: {
          title: 'Day Tabs (Camps)',
          description: 'For multi-day camps, switch between days here. Each day has its own program list. Use "Add Day" or "Remove Day" to adjust the schedule length.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="program-session-btns"]',
        popover: {
          title: 'Session Dividers',
          description: 'Click Morning, Afternoon, or Evening to insert a colored section header. These visually group items in the list and appear in the exported PDF.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="program-item-list"]',
        popover: {
          title: 'Program Items',
          description: 'Each row is one agenda item. Hover to reveal Edit and Delete buttons. Drag the ⠿ grip handle on the left to reorder items within the day.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="program-add-item"]',
        popover: {
          title: 'Add a Program Item',
          description: 'Click here to open the item form. Fill in the Title (required), then optionally set the start and end time, session, assigned church, presenter name, and a description.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  // ─── Worship Screen (presentations list) ─────────────────────────────────
  'worship-screen': {
    title: 'Worship Screen',
    path: '/worship',
    steps: [
      {
        popover: {
          title: '👋 Welcome to Worship Screen',
          description: 'Create and manage lyric presentations for live worship services. Let\'s explore the Presentations page.',
        },
      },
      {
        element: '[data-tour="worship-new-btn"]',
        popover: {
          title: 'Create a Presentation',
          description: 'Click "New Presentation" to open the editor with a blank deck. Give it a name like "Sunday Service — April 20" and start building your set list.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="worship-table"]',
        popover: {
          title: 'Your Presentations',
          description: 'Each row shows a saved presentation with its background, font, slide count, and last saved time. Click the Play icon (▶) to go live instantly, the pencil to edit, or the trash to delete.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  // ─── Worship Editor (in-editor tour) ─────────────────────────────────────
  'worship-editor': {
    title: 'Worship Editor',
    path: null, // triggered from inside the editor
    steps: [
      {
        popover: {
          title: '👋 Welcome to the Worship Editor',
          description: 'The editor has three panels and a header. Let\'s walk through each part.',
        },
      },
      {
        element: '[data-tour="worship-editor-header"]',
        popover: {
          title: 'Header — Title, Save & Present',
          description: 'Edit the presentation title here. The Save button saves your changes. "Open Presenter" launches the fullscreen view on your projector or second screen.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="worship-slides-panel"]',
        popover: {
          title: 'Slides Panel (Left)',
          description: 'All generated slides appear here in order — title slides, lyric slides, and section slides. Click any slide to jump to it. During a live presentation, this controls what the audience sees.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="worship-lyrics-panel"]',
        popover: {
          title: 'Lyrics & Set List (Center)',
          description: 'Your set list of songs is here. Click "+ Add Song" to add songs manually, search using AI, or insert a section announcement. Drag songs to reorder them. Click any song to edit its lyrics in the text area.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="worship-preview-panel"]',
        popover: {
          title: 'Live Preview (Right)',
          description: 'See exactly how the current slide looks on screen — background, font, size, and layout. This matches the presenter window in real time.',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: '[data-tour="worship-settings-btn"]',
        popover: {
          title: 'Appearance Settings',
          description: 'Open Settings to change the background (12+ animated options), font, font size, slide transition style, and animation speed. Changes apply live to the presenter window.',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },
};

export const TOUR_IDS = Object.keys(TOURS) as TourId[];

export function getTour(id: string): TourDefinition | undefined {
  return TOURS[id as TourId];
}
