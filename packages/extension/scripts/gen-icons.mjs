import { writeFileSync, mkdirSync } from "fs"

// Minimal 1px transparent PNG — placeholder until real design
const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

mkdirSync("icons", { recursive: true })
writeFileSync("icons/icon16.png",  png1x1)
writeFileSync("icons/icon48.png",  png1x1)
writeFileSync("icons/icon128.png", png1x1)
console.log("✅ placeholder icons created")
