import { getSql, json } from "./_lib/db.js";
import { isAdminRequest } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  if (!isAdminRequest(req)) return json(res, 401, { error: "Unauthorized. Please sign in again." });
  try {
    const sql = getSql();
    const activities = await sql`SELECT id, display_name, event_type, created_at FROM gamehub_activity ORDER BY created_at DESC LIMIT 500`;
    await sql`UPDATE gamehub_tasks SET progress_percent = CASE game_id WHEN 'blox' THEN LEAST(100, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 120)::int * 2) WHEN 'rivals' THEN LEAST(100, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 600)::int * 5) WHEN 'egg' THEN LEAST(100, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 1200)::int * 10) WHEN 'anime' THEN LEAST(100, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 1800)::int * 20) ELSE progress_percent END, updated_at = NOW() WHERE progress_percent <> CASE game_id WHEN 'blox' THEN LEAST(100, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 120)::int * 2) WHEN 'rivals' THEN LEAST(100, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 600)::int * 5) WHEN 'egg' THEN LEAST(100, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 1200)::int * 10) WHEN 'anime' THEN LEAST(100, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)) / 1800)::int * 20) ELSE progress_percent END`;
    const tasks = await sql`SELECT id, display_name, game_id, started_at, progress_percent, updated_at FROM gamehub_tasks ORDER BY updated_at DESC LIMIT 500`;
    return json(res, 200, { activities, tasks });
  } catch (error) {
    console.error("Admin data read failed", error?.message);
    return json(res, 500, { error: "Unable to load admin data. Check database setup." });
  }
}
