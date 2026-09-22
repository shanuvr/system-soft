function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createSeed() {
  const today = new Date().toISOString().slice(0, 10);

  return {
    _seedVersion: 6,

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
      { id: 'p1t2', ref: 'PTD-1027', name: 'Dashboard Widgets', description: 'New dashboard widgets including revenue trends and a realtime alerts panel.', projectId: 'p1', receivedDate: isoDaysFromNow(-6), estimatedHours: 80, allocatedHours: 0, usedHours: 0, progress: 0, deadline: isoDaysFromNow(13), status: 'not-started' },
      { id: 'p2t1', ref: 'PTD-1102', name: 'Core Banking API', description: 'Integration with the core banking message queue: ingestion, reconciliation and public API limits.', projectId: 'p2', receivedDate: isoDaysFromNow(-15), estimatedHours: 200, allocatedHours: 0, usedHours: 0, progress: 0, deadline: isoDaysFromNow(3), status: 'not-started' },
      { id: 'p1t1', ref: 'PTD-1024', name: 'User Authentication Rework', description: 'Rework portal authentication: OAuth2 login, sessions, token handling and password reset.', projectId: 'p1', receivedDate: isoDaysFromNow(-10), estimatedHours: 120, allocatedHours: 100, usedHours: 82, progress: 82, deadline: isoDaysFromNow(-2), status: 'in-progress' },
    ],

    workOrders: [
      { id: 'wo1', title: 'Implement OAuth2 login flow', description: 'Wire the portal login to the new OAuth2 identity provider.', projectId: 'p1', ptdId: 'p1t1', assignee: 'u2', priority: 'high', startDate: isoDaysFromNow(-42), dueDate: isoDaysFromNow(-12), estimatedHours: 40, actualHours: 40, status: 'completed' },
      { id: 'wo2', title: 'Session & token management', description: 'Handle refresh tokens, session expiry and secure storage.', projectId: 'p1', ptdId: 'p1t1', assignee: 'u2', priority: 'high', startDate: isoDaysFromNow(-11), dueDate: isoDaysFromNow(-4), estimatedHours: 24, actualHours: 22, status: 'submitted-review' },
      { id: 'wo3', title: 'Password reset module', description: 'Self-service password reset with email verification.', projectId: 'p1', ptdId: 'p1t1', assignee: 'u3', priority: 'medium', startDate: isoDaysFromNow(-10), dueDate: isoDaysFromNow(0), estimatedHours: 18, actualHours: 20, status: 'in-progress' },
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
      { id: 'a4', date: today, time: '14:10', actor: 'Rahul Sharma', projectId: 'p1', text: 'requested API documentation file' },
    ],

    notifications: [
      { id: 'n1', title: 'Session & token management submitted for review by Rahul', read: false },
      { id: 'n3', title: 'New blocker: Waiting for API documentation from client', read: false },
    ],
  };
}