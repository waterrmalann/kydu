import { Router } from 'express';
import isLoggedIn from '../middlewares/authMiddleware.js';
import { ConnectWithGig, DeleteGig, GetGig, ListGigs, PostGig } from '../controllers/gigController.js';
import {validateBody, validateParams, validateQuery} from '../middlewares/validateSchema.js';

import { postGigsBodySchema } from '../schemas/gigs/postGigSchemas.js';
import { getGigsQuerySchema } from '../schemas/gigs/getGigsSchemas.js';
import { getGigParamsSchema } from '../schemas/gigs/getGigSchemas.js';
import { getGigImages } from '../shared/setupMulter.js';
import { postGigConnectionParamsSchema } from '../schemas/gigs/postGigConnectionSchemas.js';

const router = Router();

router.use(isLoggedIn);

router.get("/", validateQuery(getGigsQuerySchema), ListGigs);
router.post("/", getGigImages.any(), validateBody(postGigsBodySchema), PostGig);

router.get("/:gigId", validateParams(getGigParamsSchema), GetGig);
// router.put("/:gigId", PutGig);
router.delete("/:gigId", DeleteGig);

router.post("/:gigId", validateParams(postGigConnectionParamsSchema), ConnectWithGig);

export default router;