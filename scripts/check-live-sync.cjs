/**
 * Exercise the real WatermelonDB engine/schema with two isolated LokiJS databases.
 * Default: read-only replica comparison. --write: temporary review-account farm,
 * delayed offline saves, failed push/retry, column merge, measurements and deletes.
 * Uses normal account authentication, never a service-role key. Test farms and
 * records are soft-deleted on success/failure; cleanup failures retain a manifest.
 * Run: node scripts/check-live-sync.cjs [--write]
 */
const assert = require("assert/strict")
const crypto = require("crypto")
const fs = require("fs")
const Module = require("module")
const os = require("os")
const path = require("path")

const root = process.env.HERD_SYNC_PROJECT_ROOT || path.dirname(require.resolve("../package.json"))
const outputDir =
  process.env.HERD_SYNC_OUTPUT_DIR || path.join(os.tmpdir(), "herdtrackr-sync-check")
fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 })
const req = Module.createRequire(root + "/package.json")
const ts = req("typescript")
global.__DEV__ = false
function loadTs(relative, overrides = {}) {
  const filename = root + "/" + relative
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      experimentalDecorators: true,
    },
  }).outputText
  const mod = new Module(filename, module)
  mod.filename = filename
  mod.paths = Module._nodeModulePaths(path.dirname(filename))
  const original = mod.require.bind(mod)
  mod.require = (name) =>
    Object.hasOwn(overrides, name)
      ? overrides[name]
      : name.startsWith("@/")
        ? loadTs("app/" + name.slice(2) + ".ts", overrides)
        : original(name)
  mod._compile(output, filename)
  return mod.exports
}
const { Database, Model } = req("@nozbe/watermelondb")
const LokiAdapter = req("@nozbe/watermelondb/adapters/lokijs").default
const { schema, migrations } = loadTs("app/db/schema.ts")
const memoryAdapter = () => new (req("lokijs").LokiMemoryAdapter)()
function database(name) {
  const modelClasses = Object.keys(schema.tables).map((table) => {
    class Row extends Model {}
    Row.table = table
    return Row
  })
  return new Database({
    adapter: new LokiAdapter({
      dbName: name,
      schema,
      migrations,
      useWebWorker: false,
      useIncrementalIndexedDB: true,
      _testLokiAdapter: memoryAdapter(),
      extraLokiOptions: { autosave: false },
    }),
    modelClasses,
  })
}
const normalization = loadTs("app/services/syncChangeNormalization.ts")
const failures = loadTs("app/utils/syncFailures.ts")
const checks = []
function check(label, condition) {
  assert.ok(condition, label)
  checks.push(label)
  console.log("PASS " + label)
}
const env = {
  ...(fs.existsSync(root + "/.env") ? req("dotenv").parse(fs.readFileSync(root + "/.env")) : {}),
  ...process.env,
}
if (!env.REVIEW_EMAIL || !env.REVIEW_PASSWORD)
  throw new Error("REVIEW_EMAIL and REVIEW_PASSWORD are required")
