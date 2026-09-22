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
        deleteWorkOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}