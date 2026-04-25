import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";

const router = express.Router();

const oauthEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (oauthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      (_accessToken, _refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );
}

// Initiate Google OAuth flow
router.get("/google", (req, res, next) => {
  if (!oauthEnabled) return res.status(503).json({ error: "Google OAuth not configured" });
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

// OAuth callback — issue JWT and redirect to frontend
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/?auth_error=1` }),
  (req, res) => {
    const profile = req.user;
    const payload = {
      userId: profile.id,
      email: profile.emails?.[0]?.value ?? "",
      displayName: profile.displayName ?? "",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/?token=${token}`);
  }
);

export default router;
