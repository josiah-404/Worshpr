export interface GuideStep {
  title: string;
  description: string;
  image?: string;
  tip?: string;
  warning?: string;
}

export interface GuideSection {
  heading: string;
  steps: GuideStep[];
}

export interface Guide {
  slug: string;
  module: string;
  icon: string;
  description: string;
  sections: GuideSection[];
}

export const GUIDES: Guide[] = [
  // ─── Events ────────────────────────────────────────────────────────────────
  {
    slug: 'events',
    module: 'Events',
    icon: 'CalendarDays',
    description: 'Create and manage events, set cover images, fees, slots, and participating churches.',
    sections: [
      {
        heading: 'Creating an Event',
        steps: [
          {
            title: 'Go to the Events page',
            description: 'Click "Events" in the sidebar under Modules. You will see a grid of all events for your organization.',
          },
          {
            title: 'Click "Create Event"',
            description: 'Press the orange "Create Event" button in the top-right corner of the page to open the event creation dialog.',
          },
          {
            title: 'Upload a cover image',
            description: 'Click the image area at the top of the form to upload a cover photo for the event. Accepted formats: PNG, JPG, WEBP (max 4 MB). This image appears on the event card.',
            tip: 'A good cover image makes the event stand out in the grid.',
          },
          {
            title: 'Pick a theme color',
            description: 'Choose a preset color or use the custom color picker. The theme color is used for the event card gradient and accents throughout the event.',
          },
          {
            title: 'Fill in the event details',
            description: 'Enter the event title, description (optional), type (Camp, Fellowship, Seminar, or Worship Night), venue (optional), start and end dates, and registration deadline (optional).',
          },
          {
            title: 'Set registration fee and max slots',
            description: 'Enter the registration fee in Philippine Peso (₱). Leave blank for free events. Optionally set a maximum number of slots — leave blank for unlimited.',
          },
          {
            title: 'Attach a payment account',
            description: 'If the fee is greater than zero, a payment account selector appears. Choose the GCash, Maya, or bank account where registrants should send payment. Payment accounts are managed under Finance → Payment Accounts.',
            tip: 'If no payment accounts appear, add one under Finance → Payment Accounts first.',
          },
          {
            title: 'Select participating churches',
            description: 'Check at least one church whose members are allowed to register for this event. Churches must be added under Management → Churches first.',
            warning: 'You must select at least one participating church. If none are selected, the event registration page will be blocked for registrants.',
          },
          {
            title: 'Click "Create Event"',
            description: 'Press the Create Event button. The event card will appear in the grid immediately.',
          },
        ],
      },
      {
        heading: 'Managing Events',
        steps: [
          {
            title: 'Edit an event',
            description: 'Click the pencil icon on an event card to open the edit dialog. All fields including participating churches can be updated.',
          },
          {
            title: 'Change event status',
            description: 'Use the Status dropdown inside the edit dialog to move the event between Draft, Open, Closed, Cancelled, and Completed.',
            tip: 'Set the status to "Open" when registration should be available to the public.',
          },
          {
            title: 'Share the registration link via QR',
            description: 'Click the QR code icon on the event card to open the QR modal. You can copy the registration link, open it in a new tab, or download a printable poster.',
          },
          {
            title: 'View event program',
            description: 'Click the calendar icon on an event card to go to the event\'s Program page where you can build the event agenda.',
          },
          {
            title: 'Delete an event',
            description: 'Click the trash icon on an event card and confirm the deletion. Deleted events cannot be recovered.',
            warning: 'Deleting an event will also remove all associated registrations, program items, and finance entries.',
          },
        ],
      },
      {
        heading: 'Collaborating with Other Organizations',
        steps: [
          {
            title: 'Invite a collaborating organization',
            description: 'Open the event edit dialog and go to the Collaborations section. Select an organization and click Invite. The invited organization must accept before they can see registrations.',
          },
          {
            title: 'Monitor collaboration status',
            description: 'Invited organizations appear with a status badge: Pending, Accepted, or Declined. You can revoke an invitation at any time.',
          },
        ],
      },
    ],
  },

  // ─── Registrations ─────────────────────────────────────────────────────────
  {
    slug: 'registrations',
    module: 'Registrations',
    icon: 'ClipboardList',
    description: 'Review, approve, reject, and manage event registrations submitted by participants.',
    sections: [
      {
        heading: 'How Registrants Sign Up',
        steps: [
          {
            title: 'Registration is public — no account needed',
            description: 'Registrants access the registration form through the event\'s QR code or share link (e.g. embr.app/register/event-slug). They do not need to log in to EMBR.',
          },
          {
            title: 'Step 1 — Registrant information',
            description: 'Registrants fill in their full name, nickname, email, phone, birthday, address, division (organization), and church. Division and church dropdowns are populated from the event\'s accepted collaborators and participating churches.',
          },
          {
            title: 'Step 2 — Payment',
            description: 'If the event has a fee, registrants enter their payment reference number and upload a screenshot of their payment. They can see the payment account details (GCash/Maya/bank) that were set on the event.',
          },
          {
            title: 'Step 3 — Review and submit',
            description: 'Registrants review all their information before submitting. Duplicate registrations (same email or same name + birthday + organization) are automatically blocked.',
          },
        ],
      },
      {
        heading: 'Managing Registrations',
        steps: [
          {
            title: 'Go to the Registrations page',
            description: 'Click "Registrations" in the sidebar. You will see a table of all registrations across events for your organization.',
          },
          {
            title: 'Filter by event or status',
            description: 'Use the event and status filters at the top of the table to narrow down registrations. Statuses are: Pending, Approved, Rejected, and Cancelled.',
          },
          {
            title: 'Open a registration drawer',
            description: 'Click any row in the table to open the registration drawer. It shows the registrant\'s full details, payment screenshot, and action buttons.',
          },
          {
            title: 'Approve a registration',
            description: 'Click "Approve" in the registration drawer. Approving a registration with a payment automatically creates an income entry in the Finance ledger.',
            tip: 'Approving is the most common action. Once approved, the registrant is officially confirmed for the event.',
          },
          {
            title: 'Reject or cancel a registration',
            description: 'Click "Reject" to deny the registration or "Cancel" to undo an already-approved registration. Both actions update the status immediately.',
          },
          {
            title: 'Group registrations',
            description: 'If a group paid together, their registrations are linked under one shared payment. The registration drawer shows all members of the group and the shared payment details.',
          },
        ],
      },
    ],
  },

  // ─── Program ───────────────────────────────────────────────────────────────
  {
    slug: 'program',
    module: 'Program',
    icon: 'LayoutList',
    description: 'Build the full event agenda — organize items by day and session, assign presenters, reorder with drag and drop, and export as PDF or CSV.',
    sections: [
      {
        heading: 'Opening the Program Builder',
        steps: [
          {
            title: 'Navigate to an event\'s Program page',
            description: 'From the Events page, click the calendar icon on any event card. This takes you directly to that event\'s Program Builder.',
          },
          {
            title: 'Initialize the program (first time)',
            description: 'If no program exists yet, you will see an empty state with an "Initialize Program" button. Click it to create the program structure. For camps, EMBR sets up a day-by-day structure based on the event date range.',
            tip: 'You only need to initialize once. After that, you can keep adding and editing items freely.',
          },
          {
            title: 'Switch between days (camps)',
            description: 'For multi-day events (camps), day tabs appear at the top of the page — Day 1, Day 2, and so on. Click a day tab to switch the active view and edit that day\'s program.',
          },
          {
            title: 'Add or remove days',
            description: 'Use the "+ Add Day" button to add another day, or the "Remove Day" button to remove the last day. A day can only be removed if it has no items.',
            warning: 'You cannot remove a day that still has program items. Delete or move its items first.',
          },
        ],
      },
      {
        heading: 'Building the Schedule',
        steps: [
          {
            title: 'Add a session header',
            description: 'Click the "Morning", "Afternoon", or "Evening" button to insert a session divider. Session headers group your items visually with a colored separator — Morning (yellow sun), Afternoon (orange sunset), Evening (blue moon).',
            tip: 'Add session headers before items so the agenda reads clearly when exported.',
          },
          {
            title: 'Add a program item',
            description: 'Click the "Add Item" button to open the item dialog. Fill in the required Title, and optionally the Description, Session, Day (for camps), Start Time, End Time, Assigned Church, and Presenter Name.',
          },
          {
            title: 'Set the item title',
            description: 'Enter the name of the program activity (e.g. "Opening Worship", "Keynote Address", "Bible Study"). This is the only required field and appears prominently in the printed program.',
          },
          {
            title: 'Set the time',
            description: 'Choose the start time using the Hour, Minute (in 5-min increments), and AM/PM controls. Toggle "Has End Time" to also specify when the item ends. The formatted time (e.g. "8:00 AM – 9:30 AM") appears on the program.',
          },
          {
            title: 'Assign a session',
            description: 'Select Morning, Afternoon, Evening, or None from the Session dropdown. This groups the item under the correct session divider on the program.',
          },
          {
            title: 'Assign a church and presenter',
            description: 'Optionally select which church is responsible for this item from the Church dropdown (populated from the event\'s participating churches), and enter the presenter\'s name (e.g. "Bro. Juan dela Cruz").',
          },
          {
            title: 'Save the item',
            description: 'Click "Save Item". The item appears in the program list immediately. Items are sorted by their order position, not by time, so reorder them manually as needed.',
          },
        ],
      },
      {
        heading: 'Editing and Organizing Items',
        steps: [
          {
            title: 'Edit an item',
            description: 'Hover over any item row to reveal the action buttons. Click the pencil (edit) icon to open the item dialog with all its current values pre-filled. Update any field and click "Save Item".',
          },
          {
            title: 'Delete an item',
            description: 'Hover over an item row and click the trash icon. A confirmation prompt appears before the item is removed. Deleting a session header does not delete the items below it — they remain on the list.',
            warning: 'Deleted program items cannot be recovered.',
          },
          {
            title: 'Reorder items with drag and drop',
            description: 'Each item has a grip handle (⠿) on its left edge. Click and hold the handle, then drag the item up or down to its new position. Release to drop. The new order is saved automatically.',
            tip: 'You can drag session headers too. Move a header above the items it should group to keep the schedule organized.',
          },
        ],
      },
      {
        heading: 'Program Status',
        steps: [
          {
            title: 'Understanding the status workflow',
            description: 'Every program has a status: Draft (work in progress), Pending (submitted for review), or Final (approved). The status badge is visible in the program header.',
          },
          {
            title: 'Change the program status',
            description: 'Use the Status dropdown at the top of the Program page to move the program between stages. Select "Draft" while still editing, "Pending" when it needs review, and "Final" once it is confirmed.',
            tip: 'Set the status to "Final" before sharing or printing — it signals to everyone that the program is locked.',
          },
        ],
      },
      {
        heading: 'Exporting the Program',
        steps: [
          {
            title: 'Export as PDF',
            description: 'Click the "Export PDF" button. A dialog lets you choose the page size (A4, Letter, Folio, or Legal) and, for multi-day events, which days to include. The PDF is generated and downloaded automatically.',
            tip: 'The PDF includes a styled header with the event title and date range, colored session dividers, and a page footer with the program status and page numbers.',
          },
          {
            title: 'Export as CSV',
            description: 'Click the "Export CSV" button to download a spreadsheet-compatible file. Each row represents one item with columns for Day, Session, Time, Type, Title, Church, Presenter, and Description. Useful for sharing with a team or importing into other tools.',
          },
          {
            title: 'Selective day export (PDF)',
            description: 'When exporting a multi-day event as PDF, checkboxes let you include only specific days. For example, export only Day 1 and Day 2 if Day 3 is still being finalized.',
          },
        ],
      },
    ],
  },

  // ─── Finance ───────────────────────────────────────────────────────────────
  {
    slug: 'finance',
    module: 'Finance',
    icon: 'Wallet',
    description: 'Track your organization\'s income and expenses, view event breakdowns, and print finance reports.',
    sections: [
      {
        heading: 'Overview Tab',
        steps: [
          {
            title: 'Go to the Finance page',
            description: 'Click "Finance" in the sidebar under Modules. You land on the Overview tab by default.',
          },
          {
            title: 'View the Org Fund card',
            description: 'The Org Fund card shows your organization\'s current cash on hand (COH). COH is calculated as: Initial Balance + Total Income − Total Expenses.',
          },
          {
            title: 'Set the initial balance',
            description: 'Click the edit (pencil) icon on the Org Fund card to set or update the initial balance. This represents the starting cash before any transactions.',
            tip: 'Set this once when you first start using Finance. It carries forward and does not need to be updated unless you are correcting an error.',
          },
          {
            title: 'View the event breakdown',
            description: 'Below the Org Fund card, the Event Breakdown section shows income and expenses grouped by event. Click any event to go to its detailed finance page.',
          },
        ],
      },
      {
        heading: 'Adding a Finance Entry',
        steps: [
          {
            title: 'Click "Add Entry"',
            description: 'Press the "Add Entry" button in the top-right corner of the Finance page.',
          },
          {
            title: 'Select Income or Expense',
            description: 'Choose whether this is an income (money received) or expense (money spent) entry.',
          },
          {
            title: 'Pick a category',
            description: 'Select the most appropriate category. Income categories include: Registration, Offertory, Donation, and Other Income. Expense categories include: Prizes, Design & Printing, Food & Beverage, Transportation, Venue, Supplies, Marketing, and Other Expense.',
          },
          {
            title: 'Enter the amount',
            description: 'Type the amount in Philippine Peso (₱). The amount must be greater than zero.',
          },
          {
            title: 'Add a description',
            description: 'Enter a brief description of the transaction (e.g. "Bus rental to camp site").',
          },
          {
            title: 'Set the date and link to an event',
            description: 'Pick the transaction date. Optionally link the entry to one of your events using the Event dropdown. Entries not linked to any event are classified as standalone.',
          },
          {
            title: 'For expenses: add payee and receipt',
            description: 'Optionally fill in who was paid (Paid To), who requested the expense (Requested By), and upload a receipt image.',
          },
          {
            title: 'Click "Add Entry"',
            description: 'The entry is saved and the ledger, org fund, and finance summary all update immediately.',
            tip: 'Approving a registration automatically creates an income entry — you do not need to add it manually.',
          },
        ],
      },
      {
        heading: 'Ledger Tab',
        steps: [
          {
            title: 'Browse all transactions',
            description: 'The Ledger tab shows every income and expense entry in a table sorted by date. Use the Type and Category filters to narrow down entries.',
          },
          {
            title: 'Filter by event',
            description: 'Use the Event filter dropdown to see only transactions linked to a specific event.',
          },
          {
            title: 'Delete an entry',
            description: 'Click the trash icon on a row to delete that entry. The org fund totals recalculate immediately.',
            warning: 'Deleting a registration income entry does not revert the registration\'s approved status.',
          },
        ],
      },
      {
        heading: 'Reports Tab',
        steps: [
          {
            title: 'Open the Reports tab',
            description: 'Click the "Reports" tab to see a formatted finance report for your organization.',
          },
          {
            title: 'Filter by event',
            description: 'Use the event dropdown to generate a report for a specific event, or choose "All Events" for the full organization report.',
          },
          {
            title: 'Print the report',
            description: 'Click "Print Report" to open the browser print dialog. The report is formatted for A4 paper with clean margins and typography.',
          },
        ],
      },
      {
        heading: 'Payment Accounts Tab',
        steps: [
          {
            title: 'Add a payment account',
            description: 'Click "Add Account" to create a GCash, Maya, Bank Transfer, or Other payment account. Enter the account name, account number, and optional QR code image.',
          },
          {
            title: 'Link to events',
            description: 'When creating or editing an event with a fee, the Payment Account selector lets you choose which account registrants should use for payment.',
          },
          {
            title: 'Toggle active status',
            description: 'Use the toggle on a payment account to activate or deactivate it. Only active accounts appear in the event creation form.',
          },
        ],
      },
      {
        heading: 'Per-Event Finance',
        steps: [
          {
            title: 'Go to an event\'s finance page',
            description: 'From the Finance Overview, click any event in the Event Breakdown list to open its dedicated finance page.',
          },
          {
            title: 'View event-specific transactions',
            description: 'The event finance page shows only the transactions linked to that event, along with a summary of total income, expenses, and net result.',
          },
          {
            title: 'Add an entry from the event page',
            description: 'Click "Add Entry" on the event finance page. The entry is automatically linked to that event.',
          },
          {
            title: 'Print the event report',
            description: 'Click "Print Report" to generate a print-ready finance report for just that event.',
          },
        ],
      },
    ],
  },

  // ─── Churches ──────────────────────────────────────────────────────────────
  {
    slug: 'churches',
    module: 'Churches',
    icon: 'Church',
    description: 'Manage churches under your organization and assign them to events for registration.',
    sections: [
      {
        heading: 'Managing Churches',
        steps: [
          {
            title: 'Go to the Churches page',
            description: 'Click "Churches" in the sidebar under Management. You will see a table of all churches associated with your organization.',
          },
          {
            title: 'Add a church',
            description: 'Click "Add Church" and fill in the church name and optional location. The church is automatically linked to your active organization.',
          },
          {
            title: 'Edit a church',
            description: 'Click the pencil icon on a church row to update its name or location.',
          },
          {
            title: 'Deactivate a church',
            description: 'Use the toggle in the Active column to deactivate a church. Deactivated churches do not appear in event church selectors or registration forms.',
          },
          {
            title: 'Delete a church',
            description: 'Click the trash icon to permanently delete a church.',
            warning: 'Deleting a church that is linked to past registrations may cause data inconsistencies. Deactivate instead of deleting when in doubt.',
          },
        ],
      },
      {
        heading: 'Assigning Churches to Events',
        steps: [
          {
            title: 'Open the event edit dialog',
            description: 'Go to Events, click the edit icon on an event card to open the event dialog.',
          },
          {
            title: 'Select participating churches',
            description: 'In the "Participating Churches" section, check each church whose members are allowed to register for this event.',
          },
          {
            title: 'How churches appear to registrants',
            description: 'On the registration form, registrants select their Division (organization) first, then their Church from that division\'s list. Only churches checked on the event will appear.',
          },
        ],
      },
    ],
  },

  // ─── Collaborations ────────────────────────────────────────────────────────
  {
    slug: 'collaborations',
    module: 'Collaborations',
    icon: 'Handshake',
    description: 'Invite partner organizations to your events and respond to collaboration invitations.',
    sections: [
      {
        heading: 'Sending Invitations',
        steps: [
          {
            title: 'Open an event\'s edit dialog',
            description: 'Go to Events and click the edit icon on the event you want to collaborate on.',
          },
          {
            title: 'Invite a collaborating organization',
            description: 'In the Collaborators section of the event dialog, select an organization from the dropdown and click Invite.',
          },
          {
            title: 'Monitor the invitation',
            description: 'The invited organization appears in the list with a "Pending" badge until they respond. You can revoke the invitation at any time.',
          },
        ],
      },
      {
        heading: 'Responding to Invitations',
        steps: [
          {
            title: 'Check the Collaborations page',
            description: 'Click "Collaborations" in the sidebar. Pending invitations appear with an amber badge count on the sidebar icon.',
          },
          {
            title: 'Accept or decline an invitation',
            description: 'Click Accept to join the event as a collaborator, or Decline to refuse. Accepted collaborations mean your organization\'s registrants and churches will appear in the event.',
          },
          {
            title: 'View accepted collaborations',
            description: 'The Collaborations page also shows all events you have accepted, with their status and your role (Collaborator).',
          },
        ],
      },
    ],
  },

  // ─── Worship Screen ────────────────────────────────────────────────────────
  {
    slug: 'worship-screen',
    module: 'Worship Screen',
    icon: 'Monitor',
    description: 'Create song lyric presentations, customize backgrounds and fonts, and project live slides for worship services — with AI-powered song search.',
    sections: [
      {
        heading: 'Managing Presentations',
        steps: [
          {
            title: 'Go to Worship Screen',
            description: 'Click "Worship Screen" in the sidebar. You will land on the Presentations page which lists all saved presentations with their background style, font, slide count, and last-updated time.',
          },
          {
            title: 'Create a new presentation',
            description: 'Click the "New Presentation" button. You are taken directly to the editor with a blank presentation. Give it a meaningful name (e.g. "Sunday Service — April 20") in the title field at the top.',
          },
          {
            title: 'Open an existing presentation',
            description: 'From the Presentations list, click the pencil (Edit) icon on any row to open it in the editor, or click the Play icon to jump straight into the live presenter view.',
          },
          {
            title: 'Delete a presentation',
            description: 'Click the trash icon on a presentation row and confirm the prompt. Deleted presentations cannot be recovered.',
            warning: 'Make sure you are not currently presenting this deck before deleting it.',
          },
        ],
      },
      {
        heading: 'Adding Songs to the Set List',
        steps: [
          {
            title: 'Open the Add Song dialog',
            description: 'In the editor, click the "+ Add Song" button to open the song picker. There are three modes: Manual, AI Search, and Section.',
          },
          {
            title: 'Manual mode — add a song with lyrics',
            description: 'Switch to Manual mode, enter the song Title (required), Artist (optional), and Role/Label (optional, e.g. "Worship Team" or "Solo"). Paste the song lyrics into the lyrics text area. Blank lines between stanzas become separate slides.',
            tip: 'You can leave lyrics blank and paste them later directly in the editor\'s lyrics panel.',
          },
          {
            title: 'AI Search mode — find songs automatically',
            description: 'Switch to AI Search mode and type a description — song title, a lyric phrase, a theme, or even a scripture reference. Click Search. EMBR returns ranked results. Click "Fetch Lyrics" on a result to load the full lyrics, then click "+ Add" to include it in the set.',
            tip: 'AI Search has a daily quota. The remaining searches are shown at the top of the panel. Use Manual mode once the quota is reached.',
          },
          {
            title: 'Section mode — add a non-song slide',
            description: 'Switch to Section mode and enter a label (e.g. "Testimony", "Word of God", "Offering"). This creates a single full-screen announcement slide — useful to mark transitions in the service.',
          },
          {
            title: 'Reorder the set list',
            description: 'Songs appear in the set list on the left side of the editor. Drag the grip handle (⠿) on any song to move it up or down. The slide list and live preview update instantly.',
          },
          {
            title: 'Edit a song in the set list',
            description: 'Click the pencil icon on a set list item to edit its title, artist, or role inline. To change lyrics, click the song in the set list to load its slides in the editor, then edit the lyrics text directly.',
          },
          {
            title: 'Remove a song',
            description: 'Click the trash icon on a set list item to remove it from the presentation. The song is removed from the slide sequence immediately.',
          },
        ],
      },
      {
        heading: 'Editing Lyrics and Slides',
        steps: [
          {
            title: 'Understand the editor layout',
            description: 'The editor has three panels: Left (Slides — all generated slides in order), Center (Lyrics — the text editor and set list), and Right (Preview — live preview of the selected slide).',
          },
          {
            title: 'Edit lyrics in the center panel',
            description: 'Click a song in the set list to load its lyrics into the center text area. Edit freely. A blank line (press Enter twice) creates a new slide. Every block of text between blank lines becomes one presentation slide.',
          },
          {
            title: 'Navigate slides',
            description: 'Click any slide in the left Slides panel to preview it on the right. When presenting, this also advances the live view to that slide.',
          },
          {
            title: 'Auto-generated title slides',
            description: 'Each song in the set list automatically gets a title slide showing the song name, artist, and role label. You do not need to create these manually — they are generated from the set list item\'s metadata.',
          },
          {
            title: 'Save the presentation',
            description: 'Click the "Save" button in the header. A green checkmark confirms the save. The presentation auto-saves periodically, but always click Save before going live to make sure the latest changes are captured.',
          },
        ],
      },
      {
        heading: 'Customizing Appearance',
        steps: [
          {
            title: 'Open Settings',
            description: 'Click the settings (gear) icon or the Settings button in the editor header to open the Settings drawer. All appearance options are here.',
          },
          {
            title: 'Choose a background',
            description: 'Click "Change Background" to open the background picker. Choose from 12+ animated backgrounds — Deep Space, Aurora, gradient patterns, and abstract designs. The preview updates live in the right panel.',
          },
          {
            title: 'Choose a font',
            description: 'Select a font family from the Font dropdown (Inter, Poppins, Playfair Display, and more). Fonts affect how lyrics appear on screen. Choose a font that is easy to read from a distance.',
          },
          {
            title: 'Set the font size',
            description: 'Choose from Small, Medium, Large, or Extra Large. The text automatically scales to fit the screen regardless of size, but this setting controls the relative prominence of the text.',
            tip: 'Use Large or Extra Large for wide projector screens so lyrics are readable from the back of the room.',
          },
          {
            title: 'Set the slide transition',
            description: 'Choose how slides animate when advancing: Fade, Up (slides upward), Zoom, or Blur. Set the transition speed: Instant, Fast, Normal, or Slow.',
          },
          {
            title: 'Set the background animation speed',
            description: 'Animated backgrounds move continuously. Use the Animation Speed setting to make them slower (calming) or faster (energetic) to match the worship atmosphere.',
          },
        ],
      },
      {
        heading: 'Going Live',
        steps: [
          {
            title: 'Open the Presenter window',
            description: 'Click the "Present" button in the editor header. A separate full-screen window opens — this is what you display on the projector or second screen. It starts on the first slide automatically.',
            tip: 'Set your projector as your second display in Windows/Mac display settings. Drag the Presenter window to the projector screen, then make it full screen (F11 or the fullscreen button).',
          },
          {
            title: 'Control slides from the editor',
            description: 'Keep the editor open on your laptop screen. Click any slide in the left Slides panel to instantly jump the Presenter window to that slide. The two windows communicate in real-time — no lag.',
          },
          {
            title: 'Switch to Controller View',
            description: 'Instead of the full editor, switch to Controller View (the button is in the editor header). Controller View shows a simplified interface with Previous/Next navigation buttons, a slide list, and a full live preview — easier to operate during a live service.',
          },
          {
            title: 'Navigate slides in Controller View',
            description: 'Use the Previous (←) and Next (→) buttons to advance slides. The current slide number and total count are shown. Click any slide in the list to jump directly to it.',
          },
          {
            title: 'Adjust settings while live',
            description: 'You can open the Settings drawer while presenting. Changes to background, font, size, and transitions take effect on the Presenter window immediately — without interrupting the current slide.',
          },
          {
            title: 'End the presentation',
            description: 'Close the Presenter window when done. The editor detects the window was closed and returns to normal editing mode. The presentation is saved.',
          },
        ],
      },
    ],
  },

  // ─── Organizations ─────────────────────────────────────────────────────────
  {
    slug: 'organizations',
    module: 'Organizations',
    icon: 'Building2',
    description: 'Create and manage organizations in the system. Available to Super Admins only.',
    sections: [
      {
        heading: 'Managing Organizations',
        steps: [
          {
            title: 'Go to the Organizations page',
            description: 'Click "Organizations" in the sidebar under Management. Only super admins can access this page.',
          },
          {
            title: 'Add an organization',
            description: 'Click "Add Organization", enter the organization name, and upload an optional logo. The organization is created immediately.',
          },
          {
            title: 'Edit an organization',
            description: 'Click the pencil icon on an organization row to update its name or logo.',
          },
          {
            title: 'Delete an organization',
            description: 'Click the trash icon to permanently delete an organization.',
            warning: 'Deleting an organization removes all associated users, events, churches, and finance data. This action cannot be undone.',
          },
        ],
      },
    ],
  },

  // ─── User Management ───────────────────────────────────────────────────────
  {
    slug: 'user-management',
    module: 'User Management',
    icon: 'Users',
    description: 'Add, update, and remove users. Assign roles and organizations.',
    sections: [
      {
        heading: 'Managing Users',
        steps: [
          {
            title: 'Go to User Management',
            description: 'Click "User Management" in the sidebar under Management.',
          },
          {
            title: 'Invite a new user',
            description: 'Click "Add User" and fill in the user\'s name, email, password, role, and organization. Available roles are: Super Admin, Org Admin, and Officer.',
            tip: 'Officers can be given a title (e.g. "Treasurer") which grants access to Finance.',
          },
          {
            title: 'Edit a user',
            description: 'Click the pencil icon on a user row to update their name, role, title, or organization.',
          },
          {
            title: 'Delete a user',
            description: 'Click the trash icon to remove a user from the system. They will no longer be able to log in.',
          },
        ],
      },
      {
        heading: 'Understanding Roles',
        steps: [
          {
            title: 'Super Admin',
            description: 'Has full access to all organizations, users, events, finance, and system settings. Can switch between organizations using the org switcher in the top bar.',
          },
          {
            title: 'Org Admin',
            description: 'Has full access to their own organization — events, registrations, finance, churches, and collaborations. Cannot manage other organizations or create new orgs.',
          },
          {
            title: 'Officer',
            description: 'Limited access: can view events, registrations, and collaborations. Officers with the "Treasurer" title also have access to Finance.',
          },
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
