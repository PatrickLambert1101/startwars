import XCTest
final class HerdDeviceChecks: XCTestCase {
 func capture(_ name: String, _ app: XCUIApplication) {
  let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
 }
 func testInitialInspection() throws {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier: "com.herdtrackr"); app.activate(); sleep(2)
  let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
  if springboard.alerts.buttons["Open"].exists { springboard.alerts.buttons["Open"].tap() }
  if app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "This is the developer menu")).firstMatch.exists {
   if app.buttons["Continue"].exists { app.buttons["Continue"].tap() }
  }
  capture("initial-screen", app)
  print("DEVICE_TREE_BEGIN\n\(app.debugDescription)\nDEVICE_TREE_END")
  XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10))
 }
 func testSurfaceExploration() throws {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier: "com.herdtrackr")
  app.activate(); sleep(2)
  let banner = app.otherElements.matching(NSPredicate(format: "label CONTAINS %@", "TypeError: Network request failed")).firstMatch
  if banner.exists && banner.isHittable {
   banner.tap(); sleep(1)
   print("LOGBOX_TREE_BEGIN\n\(app.debugDescription)\nLOGBOX_TREE_END")
   for title in ["Dismiss All", "Dismiss", "Close"] {
    let button = app.buttons[title]
    if button.exists && button.isHittable { button.tap(); break }
   }
  }
  for name in ["Herd", "Chute", "Pastures", "Calendar", "Breeding", "Home"] {
   tab(name, app)
   capture(name + "-screen", app)
   print("SCREEN_" + name + "_BEGIN\n\(app.debugDescription)\nSCREEN_" + name + "_END")
  }
 }

 func tab(_ name: String, _ app: XCUIApplication) {
  let route = ["Home": "Dashboard", "Herd": "HerdList", "Calendar": "Calendar", "Breeding": "Calendar"][name] ?? name
  let bento = app.descendants(matching: .any).matching(identifier: "navigation-" + route).firstMatch
  var item: XCUIElement {
   bento.exists ? bento : app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", name + ", tab,")).firstMatch
  }
  if app.buttons["Close animal picker"].exists { app.buttons["Close animal picker"].tap() }
  for _ in 0..<3 {
   for _ in 0..<8 {
    let dismiss = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Dismiss")).allElementsBoundByIndex.first(where: { $0.isHittable })
    if let dismiss = dismiss { dismiss.tap(); usleep(250000); continue }
    let banners = app.otherElements.matching(NSPredicate(format: "label CONTAINS %@ OR label CONTAINS %@", "[RevenueCat]", "Network request failed")).allElementsBoundByIndex
    if let banner = banners.first(where: { $0.isHittable && $0.frame.height < 130 }) {
     banner.tap(); usleep(250000); continue
    }
    break
   }
   if !item.exists && app.buttons["Cancel"].exists {
    app.buttons["Cancel"].tap()
    if app.alerts.buttons["Discard changes"].exists { app.alerts.buttons["Discard changes"].tap() }
   }
   XCTAssertTrue(item.waitForExistence(timeout: 20))
   if item.isHittable { item.tap() }
   usleep(350000)
   if item.isSelected {
    if bento.exists && (name == "Calendar" || name == "Breeding") {
     let segment = app.descendants(matching: .any).matching(identifier: "plan-" + name).firstMatch
     XCTAssertTrue(segment.waitForExistence(timeout: 5)); segment.tap(); usleep(350000)
     XCTAssertTrue(segment.isSelected)
    }
    return
   }
  }
  XCTFail("Tab did not become selected: " + name)
 }
 func addAnimal(_ app: XCUIApplication) {
  let add = app.buttons.matching(NSPredicate(format: "label CONTAINS %@ OR label == %@", "+ Add", "Add animal")).firstMatch
  XCTAssertTrue(add.waitForExistence(timeout: 5))
  for _ in 0..<4 { if add.isHittable { break }; app.swipeUp() }
  add.tap()
  XCTAssertTrue(app.textFields.matching(NSPredicate(format: "label BEGINSWITH %@", "Visual Tag")).firstMatch.waitForExistence(timeout: 5))
 }
 func testDraftAndWeightEditing() throws {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier: "com.herdtrackr"); app.activate()
  tab("Herd", app)
  let row = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", ", active,")).firstMatch
  guard row.waitForExistence(timeout: 5) else { throw XCTSkip("Requires an existing active animal; this test does not create farm records.") }
  let cowIdentifier = row.label.components(separatedBy: ",")[0]
  tab("Home", app)
  addAnimal(app)
  capture("animal-form-untouched", app)
  print("ANIMAL_FORM_BEGIN\n\(app.debugDescription)\nANIMAL_FORM_END")
  app.buttons["Cancel"].tap()
  XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label == %@ OR label == %@", "Dashboard", "Your farm")).firstMatch.waitForExistence(timeout: 5))
  XCTAssertFalse(app.alerts.firstMatch.exists)

  addAnimal(app)
  let field = app.textFields.matching(NSPredicate(format: "label BEGINSWITH %@", "Visual Tag")).firstMatch
  field.tap(); field.typeText("UX-DEVICE-DRAFT")
  app.buttons["Cancel"].tap()
  XCTAssertTrue(app.alerts["Discard unsaved changes?"].waitForExistence(timeout: 5))
  app.alerts.buttons["Keep editing"].tap()
  XCTAssertEqual(field.value as? String, "UX-DEVICE-DRAFT")
  app.buttons["Cancel"].tap()
  app.alerts.buttons["Discard changes"].tap()
  XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label == %@ OR label == %@", "Dashboard", "Your farm")).firstMatch.waitForExistence(timeout: 5))

  let weigh = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Weigh")).firstMatch
  weigh.tap(); sleep(1)
  print("ANIMAL_PICKER_BEGIN\n\(app.debugDescription)\nANIMAL_PICKER_END")
  let cow = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", cowIdentifier)).firstMatch
  XCTAssertTrue(cow.waitForExistence(timeout: 5)); cow.tap()
  let weight = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Weight")).firstMatch
  XCTAssertTrue(weight.waitForExistence(timeout: 5))
  print("WEIGHT_FORM_BEGIN\n\(app.debugDescription)\nWEIGHT_FORM_END")
  weight.tap()
  for digit in ["4", "5", "0"] { app.buttons[digit].tap() }
  app.buttons["Done"].tap()
  XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@ AND label CONTAINS %@", "Weight", "450")).firstMatch.waitForExistence(timeout: 5))
  weight.tap()
  app.buttons["Delete last digit"].tap(); app.buttons["5"].tap(); app.buttons["Done"].tap()
  let corrected = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@ AND label CONTAINS %@", "Weight", "455")).firstMatch
  XCTAssertTrue(corrected.waitForExistence(timeout: 5))
  capture("weight-corrected-455", app)
  corrected.tap(); app.buttons["Clear"].tap(); app.buttons["1"].tap()
  app.buttons.matching(identifier: "Cancel").allElementsBoundByIndex.last!.tap()
  XCTAssertTrue(corrected.waitForExistence(timeout: 5))
  app.buttons["Cancel"].tap()
  XCTAssertTrue(app.alerts["Discard unsaved changes?"].waitForExistence(timeout: 5))
  app.alerts.buttons["Discard changes"].tap()
  XCTAssertTrue(app.staticTexts.matching(NSPredicate(format: "label == %@ OR label == %@", "Dashboard", "Your farm")).firstMatch.waitForExistence(timeout: 5))
 }
 func testConditionOnlyEntry() throws {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier: "com.herdtrackr"); app.activate()
  tab("Chute", app)
  let endPrevious = app.buttons.matching(NSPredicate(format: "label BEGINSWITH[c] %@", "End Session")).firstMatch
  if endPrevious.exists { endPrevious.tap() }
  let mode = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Condition Score")).firstMatch
  XCTAssertTrue(mode.waitForExistence(timeout: 5)); mode.tap()
  capture("condition-only-session", app)
  print("CONDITION_SESSION_BEGIN\n\(app.debugDescription)\nCONDITION_SESSION_END")
  let end = app.buttons.matching(NSPredicate(format: "label BEGINSWITH[c] %@", "End")).firstMatch
  XCTAssertTrue(end.waitForExistence(timeout: 5)); end.tap()
  XCTAssertTrue(mode.waitForExistence(timeout: 5))
  tab("Home", app)
 }

 func testChuteDraftAcrossTabs() throws {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier: "com.herdtrackr"); app.activate()
  tab("Herd", app)
  let row = app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", ", active,")).firstMatch
  guard row.waitForExistence(timeout: 5) else { throw XCTSkip("Requires an existing active animal") }
  let identifier = row.label.components(separatedBy: ",")[0]
  tab("Chute", app)
  let endPrevious = app.buttons.matching(NSPredicate(format: "label BEGINSWITH[c] %@", "End Session")).firstMatch
  if endPrevious.exists { endPrevious.tap() }
  let mode = app.descendants(matching: .any).matching(NSPredicate(format: "label BEGINSWITH %@", "Weigh,")).firstMatch
  XCTAssertTrue(mode.waitForExistence(timeout: 5)); mode.tap()
  let input = app.textFields.firstMatch
  XCTAssertTrue(input.waitForExistence(timeout: 5)); input.tap(); input.typeText(identifier + "\n")
  let weight = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "New Weight")).firstMatch
  XCTAssertTrue(weight.waitForExistence(timeout: 5)); weight.tap()
  for digit in ["4", "5", "0"] { app.buttons[digit].tap() }
  app.buttons["Done"].tap()
  tab("Calendar", app); tab("Chute", app)
  let retained = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@ AND label CONTAINS %@", "New Weight", "450")).firstMatch
  capture("chute-draft-after-tab-switch", app)
  XCTAssertTrue(retained.waitForExistence(timeout: 5), "Switching tabs discarded the unfinished weight")
  app.buttons.matching(NSPredicate(format: "label BEGINSWITH[c] %@", "End")).firstMatch.tap()
  tab("Home", app)
 }

}
