import express from "express";
import { videoDownload,demoDownload} from "../controller/linkController.js";

const router = express.Router();

router.post("/video",videoDownload)
router.get("/demo",demoDownload)

export default router;
