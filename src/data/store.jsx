import { useEffect, useState } from 'react';
import { AppContext } from './context';
import { createSeed } from './seed';

const DB_KEY = 'system-soft:db';
const SESSION_KEY = 'system-soft:session';
const SEED_VERSION = 6;

function readKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — ignore
  }
}

function uid(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function loadDb() {
  const persisted = readKey(DB_KEY);
  if (persisted && persisted._seedVersion === SEED_VERSION) return persisted;
  if (persisted && persisted._seedVersion !== SEED_VERSION) {
    console.warn(
      `[system-soft] Seed data updated (version ${persisted._seedVersion} -> ${SEED_VERSION}); stored db was reset to the new seed.`,
    );
  }
  return createSeed();
}

export function AppProvider({ children }) {
  const [db, setDb] = useState(loadDb);
  const [currentUser, setCurrentUser] = useState(() => readKey(SESSION_KEY));

  useEffect(() => {
    writeKey(DB_KEY, db);
  }, [db]);

  const login = (username, password) => {
    const user = db.users.find(
      (u) => u.username === username.trim().toLowerCase() && u.password === password,
    );
    if (!user) return null;
    setCurrentUser(user);
    writeKey(SESSION_KEY, user);
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const resetDb = () => {
    setDb(createSeed());
  };

  const updatePtd = (id, patch) => {
    setDb((prev) => ({
      ...prev,
      ptds: prev.ptds.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const createWorkOrders = (ptdId, rows) => {
    const clean = rows.filter((r) => r.title && r.title.trim());
    if (!clean.length) return 0;
    const now = new Date().toISOString().slice(0, 10);
    const projectId = db.ptds.find((p) => p.id === ptdId)?.projectId || null;
    const newWorkOrders = clean.map((r) => ({
      id: uid('wo'),
      title: r.title.trim(),
      description: r.description?.trim() || '',
      projectId,
      ptdId,
      assignee: r.assignee,
      priority: r.priority || 'medium',
      startDate: r.startDate || now,
      dueDate: r.dueDate || '',
      estimatedHours: Number(r.estimatedHours) || 0,
      actualHours: 0,
      status: 'not-started',
    }));
    const totalHours = newWorkOrders.reduce((s, w) => s + w.estimatedHours, 0);
    setDb((prev) => ({
      ...prev,
      workOrders: [...prev.workOrders, ...newWorkOrders],
      ptds: prev.ptds.map((p) =>
        p.id === ptdId
          ? {
              ...p,
              allocatedHours: (p.allocatedHours || 0) + totalHours,
              status: p.status === 'received' || p.status === 'not-started' ? 'in-progress' : p.status,
            }
          : p,
      ),
    }));
    return newWorkOrders.length;
  };

  const updateWorkOrderStatus = (id, status) => {
    setDb((prev) => {
      const target = prev.workOrders.find((w) => w.id === id);
      if (!target) return prev;
      const today = new Date().toISOString().slice(0, 10);
      const project = prev.projects.find((p) => p.id === target.projectId);
      return {
        ...prev,
        workOrders: prev.workOrders.map((w) => (w.id === id ? { ...w, status } : w)),
        activity: [
          {
            id: uid('a'),
            date: today,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
            actor: currentUser?.name || 'User',
            projectId: target.projectId,
            text: `${currentUser?.name || 'User'} set "${target.title}" to ${status.replaceAll('-', ' ')}${
              project ? ` in ${project.name}` : ''
            }`,
          },
          ...(prev.activity || []),
        ],
      };
    });
  };

  const updateWorkOrder = (id, patch) => {
    setDb((prev) => {
      const target = prev.workOrders.find((w) => w.id === id);
      if (!target) return prev;
      const workOrders = prev.workOrders.map((w) => (w.id === id ? { ...w, ...patch } : w));
      const ptdWos = workOrders.filter((w) => w.ptdId === target.ptdId);
      return {
        ...prev,
        workOrders,
        ptds: prev.ptds.map((p) =>
          p.id === target.ptdId
            ? {
                ...p,
                allocatedHours: ptdWos.reduce((s, w) => s + (w.estimatedHours || 0), 0),
                usedHours: ptdWos.reduce((s, w) => s + (w.actualHours || 0), 0),
              }
            : p,
        ),
      };
    });
  };

  const deleteWorkOrder = (id) => {
    setDb((prev) => {
      const target = prev.workOrders.find((w) => w.id === id);
      if (!target) return prev;
      const ptdWos = prev.workOrders.filter((w) => w.ptdId === target.ptdId && w.id !== id);
      return {
        ...prev,
        workOrders: prev.workOrders.filter((w) => w.id !== id),
        ptds: prev.ptds.map((p) =>
          p.id === target.ptdId
            ? {
                ...p,
                allocatedHours: ptdWos.reduce((s, w) => s + (w.estimatedHours || 0), 0),
                usedHours: ptdWos.reduce((s, w) => s + (w.actualHours || 0), 0),
                status: ptdWos.length === 0 && p.status === 'in-progress' ? 'not-started' : p.status,
              }
            : p,
        ),
      };
    });
  };

  const createProject = (projectData) => {
    const id = uid('p');
    const today = new Date().toISOString().slice(0, 10);
    const newProject = {
      id,
      name: projectData.name.trim(),
      client: projectData.client?.trim() || 'Internal',
      pm: projectData.pm || currentUser?.id || 'u1',
      status: projectData.status || 'not-started',
      priority: projectData.priority || 'medium',
      startDate: projectData.startDate || today,
      dueDate: projectData.dueDate || '',
      team: projectData.team || [],
      description: projectData.description?.trim() || '',
    };
    const defaultMilestones = [
      { id: uid('m'), projectId: id, name: 'Requirement', status: 'pending' },
      { id: uid('m'), projectId: id, name: 'UI Design', status: 'pending' },
      { id: uid('m'), projectId: id, name: 'Development', status: 'pending' },
      { id: uid('m'), projectId: id, name: 'Testing', status: 'pending' },
      { id: uid('m'), projectId: id, name: 'Deployment', status: 'pending' },
    ];
    setDb((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
      milestones: [...(prev.milestones || []), ...defaultMilestones],
      activity: [
        {
          id: uid('a'),
          date: today,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          actor: currentUser?.name || 'Project Manager',
          projectId: id,
          text: `created new project "${newProject.name}"`,
        },
        ...(prev.activity || []),
      ],
    }));
    return id;
  };

  const updateProject = (id, patch) => {
    setDb((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const deleteProject = (id) => {
    setDb((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      ptds: prev.ptds.filter((t) => t.projectId !== id),
      workOrders: prev.workOrders.filter((w) => w.projectId !== id),
      milestones: (prev.milestones || []).filter((m) => m.projectId !== id),
      activity: (prev.activity || []).filter((a) => a.projectId !== id),
    }));
  };

  const updateMilestone = (id, patch) => {
    setDb((prev) => ({
      ...prev,
      milestones: (prev.milestones || []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  };

  const raiseBlocker = (blockerData) => {
    const id = uid('b');
    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const targetWo = db.workOrders.find((w) => w.id === blockerData.workOrderId);
    const newBlocker = {
      id,
      description: blockerData.description.trim(),
      projectId: blockerData.projectId || targetWo?.projectId || null,
      workOrderId: blockerData.workOrderId || null,
      developerId: blockerData.developerId || currentUser?.id || 'u2',
      priority: blockerData.priority || 'high',
      type: blockerData.type || 'Technical issue',
      dateRaised: today,
      status: 'open',
    };
    setDb((prev) => ({
      ...prev,
      blockers: [newBlocker, ...(prev.blockers || [])],
      notifications: [
        {
          id: uid('n'),
          title: `New blocker raised by ${currentUser?.name || 'Developer'}: ${newBlocker.description}`,
          read: false,
        },
        ...(prev.notifications || []),
      ],
      activity: [
        {
          id: uid('a'),
          date: today,
          time,
          actor: currentUser?.name || 'Developer',
          projectId: newBlocker.projectId,
          text: `raised blocker: "${newBlocker.description}"`,
        },
        ...(prev.activity || []),
      ],
    }));
  };

  const logHours = (workOrderId, hours, note = '') => {
    const hrs = Number(hours) || 0;
    if (hrs <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const targetWo = db.workOrders.find((w) => w.id === workOrderId);
    if (!targetWo) return;

    setDb((prev) => {
      const updatedWorkOrders = prev.workOrders.map((w) =>
        w.id === workOrderId ? { ...w, actualHours: (w.actualHours || 0) + hrs } : w,
      );
      const ptdWos = updatedWorkOrders.filter((w) => w.ptdId === targetWo.ptdId);
      const usedHours = ptdWos.reduce((s, w) => s + (w.actualHours || 0), 0);

      return {
        ...prev,
        workOrders: updatedWorkOrders,
        ptds: prev.ptds.map((p) => (p.id === targetWo.ptdId ? { ...p, usedHours } : p)),
        activity: [
          {
            id: uid('a'),
            date: today,
            time,
            actor: currentUser?.name || 'Developer',
            projectId: targetWo.projectId,
            text: `logged ${hrs}h on "${targetWo.title}"${note ? ` (${note})` : ''}`,
          },
          ...(prev.activity || []),
        ],
      };
    });
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        login,
        logout,
        resetDb,
        updatePtd,
        createWorkOrders,
        updateWorkOrder,
        updateWorkOrderStatus,
        deleteWorkOrder,
        createProject,
        updateProject,
        deleteProject,
        updateMilestone,
        raiseBlocker,
        logHours,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}