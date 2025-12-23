import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import clientOnly from "../middleware/clientOnly.js";
import {
  getClientProfile,
  updateClientProfile,
  changeClientPassword,
} from "../controllers/clientProfileController.js";

const router = express.Router();

/* ============================
   CLIENT PROFILE ROUTES
============================ */
router.get("/profile", authMiddleware, clientOnly, getClientProfile);
router.put("/profile", authMiddleware, clientOnly, updateClientProfile);
router.put(
  "/change-password",
  authMiddleware,
  clientOnly,
  changeClientPassword
);

export default router;
