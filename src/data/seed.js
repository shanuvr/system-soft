function isoDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createSeed() {
  const today = new Date().toISOString().slice(0, 10);

  return {
    _seedVersion: 12,

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
      { id: 'p1t2', ref: 'PTD-1027', name: 'Dashboard Widgets', description: 'New dashboard widgets including revenue trends and a realtime alerts panel.', projectId: 'p1', receivedDate: isoDaysFromNow(-6), estimatedHours: 80, allocatedHours: 0, usedHours: 0, progress: 0, deadline: isoDaysFromNow(13), status: 'in-progress' },
      { id: 'p2t1', ref: 'PTD-1102', name: 'Core Banking API', description: 'Integration with the core banking message queue: ingestion, reconciliation and public API limits.', projectId: 'p2', receivedDate: isoDaysFromNow(-15), estimatedHours: 200, allocatedHours: 72, usedHours: 38, progress: 25, deadline: isoDaysFromNow(3), status: 'in-progress' },
      { id: 'p1t1', ref: 'PTD-1024', name: 'User Authentication Rework', description: 'Rework portal authentication: OAuth2 login, sessions, token handling and password reset.', projectId: 'p1', receivedDate: isoDaysFromNow(-10), estimatedHours: 120, allocatedHours: 56, usedHours: 42, progress: 65, deadline: isoDaysFromNow(-2), status: 'in-progress' },
    ],

    workOrders: [
      // PTD-1102 Core Banking API — 3 work orders
      { id: 'WORK-1004', title: 'Message Queue Ingestion Service', description: 'Build the message queue consumer for core banking transactions with retry logic and dead-letter handling.', projectId: 'p2', ptdId: 'p2t1', assignee: 'u2', priority: 'high', startDate: isoDaysFromNow(-12), dueDate: isoDaysFromNow(-1), estimatedHours: 32, actualHours: 28, status: 'in-progress', progress: 75, dependencies: [], comments: [], reviewHistory: [], files: [] },
      { id: 'WORK-1005', title: 'Transaction Reconciliation Engine', description: 'Automated reconciliation between bank ledger and internal records with mismatch reporting.', projectId: 'p2', ptdId: 'p2t1', assignee: 'u3', priority: 'high', startDate: isoDaysFromNow(-8), dueDate: isoDaysFromNow(2), estimatedHours: 24, actualHours: 10, status: 'in-progress', progress: 33, dependencies: ['WORK-1004'], comments: [], reviewHistory: [], files: [] },
      { id: 'WORK-1006', title: 'Public API Rate Limiter', description: 'Implement rate limiting middleware for the public banking API endpoints with token bucket algorithm.', projectId: 'p2', ptdId: 'p2t1', assignee: 'u2', priority: 'medium', startDate: isoDaysFromNow(-2), dueDate: isoDaysFromNow(5), estimatedHours: 16, actualHours: 0, status: 'not-started', progress: 0, dependencies: [], comments: [], reviewHistory: [], files: [] },

      // PTD-1024 User Authentication Rework — 3 work orders
      { id: 'WORK-1007', title: 'OAuth2 Login Flow', description: 'Implement OAuth2 authorization code flow with Google and Microsoft identity providers.', projectId: 'p1', ptdId: 'p1t1', assignee: 'u2', priority: 'high', startDate: isoDaysFromNow(-9), dueDate: isoDaysFromNow(-3), estimatedHours: 20, actualHours: 20, status: 'done', progress: 100, dependencies: [], comments: [], reviewHistory: [], files: [] },
      { id: 'WORK-1008', title: 'Session & Token Management', description: 'Implement JWT refresh token rotation, session expiry handling, and secure cookie storage.', projectId: 'p1', ptdId: 'p1t1', assignee: 'u3', priority: 'high', startDate: isoDaysFromNow(-6), dueDate: isoDaysFromNow(1), estimatedHours: 20, actualHours: 16, status: 'in-progress', progress: 65, dependencies: ['WORK-1007'], comments: [], reviewHistory: [], files: [] },
      { id: 'WORK-1009', title: 'Password Reset Flow', description: 'Build the forgot-password flow with email verification, OTP input, and new password form.', projectId: 'p1', ptdId: 'p1t1', assignee: 'u4', priority: 'medium', startDate: isoDaysFromNow(-3), dueDate: isoDaysFromNow(4), estimatedHours: 16, actualHours: 6, status: 'in-progress', progress: 30, dependencies: [], comments: [], reviewHistory: [], files: [] },
    ],

    blockers: [],

    milestones: [
      { id: 'm1', projectId: 'p1', name: 'Requirement', status: 'done' },
      { id: 'm2', projectId: 'p1', name: 'UI Design', status: 'done' },
      { id: 'm3', projectId: 'p1', name: 'Development', status: 'in-progress' },
      { id: 'm4', projectId: 'p1', name: 'Testing', status: 'pending' },
      { id: 'm5', projectId: 'p1', name: 'Deployment', status: 'pending' },
    ],

    activity: [
      { id: 'a1', date: isoDaysFromNow(0), time: '09:15', actor: 'Rahul Sharma', projectId: 'p1', text: 'logged 4h on "Revenue Trends Chart Component"' },
      { id: 'a2', date: isoDaysFromNow(0), time: '10:30', actor: 'Arun Dev', projectId: 'p2', text: 'logged 3h on "Transaction Reconciliation Engine"' },
      { id: 'a3', date: isoDaysFromNow(-1), time: '14:00', actor: 'Rohan Mehta', projectId: 'p1', text: 'logged 2h on "Password Reset Flow"' },
      { id: 'a4', date: isoDaysFromNow(-1), time: '16:45', actor: 'Rahul Sharma', projectId: 'p2', text: 'logged 6h on "Message Queue Ingestion Service"' },
      { id: 'a5', date: isoDaysFromNow(-2), time: '11:00', actor: 'Arun Dev', projectId: 'p1', text: 'completed checklist item on "Session & Token Management"' },
    ],

    notifications: [],
  };
}