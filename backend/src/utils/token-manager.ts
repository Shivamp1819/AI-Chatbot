import { Request, Response, NextFunction } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { COOKIE_NAME } from "./constants.js";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "default_secret";

export const createToken = (
  id: string,
  email: string,
  expiresIn: SignOptions["expiresIn"] // 👈 ensures correct type
) => {
  const payload = { id, email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
  return token;
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.signedCookies[`${COOKIE_NAME}`];
  if (!token || token.trim() === "") {
    return res.status(401).json({ message: "Token Not Received" });
  }
  return new Promise<void>((resolve, reject) => {
    return jwt.verify(token, JWT_SECRET, (err, success) => {
      if (err) {
        reject(err.message);
        return res.status(401).json({ message: "Token Expired" });
      } else {
        resolve();
        res.locals.jwtData = success;
        return next();
      }
    });
  });
};
