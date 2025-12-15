import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import type { InsertLaw } from "@shared/schema";

const COOLDOWN_HOURS = 24;
const GRID_SIZE = 500;
const VOTING_DELAY_HOURS = 24;
const VOTING_DURATION_HOURS = 168; // 1 week
const JOB_COOLDOWN_HOURS = 24;

function isVotable(law: any): boolean {
  // Must be active status
  if (law.status !== "active") return false;
  
  // If voting already closed, check if in tiebreak
  if (law.votingClosedAt) {
    return law.isInTiebreak;
  }
  
  const now = new Date();
  const votingStart = new Date(law.publishedAt.getTime() + VOTING_DELAY_HOURS * 60 * 60 * 1000);
  const votingEnd = new Date(votingStart.getTime() + VOTING_DURATION_HOURS * 60 * 60 * 1000);

  return now >= votingStart && now < votingEnd;
}

function canMoveHouse(lastMovedAt: Date): boolean {
  const now = new Date();
  const cooldownEnd = new Date(lastMovedAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
  return now >= cooldownEnd;
}

function canChangeColor(lastColorChangedAt: Date): boolean {
  const now = new Date();
  const cooldownEnd = new Date(lastColorChangedAt.getTime() + 60 * 1000);
  return now >= cooldownEnd;
}

function canTakeJob(jobStoppedAt: Date | null | undefined): boolean {
  if (!jobStoppedAt) return true; // No cooldown if never stopped a job
  const now = new Date();
  const cooldownEnd = new Date(jobStoppedAt.getTime() + JOB_COOLDOWN_HOURS * 60 * 60 * 1000);
  return now >= cooldownEnd;
}

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all houses
  app.get("/api/houses", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const allHouses = await storage.getAllHouses();
      
      const housesWithUser = allHouses.map(house => ({
        ...house,
        isCurrentUser: house.userId === userId,
      }));
      
      res.json(housesWithUser);
    } catch (error) {
      console.error("Error fetching houses:", error);
      res.status(500).json({ error: "Échec de la récupération des maisons" });
    }
  });

  // Get current user's house
  app.get("/api/houses/mine", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const house = await storage.getHouse(userId);
      
      if (!house) {
        return res.json(null);
      }
      
      res.json({
        ...house,
        isCurrentUser: true,
        canMove: canMoveHouse(house.lastMovedAt),
      });
    } catch (error) {
      console.error("Error fetching user house:", error);
      res.status(500).json({ error: "Échec de la récupération de votre maison" });
    }
  });

  // Place or move house
  app.post("/api/houses", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { x, y } = req.body;
      
      // Validate coordinates
      if (typeof x !== "number" || typeof y !== "number" || 
          x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
        return res.status(400).json({ error: "Coordonnées invalides" });
      }
      
      // Check if space is occupied
      const existingHouse = await storage.getHouseByCoordinates(x, y);
      if (existingHouse) {
        return res.status(400).json({ error: "Cet emplacement est déjà occupé" });
      }
      
      // Check if user already has a house
      const userHouse = await storage.getHouse(userId);
      
      if (userHouse) {
        // Check cooldown for moving
        if (!canMoveHouse(userHouse.lastMovedAt)) {
          return res.status(400).json({ error: "Vous devez attendre avant de déménager" });
        }
        
        // Move existing house
        const movedHouse = await storage.moveHouse(userId, x, y);
        return res.json({ ...movedHouse, isCurrentUser: true, canMove: false });
      }
      
      // Create new house
      const newHouse = await storage.createHouse(userId, x, y);
      res.json({ ...newHouse, isCurrentUser: true, canMove: false });
    } catch (error: any) {
      console.error("Error placing house:", error);
      if (error.message === "DUPLICATE_ENTRY") {
        return res.status(400).json({ error: "Cet emplacement est déjà occupé" });
      }
      res.status(500).json({ error: "Échec du placement de la maison" });
    }
  });

  // Change house color
  app.post("/api/houses/color", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { color } = req.body;

      // Validate color
      if (typeof color !== "string" || !/^#[0-9A-F]{6}$/i.test(color)) {
        return res.status(400).json({ error: "Couleur invalide" });
      }

      const userHouse = await storage.getHouse(userId);

      if (!userHouse) {
        return res.status(404).json({ error: "Maison non trouvée" });
      }

      if (!canChangeColor(userHouse.lastColorChangedAt)) {
        return res.status(400).json({ error: "Vous devez attendre avant de changer la couleur" });
      }

      const updatedHouse = await storage.updateHouseColor(userId, color);
      res.json({ ...updatedHouse, isCurrentUser: true, canMove: canMoveHouse(updatedHouse.lastMovedAt) });
    } catch (error) {
      console.error("Error changing house color:", error);
      res.status(500).json({ error: "Échec du changement de couleur de la maison" });
    }
  });

  app.post("/api/houses/upgrade", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const userHouse = await storage.getHouse(userId);
      if (!userHouse) {
        return res.status(404).json({ error: "Maison non trouvée" });
      }

      const upgradeCost = 100 * (2 ** userHouse.size);
      if (user.balance < upgradeCost) {
        return res.status(400).json({ error: "Solde insuffisant" });
      }

      const allHouses = await storage.getAllHouses();
      const newSize = userHouse.size + 1;
      const newHouse = { ...userHouse, size: newSize };

      for (const house of allHouses) {
        if (house.userId === userId) continue;

        const dx = Math.abs(newHouse.x - house.x);
        const dy = Math.abs(newHouse.y - house.y);

        if (dx < (newHouse.size + house.size) / 2 && dy < (newHouse.size + house.size) / 2) {
          return res.status(400).json({ error: "L'extension entre en collision avec une autre maison" });
        }
      }

      const upgradedHouse = await storage.upgradeHouse(userId, newSize, upgradeCost);
      res.json(upgradedHouse);
    } catch (error) {
      console.error("Error upgrading house:", error);
      res.status(500).json({ error: "Échec de l'amélioration de la maison" });
    }
  });

  // Get all laws with vote counts
  app.get("/api/laws", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const laws = await storage.getLawsWithVotes(userId);
      res.json(laws);
    } catch (error) {
      console.error("Error fetching laws:", error);
      res.status(500).json({ error: "Échec de la récupération des lois" });
    }
  });

  // Vote on a law
  app.post("/api/laws/:id/vote", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { vote } = req.body;
      
      // Check if user has a house
      const userHouse = await storage.getHouse(userId);
      if (!userHouse) {
        return res.status(403).json({ error: "Vous devez placer une maison pour voter" });
      }
      
      // Check if law exists
      const law = await storage.getLaw(id);
      if (!law) {
        return res.status(404).json({ error: "Loi non trouvée" });
      }
      
      // Check if voting is allowed
      if (!isVotable(law)) {
        return res.status(400).json({ error: "Le vote n'est plus possible pour cette loi" });
      }
      
      if (vote === null) {
        // Remove vote
        await storage.deleteVote(id, userId);
      } else if (vote === "up" || vote === "down") {
        // Create or update vote
        await storage.createOrUpdateVote(id, userId, vote);
        
        // Check if this vote closes a tiebreak
        if (law.isInTiebreak) {
          const laws = await storage.getLawsWithVotes(userId);
          const updatedLaw = laws.find(l => l.id === id);
          if (updatedLaw && updatedLaw.upvotes !== updatedLaw.downvotes) {
            // Close voting
            await storage.closeLawVoting(id);
          }
        }
      } else {
        return res.status(400).json({ error: "Vote invalide" });
      }
      
      // Return updated law with votes
      const laws = await storage.getLawsWithVotes(userId);
      const updatedLaw = laws.find(l => l.id === id);
      res.json(updatedLaw);
    } catch (error) {
      console.error("Error voting:", error);
      res.status(500).json({ error: "Échec du vote" });
    }
  });

  // Submit a suggestion
  app.post("/api/suggestions", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { title, text } = req.body;
      
      // Check if user has a house
      const userHouse = await storage.getHouse(userId);
      if (!userHouse) {
        return res.status(403).json({ error: "Vous devez placer une maison pour proposer" });
      }
      
      // Validate input
      if (!title || typeof title !== "string" || title.trim().length < 5) {
        return res.status(400).json({ error: "Titre invalide (minimum 5 caractères)" });
      }
      
      if (!text || typeof text !== "string" || text.trim().length < 50) {
        return res.status(400).json({ error: "Texte invalide (minimum 50 caractères)" });
      }
      
      if (text.length > 2000) {
        return res.status(400).json({ error: "Texte trop long (maximum 2000 caractères)" });
      }
      
      const suggestion = await storage.createSuggestion(userId, title.trim(), text.trim());

      // Automatically create a law from the suggestion
      const description = text.trim().substring(0, 150) + (text.trim().length > 150 ? "..." : "");
      
      const newLaw: InsertLaw = {
        id: randomUUID(),
        title: title.trim(),
        description: description,
        fullText: text.trim(),
        status: 'active',
      };

      await storage.createLaw(newLaw, userId);

      res.json(suggestion);
    } catch (error) {
      console.error("Error creating suggestion:", error);
      res.status(500).json({ error: "Échec de la soumission de la proposition" });
    }
  });

  // Get user status (for header display)
  app.get("/api/user/status", async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const house = await storage.getHouse(userId);
      
      res.json({
        hasHouse: !!house,
        house: house ? {
          x: house.x,
          y: house.y,
          color: house.color,
          size: house.size,
          lastMovedAt: house.lastMovedAt,
          canMove: canMoveHouse(house.lastMovedAt),
        } : null,
      });
    } catch (error) {
      console.error("Error fetching user status:", error);
      res.status(500).json({ error: "Échec de la récupération du statut" });
    }
  });

  // Seed initial laws if none exist
  app.post("/api/admin/seed-laws", async (_req: Request, res: Response) => {
    try {
      const existingLaws = await storage.getAllLaws();
      if (existingLaws.length > 0) {
        return res.json({ message: "Les lois existent déjà", count: existingLaws.length });
      }

      const initialLaws = [
        {
          id: randomUUID(),
          title: "Initiative des Jardins Communautaires",
          description: "Établir des jardins communautaires dans les terrains vides pour une production alimentaire durable et le renforcement des liens communautaires.",
          fullText: `Article 1 : Objectif
Cette loi établit un cadre pour la création et l'entretien de jardins communautaires dans les zones désignées de la grille.

Article 2 : Éligibilité
Tout résident ayant une maison placée peut demander une parcelle de jardin adjacente à son emplacement.

Article 3 : Responsabilités
Les détenteurs de parcelles de jardin doivent :
- Maintenir leur parcelle en bon état
- Suivre des pratiques de culture biologique
- Partager les excédents de production avec les voisins

Article 4 : Gouvernance
Un comité de jardinage composé de 5 résidents élus supervisera les opérations et résoudra les différends.`,
          status: "active" as const,
        },
        {
          id: randomUUID(),
          title: "Politique des Heures de Silence",
          description: "Mettre en place des heures de silence de 22h à 7h dans les zones résidentielles pour garantir un cadre de vie paisible.",
          fullText: `Article 1 : Heures de Silence
Tous les résidents doivent observer les heures de silence entre 22h00 et 7h00 chaque jour.

Article 2 : Restrictions
Pendant les heures de silence, les activités suivantes sont interdites :
- Musique forte ou divertissements bruyants
- Travaux de construction
- Rassemblements extérieurs de plus de 5 personnes

Article 3 : Application
Les infractions peuvent entraîner des avertissements et des obligations de service communautaire.`,
          status: "passed" as const,
        },
        {
          id: randomUUID(),
          title: "Extension des Transports en Commun",
          description: "Étendre les lignes de bus pour couvrir les zones mal desservies de la grille pour une meilleure mobilité.",
          fullText: `Article 1 : Plan d'Extension
L'autorité des transports publics doit étendre le service aux secteurs 100-200 et 400-500 de la grille.

Article 2 : Calendrier
La mise en œuvre doit commencer dans les 60 jours suivant l'adoption et être achevée dans les 180 jours.

Article 3 : Financement
Financé par une taxe de 0,5% sur toutes les maisons placées.`,
          status: "pending" as const,
        },
        {
          id: randomUUID(),
          title: "Obligation d'Énergie Renouvelable",
          description: "Exiger que toutes les nouvelles constructions incluent des panneaux solaires ou d'autres sources d'énergie renouvelable.",
          fullText: `Article 1 : Exigences
Toutes les nouvelles maisons placées après l'adoption doivent inclure des systèmes d'énergie renouvelable.

Article 2 : Incitations
Les maisons existantes qui se modernisent recevront des crédits d'impôt foncier.

Article 3 : Conformité
Les maisons doivent générer au moins 30% de leurs besoins énergétiques à partir de sources renouvelables.`,
          status: "active" as const,
        },
      ];

      for (const law of initialLaws) {
        await storage.createLaw(law);
      }

      res.json({ message: "Lois créées avec succès", count: initialLaws.length });
    } catch (error) {
      console.error("Error seeding laws:", error);
      res.status(500).json({ error: "Échec de la création des lois" });
    }
  });

  // Get all jobs
  app.get("/api/jobs", async (_req: Request, res: Response) => {
    try {
      const allJobs = await storage.getAllJobs();
      res.json(allJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Échec de la récupération des métiers" });
    }
  });

  // Choose a job
  app.post("/api/jobs/choose", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { jobId } = req.body;

      // Check if user has a house
      const userHouse = await storage.getHouse(userId);
      if (!userHouse) {
        return res.status(403).json({ error: "Vous devez placer une maison pour choisir un métier" });
      }

      // Fetch the full user object to check current job and cooldown
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Check if user already has a job
      if (user.jobId) {
        return res.status(400).json({ error: "Vous avez déjà un métier" });
      }

      // Check job cooldown
      if (!canTakeJob(user.jobStoppedAt)) {
        return res.status(400).json({ error: "Vous êtes en période de récupération avant de pouvoir prendre un nouveau métier" });
      }

      const updatedUser = await storage.updateUserJob(userId, jobId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error choosing job:", error);
      res.status(500).json({ error: "Échec du choix du métier" });
    }
  });

  // Quit a job
  app.post("/api/jobs/quit", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      // Fetch the full user object to check current job
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Check if user has a job to quit
      if (!user.jobId) {
        return res.status(400).json({ error: "Vous n'avez pas de métier à quitter" });
      }

      const updatedUser = await storage.quitJob(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error quitting job:", error);
      res.status(500).json({ error: "Échec pour quitter le métier" });
    }
  });

  app.post("/api/jobs/bonus", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { bonus } = req.body;

      const updatedUser = await storage.updateUserBonus(userId, bonus);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating bonus:", error);
      res.status(500).json({ error: "Échec de la mise à jour du bonus" });
    }
  });

  // Search for users by username
  app.get("/api/users/search", async (req: Request, res: Response) => {
    try {
        const { username } = req.query;
        if (!username || typeof username !== "string") {
            return res.status(400).json({ error: "Nom d'utilisateur invalide" });
        }

        const usersWithHouses = await storage.searchUsersWithHouse(username);
        res.json(usersWithHouses);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ error: "Échec de la recherche d'utilisateurs" });
    }
  });

  app.post("/api/elections/candidate", ensureAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { platform } = req.body;

      const userHouse = await storage.getHouse(userId);
      if (!userHouse) {
        return res.status(403).json({ error: "Vous devez posséder une maison pour être candidat" });
      }

      let currentElection = await storage.getCurrentElection();
      if (!currentElection) {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        currentElection = await storage.createElection({
          id: randomUUID(),
          startDate,
        });
      }

      const now = new Date();
      const candidacyStartDate = new Date(currentElection.startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      const candidacyEndDate = new Date(currentElection.startDate.getTime() - 1 * 24 * 60 * 60 * 1000);

      if (now < candidacyStartDate || now > candidacyEndDate) {
        return res.status(400).json({ error: "La période de candidature n'est pas active" });
      }

      const candidate = await storage.createCandidate({
        id: randomUUID(),
        electionId: currentElection.id,
        userId,
        platform,
      });

      res.json(candidate);
    } catch (error) {
      console.error("Error creating candidate:", error);
      res.status(500).json({ error: "Échec de la création de la candidature" });
    }
  });

  app.get("/api/elections/status", async (req: Request, res: Response) => {
    try {
      const currentElection = await storage.getCurrentElection();
      res.json(currentElection);
    } catch (error) {
      console.error("Error getting election status:", error);
      res.status(500).json({ error: "Échec de la récupération du statut de l'élection" });
    }
  });

  return httpServer;
}
