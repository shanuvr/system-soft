import {
  LayoutDashboard,
  Briefcase,
  FileText,
  CheckSquare,
  ListTodo,
  Users,
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
  { id: 'mywork', name: 'My Work', icon: CheckSquare },
  { id: 'workorders', name: 'Work Orders', icon: ListTodo },
  { id: 'team', name: 'Team', icon: Users },
  { id: 'chat', name: 'Chat', icon: MessageSquare },
  { id: 'files', name: 'Files', icon: Folder },
  { id: 'issues', name: 'Issues', icon: Bug },
  { id: 'calendar', name: 'Calendar', icon: Calendar },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

export const DEV_APPS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'mywork', name: 'My Work', icon: CheckSquare },
  { id: 'chat', name: 'Chat', icon: MessageSquare },
  { id: 'files', name: 'Files', icon: Folder },
  { id: 'issues', name: 'Issues', icon: Bug },
  { id: 'calendar', name: 'Calendar', icon: Calendar },
];

export function appsForRole(role) {
  if (role === 'dev') return DEV_APPS;
  return PM_APPS;
}