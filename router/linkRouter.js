import express from "express";
import { videoDownload} from "../controller/linkController.js";

const router = express.Router();

router.post("/video",videoDownload)

export default router;
