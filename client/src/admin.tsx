import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { User, House, Job } from '@shared/schema';

interface UserWithHouse extends User {
  house: House | null;
}

const AdminApp = () => {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: users = [], refetch: refetchUsers } = useQuery<UserWithHouse[]>({
    queryKey: ['adminUsers'],
    queryFn: () => fetch('/api/admin/users').then(res => res.json()),
    enabled: isAdmin,
  });

  const { data: jobs = [], refetch: refetchJobs } = useQuery<Job[]>({
    queryKey: ['adminJobs'],
    queryFn: () => fetch('/api/admin/jobs').then(res => res.json()),
    enabled: isAdmin,
  });

  const updateJobMutation = useMutation({
    mutationFn: async (job: Job) => {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      if (!res.ok) throw new Error('Failed to update job');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
      toast({ title: 'Métier mis à jour', description: 'Les détails du métier ont été enregistrés.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message || 'Échec de la mise à jour du métier', variant: 'destructive' });
    },
  });

  useEffect(() => {
    fetch('/api/admin/status')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          setIsAdmin(true);
        }
      });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      setIsAdmin(true);
      toast({ title: 'Connexion réussie', description: 'Bienvenue administrateur.' });
    } else {
      toast({ title: 'Erreur', description: 'Identifiants invalides', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    const res = await fetch('/api/admin/logout', { method: 'POST' });
    if (res.ok) {
      setIsAdmin(false);
      setUsername('');
      setPassword('');
      toast({ title: 'Déconnexion réussie', description: 'Vous avez été déconnecté.' });
    } else {
      toast({ title: 'Erreur', description: 'Échec de la déconnexion', variant: 'destructive' });
    }
  };

  const handleJobChange = (
    jobId: string,
    field: keyof Job,
    value: string | number
  ) => {
    const updatedJobs = jobs.map((job) =>
      job.id === jobId ? { ...job, [field]: value } : job
    );
    // This is optimistic update, a real app would have more robust state management
    queryClient.setQueryData(['adminJobs'], updatedJobs);
  };

  const handleSaveJob = (job: Job) => {
    updateJobMutation.mutate(job);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6">Connexion Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Panneau d'administration</h1>
        <Button onClick={handleLogout} variant="destructive">
          Déconnexion
        </Button>
      </header>
      <main className="p-4">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="jobs">Métiers</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <div className="mt-4">
              <h2 className="text-2xl font-semibold mb-4">Gestion des utilisateurs</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom d'utilisateur</TableHead>
                    <TableHead>Solde</TableHead>
                    <TableHead>Maison (X, Y)</TableHead>
                    <TableHead>Taille maison</TableHead>
                    <TableHead>Unités d'expansion</TableHead>
                    <TableHead>Expansion placées</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.balance} 🍊</TableCell>
                      <TableCell>
                        {user.house ? `${user.house.x}, ${user.house.y}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user.house ? user.house.size : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user.house ? user.house.expansionUnits : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user.house ? user.house.expansion.length : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="jobs">
            <div className="mt-4">
              <h2 className="text-2xl font-semibold mb-4">Gestion des métiers</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Salaire brut</TableHead>
                    <TableHead>Frais</TableHead>
                    <TableHead>Justification</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Input
                          value={job.name}
                          onChange={(e) => handleJobChange(job.id, 'name', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={job.grossSalary}
                          onChange={(e) => handleJobChange(job.id, 'grossSalary', parseInt(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={job.fees}
                          onChange={(e) => handleJobChange(job.id, 'fees', parseInt(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={job.justification || ''}
                          onChange={(e) => handleJobChange(job.id, 'justification', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => handleSaveJob(job)}>
                          Enregistrer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

import { queryClient, QueryClientProvider } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// ... (rest of the AdminApp component)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AdminApp />
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);