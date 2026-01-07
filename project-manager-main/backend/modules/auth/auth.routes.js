import express from "express";
import { validateRequest } from "zod-express-middleware";
import {
    emailSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    verifyEmailSchema,
} from "../../dto/auth.dto.js";
import {
    loginUser,
    registerUser,
    resetPasswordRequest,
    verifyEmail,
    verifyResetPasswordTokenAndResetPassword,
    refreshToken,
    logout,
    logoutAllDevices,
    getActiveSessions,
} from "./controllers/auth-controller.js";
import authMiddleware from "../../middleware/auth-middleware.js";

const router = express.Router();

router.post(
    "/register",
    validateRequest({
        body: registerSchema,
    }),
    registerUser
);
router.post(
    "/login",
    validateRequest({
        body: loginSchema,
    }),
    loginUser
);

router.post(
    "/verify-email",
    validateRequest({
        body: verifyEmailSchema,
    }),
    verifyEmail
);

router.post(
    "/reset-password-request",
    validateRequest({
        body: emailSchema,
    }),
    resetPasswordRequest
);

router.post(
    "/reset-password",
    validateRequest({
        body: resetPasswordSchema,
    }),
    verifyResetPasswordTokenAndResetPassword
);

router.post("/refresh-token", refreshToken);

router.post("/logout", logout);

router.post("/logout-all", authMiddleware, logoutAllDevices);

router.get("/sessions", authMiddleware, getActiveSessions);

export default router;
