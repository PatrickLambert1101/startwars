import fs from "fs"
import path from "path"

it("tracks every registered screen and all report subtabs in the visual review", () => {
  const root = process.cwd()
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "docs/bento-screen-coverage.json"), "utf8"),
  )
  const routes = ["app/navigators/AppNavigator.tsx", "app/navigators/MainTabNavigator.tsx"].flatMap(
    (file) =>
      [
        ...fs
          .readFileSync(path.join(root, file), "utf8")
          .matchAll(/<(?:Stack|Tab)\.Screen\s+name="([^"]+)"/g),
      ].map((match) => match[1]),
  )
  expect(manifest.routes.map((entry: { route: string }) => entry.route).sort()).toEqual(
    routes.sort(),
  )
  for (const entry of [...manifest.routes, ...manifest.reportTabs]) {
    expect(fs.existsSync(path.join(root, entry.file))).toBe(true)
    expect(entry.family).toBeTruthy()
  }
  expect(manifest.reportTabs.map((entry: { route: string }) => entry.route)).toEqual([
    "Reports/DashboardTab",
    "Reports/MyReportsTab",
    "Reports/ExportTab",
  ])
})
