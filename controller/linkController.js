import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execPromise = promisify(exec);

// Function to check if yt-dlp is installed
const checkYtDlp = async () => {
  try {
    const { stdout } = await execPromise('which yt-dlp');
    return stdout.trim() !== '';
  } catch (error) {
    return false;
  }
};

// Function to install yt-dlp locally
const installYtDlp = async () => {
  try {
    // Install yt-dlp in the /tmp directory
    const installDir = path.join(os.tmpdir(), 'yt-dlp');
    await execPromise(`
      mkdir -p ${installDir} && \
      curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${installDir}/yt-dlp && \
      chmod a+rx ${installDir}/yt-dlp
    `);
    return `${installDir}/yt-dlp`;
  } catch (error) {
    throw new Error('Failed to install yt-dlp locally');
  }
};

export const videoDownload = async (req, res) => {
  try {
    // Check if yt-dlp is installed
    const isYtDlpInstalled = await checkYtDlp();

    if (!isYtDlpInstalled) {
      console.log('yt-dlp not found, attempting to install...');
      try {
        const ytDlpPath = await installYtDlp();
        console.log('yt-dlp installed successfully:', ytDlpPath);
      } catch (installError) {
        console.error('Failed to install yt-dlp:', installError);
        return res.status(500).json({
          message: "Server Error",
          error: "Failed to install required dependencies"
        });
      }
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    // Generate a unique file path for each download
    const uniqueFilename = `downloaded_video_${Date.now()}.mp4`;
    const outputPath = path.join(os.tmpdir(), uniqueFilename);

    // Add quotes around the URL to handle special characters
    const command = `yt-dlp -o "${outputPath}" --recode-video mp4 "${url}"`;

    // Execute yt-dlp command to download and convert the video
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error(`Error downloading video: ${stderr}`);
      return res
        .status(500)
        .json({ message: "Error downloading video", error: stderr });
    }

    console.log(`Download successful: ${stdout}`);

    // Check if file exists before sending
    const fileExists = await fs.access(outputPath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      return res.status(500).json({
        message: "Server Error",
        error: "Downloaded file not found"
      });
    }

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
    }, 1000);

  } catch (error) {
    console.error("An error occurred:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const demo=(req,res)=>{
 return res.status(200).json({
  success:true,
  message:"yes its working"
 })
}