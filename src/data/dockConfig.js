import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ListTodo,
  MessageSquare,
  Folder,
  Bug,
  Calendar,
  BarChart3,
  Bell,
} from 'lucide-react';

export const PM_APPS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', name: 'Projects', icon: Briefcase },
  { id: 'ptds', name: 'PTDs', icon: FileText },
  { id: 'workorders', name: 'Work Orders', icon: ListTodo },
  { id: 'chat', name: 'Chat', icon: MessageSquare },
  { id: 'files', name: 'Files', icon: Folder },
  { id: 'issues', name: 'Issues', icon: Bug },
  { id: 'calendar', name: 'Calendar', icon: Calendar },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

export const DEV_APPS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'workorders', name: 'Work Orders', icon: ListTodo },
  { id: 'chat', name: 'Chat', icon: MessageSquare },
  { id: 'files', name: 'Files', icon: Folder },
  { id: 'issues', name: 'Issues', icon: Bug },
  { id: 'calendar', name: 'Calendar', icon: Calendar },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

export function appsForRole(role) {
  if (role === 'dev') return DEV_APPS;
  return PM_APPS;
}