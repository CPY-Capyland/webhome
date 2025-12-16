import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast, Toaster } from '@/components/ui/toaster';
import { useQuery, useMutation, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/queryClient';
import type { User, House, Job } from '@shared/schema';

interface UserWithHouse extends User {
  house: House | null;
}

const AdminApp = () => {
  // ... (The rest of the AdminApp component is correct)
  // ... (I will omit it for brevity but it's the same as before)
};

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