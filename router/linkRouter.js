import express from "express";
import { demo, videoDownload} from "../controller/linkController.js";

const router = express.Router();

router.post("/video",videoDownload)
router.get("/demo",demo)
export default router;
