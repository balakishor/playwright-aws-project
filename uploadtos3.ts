import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function uploadReportToS3(reportDir: string) {
  const absolutePath = path.resolve(reportDir);
  console.log("Looking for reports in:", absolutePath);

  if (!fs.existsSync(absolutePath)) {
    console.error("Report folder not found:", absolutePath);
    return;
  }

  const files = fs.readdirSync(absolutePath);
  console.log("Files found:", files);

  for (const file of files) {
    const filePath = path.join(absolutePath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      const fileContent = fs.readFileSync(filePath);
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `playwright-reports/${Date.now()}/${file}`,
        Body: fileContent,
        ContentType: file.endsWith(".html") ? "text/html" : "application/octet-stream",
      });

      await s3Client.send(command);
      console.log(`Uploaded: ${file}`);
    }
  }

  console.log("All reports uploaded to S3 successfully!");
}

uploadReportToS3("playwright-report")
  .then(() => console.log("Done!"))
  .catch((err) => console.error("Error:", err));