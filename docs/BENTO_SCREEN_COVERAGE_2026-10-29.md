# Full-app visual coverage — 29 October 2026

Every registered stack/tab screen and all report subtabs were reviewed against the dashboard visual system. The list below is generated from both navigators, including authentication and development routes. Source review includes loading, empty, populated and error branches where present; this is not a claim that every branch was exercised on a device.

| Page | Source | Presentation |
| --- | --- | --- |
| Main | `app/navigators/MainTabNavigator.tsx` | Navigation container |
| OrgSetup | `app/screens/OrgSetupScreen.tsx` | Grouped form and picker surfaces |
| Team | `app/screens/TeamScreen/TeamScreen.tsx` | Management and planning hub |
| Settings | `app/screens/SettingsScreen.tsx` | Management and planning hub |
| DataImports | `app/screens/DataImportsScreen/DataImportsScreen.tsx` | Import guide, mapping, progress and results |
| DataImport | `app/screens/DataImportScreen/DataImportScreen.tsx` | Import guide, mapping, progress and results |
| AnimalDetail | `app/screens/AnimalDetailScreen/AnimalDetailScreen.tsx` | Detail and supporting records |
| AnimalForm | `app/screens/AnimalFormScreen.tsx` | Grouped form and picker surfaces |
| BulkAnimalAdd | `app/screens/BulkAnimalAddScreen.tsx` | Grouped form and picker surfaces |
| HealthRecordForm | `app/screens/HealthRecordFormScreen.tsx` | Grouped form and picker surfaces |
| WeightRecordForm | `app/screens/WeightRecordFormScreen.tsx` | Grouped form and picker surfaces |
| BreedingRecordForm | `app/screens/BreedingRecordFormScreen.tsx` | Grouped form and picker surfaces |
| TreatmentProtocols | `app/screens/TreatmentProtocolsScreen/TreatmentProtocolsScreen.tsx` | Management and planning hub |
| ProtocolForm | `app/screens/ProtocolFormScreen/ProtocolFormScreen.tsx` | Grouped form and picker surfaces |
| ProtocolDetail | `app/screens/ProtocolDetailScreen/ProtocolDetailScreen.tsx` | Detail and supporting records |
| VaccinationSchedules | `app/screens/VaccinationScheduleScreen.tsx` | Management and planning hub |
| VaccinationScheduleForm | `app/screens/VaccinationScheduleFormScreen.tsx` | Grouped form and picker surfaces |
| PendingVaccinations | `app/screens/PendingVaccinationsScreen.tsx` | Management and planning hub |
| Reports | `app/screens/ReportsScreen/index.tsx` | Management and planning hub |
| ReportBuilder | `app/screens/ReportBuilderScreen/index.tsx` | Detail and supporting records |
| ReportViewer | `app/screens/ReportViewerScreen/index.tsx` | Detail and supporting records |
| PastureDetail | `app/screens/PastureDetailScreen/PastureDetailScreen.tsx` | Detail and supporting records |
| PastureForm | `app/screens/PastureFormScreen/PastureFormScreen.tsx` | Grouped form and picker surfaces |
| PastureActivityForm | `app/screens/PastureActivityFormScreen/PastureActivityFormScreen.tsx` | Grouped form and picker surfaces |
| PastureActivityList | `app/screens/PastureActivityListScreen/PastureActivityListScreen.tsx` | Detail and supporting records |
| PastureBoundary | `app/screens/PastureBoundaryScreen/PastureBoundaryScreen.tsx` | Map with branded app overlays |
| PastureKmlImport | `app/screens/PastureKmlImportScreen/PastureKmlImportScreen.tsx` | Import guide, mapping, progress and results |
| PasturesMap | `app/screens/PasturesMapScreen/PasturesMapScreen.tsx` | Map with branded app overlays |
| PastureWizard | `app/screens/PastureWizardScreen/PastureWizardScreen.tsx` | Grouped form and picker surfaces |
| MovementForm | `app/screens/MovementFormScreen/MovementFormScreen.tsx` | Grouped form and picker surfaces |
| TagScanner | `app/screens/TagScannerScreen/TagScannerScreen.tsx` | Camera with branded manual-entry and permission states |
| Upgrade | `app/screens/UpgradeScreen.tsx` | Billing and subscription |
| Paywall | `app/screens/PaywallScreen.tsx` | Billing and subscription |
| CustomerCenter | `app/screens/CustomerCenterScreen.tsx` | Billing and subscription |
| Auth | `app/screens/AuthScreen/AuthScreen.tsx` | Welcome and authentication |
| Landing | `app/screens/LandingScreen.tsx` | Welcome and authentication |
| Login | `app/screens/LoginScreen.tsx` | Welcome and authentication |
| IconGallery | `app/screens/IconGalleryScreen.tsx` | Development icon gallery |
| Dashboard | `app/screens/DashboardScreen.tsx` | Primary bento destination |
| HerdList | `app/screens/HerdListScreen.tsx` | Primary bento destination |
| Chute | `app/screens/ChuteScreen.tsx` | Primary bento destination |
| Pastures | `app/screens/PasturesScreen/PasturesScreen.tsx` | Primary bento destination |
| Calendar | `app/screens/CalendarScreen.tsx` | Primary bento destination |
| Breeding | `app/screens/BreedingScreen.tsx` | Primary bento destination |
| Reports/DashboardTab | `app/screens/ReportsScreen/DashboardTab.tsx` | Report subtab |
| Reports/MyReportsTab | `app/screens/ReportsScreen/MyReportsTab.tsx` | Report subtab |
| Reports/ExportTab | `app/screens/ReportsScreen/ExportTab.tsx` | Report subtab |