const { createClient } = req("@supabase/supabase-js")
const client = createClient(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (url, options) =>
        fetch(url, { ...options, signal: globalThis.AbortSignal.timeout(60000) }),
    },
  },
)
let offlineA = false
function engine(db, name) {
  const proxy = {
    rpc: async (method, args) => {
      if (name === "A" && (offlineA === true || offlineA === method))
        return { data: null, error: { code: "", message: "TypeError: Network request failed" } }
      return client.rpc(method, args)
    },
  }
  return loadTs("app/services/sync_rpc.ts", {
    "@/db": { database: db, schema },
    "@/services/supabase": { supabase: proxy },
    "@/services/syncChangeNormalization": normalization,
    "@/utils/syncFailures": failures,
  })
}
async function sync(e, label) {
  const result = await e.syncDatabase()
  if (!result.success) throw new Error(label + ": " + result.error)
  checks.push(label)
  console.log("PASS " + label)
}
async function create(db, table, fields) {
  if (typeof fields.id !== "string" || !fields.id)
    throw new Error(`Invalid fixture ID for ${table}`)
  for (const field of Object.keys(fields)) {
    if (field !== "id" && !schema.tables[table].columns[field])
      throw new Error(`Unknown fixture field ${table}.${field}`)
  }
  return db.write(() =>
    db.get(table).create((row) => {
      row._raw.id = fields.id
      for (const [field, value] of Object.entries(fields))
        if (field !== "id") row._setRaw(field, value)
    }),
  )
}
const id = () => crypto.randomBytes(8).toString("hex")
const ids = {
  org: id(),
  member: id(),
  animal: id(),
  weight: id(),
  health: id(),
  pasture: id(),
  activity: id(),
}
let createdRemote = false
const manifest = path.join(outputDir, "pending-cleanup-" + ids.org + ".json")
async function cleanup() {
  if (!createdRemote) return
  const deleted = (table) => ({ created: [], updated: [], deleted: [ids[table]] })
  const children = await client.rpc("sync_push", {
    changes: {
      weight_records: deleted("weight"),
      health_records: deleted("health"),
      pasture_activities: deleted("activity"),
      pastures: deleted("pasture"),
      animals: deleted("animal"),
    },
  })
  if (children.error || children.data?.success !== true || children.data.error_count > 0)
    throw new Error("Test-record cleanup failed")
  const farm = await client.rpc("sync_push", {
    changes: { organizations: deleted("org"), memberships: deleted("member") },
  })
  if (farm.error || farm.data?.success !== true || farm.data.error_count > 0)
    throw new Error("Test-farm cleanup failed")
  console.log("PASS isolated test records and farm soft-deleted")
  createdRemote = false
  fs.rmSync(manifest, { force: true })
}
;(async () => {
  const signIn = await client.auth.signInWithPassword({
    email: env.REVIEW_EMAIL,
    password: env.REVIEW_PASSWORD,
  })
  if (signIn.error) throw new Error("Review account sign-in failed: " + signIn.error.message)
  check("normal client authentication", Boolean(signIn.data.user))
  const A = database("herd-sync-a-" + ids.org)
  const B = database("herd-sync-b-" + ids.org)
  const a = engine(A, "A"),
    b = engine(B, "B")
  await sync(a, "client A initial pull using real WatermelonDB")
  await sync(b, "client B initial pull using real WatermelonDB")
  const tables = Object.keys(schema.tables)
  let rows = 0
  for (const table of tables) {
    const countA = await A.get(table).query().fetchCount(),
      countB = await B.get(table).query().fetchCount()
    assert.equal(countA, countB, "Replica counts differ for " + table)
    rows += countA
  }
  check("both replicas agree across all " + tables.length + " tables", true)
  console.log("Initial row count: " + rows)
  if (!process.argv.includes("--write")) {
    fs.writeFileSync(
      path.join(outputDir, "read-only-result.json"),
      JSON.stringify({ checks, tables: tables.length, rows, schema: schema.version }, null, 2),
    )
    return
  }
  const now = Date.now()
  await create(A, "organizations", {
    id: ids.org,
    name: "Sync verification " + ids.org.slice(0, 6),
    livestock_types: '["cattle"]',
    default_breeds: '{"cattle":"Nguni"}',
    subscription_tier: "starter",
    subscription_status: "active",
    created_at: now,
    updated_at: now,
    is_deleted: false,
  })
  await create(A, "organization_members", {
    id: ids.member,
    organization_id: ids.org,
    user_id: signIn.data.user.id,
    user_email: env.REVIEW_EMAIL,
    role: "admin",
    joined_at: now,
    is_active: true,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  })
  createdRemote = true
  fs.writeFileSync(manifest, JSON.stringify(ids, null, 2), { mode: 0o600 })
  await sync(a, "isolated farm and membership created through normal sync")
  await sync(b, "second client receives the isolated farm")
  const orgB = await B.get("organizations").find(ids.org)
  check(
    "livestock types survive pull",
    JSON.stringify(JSON.parse(orgB._raw.livestock_types)) === '["cattle"]',
  )
  check("default breeds survive pull", JSON.parse(orgB._raw.default_breeds).cattle === "Nguni")
  const savedAt = Date.now() - 86400000 // A queued save from yesterday, behind the other client's checkpoint.
  offlineA = true
  await create(A, "animals", {
    id: ids.animal,
    organization_id: ids.org,
    species: "cattle",
    visual_tag: "SYNC-" + ids.org.slice(0, 6),
    rfid_tag: "",
    name: "Sync verification animal",
    breed: "Nguni",
    sex: "female",
    status: "active",
    vaccinations_up_to_date: true,
    vaccination_history: "unknown",
    tags: '["sync-verification"]',
    genetic_traits: '{"horns":"polled"}',
    created_at: savedAt,
    updated_at: savedAt,
    is_deleted: false,
  })
  const offline = await a.syncDatabase()
  check("offline sync returns failure", offline.success === false)
  check(
    "offline creation remains pending",
    (await A.get("animals").find(ids.animal))._raw._status === "created",
  )
  await sync(b, "other client advances its checkpoint while the animal is still offline")
  offlineA = false
  await sync(a, "offline creation retries successfully")
  await sync(b, "second client completes its queued-animal pull")
  const animalB = await B.get("animals").find(ids.animal)
  check("delayed offline creation reaches the other client", Boolean(animalB))
  check("original creation date is preserved", animalB._raw.created_at === savedAt)
  check(
    "genetic traits round-trip as JSON",
    JSON.parse(animalB._raw.genetic_traits).horns === "polled",
  )
  check("new vaccination-history field round-trips", animalB._raw.vaccination_history === "unknown")
  check("animal tags round-trip as JSON", JSON.parse(animalB._raw.tags)[0] === "sync-verification")
  const animalA = await A.get("animals").find(ids.animal)
  await A.write(() =>
    animalA.update((row) => {
      row._setRaw("name", "Queued edit from client A")
      row._setRaw("updated_at", savedAt + 1000)
    }),
  )
  await sync(b, "second client advances before the queued edit is uploaded")
  offlineA = "sync_push"
  const failedPush = await a.syncDatabase()
  check("a network failure after pulling reports failure", failedPush.success === false)
  check("failed push keeps the edit pending", animalA._raw._status === "updated")
  offlineA = false
  await sync(a, "pending edit retries after a push failure")
  await sync(b, "second client pulls the delayed edit")
  check("delayed edit reaches the other client", animalB._raw.name === "Queued edit from client A")
  await B.write(() =>
    animalB.update((row) => {
      row._setRaw("name", "Updated from client B")
      row._setRaw("vaccination_history", "current")
      row._setRaw("updated_at", savedAt + 2000)
    }),
  )
  await sync(a, "first client advances before the second client uploads its edit")
  await sync(b, "second client pushes an edit")
  await sync(a, "first client receives the edit")
  check(
    "cross-client edit arrives intact",
    (await A.get("animals").find(ids.animal))._raw.name === "Updated from client B",
  )
  check(
    "vaccination history edit arrives intact",
    (await A.get("animals").find(ids.animal))._raw.vaccination_history === "current",
  )
  await A.write(() =>
    animalA.update((row) => {
      row._setRaw("name", "Column merge from client A")
      row._setRaw("updated_at", savedAt + 3000)
    }),
  )
  await B.write(() =>
    animalB.update((row) => {
      row._setRaw("vaccination_history", "needs_review")
      row._setRaw("updated_at", savedAt + 4000)
    }),
  )
  await sync(b, "second client pushes a different column while the first has an unsent edit")
  await sync(a, "first client merges the remote column with its pending local edit")
  await sync(b, "second client receives the merged result")
  check(
    "pending local name survives a remote change",
    animalA._raw.name === "Column merge from client A" && animalB._raw.name === animalA._raw.name,
  )
  check(
    "remote history survives the local name edit",
    animalA._raw.vaccination_history === "needs_review" &&
      animalB._raw.vaccination_history === "needs_review",
  )
  await create(A, "pastures", {
    id: ids.pasture,
    organization_id: ids.org,
    name: "Sync verification pasture",
    code: "SYNC",
    current_animal_count: 0,
    is_active: true,
    created_at: savedAt,
    updated_at: savedAt,
    is_deleted: false,
  })
  await create(A, "pasture_activities", {
    id: ids.activity,
    organization_id: ids.org,
    pasture_id: ids.pasture,
    activity_date: savedAt,
    activity_type: "tick_observation",
    tick_count: 23,
    animals_inspected: 5,
    tick_load_score: 3,
    created_at: savedAt,
    updated_at: savedAt,
    is_deleted: false,
  })
  await create(A, "weight_records", {
    id: ids.weight,
    organization_id: ids.org,
    animal_id: ids.animal,
    weight_kg: 450.5,
    record_date: savedAt,
    created_at: savedAt,
    updated_at: savedAt,
    is_deleted: false,
  })
  await create(A, "health_records", {
    id: ids.health,
    organization_id: ids.org,
    animal_id: ids.animal,
    record_type: "observation",
    description: "Sync verification",
    record_date: savedAt,
    created_at: savedAt,
    updated_at: savedAt,
    is_deleted: false,
  })
  await sync(a, "weight and tick records push together")
  await sync(b, "second client pulls measurement records")
  check(
    "weight precision is preserved",
    (await B.get("weight_records").find(ids.weight))._raw.weight_kg === 450.5,
  )
  check(
    "tick count is preserved",
    (await B.get("pasture_activities").find(ids.activity))._raw.tick_count === 23,
  )
  await sync(a, "echoed creates do not break a later pull")
  await A.write(async () => {
    await (await A.get("weight_records").find(ids.weight)).markAsDeleted()
    await (await A.get("health_records").find(ids.health)).markAsDeleted()
    await (await A.get("pasture_activities").find(ids.activity)).markAsDeleted()
    await animalA.markAsDeleted()
    await (await A.get("pastures").find(ids.pasture)).markAsDeleted()
  })
  await sync(a, "first client pushes record deletions through the real engine")
  await sync(b, "second client receives record deletions")
  check(
    "test animal removed from both replicas",
    (await A.get("animals")
      .query(require(root + "/node_modules/@nozbe/watermelondb").Q.where("id", ids.animal))
      .fetchCount()) === 0 &&
      (await B.get("animals")
        .query(require(root + "/node_modules/@nozbe/watermelondb").Q.where("id", ids.animal))
        .fetchCount()) === 0,
  )
  check(
    "measurement records are removed from both replicas",
    (await A.get("weight_records")
      .query(req("@nozbe/watermelondb").Q.where("id", ids.weight))
      .fetchCount()) === 0 &&
      (await B.get("weight_records")
        .query(req("@nozbe/watermelondb").Q.where("id", ids.weight))
        .fetchCount()) === 0 &&
      (await A.get("health_records")
        .query(req("@nozbe/watermelondb").Q.where("id", ids.health))
        .fetchCount()) === 0 &&
      (await B.get("health_records")
        .query(req("@nozbe/watermelondb").Q.where("id", ids.health))
        .fetchCount()) === 0,
  )
  await Promise.all([
    sync(a, "first client completes a concurrent sync"),
    sync(b, "second client completes a concurrent sync"),
  ])
  await cleanup()
  fs.writeFileSync(
    path.join(outputDir, "result.json"),
    JSON.stringify(
      { checks, tables: tables.length, schema: schema.version, cleanup: true },
      null,
      2,
    ),
  )
})()
  .catch(async (error) => {
    console.error("FAIL " + error.message)
    try {
      await cleanup()
    } catch (cleanupError) {
      console.error("CLEANUP " + cleanupError.message)
      console.error("Cleanup manifest retained at " + manifest)
    }
    process.exitCode = 1
  })
  .finally(async () => {
    await client.auth.signOut({ scope: "local" })
  })
