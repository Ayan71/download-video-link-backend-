import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execPromise = promisify(exec);

export const videoDownload = async (req, res) => {
  console.log("yes it runnin g---------------------------->")
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    // Generate a unique file path for each download
    const uniqueFilename = `downloaded_video_${Date.now()}.mp4`;
    const outputPath = path.join(os.tmpdir(), uniqueFilename);
    const command = `yt-dlp -o "${outputPath}" --recode-video mp4 ${url}`;

    // Execute yt-dlp command to download and convert the video
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      console.error(`Error downloading video: ${stderr}`);
      return res
        .status(500)
        .json({ message: "Error downloading video", error: stderr });
    }
    console.log(`Download successful: ${stdout}`);

    // Stream the file directly to the client
    res.setHeader("Content-Disposition", 'attachment; filename="video.mp4"');
    res.setHeader("Content-Type", "video/mp4");

    // Read the file and send it as response
    const fileStream = await fs.readFile(outputPath);
    res.send(fileStream);

    // Clean up the file after sending response
    setTimeout(async () => {
      try {
        await fs.unlink(outputPath);
        console.log("Temporary file deleted:", outputPath);
      } catch (err) {
        console.error("Error deleting temporary file:", err);
      }
    }, 1000); // Short delay to ensure file is no longer in use
  } catch (error) {
    console.error("An error occurred:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const demoDownload=(req,res)=>{
  return res.status(200).json({
    success:true,
    message:"Demo api wokring"
  })
}
