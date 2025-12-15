import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { User, HouseWithUser } from "@shared/schema";
import { CooldownTimer } from "@/components/CooldownTimer";

interface Job {
  id: string;
  name: string;
  grossSalary: number;
  fees: number;
  justification: string;
}
import { useState } from "react"; // Added useState

const JOB_COOLDOWN_HOURS = 24;

interface UserStatus {
  hasHouse: boolean;
  house: {
    x: number;
    y: number;
    lastMovedAt: string;
    canMove: boolean;
  } | null;
}


export default function Jobs() {
  const { toast } = useToast();
  const [isWorking, setIsWorking] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const { data: userStatus } = useQuery<UserStatus>({
    queryKey: ["/api/user/status"],
  });

  const { data: houses = [] } = useQuery<HouseWithUser[]>({
    queryKey: ["/api/houses"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const userHouse: HouseWithUser | null = userStatus?.house && user ? {
    id: "",
    ...userStatus.house,
    userId: user.id,
    username: user.username,
    isCurrentUser: true,
    color: "",
    lastColorChangedAt: new Date(),
    placedAt: new Date(),
    lastMovedAt: new Date(userStatus.house.lastMovedAt),
  } : null;
  const lastMoveTime = userStatus?.house?.lastMovedAt ? new Date(userStatus.house.lastMovedAt) : null;

  const currentJob = user?.jobId ? jobs.find(job => job.id === user.jobId) : null;
  const isJobCooldownActive = user?.jobStoppedAt ? (new Date().getTime() < (new Date(user.jobStoppedAt).getTime() + JOB_COOLDOWN_HOURS * 60 * 60 * 1000)) : false;
  const jobCooldownEndTime = user?.jobStoppedAt ? (new Date(user.jobStoppedAt).getTime() + JOB_COOLDOWN_HOURS * 60 * 60 * 1000) : null;

  const chooseJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiRequest("POST", "/api/jobs/choose", { jobId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Métier choisi",
        description: "Vous avez choisi un nouveau métier.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec du choix du métier",
        variant: "destructive",
      });
    },
  });

  const quitJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/jobs/quit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Métier quitté",
        description: "Vous avez quitté votre métier. Vous êtes en période de récupération.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec pour quitter le métier",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        user={user}
        houseLocation={userHouse ? { x: userHouse.x, y: userHouse.y } : null}
        lastMoveTime={lastMoveTime}
        totalHouses={houses.length}
        gridSize={500}
        showMenuButton={false}
      />
      <div className="flex-1 overflow-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Métiers</h1>

        {user?.jobId && currentJob ? (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Votre métier actuel : {currentJob.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Salaire Brut: {currentJob.grossSalary} 🍊</p>
              <p>Frais: {currentJob.fees} 🍊</p>
              <p>Salaire Net: {currentJob.grossSalary + currentJob.fees} 🍊</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                onClick={() => {
                  setIsWorking(true);
                  setTimeout(() => setIsWorking(false), 3000);
                }}
                disabled={isWorking}
              >
                {isWorking ? "Travail en cours..." : "Commencer le travail"}
              </Button>
              <Button onClick={() => alert(`Votre salaire net est de ${currentJob.grossSalary + currentJob.fees} 🍊 après ${-currentJob.fees} 🍊 de frais.`)}>Consulter mon bulletin de paye</Button>
              <Button variant="destructive" onClick={() => quitJobMutation.mutate()} disabled={quitJobMutation.isPending}>Arrêter d'exercer</Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Choisir un métier</h2>
            {isJobCooldownActive && jobCooldownEndTime && (
              <div className="mb-4 text-center text-red-500">
                Vous êtes en période de récupération. Vous pourrez choisir un nouveau métier dans : <CooldownTimer endTime={jobCooldownEndTime} />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="flex flex-col gap-2">
                  {jobs.map((job) => (
                    <Card key={job.id} onClick={() => setSelectedJob(job)} className={`cursor-pointer ${selectedJob?.id === job.id ? 'border-primary' : ''}`}>
                      <CardHeader>
                        <CardTitle>{job.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>Salaire Brut: {job.grossSalary} 🍊</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                {selectedJob && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedJob.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Salaire Brut: {selectedJob.grossSalary} 🍊</p>
                      <p>Frais de Compensation: {selectedJob.fees} 🍊</p>
                      <p>Revenu Net: {selectedJob.grossSalary + selectedJob.fees} 🍊</p>
                      <p>Justification: {selectedJob.justification}</p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => chooseJobMutation.mutate(selectedJob.id)}
                        disabled={isJobCooldownActive || chooseJobMutation.isPending}
                      >
                        Choisir
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

