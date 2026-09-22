function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createSeed() {
  const today = new Date().toISOString().slice(0, 10);

  return {
    _seedVersion: 7,

    users: [
      { id: 'u1', username: 'admin', password: 'admin', name: 'Ajoy Kumar', role: 'pm', title: 'Project Manager' },
      { id: 'u2', username: 'rahul', password: 'rahul', name: 'Rahul Sharma', role: 'dev', title: 'Senior Developer' },
      { id: 'u3', username: 'arun', password: 'arun', name: 'Arun Dev', role: 'dev', title: 'Developer' },
      { id: 'u4', username: 'developer', password: 'developer', name: 'Rohan Mehta', role: 'dev', title: 'Developer' },
    ],

    projects: [
      {
        id: 'p1',
        name: 'Client Portal Redesign',
        client: 'Nova Finance',
        pm: 'u1',
        status: 'active',
        priority: 'high',
        startDate: isoDaysFromNow(-50),
        dueDate: isoDaysFromNow(25),
        team: ['u2', 'u3', 'u4'],
        description: 'Redesign and rebuild the client self-service portal with OAuth authentication and new dashboard widgets.',
      },
      {
        id: 'p2',
        name: 'Mobile Banking App',
        client: 'Zenith Bank',
        pm: 'u1',
        status: 'active',
        priority: 'high',
        startDate: isoDaysFromNow(-70),
        dueDate: isoDaysFromNow(10),
        team: ['u2', 'u3'],
        description: 'Banking application with core banking API integration and transaction history.',
      },
      {
        id: 'p3',
        name: 'HR Portal Revamp',
        client: 'MediCare Group',
        pm: 'u1',
        status: 'on-hold',
        priority: 'medium',
        startDate: isoDaysFromNow(-20),
        dueDate: isoDaysFromNow(90),
        team: ['u3'],
        description: 'Employee onboarding flow and HR self-service portal update. Paused awaiting design mockups.',
      },
      {
        id: 'p4',
        name: 'Inventory System Migration',
        client: 'RetailPlus',
        pm: 'u1',
        status: 'completed',
        priority: 'medium',
        startDate: isoDaysFromNow(-180),
        dueDate: isoDaysFromNow(-85),
        team: ['u2'],
        description: 'Migrated legacy inventory data to the new warehouse management system.',
      },
      {
        id: 'p5',
        name: 'Payroll Enhancement',
        client: 'Nova Finance',
        pm: 'u1',
        status: 'not-started',
        priority: 'low',
        startDate: isoDaysFromNow(10),
        dueDate: isoDaysFromNow(70),
        team: ['u2'],
        description: 'Add tax slab calculation engine and new payroll report formats.',
      },
    ],

    ptds: [
      { id: 'p1t2', ref: 'PTD-1027', name: 'Dashboard Widgets', description: 'New dashboard widgets including revenue trends and a realtime alerts panel.', projectId: 'p1', receivedDate: isoDaysFromNow(-6), estimatedHours: 80, allocatedHours: 35, usedHours: 8, progress: 25, deadline: isoDaysFromNow(13), status: 'in-progress' },
      { id: 'p2t1', ref: 'PTD-1102', name: 'Core Banking API', description: 'Integration with the core banking message queue: ingestion, reconciliation and public API limits.', projectId: 'p2', receivedDate: isoDaysFromNow(-15), estimatedHours: 200, allocatedHours: 50, usedHours: 42, progress: 80, deadline: isoDaysFromNow(3), status: 'in-progress' },
      { id: 'p1t1', ref: 'PTD-1024', name: 'User Authentication Rework', description: 'Rework portal authentication: OAuth2 login, sessions, token handling and password reset.', projectId: 'p1', receivedDate: isoDaysFromNow(-10), estimatedHours: 120, allocatedHours: 100, usedHours: 82, progress: 82, deadline: isoDaysFromNow(-2), status: 'in-progress' },
    ],

    workOrders: [
      {
        id: 'wo1',
        title: 'Implement OAuth2 login flow',
        description: 'Wire the portal login to the new OAuth2 identity provider with PKCE and token refreshes.',
        projectId: 'p1',
        ptdId: 'p1t1',
        assignee: 'u2',
        priority: 'high',
        startDate: isoDaysFromNow(-42),
        dueDate: isoDaysFromNow(-12),
        estimatedHours: 40,
        actualHours: 40,
        status: 'completed',
        checklist: [
          { id: 'c1', title: 'Setup auth client config', done: true },
          { id: 'c2', title: 'Implement PKCE challenge exchange', done: true },
          { id: 'c3', title: 'Write integration test cases', done: true },
        ],
        dependencies: [],
        comments: [
          { id: 'cm1', author: 'Rahul Sharma', time: '2026-09-10 11:30', text: 'Auth server endpoints verified and unit tests passing.' },
        ],
        reviewHistory: [
          { id: 'rh1', date: isoDaysFromNow(-14), reviewer: 'Ajoy Kumar', decision: 'approved', note: 'Looks solid! PKCE flow matches standard.' },
        ],
        files: [
          { id: 'f1', name: 'oauth2-config-spec.pdf', size: '240 KB', uploadedBy: 'Ajoy Kumar', date: isoDaysFromNow(-40) },
        ],
      },
      {
        id: 'wo2',
        title: 'Session & token management',
        description: 'Handle refresh tokens, session expiry and secure encrypted storage in client cookies.',
        projectId: 'p1',
        ptdId: 'p1t1',
        assignee: 'u2',
        priority: 'high',
        startDate: isoDaysFromNow(-11),
        dueDate: isoDaysFromNow(-4),
        estimatedHours: 24,
        actualHours: 22,
        status: 'submitted-review',
        checklist: [
          { id: 'c4', title: 'Secure cookie rotation logic', done: true },
          { id: 'c5', title: 'Auto-refresh token timer hook', done: true },
          { id: 'c6', title: 'Multi-tab broadcast channel sync', done: true },
        ],
        dependencies: ['wo1'],
        comments: [
          { id: 'cm2', author: 'Rahul Sharma', time: 'Today, 09:15', text: 'Submitted for final review. Waiting for PM approval.' },
        ],
        reviewHistory: [
          { id: 'rh2', date: isoDaysFromNow(-1), reviewer: 'Rahul Sharma', decision: 'submitted', note: 'Finished cookie handling and broadcast channel tests.' },
        ],
        files: [
          { id: 'f2', name: 'session-diagram.png', size: '1.2 MB', uploadedBy: 'Rahul Sharma', date: isoDaysFromNow(-5) },
        ],
      },
      {
        id: 'wo3',
        title: 'Password reset module',
        description: 'Self-service password reset with time-limited email verification tokens.',
        projectId: 'p1',
        ptdId: 'p1t1',
        assignee: 'u3',
        priority: 'medium',
        startDate: isoDaysFromNow(-10),
        dueDate: isoDaysFromNow(1),
        estimatedHours: 18,
        actualHours: 20,
        status: 'in-progress',
        checklist: [
          { id: 'c7', title: 'Request reset email UI & API', done: true },
          { id: 'c8', title: 'Token verification page', done: true },
          { id: 'c9', title: 'Password complexity validation', done: false },
        ],
        dependencies: [],
        comments: [
          { id: 'cm3', author: 'Arun Dev', time: 'Yesterday, 16:40', text: 'Working on password strength criteria now.' },
        ],
        reviewHistory: [],
        files: [],
      },
      {
        id: 'wo4',
        title: 'Realtime alerts notification panel',
        description: 'Build web-socket notification drawer for real-time risk alerts and transaction updates.',
        projectId: 'p1',
        ptdId: 'p1t2',
        assignee: 'u4',
        priority: 'high',
        startDate: isoDaysFromNow(-5),
        dueDate: isoDaysFromNow(5),
        estimatedHours: 35,
        actualHours: 8,
        status: 'changes-requested',
        checklist: [
          { id: 'c10', title: 'WebSocket subscription manager', done: true },
          { id: 'c11', title: 'Notification badge animation', done: true },
          { id: 'c12', title: 'Sound alerts toggle setting', done: false },
        ],
        dependencies: [],
        comments: [
          { id: 'cm4', author: 'Ajoy Kumar', time: 'Yesterday, 14:00', text: 'Please ensure notification counter accurately decrements when clicked.' },
        ],
        reviewHistory: [
          { id: 'rh3', date: isoDaysFromNow(-1), reviewer: 'Ajoy Kumar', decision: 'changes-requested', note: 'Notification sound causes audio playback exception if user has not interacted.' },
        ],
        files: [
          { id: 'f3', name: 'alert-ui-mockup.fig', size: '3.4 MB', uploadedBy: 'Ajoy Kumar', date: isoDaysFromNow(-4) },
        ],
      },
      {
        id: 'wo5',
        title: 'Core Banking API Queue Ingestion',
        description: 'Implement RabbitMQ consumer to process real-time transaction messages with error retries.',
        projectId: 'p2',
        ptdId: 'p2t1',
        assignee: 'u2',
        priority: 'high',
        startDate: isoDaysFromNow(-12),
        dueDate: isoDaysFromNow(3),
        estimatedHours: 50,
        actualHours: 42,
        status: 'in-progress',
        checklist: [
          { id: 'c13', title: 'AMQP consumer connection pool', done: true },
          { id: 'c14', title: 'Dead-letter queue handling', done: true },
          { id: 'c15', title: 'Throughput load test (10k msg/sec)', done: false },
        ],
        dependencies: [],
        comments: [
          { id: 'cm5', author: 'Rahul Sharma', time: 'Today, 11:20', text: 'Connection pool benchmarking done; tuning GC parameters.' },
        ],
        reviewHistory: [],
        files: [],
      },
      {
        id: 'wo6',
        title: 'Revenue Trends Chart Widget',
        description: 'Interactive SVG line and area chart for quarterly income analytics with currency switcher.',
        projectId: 'p1',
        ptdId: 'p1t2',
        assignee: 'u3',
        priority: 'medium',
        startDate: isoDaysFromNow(2),
        dueDate: isoDaysFromNow(12),
        estimatedHours: 25,
        actualHours: 0,
        status: 'not-started',
        checklist: [
          { id: 'c16', title: 'Design SVG chart layout', done: false },
          { id: 'c17', title: 'Currency conversion API integration', done: false },
        ],
        dependencies: ['wo4'],
        comments: [],
        reviewHistory: [],
        files: [],
      },
    ],

    blockers: [
      { id: 'b1', description: 'Waiting for API documentation from client', projectId: 'p1', workOrderId: 'wo2', developerId: 'u2', priority: 'high', dateRaised: isoDaysFromNow(-1), status: 'open' },
    ],

    milestones: [
      { id: 'm1', projectId: 'p1', name: 'Requirement', status: 'done' },
      { id: 'm2', projectId: 'p1', name: 'UI Design', status: 'done' },
      { id: 'm3', projectId: 'p1', name: 'Development', status: 'in-progress' },
      { id: 'm4', projectId: 'p1', name: 'Testing', status: 'pending' },
      { id: 'm5', projectId: 'p1', name: 'Deployment', status: 'pending' },
    ],

    activity: [
      { id: 'a1', date: today, time: '09:15', actor: 'Rahul Sharma', projectId: 'p1', text: 'submitted Session & token management for review' },
      { id: 'a2', date: today, time: '11:20', actor: 'Rahul Sharma', projectId: 'p2', text: 'logged 4h on "Core Banking API Queue Ingestion"' },
      { id: 'a4', date: today, time: '14:10', actor: 'Rahul Sharma', projectId: 'p1', text: 'requested API documentation file' },
    ],

    notifications: [
      { id: 'n1', title: 'Session & token management submitted for review by Rahul', read: false },
      { id: 'n3', title: 'New blocker: Waiting for API documentation from client', read: false },
    ],
  };
}