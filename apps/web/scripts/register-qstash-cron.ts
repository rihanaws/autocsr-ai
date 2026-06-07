import { Client } from "@upstash/qstash"
import { env } from "../lib/env"

const qstash = new Client({ token: env.QSTASH_TOKEN })

async function main() {
  const schedules = await qstash.schedules.list()
  const existing = schedules.find((s) =>
    s.destination?.includes("/api/training/weekly-trigger")
  )
  if (existing) {
    console.log("⚠️  Cron already registered:", existing.scheduleId)
    return
  }

  const schedule = await qstash.schedules.create({
    destination: `${env.INFERENCE_SERVICE_URL}/api/training/weekly-trigger`,
    cron: "0 2 * * 0", // every Sunday 02:00 UTC
    headers: { Authorization: `Bearer ${env.INFERENCE_API_SECRET}` },
  })
  console.log("✅ QStash cron registered:", schedule.scheduleId)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
