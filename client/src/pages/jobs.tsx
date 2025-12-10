import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Job, User } from "@shared/schema";
import Header from "@/components/Header";

export default function Jobs() {
  const { toast } = useToast();

  const { data: user } = useQuery<User | null>({
    queryKey: ["/api/me"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

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

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        user={user}
        houseLocation={null}
        lastMoveTime={null}
        totalHouses={0}
        gridSize={500}
        showMenuButton={false}
      />
      <div className="flex-1 overflow-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Choisir un métier</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle>{job.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Salaire Brut: {job.grossSalary}</p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => chooseJobMutation.mutate(job.id)}
                  disabled={user?.jobId === job.id}
                >
                  {user?.jobId === job.id ? "Métier actuel" : "Choisir"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
