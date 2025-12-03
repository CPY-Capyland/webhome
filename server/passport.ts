import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

if (
  !process.env.DISCORD_CLIENT_ID ||
  !process.env.DISCORD_CLIENT_SECRET ||
  !process.env.DISCORD_REDIRECT_URI
) {
  throw new Error("Missing Discord OAuth2 environment variables");
}

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_REDIRECT_URI,
      scope: ["identify"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.discordId, profile.id));

        if (user) {
          return done(null, user);
        }

        const newUser = {
          id: randomUUID(),
          sessionId: randomUUID(),
          discordId: profile.id,
          username: profile.username,
          avatar: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
        };

        const [createdUser] = await db.insert(users).values(newUser).returning();
        return done(null, createdUser);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as any).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    done(null, user);
  } catch (err) {
    done(err);
  }
});
