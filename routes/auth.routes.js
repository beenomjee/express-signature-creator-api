import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";

export const generateClient = () =>
  new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET_KEY,
    redirectUri: process.env.GOOGLE_AUTH_REDIRECT_URL,
  });

const router = new Router();

router.get("/google/generate", (req, res) => {
  const url = generateClient().generateAuthUrl({
    scope: ["https://www.googleapis.com/auth/gmail.settings.basic"].join(" "),
    access_type: "offline",
    response_type: "code",
  });
  return res.redirect(url);
});

router.get("/login", (req, res) => {
  const { tokens } = req.cookies;
  if (!tokens) return res.render("login.ejs");
  return res.redirect("/");
});

router.get("/google/redirect", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await generateClient().getToken(code);
    return res
      .cookie("tokens", jwt.sign(tokens, process.env.SECRET_KEY), {})
      .redirect("/");
  } catch (err) {
    return res.json({ message: err.message });
  }
});

router.get("/logout", authMiddleware, async (req, res) => {
  try {
    const client = generateClient();
    await client.revokeToken(req.tokens.access_token);
    res.clearCookie("tokens").redirect("/");
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
});

export default router;
