import { useEffect, useState } from 'react';
import { AppContext } from './context';
import { createSeed } from './seed';

const DB_KEY = 'system-soft:db';
const SESSION_KEY = 'system-soft:session';
const SEED_VERSION = 3;

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

  const createPtd = (data) => {
    const ptd = {
      id: uid('ptd'),
      ref: data.ref || 'PTD-0000',
      name: data.name,
      description: data.description || '',
      projectId: data.projectId || null,
      source: 'manual',
      receivedDate: data.receivedDate || new Date().toISOString().slice(0, 10),
      estimatedHours: Number(data.estimatedHours) || 0,
      allocatedHours: 0,
      usedHours: 0,
      progress: 0,
      deadline: data.deadline || '',
      status: 'received',
    };
    setDb((prev) => ({ ...prev, ptds: [...prev.ptds, ptd] }));
    return ptd;
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

  return (
    <AppContext.Provider
      value={{ db, currentUser, login, logout, resetDb, createPtd, updatePtd, createWorkOrders }}
    >
      {children}
    </AppContext.Provider>
  );
}