Additional review covers the legacy farm-setup implementation, error-boundary presentation and scanner overlay. Shared controls cover buttons, fields, measurements, dates, photos, tags, animal/filter pickers, RFID settings, charts and empty states.

Platform-owned purchase management, maps, camera imagery, system authentication and native picker/permission sheets retain their functional/native presentation; their app-owned surrounding headers, controls, fallbacks and overlays use the updated visual system.

Settings has an account/farm hero, plan/language cards, a four-action management grid, grouped preferences and subscription details, state-aware sync copy and a collapsible development-only advanced-tools section. Existing biometric confirmation, billing, sign-out, reset and record-save handlers remain connected.

Forms now have clearly bounded primary field panels, consistent title sizes, spacing, selection controls and input shapes. Management hubs and pasture/protocol detail pages have intentional introduction/identity cards. Subscription screens retain real store prices and selections with matching app-owned surfaces.

The companion manifest is checked by a regression test so a newly registered route cannot silently disappear from this review list.

Validation completed on 29 October 2026:

- 181 tests passed across 38 suites (excluding unrelated nested `.claude` worktrees).
- Production JavaScript bundles exported successfully for both iOS and Android.
- TypeScript comparison: 92 existing errors versus 95 at the starting commit; no new diagnostics. Changed-file lint comparison likewise reports no new errors; the repository still has existing lint failures.
- Native iOS spot-checks cover Settings, Team and Treatment Protocols, alongside the earlier dashboard, chute, pasture and animal-profile checks. The full route list above records source coverage; it does not claim every route/state was exercised on-device. Android received bundle verification, not an emulator visual review.
- Opening the empty Protocols screen during review triggered its pre-existing automatic seed effect and created 12 default protocol templates in the active farm. Those templates remain present; no animal treatment records were created. Removed the automatic effect so future default creation requires the existing Load Defaults button, and added a regression test for that behavior.
- Fixed protocol filter-row flex shrinking discovered in the native review.

All styling work remains on `experiment/bento-navigation`; no store release or main-branch merge is part of this pass.
