import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";

const COOLDOWN_HOURS = 24;
const GRID_SIZE = 500;
const VOTING_DURATION_HOURS = 72;

function isVotable(law: any): boolean {
  // Must be active status
  if (law.status !== "active") return false;
  
  // If voting already closed, check if in tiebreak
  if (law.votingClosedAt) {
    return law.isInTiebreak;
  }
  
  // Check if within 72 hours
  const now = new Date();
  const votingDeadline = new Date(law.publishedAt.getTime() + VOTING_DURATION_HOURS * 60 * 60 * 1000);
  return now < votingDeadline;
}

function canMoveHouse(lastMovedAt: Date): boolean {
  const now = new Date();
  const cooldownEnd = new Date(lastMovedAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
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

  return httpServer;
}
