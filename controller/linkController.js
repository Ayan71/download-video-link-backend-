import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";

const execPromise = promisify(exec);
const isWindows = process.platform === "win32";
const ytDlpPath = isWindows ? "yt-dlp" : "/usr/local/bin/yt-dlp"; // Use yt-dlp on PATH for Windows

// Function to check if yt-dlp is installed
const checkYtDlp = async () => {
  try {
    const command = isWindows ? "where yt-dlp" : `which ${ytDlpPath}`;
    const { stdout } = await execPromise(command);
    console.log(`yt-dlp found at: ${stdout.trim()}`);
    return true;
  } catch (error) {
    console.log("yt-dlp not found:", error);
    return false;
  }
};

// Function to install yt-dlp
const installYtDlp = async () => {
  try {
    if (isWindows) {
      console.log("Attempting to install yt-dlp via pip on Windows...");
      await execPromise("python -m pip install yt-dlp"); // Use python command instead of python3 for Windows
    } else {
      console.log("Attempting to install yt-dlp using curl on Unix...");
      await execPromise(`
        curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${ytDlpPath} && \
        chmod a+rx ${ytDlpPath}
      `);
    }
    console.log("yt-dlp installed successfully.");
    return true;
  } catch (error) {
    console.error("Failed to install yt-dlp:", error);
    throw new Error("Failed to install yt-dlp using both curl and pip");
  }
};

export const videoDownload = async (req, res) => {
  try {
    // Check if yt-dlp is installed
    const isYtDlpInstalled = await checkYtDlp();

    if (!isYtDlpInstalled) {
      console.log("yt-dlp not found, attempting to install...");
      try {
        await installYtDlp();
        console.log("yt-dlp installed successfully");
      } catch (installError) {
        console.error("Failed to install yt-dlp:", installError);
        return res.status(500).json({
          message: "Server Error",
          error: "Failed to install required dependencies",
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
    
    // Format command for Windows and Unix
    const ytDlpCmd = isWindows ? "yt-dlp" : ytDlpPath;
    const command = `${ytDlpCmd} -o "${outputPath}" --recode-video mp4 "${url}"`;
    console.log(`Running command: ${command}`);

    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error(`Error downloading video: ${stderr}`);
      return res.status(500).json({ message: "Error downloading video", error: stderr });
    }

    console.log(`Download successful: ${stdout}`);

    // Check if file exists before sending
    const fileExists = await fs.access(outputPath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      return res.status(500).json({
        message: "Server Error",
        error: "Downloaded file not found",
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
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const demo = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "yes it's working",
  });
};
