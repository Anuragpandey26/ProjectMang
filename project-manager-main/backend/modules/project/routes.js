import express from "express";
import authMiddleware from "../../middleware/auth-middleware.js";
import { validateRequest } from "zod-express-middleware";
import { projectSchema } from "./validators/project.validator.js";
import { z } from "zod";
import {
    createProject,
    getProjectDetails,
    getProjectTasks,
    addProjectAttachment,
    removeProjectAttachment,
} from "./controllers/project.js";
import upload from "../../middleware/upload.middleware.js";

const router = express.Router();

router.post(
    "/:projectId/attachments",
    authMiddleware,
    upload.single("file"),
    addProjectAttachment
);

router.delete(
    "/:projectId/attachments/:attachmentId",
    authMiddleware,
    removeProjectAttachment
);

router.post(
    "/:workspaceId/create-project",
    authMiddleware,
    validateRequest({
        params: z.object({
            workspaceId: z.string(),
        }),
        body: projectSchema,
    }),
    createProject
);

router.get(
    "/:projectId",
    authMiddleware,
    validateRequest({
        params: z.object({ projectId: z.string() }),
    }),
    getProjectDetails
);

router.get(
    "/:projectId/tasks",
    authMiddleware,
    validateRequest({ params: z.object({ projectId: z.string() }) }),
    getProjectTasks
);
export default router;
