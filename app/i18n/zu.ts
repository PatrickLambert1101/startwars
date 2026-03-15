const zu = {
  common: {
    ok: "OK",
    cancel: "Cancel",
    back: "Back",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    done: "Done",
    search: "Search",
    logOut: "Sign Out",
    next: "Next",
    skip: "Skip",
    loading: "Loading...",
    required: "Required",
    optional: "optional",
    error: "Error",
    notFound: "Not Found",
    failedToLoad: "Failed to load data",
  },
  errors: {
    invalidEmail: "Invalid email address.",
    somethingWentWrong: "Something went wrong!",
    tryAgain: "Please try again.",
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "An unexpected error occurred. Please try restarting the app. If the problem persists, contact support.",
    reset: "RESET APP",
    traceTitle: "Error from {{name}} stack",
  },
  emptyStateComponent: {
    generic: {
      heading: "Nothing here yet",
      content: "No data found. Add some records to get started.",
      button: "Refresh",
    },
  },
  authScreen: {
    title: "HerdTrackr",
    subtitle: "Manage your livestock with ease",
    formTitle: "Sign in with your email",
    formSubtitle: "We'll send you a 7-digit code - no password needed!",
    emailLabel: "Email Address",
    emailPlaceholder: "farmer@example.com",
    sendCode: "Send Code",
    sending: "Sending...",
    enterCode: "Enter Code",
    checkEmail: "Check your email for the 7-digit code",
    sentTo: "Sent to",
    codeLabel: "7-Digit Code",
    codePlaceholder: "0000000",
    verifyCode: "Verify Code",
    verifying: "Verifying...",
    didntReceive: "Didn't receive the code?",
    resend: "Resend",
    termsNotice: "By continuing, you agree to our Terms of Service",
    benefits: {
      title: "What you can do:",
      animals: "Track animals, health & breeding",
      pastures: "Manage pastures & rotations",
      team: "Invite your farm workers",
      sync: "Sync across all devices",
    },
  },
  dashboardScreen: {
    title: "Dashboard",
    welcomeBack: "Welcome back, {{name}}",
    currentFarm: "Current Farm",
    switchFarm: "Switch Farm",
    createNewFarm: "+ Create New Farm",
    setupCard: {
      title: "Welcome to HerdTrackr",
      subtitle: "Set up your farm to start managing your herd.",
      button: "Set Up Farm",
    },
    stats: {
      totalHead: "Total Head",
      active: "Active",
      dueToCalve: "Due to Calve",
      pendingSync: "Pending Sync",
    },
    vaccinations: {
      title: "Vaccinations Due",
      overdue: "Overdue",
      dueToday: "Due Today",
      dueSoon: "Due Soon",
      viewAll: "View All Schedules",
    },
    reports: {
      title: "Reports & Analytics",
      description: "View herd performance, weight trends, and breeding reports",
    },
    recentAnimals: {
      title: "Recent Animals",
      empty: "No animals yet. Go to the Herd tab to add your first animal.",
    },
  },
  settingsScreen: {
    title: "Settings",
    sections: {
      appearance: "APPEARANCE",
      language: "LANGUAGE",
      account: "ACCOUNT",
      subscription: "SUBSCRIPTION",
      management: "MANAGEMENT",
      rfidScanner: "RFID SCANNER",
      dangerZone: "DANGER ZONE",
    },
    appearance: {
      darkMode: "Dark Mode",
      darkThemeEnabled: "Dark theme enabled",
      lightThemeEnabled: "Light theme enabled",
    },
    language: {
      appLanguage: "App Language",
      current: "Current: {{language}}",
    },
    account: {
      notSignedIn: "Not signed in",
      org: "Org: {{orgName}}",
      noOrg: "None",
    },
    subscription: {
      plans: {
        commercial: "Commercial",
        farm: "Farm",
        starter: "Starter",
      },
      status: {
        loading: "Loading...",
        commercialAccess: "Full access + team features",
        farmAccess: "Premium features unlocked",
        freeTier: "Free tier",
      },
      badges: {
        com: "COM",
        farm: "FARM",
      },
      descriptions: {
        commercial: "Full access: Unlimited animals, pastures, vaccines, team members, and advanced reports.",
        farm: "Premium access: Unlimited animals, pasture management, and vaccine tracking.",
        starter: "Upgrade to unlock pasture management, vaccine tracking, unlimited animals, and more.",
      },
      buttons: {
        manageSubscription: "Manage Subscription",
        viewPlans: "View Plans",
      },
    },
    management: {
      team: "Team",
      treatmentProtocols: "Treatment Protocols",
      vaccinationSchedules: "Vaccination Schedules",
    },
    rfid: {
      connected: "Hand scanner connected",
      readerPower: "Reader Power",
      powerSaved: "Power set to {{power}}",
      rangeHint: "Range: {{min}} (shortest) to {{max}} (longest). Higher power drains battery faster.",
      presets: {
        low: "Low",
        med: "Med",
        high: "High",
        max: "Max",
      },
    },
    dangerZone: {
      resetTitle: "Reset Local Database",
      resetDescription: "Wipes ALL local data. Only use if starting fresh after wiping Supabase.",
      resetButton: "Wipe Local Database",
      alerts: {
        confirmTitle: "Reset Local Database",
        confirmMessage: "This will delete ALL local data including your organization, animals, and records. This cannot be undone!\\n\\nOnly do this if you're starting fresh after wiping Supabase.",
        wipeButton: "WIPE EVERYTHING",
        successTitle: "Success",
        successMessage: "Local database reset! Please restart the app.",
        errorTitle: "Error",
        errorMessage: "Failed to reset database: {{error}}",
      },
    },
    signOut: "Sign Out",
    version: "HerdTrackr v0.1.0",
  },
  orgSetupScreen: {
    title: "HerdTrackr",
    subtitle: "Set up your operation",
    allSet: "You're all set!",
    step1: {
      title: "Your Farm",
      description: "Tell us about your operation. This creates your workspace.",
      yourNameLabel: "Your Name *",
      yourNamePlaceholder: "e.g. John Smith",
      farmNameLabel: "Farm / Ranch Name *",
      farmNamePlaceholder: "e.g. Sunrise Livestock, Bosveld Game Farm",
      locationLabel: "Location (optional)",
      locationPlaceholder: "e.g. Limpopo, Free State, KZN",
      ownerBadge: "Owner",
      alerts: {
        nameRequired: "Please enter your name",
        farmRequired: "Give your farm or ranch a name",
      },
    },
    step2: {
      title: "What do you farm?",
      description: "Select all the types of animals you manage.",
      livestock: {
        cattle: {
          label: "Cattle",
          desc: "Nguni, Bonsmara, Brahman, Angus...",
        },
        buffalo: {
          label: "Buffalo",
          desc: "Cape buffalo, water buffalo",
        },
        horses: {
          label: "Horses",
          desc: "Boerperd, Nooitgedachter, Thoroughbred...",
        },
        sheep: {
          label: "Sheep",
          desc: "Dorper, Merino, Damara, Dohne...",
        },
        goats: {
          label: "Goats",
          desc: "Boer, Angora, Kalahari Red, Savanna...",
        },
        game: {
          label: "Game",
          desc: "Springbok, Impala, Kudu, Eland...",
        },
        pigs: {
          label: "Pigs",
          desc: "Large White, Landrace, Duroc...",
        },
        poultry: {
          label: "Poultry",
          desc: "Boschveld, Koekoek, Rhode Island Red...",
        },
      },
      nextButton: "Next ({{count}} selected)",
      alert: "Choose the types of animals you manage",
    },
    step3: {
      title: "Set default breeds",
      description: "Choose your most common breeds. You can always change these later.",
      breedLabel: "{{livestock}} breed",
    },
    step4: {
      title: "Tell us about your herd",
      description: "This helps us tailor the experience for your operation.",
      herdSizeLabel: "Approximate herd size",
      herdSizes: {
        small: {
          label: "1 – 50",
          desc: "Smallholding / starter herd",
        },
        medium: {
          label: "50 – 200",
          desc: "Medium operation",
        },
        large: {
          label: "200 – 500",
          desc: "Large commercial",
        },
        xlarge: {
          label: "500+",
          desc: "Enterprise scale",
        },
      },
      purposeLabel: "Primary purpose (optional)",
      purposes: {
        breeding: "Breeding / Stud",
        fattening: "Fattening / Feedlot",
        dairy: "Dairy",
        mixed: "Mixed Farming",
        game: "Game Farming",
      },
      createButton: "Create Farm",
      creating: "Creating & Syncing...",
      alert: "Select your approximate herd size",
    },
    step5: {
      title: "{{farmName}} is ready!",
      subtitle: "What would you like to do first?",
      options: {
        addAnimals: {
          title: "Add my first animals",
          description: "Register your herd one by one or import from a list",
        },
        explore: {
          title: "Explore the app",
          description: "Take a look around and see what HerdTrackr can do",
        },
      },
    },
  },
  reportsScreen: {
    title: "Reports",
    noAnimals: "Add animals to see reports and analytics.",
    herdSummary: {
      title: "Herd Summary",
      totalHead: "Total Head",
    },
    bySex: {
      title: "By Sex",
    },
    byBreed: {
      title: "By Breed",
    },
    records: {
      title: "Records",
      healthRecords: "Health records",
      weightRecords: "Weight records",
      breedingRecords: "Breeding records",
      avgWeight: "Avg weight",
      calvingSuccess: "Calving success",
    },
    treatmentStats: {
      title: "Treatment Statistics",
      vaccinations: "Vaccinations",
      treatments: "Treatments",
      deworming: "Deworming",
      totalHealthEvents: "Total health events",
    },
    animalsNeedingAttention: {
      title: "Animals Needing Attention",
      count_one: "{{count}} animal needs attention",
      count_other: "{{count}} animals need attention",
      monthsOld: "{{months}} months old",
      reasons: {
        noVaccinations: "No vaccinations recorded - calves should be vaccinated by 2 months",
        needsBooster: "May need booster shots - typically required by 6 months",
      },
    },
    exportButton: "Export Herd as CSV",
    traceability: {
      title: "Animal Traceability Reports",
      description: "Generate comprehensive traceability reports for individual animals or groups. Reports include complete history: health records, weights, breeding, movements, and photos.",
      selected: "{{count}} selected",
      selectAll: "Select All",
      clear: "Clear",
      generateButton: "Generate & Share Report",
      generating: "Generating Report...",
      noSelection: "Please select at least one animal to generate a traceability report.",
    },
  },
  herdListScreen: {
    title: "Herd",
    addButton: "+ Add",
    searchPlaceholder: "Search by tag, name, or breed...",
    count_one: "{{count}} animal",
    count_other: "{{count}} animals",
    tag: "Tag: {{tag}}",
    breedAndSex: "{{breed}} | {{sex}}",
    empty: {
      loading: "Loading...",
      title: "Start Building Your Herd",
      description: "Add your first animal to start tracking health records, weights, breeding, and more.",
      onboarding: {
        step1: {
          title: "Add Animal Details",
          description: "Enter tag number, breed, sex, and optional photo",
        },
        step2: {
          title: "Track Everything",
          description: "Record treatments, weights, breeding, and movements",
        },
        step3: {
          title: "Export Reports",
          description: "Generate compliance-ready reports for sales and audits",
        },
      },
      button: "Add Your First Animal",
      tip: "Tip: Use the camera scanner to automatically read ear tag numbers",
    },
  },
  chuteScreen: {
    title: "Chute Mode",
    selectMode: "Select what you're recording today",
    modes: {
      weight: {
        title: "Weigh",
        description: "Record weight and optional condition score",
        sessionTitle: "Weigh Session",
      },
      protocol: {
        title: "Vaccinate / Treat",
        description: "Apply vaccination or treatment protocols with auto-calculated dosages",
        sessionTitle: "Vaccinate / Treat Session",
      },
      weightAndTreatment: {
        title: "Weigh + Treat",
        description: "Record weight and apply protocol in one go",
        sessionTitle: "Weigh + Treat Session",
      },
      condition: {
        title: "Condition Score",
        description: "Record body condition scores",
        sessionTitle: "Condition Score Session",
      },
    },
    session: {
      processed: "{{count}} processed",
      previousSession: "Previous session: {{count}} processed",
      endSession: "End Session",
    },
    scan: {
      title: "SCAN TAG",
      placeholder: "Enter tag or use camera",
      lookUp: "Look Up",
      searching: "Searching...",
      notFound: "No animal found with tag \"{{tag}}\". Add it first in the Herd tab.",
    },
    animalInfo: {
      rfid: "RFID",
      visualTag: "Visual Tag",
      dob: "DOB",
      lastWeight: "Last Weight",
      lastWeightValue: "{{weight}} kg",
    },
    weight: {
      previousWeight: "Previous weight:",
      weightValue: "{{weight}} kg",
      newWeightLabel: "New Weight (kg)",
      weightPlaceholder: "e.g. 450",
      conditionScoreLabel: "Condition Score (1-9)",
      conditionScorePlaceholder: "Optional, e.g. 6",
      saveAndNext: "Save & Next",
      invalidWeight: "Enter a valid weight in kg",
      invalidConditionScore: "Condition score must be 1-9",
    },
    weightAndTreatment: {
      step1: "1. Record Weight",
      step2: "2. Select Treatment",
      weightLabel: "Weight (kg)",
      conditionScoreLabel: "Condition Score (1-9)",
      noProtocols: "No active protocols available",
      manageProtocols: "Manage Protocols",
      changeProtocol: "Change Protocol",
      saveBoth: "Save Both & Next",
      calculatedDosage: {
        title: "Calculated Dosage",
        atWeight: "At {{weight}} kg:",
        give: "Give: {{ml}} ml",
      },
      required: "Select a treatment protocol",
    },
    condition: {
      labels: {
        thin: "Thin",
        moderate: "Moderate",
        fat: "Fat",
      },
    },
    protocol: {
      title: "Select Vaccination / Treatment",
      product: "Product: {{name}}",
      standardDosage: "Standard Dosage: {{dosage}}",
      method: "Method: {{method}}",
      withdrawal: "Withdrawal: {{days}} days",
      autoCalculated: {
        title: "Auto-Calculated Dosage",
        lastWeight: "Last weight: {{weight}} kg",
        give: "Give: {{ml}} ml",
        based: "Based on {{ml}}ml per {{kg}}kg",
      },
      manualDosage: "Manual dosage required - protocol doesn't specify rate per kg",
      noWeight: {
        title: "No Weight on Record",
        message: "Weigh this animal first for accurate dosage calculation",
      },
      changeProtocol: "Change Protocol",
      applyAndNext: "Apply & Next",
    },
  },
  pasturesScreen: {
    title: "Pasture Rotation",
    createButton: "+ New",
    locked: {
      title: "Pasture Rotation",
      description: "Map paddocks, assign herds, and track grazing days to optimise forage and soil health.",
      proBadge: "PRO",
      upgradeButton: "Upgrade to Pro",
    },
    stats: {
      pastures: "Pastures",
      animals: "Animals",
      occupied: "Occupied",
    },
    card: {
      animals: "Animals",
      daysGrazed: "Days Grazed",
      daysUntilRotation: "{{days}} days until rotation",
    },
    empty: {
      title: "No Pastures Yet",
      description: "We'll guide you through creating your first pasture in just 3 easy steps",
      button: "Get Started →",
    },
  },
  animalDetailScreen: {
    loading: "Loading...",
    notFound: "Animal not found",
    backButton: "Back",
    editButton: "Edit",
    deleteButton: "Delete Animal",
    tabs: {
      overview: "Overview",
      health: "Health",
      vaccinations: "Vaccinations",
      weight: "Weight",
      breeding: "Breeding",
    },
    overview: {
      rfidTag: "RFID Tag",
      visualTag: "Visual Tag",
      dateOfBirth: "Date of Birth",
      registrationNumber: "Registration #",
      notes: "Notes",
      noValue: "—",
    },
    health: {
      addButton: "+ Add Health Record",
      empty: "No health records yet.",
      product: "Product: {{product}}",
      recordedBy: "Recorded by {{name}}",
    },
    weight: {
      addButton: "+ Add Weight Record",
      empty: "No weight records yet.",
      weightValue: "{{weight}} kg",
      condition: "Condition: {{score}}/9",
      recordedBy: "Recorded by {{name}}",
    },
    breeding: {
      addButton: "+ Add Breeding Record",
      empty: "No breeding records yet.",
      bred: "Bred: {{date}}",
      expectedCalving: "Expected calving: {{date}}",
      recordedBy: "Recorded by {{name}}",
    },
  },
  animalFormScreen: {
    title: {
      edit: "Edit Animal",
      add: "Add Animal",
    },
    farmLabel: "Farm:",
    helperNote: "* At least one tag (RFID or Visual) is required",
    fields: {
      rfidTag: {
        label: "RFID Tag",
        placeholder: "Enter RFID tag number",
        scanPlaceholder: "Pull trigger to scan RFID tag",
        helpText: "Electronic tag embedded in ear tag - Commercial plan includes RFID scanner support",
        scanning: "Pull trigger to scan...",
      },
      visualTag: {
        label: "Visual Tag (ear tag/brand)",
        placeholder: "Ear tag or brand number",
        helpText: "Use camera scanner button to automatically read tag numbers from photos",
      },
      name: {
        label: "Name (optional)",
        placeholder: "Animal name",
      },
      photos: {
        label: "Photos (for identification)",
      },
      breed: {
        label: "Breed *",
        placeholder: "Select breed",
      },
      sex: {
        label: "Sex *",
        options: {
          male: "Bull",
          female: "Cow",
          castrated: "Steer/Ox",
          unknown: "Unknown",
        },
      },
      dateOfBirth: {
        label: "Date of Birth",
        placeholder: "DD/MM/YYYY",
      },
      registrationNumber: {
        label: "Registration Number",
        placeholder: "Optional",
      },
      herdTag: {
        label: "Herd/Group Tag",
        placeholder: "e.g., 23-C, XYZ, Group A (optional)",
      },
      notes: {
        label: "Notes",
        placeholder: "Any additional notes...",
      },
    },
    lineage: {
      title: "Lineage (optional)",
      helpText: "Track genetics for breeding programs and pedigree documentation",
      sire: {
        label: "Sire (Father)",
        placeholder: "+ Add sire",
        noMales: "Add male animals to your herd first to select as sires",
      },
      dame: {
        label: "Dame (Mother)",
        placeholder: "+ Add dame",
        noFemales: "Add female animals to your herd first to select as dames",
      },
    },
    buttons: {
      cancel: "Cancel",
      save: "Save Changes",
      add: "Add Animal",
      saving: "Saving...",
    },
    modals: {
      breed: {
        title: "Select Breed",
        cancel: "Cancel",
      },
      sex: {
        title: "Select Sex",
        cancel: "Cancel",
      },
      sire: {
        title: "Select Sire",
        searchPlaceholder: "Search by name or tag...",
        empty: "No bulls found",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Cancel",
      },
      dame: {
        title: "Select Dame",
        searchPlaceholder: "Search by name or tag...",
        empty: "No cows found",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Cancel",
      },
    },
    alerts: {
      validation: {
        tagRequired: {
          title: "Required",
          message: "Please enter either an RFID Tag or Visual Tag (at least one is required)",
        },
        breedRequired: {
          title: "Required",
          message: "Breed is required",
        },
        noOrganization: {
          title: "Error",
          message: "No organization selected",
        },
      },
      saveError: {
        title: "Error",
        message: "Failed to save animal. Please try again.",
      },
    },
  },
  bulkAnimalAddScreen: {
    title: {
      setup: "Bulk Add",
      entry: "Quick Add",
    },
    setup: {
      helpText: "Set common fields once, then quickly scan tags for multiple animals with the same characteristics.",
      sectionTitle: "Common Fields (apply to all animals)",
      tagTypeLabel: "Tag Type",
      tagTypeModalTitle: "Select Tag Type",
      tagType: {
        visual: "Visual Tag (Ear Tag)",
        rfid: "RFID Tag",
      },
      tagTypeDescription: {
        visual: "Physical tag number visible on the animal",
        rfid: "Electronic RFID tag number",
      },
      labelPrefixLabel: "Label/Tag Prefix (optional)",
      labelPrefixPlaceholder: "e.g., BRN, COW, 2024-",
      labelPrefixHelper: "This will be added before each tag number",
      pastureLabel: "Current Pasture/Group (optional)",
      pasturePlaceholder: "+ Select pasture",
      pastureModalTitle: "Select Pasture",
      noPastures: "No pastures found",
      notesLabel: "Notes Template (optional)",
      notesPlaceholder: "Applies to all animals in this batch...",
      startButton: "Start Quick Entry",
    },
    entry: {
      countLabel: "{{count}} Added",
      tagLabel: "Scan or Enter Tag",
      tagPlaceholder: "Ear tag or RFID",
      weightLabel: "Weight (optional)",
      weightPlaceholder: "kg",
      photoLabel: "Photo (optional)",
      addButton: "Add Animal",
      adding: "Adding...",
      recentTitle: "Recently Added",
    },
    alerts: {
      breedRequired: {
        title: "Required",
        message: "Breed is required before starting bulk entry",
      },
      tagRequired: {
        title: "Required",
        message: "Please enter a tag number (Visual or RFID)",
      },
      noOrganization: {
        message: "No organization selected",
      },
      addError: {
        message: "Failed to add animal. Please try again.",
      },
      finish: {
        title: "Finish Bulk Add?",
        message: "You've added {{count}} animals. Ready to finish?",
        cancel: "Keep Adding",
        confirm: "Done",
      },
    },
  },
  teamScreen: {
    title: "Team",
    loading: "Loading...",
    inviteButton: "+ Invite",
    inviteForm: {
      title: "Invite Team Member",
      emailLabel: "Email Address",
      emailPlaceholder: "worker@example.com",
      roleLabel: "Role",
      roles: {
        admin: "Admin",
        worker: "Worker",
      },
      sendButton: "Send Invite",
      sending: "Sending...",
      cancelButton: "Cancel",
      emailRequired: "Email address is required",
      invalidEmail: "Please enter a valid email address",
    },
    alerts: {
      inviteSent: {
        title: "Invite Sent",
        message: "An invitation has been sent to {{email}}. They'll receive an email with instructions to join your team.",
        ok: "OK",
      },
      cancelInvite: {
        title: "Cancel Invite",
        message: "Cancel the invite for {{email}}?",
        no: "No",
        yes: "Yes, Cancel",
      },
      changeRole: {
        title: "Change Role",
        message: "Change {{name}}'s role to {{role}}?",
        cancel: "Cancel",
        change: "Change Role",
      },
      removeMember: {
        title: "Remove Member",
        message: "Remove {{name}} from your team? They will lose access to this organization.",
        cancel: "Cancel",
        remove: "Remove",
      },
      error: {
        title: "Error",
        sendFailed: "Failed to send invitation. Please try again.",
        cancelFailed: "Failed to cancel invitation.",
        changeFailed: "Failed to change role.",
        removeFailed: "Failed to remove team member.",
      },
    },
    sections: {
      members: "Team Members ({{count}})",
      invites: "Pending Invites ({{count}})",
    },
    member: {
      you: "(you)",
      joined: "Joined {{date}}",
      admin: "Admin",
      worker: "Worker",
    },
    invite: {
      code: "Code: {{code}}",
      expires: "Expires {{date}}",
      cancelButton: "Cancel",
    },
    noAccess: "Only admins can manage team members",
    syncNotice: {
      title: "Sync Required",
      text: "Team changes require syncing to take effect across all devices.",
      button: "Sync Now",
    },
  },
  treatmentProtocolsScreen: {
    title: "Treatment Protocols",
    createButton: "+ New",
    filters: {
      all: "All",
      vaccination: "Vaccination",
      treatment: "Treatment",
      deworming: "Deworming",
      other: "Other",
    },
    count_one: "{{count}} protocol",
    count_other: "{{count}} protocols",
    inactive: "Inactive",
    withdrawal: "Withdrawal: {{days}} days",
    empty: {
      title: "No Protocols Found",
      noProtocols: "Create your first treatment protocol to use in Chute Mode",
      filtered: "No {{filter}} protocols found",
      showAll: "Show All",
      loadDefaults: "Load SA Defaults",
      createButton: "Create Protocol",
    },
    alerts: {
      toggleError: "Failed to toggle protocol status",
      defaultsAdded: "{{count}} protocols added successfully",
    },
  },
  healthRecordFormScreen: {
    title: "Health Record",
    cancelButton: "Cancel",
    typeLabel: "Type",
    recordTypes: {
      vaccination: "vaccination",
      treatment: "treatment",
      vet_visit: "vet visit",
      condition_score: "condition score",
      other: "other",
      vaccinationPro: "vaccination (PRO)",
    },
    protocol: {
      selectButton_one: "Select from {{count}} saved protocol",
      selectButton_other: "Select from {{count}} saved protocols",
      selectedDetail: "{{productName}} • {{dosage}}",
      noProtocols: "No protocols found. Create one in Settings → Treatment Protocols",
    },
    fields: {
      description: {
        label: "Description *",
        placeholder: "What was done?",
      },
      productName: {
        label: "Product Name",
        placeholder: "e.g. Covexin 10",
      },
      dosage: {
        label: "Dosage",
        placeholder: "e.g. 2ml SC",
      },
      administeredBy: {
        label: "Administered By",
        placeholder: "Optional",
      },
      notes: {
        label: "Notes",
        placeholder: "Additional notes...",
      },
      photos: {
        label: "Photos (Optional)",
      },
    },
    buttons: {
      save: "Save Record",
      saving: "Saving...",
    },
    alerts: {
      required: {
        title: "Required",
        message: "Description is required",
      },
      noOrganization: {
        title: "Error",
        message: "No organization selected",
      },
      saveError: {
        title: "Error",
        message: "Failed to save health record",
      },
    },
  },
  weightRecordFormScreen: {
    title: "Weight Record",
    cancelButton: "Cancel",
    fields: {
      weight: {
        label: "Weight (kg) *",
        placeholder: "e.g. 450",
      },
      conditionScore: {
        label: "Condition Score (1-9)",
        placeholder: "Optional, e.g. 6",
      },
      notes: {
        label: "Notes",
        placeholder: "Additional notes...",
      },
      photos: {
        label: "Photos (Optional)",
      },
    },
    buttons: {
      save: "Save Record",
      saving: "Saving...",
    },
    alerts: {
      invalidWeight: {
        title: "Invalid",
        message: "Please enter a valid weight in kg",
      },
      invalidConditionScore: {
        title: "Invalid",
        message: "Condition score must be between 1 and 9",
      },
      noOrganization: {
        title: "Error",
        message: "No organization selected",
      },
      saveError: {
        title: "Error",
        message: "Failed to save weight record",
      },
    },
  },
  breedingRecordFormScreen: {
    title: "Breeding Record",
    cancelButton: "Cancel",
    methodLabel: "Method",
    methods: {
      natural: "natural",
      ai: "ai",
      embryo_transfer: "embryo transfer",
    },
    outcomeLabel: "Outcome",
    outcomes: {
      pending: "pending",
      live_calf: "live calf",
      stillborn: "stillborn",
      aborted: "aborted",
      open: "open",
    },
    fields: {
      notes: {
        label: "Notes",
        placeholder: "Additional notes...",
      },
      photos: {
        label: "Photos (Optional)",
      },
    },
    buttons: {
      save: "Save Record",
      saving: "Saving...",
    },
    alerts: {
      noOrganization: {
        title: "Error",
        message: "No organization selected",
      },
      saveError: {
        title: "Error",
        message: "Failed to save breeding record",
      },
    },
    },
  vaccinationScheduleScreen: {
    title: "Vaccination Schedules",
    createButton: "+ New",
    count: "{{count}} schedules",
    filters: {
      all: "All",
      ageBased: "Age-based",
      dateBased: "Date-based",
      groupBased: "Group-based",
    },
    badges: {
      inactive: "Inactive",
    },
    details: {
      booster: "{{count}} doses, booster after {{days}} days",
    },
    empty: {
      title: "No Vaccination Schedules",
      noFilter: "Create schedules to automate vaccination reminders based on age, date, or group.",
      withFilter: "No {{filter}} schedules found.",
      showAllButton: "Show All",
      createButton: "Create Schedule",
    },
    alerts: {
      toggleError: {
        title: "Error",
        message: "Failed to toggle schedule status",
      },
      deleteConfirm: {
        title: "Delete Schedule",
        message: "Delete vaccination schedule '{{name}}'? This will not affect existing health records.",
      },
      deleteError: {
        title: "Error",
        message: "Failed to delete schedule",
      },
    },
  },
}

export default zu
export type Translations = typeof en
