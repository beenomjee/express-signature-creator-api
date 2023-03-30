import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  try {
    let tokens = req.cookies.tokens;
    if (!tokens) return res.redirect("/auth/login");
    tokens = jwt.verify(tokens, process.env.SECRET_KEY);
    if (!tokens) return res.clearCookie("tokens").redirect("/auth/login");
    req.tokens = tokens;
    next();
  } catch (err) {
    return res.redirect("/auth/login");
  }
}
