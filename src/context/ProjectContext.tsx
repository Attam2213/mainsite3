import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type ProjectStatus = 'pending' | 'in_progress' | 'completed';

export interface Comment {
  id: string;
  authorId: string;
  authorName?: string; // Backend might populate this in separate author object
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  text: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'file' | 'image' | 'link';
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  name: string;
  status: ProjectStatus;
  progress: number;
  deadline: string;
  cost: string;
  description?: string;
  comments?: Comment[];
  attachments?: Attachment[];
}

interface ProjectContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectsByClientId: (clientId: string) => Project[];
  addComment: (projectId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<void>;
  addAttachment: (projectId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => Promise<void>;
  deleteAttachment: (projectId: string, attachmentId: string) => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/projects', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const addProject = async (newProject: Omit<Project, 'id'>) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newProject)
    });
    
    if (res.ok) {
      const project = await res.json();
      // Backend might not return full structure with empty arrays immediately, 
      // but let's assume it returns the created object.
      // Better to re-fetch or normalize.
      // For now, append.
      setProjects(prev => [project, ...prev]);
    } else {
      throw new Error('Failed to add project');
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });

    if (res.ok) {
      const updated = await res.json();
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
    } else {
      throw new Error('Failed to update project');
    }
  };

  const deleteProject = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== id));
    } else {
      throw new Error('Failed to delete project');
    }
  };

  const getProjectsByClientId = (clientId: string) => {
    return projects.filter(p => p.clientId === clientId);
  };

  const addComment = async (projectId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const res = await fetch(`/api/projects/${projectId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(comment)
    });

    if (res.ok) {
      const newComment = await res.json();
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      }));
    } else {
      throw new Error('Failed to add comment');
    }
  };

  const addAttachment = async (projectId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>) => {
    const res = await fetch(`/api/projects/${projectId}/attachments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(attachment)
    });

    if (res.ok) {
      const newAttachment = await res.json();
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            attachments: [...(p.attachments || []), newAttachment]
          };
        }
        return p;
      }));
    } else {
      throw new Error('Failed to add attachment');
    }
  };

  const deleteAttachment = async (projectId: string, attachmentId: string) => {
    const res = await fetch(`/api/projects/${projectId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (res.ok) {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            attachments: (p.attachments || []).filter(a => a.id !== attachmentId)
          };
        }
        return p;
      }));
    } else {
      throw new Error('Failed to delete attachment');
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      updateProject, 
      deleteProject, 
      getProjectsByClientId, 
      addComment,
      addAttachment,
      deleteAttachment,
      loading
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
