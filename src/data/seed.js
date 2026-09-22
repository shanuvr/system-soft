function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createSeed() {
  const today = new Date().toISOString().slice(0, 10);

  return {
    _seedVersion: 3,

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
        team: ['u2', 'u3'],
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
      { id: 'p1t1', ref: 'PTD-1024', name: 'User Authentication Rework', description: 'Rework portal authentication: OAuth2 login, sessions, token handling and password reset.', projectId: 'p1', source: 'accounts', receivedDate: isoDaysFromNow(-10), estimatedHours: 120, allocatedHours: 100, usedHours: 82, progress: 82, deadline: isoDaysFromNow(-2), status: 'in-progress' },
      { id: 'p1t2', ref: 'PTD-1027', name: 'Dashboard Widgets', description: 'New dashboard widgets including revenue trends and a realtime alerts panel.', projectId: 'p1', source: 'accounts', receivedDate: isoDaysFromNow(-6), estimatedHours: 80, allocatedHours: 72, usedHours: 30, progress: 42, deadline: isoDaysFromNow(13), status: 'in-progress' },
      { id: 'p2t1', ref: 'PTD-1102', name: 'Core Banking API', description: 'Integration with the core banking message queue: ingestion, reconciliation and public API limits.', projectId: 'p2', source: 'accounts', receivedDate: isoDaysFromNow(-15), estimatedHours: 200, allocatedHours: 180, usedHours: 170, progress: 94, deadline: isoDaysFromNow(3), status: 'in-progress' },
      { id: 'p2t2', ref: 'PTD-1110', name: 'Transaction History', description: 'Paginated transaction history endpoints with filters and export.', projectId: 'p2', source: 'accounts', receivedDate: isoDaysFromNow(-3), estimatedHours: 60, allocatedHours: 40, usedHours: 12, progress: 30, deadline: isoDaysFromNow(18), status: 'not-started' },
      { id: 'p3t1', ref: 'PTD-1201', name: 'Employee Onboarding Flow', description: 'Multi-step self-service onboarding flow for new employees on the HR portal.', projectId: 'p3', source: 'accounts', receivedDate: isoDaysFromNow(-9), estimatedHours: 90, allocatedHours: 60, usedHours: 15, progress: 25, deadline: isoDaysFromNow(44), status: 'on-hold' },
      { id: 'p3t2', ref: 'PTD-1210', name: 'Leave Management Integration', description: 'Integrate the leave balance API into the HR self-service portal.', projectId: 'p3', source: 'accounts', receivedDate: isoDaysFromNow(-1), estimatedHours: 40, allocatedHours: 0, usedHours: 0, progress: 0, deadline: isoDaysFromNow(30), status: 'received' },
      { id: 'p4t1', ref: 'PTD-998', name: 'Legacy Data Export', description: 'Extract and transform legacy inventory records into the new warehouse format.', projectId: 'p4', source: 'accounts', receivedDate: isoDaysFromNow(-100), estimatedHours: 50, allocatedHours: 50, usedHours: 50, progress: 100, deadline: isoDaysFromNow(-90), status: 'completed' },
      { id: 'p5t1', ref: 'PTD-1301', name: 'Tax Slab Calculator', description: 'Configurable tax slab engine for the payroll module.', projectId: 'p5', source: 'accounts', receivedDate: isoDaysFromNow(-2), estimatedHours: 40, allocatedHours: 0, usedHours: 0, progress: 0, deadline: isoDaysFromNow(59), status: 'not-started' },
      { id: 'p5t2', ref: 'PTD-1310', name: 'Salary Slip Generation', description: 'Automated monthly salary slip PDF generation for all employees.', projectId: 'p5', source: 'accounts', receivedDate: isoDaysFromNow(0), estimatedHours: 30, allocatedHours: 0, usedHours: 0, progress: 0, deadline: isoDaysFromNow(40), status: 'received' },
      { id: 'p0t1', ref: 'PTD-1401', name: 'Client Feedback Portal', description: 'New portal section where clients can submit feedback on delivered work.', projectId: null, source: 'accounts', receivedDate: isoDaysFromNow(0), estimatedHours: 60, allocatedHours: 0, usedHours: 0, progress: 0, deadline: isoDaysFromNow(25), status: 'received' },
    ],

    workOrders: [
      { id: 'wo1', title: 'Implement OAuth2 login flow', description: 'Wire the portal login to the new OAuth2 identity provider.', projectId: 'p1', ptdId: 'p1t1', assignee: 'u2', priority: 'high', startDate: isoDaysFromNow(-42), dueDate: isoDaysFromNow(-12), estimatedHours: 40, actualHours: 40, status: 'completed' },
      { id: 'wo2', title: 'Session & token management', description: 'Handle refresh tokens, session expiry and secure storage.', projectId: 'p1', ptdId: 'p1t1', assignee: 'u2', priority: 'high', startDate: isoDaysFromNow(-11), dueDate: isoDaysFromNow(-4), estimatedHours: 24, actualHours: 22, status: 'submitted-review' },
      { id: 'wo3', title: 'Password reset module', description: 'Self-service password reset with email verification.', projectId: 'p1', ptdId: 'p1t1', assignee: 'u3', priority: 'medium', startDate: isoDaysFromNow(-10), dueDate: isoDaysFromNow(0), estimatedHours: 18, actualHours: 20, status: 'in-progress' },
      { id: 'wo4', title: 'Revenue trends widget', description: 'Chart widget showing client revenue over the last 12 months.', projectId: 'p1', ptdId: 'p1t2', assignee: 'u3', priority: 'medium', startDate: isoDaysFromNow(-7), dueDate: isoDaysFromNow(10), estimatedHours: 20, actualHours: 8, status: 'in-progress' },
      { id: 'wo5', title: 'Alerts notification panel', description: 'Realtime alerts and notifications panel for the dashboard.', projectId: 'p1', ptdId: 'p1t2', assignee: 'u2', priority: 'low', startDate: isoDaysFromNow(-2), dueDate: isoDaysFromNow(16), estimatedHours: 16, actualHours: 0, status: 'not-started' },
      { id: 'wo6', title: 'Transaction ingestion service', description: 'Consume transactions from the core banking message queue.', projectId: 'p2', ptdId: 'p2t1', assignee: 'u2', priority: 'high', startDate: isoDaysFromNow(-64), dueDate: isoDaysFromNow(-38), estimatedHours: 60, actualHours: 60, status: 'completed' },
      { id: 'wo7', title: 'Balance reconciliation job', description: 'Nightly reconciliation between local and core balances.', projectId: 'p2', ptdId: 'p2t1', assignee: 'u3', priority: 'high', startDate: isoDaysFromNow(-37), dueDate: isoDaysFromNow(-17), estimatedHours: 45, actualHours: 48, status: 'submitted-review' },
      { id: 'wo8', title: 'API rate limiting', description: 'Add throttling and quota enforcement to public endpoints.', projectId: 'p2', ptdId: 'p2t1', assignee: 'u2', priority: 'medium', startDate: isoDaysFromNow(-16), dueDate: isoDaysFromNow(2), estimatedHours: 30, actualHours: 20, status: 'in-progress' },
      { id: 'wo9', title: 'Transaction history endpoints', description: 'Paginated history API with filters and export.', projectId: 'p2', ptdId: 'p2t2', assignee: 'u3', priority: 'medium', startDate: isoDaysFromNow(9), dueDate: isoDaysFromNow(18), estimatedHours: 25, actualHours: 0, status: 'not-started' },
      { id: 'wo10', title: 'Onboarding wizard UI', description: 'Multi-step onboarding flow for new employees.', projectId: 'p3', ptdId: 'p3t1', assignee: 'u3', priority: 'medium', startDate: isoDaysFromNow(-2), dueDate: isoDaysFromNow(28), estimatedHours: 30, actualHours: 10, status: 'in-progress' },
      { id: 'wo11', title: 'Legacy DB export scripts', description: 'Extract and transform legacy inventory records.', projectId: 'p4', ptdId: 'p4t1', assignee: 'u2', priority: 'medium', startDate: isoDaysFromNow(-135), dueDate: isoDaysFromNow(-95), estimatedHours: 35, actualHours: 35, status: 'completed' },
      { id: 'wo12', title: 'Tax slab rules engine', description: 'Configurable tax slab engine for the payroll module.', projectId: 'p5', ptdId: 'p5t1', assignee: 'u2', priority: 'medium', startDate: isoDaysFromNow(20), dueDate: isoDaysFromNow(54), estimatedHours: 20, actualHours: 0, status: 'not-started' },
    ],

    blockers: [
      { id: 'b1', description: 'Waiting for API documentation from client', projectId: 'p1', workOrderId: 'wo2', developerId: 'u2', priority: 'high', dateRaised: isoDaysFromNow(-1), status: 'open' },
      { id: 'b2', description: 'Database access permissions pending', projectId: 'p2', workOrderId: 'wo8', developerId: 'u2', priority: 'medium', dateRaised: isoDaysFromNow(-2), status: 'open' },
      { id: 'b3', description: 'Design mockups not finalized', projectId: 'p3', workOrderId: 'wo10', developerId: 'u3', priority: 'medium', dateRaised: isoDaysFromNow(-4), status: 'open' },
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
      { id: 'a2', date: today, time: '10:30', actor: 'Ajoy Kumar', projectId: 'p1', text: 'reviewed and approved Transaction ingestion service' },
      { id: 'a3', date: today, time: '11:45', actor: 'Arun Dev', projectId: 'p2', text: 'logged 2 hours on API rate limiting' },
      { id: 'a4', date: today, time: '14:10', actor: 'Rahul Sharma', projectId: 'p1', text: 'requested API documentation file' },
      { id: 'a5', date: today, time: '16:20', actor: 'Ajoy Kumar', projectId: 'p2', text: 'raised deadline reminder for Balance reconciliation job' },
      { id: 'a6', date: today, time: '17:00', actor: 'Arun Dev', projectId: 'p3', text: 'updated progress on Onboarding wizard UI' },
    ],

    notifications: [
      { id: 'n1', title: 'Session & token management submitted for review by Rahul', read: false },
      { id: 'n2', title: 'API rate limiting approaching deadline', read: false },
      { id: 'n3', title: 'New blocker: Waiting for API documentation from client', read: false },
      { id: 'n4', title: 'Ajoy approved Transaction ingestion service', read: true },
    ],
  };
}