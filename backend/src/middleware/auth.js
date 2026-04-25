import jwt from "jsonwebtoken";

/**
 * JWT authentication middleware.
 * Verifies Authorization: Bearer <token> header.
 * On success: injects decoded payload into req.user.
 * On failure: returns 401.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
