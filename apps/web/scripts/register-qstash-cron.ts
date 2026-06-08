import { Client } from "@upstash/qstash"
import { env } from "../lib/env"

const qstash = new Client({ token: env.QSTASH_TOKEN })

async function main() {
  const TRIGGER_URL = `${env.INFERENCE_SERVICE_URL}/api/training/weekly-trigger`
  const schedules = await qstash.schedules.list()

  for (const s of schedules) {
    if (s.destination?.includes("/api/training/weekly-trigger") && s.destination !== TRIGGER_URL) {
      await qstash.schedules.delete(s.scheduleId)
      console.log("🗑  Deleted stale schedule:", s.scheduleId)
    }
  }

  const existing = schedules.find((s) => s.destination === TRIGGER_URL)
  if (existing) {
    console.log("⚠️  Schedule already registered:", existing.scheduleId)
    return
  }

  const schedule = await qstash.schedules.create({
    destination: TRIGGER_URL,
    cron: "0 2 * * 0", // every Sunday 02:00 UTC
  })
  console.log("✅ QStash cron registered:", schedule.scheduleId)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
