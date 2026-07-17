const zu = {
  common: {
    ok: "Kulungile",
    cancel: "Khansela",
    back: "Emuva",
    save: "Londoloza",
    delete: "Susa",
    edit: "Hlela",
    add: "Engeza",
    done: "Kwenziwe",
    search: "Sesha",
    logOut: "Phuma",
    next: "Okulandelayo",
    skip: "Yeqa",
    loading: "Iyalayisha...",
    required: "Kuyadingeka",
    optional: "okukhethekayo",
    error: "Iphutha",
    notFound: "Akutholakali",
    failedToLoad: "Yehlulekile ukulayisha idatha",
  },
  errors: {
    invalidEmail: "Ikheli le-imeyili alivumelekile.",
    somethingWentWrong: "Kukhona okungahambanga kahle!",
    tryAgain: "Sicela uzame futhi.",
  },
  errorScreen: {
    title: "Kukhona okungahambanga kahle!",
    friendlySubtitle:
      "Kwenzeke iphutha elingalindelekile. Sicela uzame ukuqalisa kabusha uhlelo. Uma inkinga iqhubeka, xhumana nabasekeli.",
    reset: "QALISA KABUSHA UHLELO",
    traceTitle: "Iphutha elivela ku-{{name}} stack",
  },
  emptyStateComponent: {
    generic: {
      heading: "Akukho lutho lapha okwamanje",
      content: "Ayikho idatha etholakele. Engeza amarekhodi ukuze uqale.",
      button: "Vuselela",
    },
  },
  authScreen: {
    title: "HerdTrackr",
    subtitle: "Phatha imfuyo yakho kalula",
    formTitle: "Ngena nge-imeyili yakho",
    formSubtitle: "Sizokuthumelela ikhodi yamadijithi ayi-7 - akudingeki iphasiwedi!",
    emailLabel: "Ikheli Le-imeyili",
    emailPlaceholder: "umlimi@isibonelo.com",
    sendCode: "Thumela Ikhodi",
    sending: "Iyathunyelwa...",
    enterCode: "Faka Ikhodi",
    checkEmail: "Bheka i-imeyili yakho ukuthola ikhodi yamadijithi ayi-7",
    sentTo: "Kuthunyelwe ku",
    codeLabel: "Ikhodi Yamadijithi ayi-7",
    codePlaceholder: "0000000",
    verifyCode: "Qinisekisa Ikhodi",
    verifying: "Iyaqinisekiswa...",
    didntReceive: "Awuyitholanga ikhodi?",
    resend: "Phinda Uthumele",
    termsNotice: "Ngokuqhubeka, uyavuma Imigomo Yethu Yenkonzo",
    benefits: {
      title: "Ongakwenza:",
      animals: "Landelela izilwane, impilo nokuzalanisa",
      pastures: "Phatha amadlelo nokuthuthwa",
      team: "Mema abasebenzi besipulazi sakho",
      sync: "Vumelanisa kuwo wonke amadivayisi",
    },
  },
  dashboardScreen: {
    title: "Ideshibhodi",
    welcomeBack: "Sawubona futhi, {{name}}",
    currentFarm: "Ipulazi Lamanje",
    switchFarm: "Shintsha Ipulazi",
    createNewFarm: "+ Dala Ipulazi Elisha",
    setupCard: {
      title: "Siyakwamukela ku-HerdTrackr",
      subtitle: "Lungisa ipulazi lakho ukuze uqale ukuphatha umhlambi wakho.",
      button: "Lungisa Ipulazi",
    },
    stats: {
      totalHead: "Inani Eliphelele",
      active: "Eziphilayo",
      dueToCalve: "Ezizozala",
      pendingSync: "Ukuvumelanisa Okulindile",
    },
    vaccinations: {
      title: "Imigomo Edingekayo",
      overdue: "Esidlulile Isikhathi",
      dueToday: "Edingeka Namuhla",
      dueSoon: "Edingeka Maduze",
      viewAll: "Bheka Yonke Imihlelo",
    },
    reports: {
      title: "Imibiko Nokuhlaziya",
      description: "Bheka ukusebenza komhlambi, izimo zesisindo, nemibiko yokuzalanisa",
    },
    recentAnimals: {
      title: "Izilwane Zakamuva",
      empty: "Azikho izilwane okwamanje. Iya kuthebhu Yomhlambi ukuze wengeze isilwane sakho sokuqala.",
    },
  },
  settingsScreen: {
    title: "Izilungiselelo",
    sections: {
      appearance: "UKUBUKEKA",
      language: "ULIMI",
      account: "I-AKHAWUNTI",
      subscription: "UKUBHALISA",
      management: "UKUPHATHA",
      rfidScanner: "ISKENA SE-RFID",
      dangerZone: "INDAWO EYINGOZI",
    },
    appearance: {
      darkMode: "Imodi Emnyama",
      darkThemeEnabled: "Itimu emnyama isebenza",
      lightThemeEnabled: "Itimu ekhanyayo isebenza",
    },
    language: {
      appLanguage: "Ulimi Lohlelo",
      current: "Lwamanje: {{language}}",
    },
    account: {
      notSignedIn: "Awungenile",
      org: "Inhlangano: {{orgName}}",
      noOrg: "Akukho",
      appLock: "Ukukhiywa Kwe-App",
      appLockHint: "Kudingeka i-Face ID noma isigxivizo somunwe ukuvula i-app",
    },
    subscription: {
      plans: {
        commercial: "Commercial",
        farm: "Farm",
        starter: "Starter",
      },
      status: {
        loading: "Iyalayisha...",
        commercialAccess: "Ukufinyelela okugcwele + izici zeqembu",
        farmAccess: "Izici ze-Premium zivuliwe",
        freeTier: "Izinga lamahhala",
      },
      badges: {
        com: "COM",
        farm: "FARM",
      },
      descriptions: {
        commercial: "Izilwane ezingenamkhawulo, kanye nazo zonke izici.",
        farm: "Izilwane ezingenamkhawulo, kanye nazo zonke izici.",
        starter: "Zonke izici zifakiwe mahhala, kuze kube izilwane ezingu-50. Thuthukisa ukuze uthole izilwane ezingenamkhawulo.",
      },
      buttons: {
        manageSubscription: "Phatha Ukubhalisa",
        viewPlans: "Bheka Amapulani",
      },
    },
    management: {
      team: "Iqembu",
      treatmentProtocols: "Iziqondiso Zokwelapha",
      vaccinationSchedules: "Imihlelo Yemigomo",
    },
    rfid: {
      connected: "Iskena sesandla sixhumekile",
      readerPower: "Amandla Esifundi",
      powerSaved: "Amandla amisiwe ku-{{power}}",
      rangeHint: "Ububanzi: {{min}} (obufushane kakhulu) kuya ku-{{max}} (obude kakhulu). Amandla aphezulu aqeda ibhethri ngokushesha.",
      presets: {
        low: "Phansi",
        med: "Phakathi",
        high: "Phezulu",
        max: "Okuphezulu",
      },
    },
    dangerZone: {
      resetTitle: "Setha Kabusha Idathabhesi Yendawo",
      resetDescription: "Isula YONKE idatha yendawo. Sebenzisa kuphela uma uqala kabusha ngemuva kokususa i-Supabase.",
      resetButton: "Sula Idathabhesi Yendawo",
      alerts: {
        confirmTitle: "Setha Kabusha Idathabhesi Yendawo",
        confirmMessage: "Lokhu kuzosusa YONKE idatha yendawo kufaka phakathi inhlangano yakho, izilwane, namarekhodi. Lokhu akusoze kwaguquleka!\\n\\nKwenze lokhu kuphela uma uqala kabusha ngemuva kokususa i-Supabase.",
        wipeButton: "SULA KONKE",
        successTitle: "Impumelelo",
        successMessage: "Idathabhesi yendawo isethwe kabusha! Sicela uqalise kabusha uhlelo.",
        errorTitle: "Iphutha",
        errorMessage: "Yehlulekile ukusetha kabusha idathabhesi: {{error}}",
      },
    },
    signOut: "Phuma",
    version: "HerdTrackr v0.1.0",
  },
  orgSetupScreen: {
    title: "HerdTrackr",
    subtitle: "Lungisa umsebenzi wakho",
    allSet: "Sekulungile konke!",
    step1: {
      title: "Ipulazi Lakho",
      description: "Sitshele ngomsebenzi wakho. Lokhu kudala indawo yakho yokusebenza.",
      yourNameLabel: "Igama Lakho *",
      yourNamePlaceholder: "isb. uJohn Smith",
      farmNameLabel: "Igama Lepulazi / Ranch *",
      farmNamePlaceholder: "isb. Sunrise Livestock, Bosveld Game Farm",
      locationLabel: "Indawo (okukhethekayo)",
      locationPlaceholder: "isb. Limpopo, Free State, KZN",
      ownerBadge: "Umnikazi",
      alerts: {
        nameRequired: "Sicela ufake igama lakho",
        farmRequired: "Nikeza ipulazi noma i-ranch yakho igama",
      },
    },
    step2: {
      title: "Yini oyilima/oyifuyileyo?",
      description: "Khetha zonke izinhlobo zezilwane ozifuyileyo.",
      livestock: {
        cattle: {
          label: "Izinkomo",
          desc: "Nguni, Bonsmara, Brahman, Angus...",
        },
        buffalo: {
          label: "Inyathi",
          desc: "Inyathi yaseKapa, inyathi yamanzi",
        },
        horses: {
          label: "Amahhashi",
          desc: "Boerperd, Nooitgedachter, Thoroughbred...",
        },
        sheep: {
          label: "Izimvu",
          desc: "Dorper, Merino, Damara, Dohne...",
        },
        goats: {
          label: "Izimbuzi",
          desc: "Boer, Angora, Kalahari Red, Savanna...",
        },
        game: {
          label: "Izinyamazane",
          desc: "Insephe, Impala, iNdlulamithi, iMpofu...",
        },
        pigs: {
          label: "Izingulube",
          desc: "Large White, Landrace, Duroc...",
        },
        poultry: {
          label: "Izinkukhu",
          desc: "Boschveld, Koekoek, Rhode Island Red...",
        },
      },
      nextButton: "Okulandelayo ({{count}} okukhethiwe)",
      alert: "Khetha izinhlobo zezilwane oziphathayo",
    },
    step3: {
      title: "Misa izinhlobo eziyizimiselo",
      description: "Khetha izinhlobo zezilwane ozisebenzisa kakhulu. Ungashintsha lokhu noma nini.",
      breedLabel: "Uhlobo lwe-{{livestock}}",
    },
    step4: {
      title: "Sitshele ngomhlambi wakho",
      description: "Lokhu kusisiza ukulungisa ulwazi lomsebenzi wakho.",
      herdSizeLabel: "Usayizi womhlambi olinganiselwa",
      herdSizes: {
        small: {
          label: "1 – 50",
          desc: "Indawo encane / umhlambi wokuqala",
        },
        medium: {
          label: "50 – 200",
          desc: "Umsebenzi ophakathi",
        },
        large: {
          label: "200 – 500",
          desc: "Owezohwebo omkhulu",
        },
        xlarge: {
          label: "500+",
          desc: "Izinga lebhizinisi",
        },
      },
      purposeLabel: "Inhloso eyinhloko (okukhethekayo)",
      purposes: {
        breeding: "Ukuzalanisa / Stud",
        fattening: "Ukukhuluphalisa / Feedlot",
        dairy: "Ubisi",
        mixed: "Ukulima Okuxubile",
        game: "Ukufuya Izinyamazane",
      },
      createButton: "Dala Ipulazi",
      creating: "Kuyadalwa Futhi Kuyavumelaniswa...",
      alert: "Khetha usayizi womhlambi olinganiselwa",
    },
    step5: {
      title: "I-{{farmName}} isikulungele!",
      subtitle: "Yini ongathanda ukuyenza kuqala?",
      options: {
        addAnimals: {
          title: "Engeza izilwane zami zokuqala",
          description: "Bhalisa umhlambi wakho ngamunye noma ufake uhlu",
        },
        explore: {
          title: "Hlola uhlelo",
          description: "Bheka indawo yonke futhi ubone okwenziwa yi-HerdTrackr",
        },
      },
    },
  },
  reportsScreen: {
    title: "Imibiko",
    noAnimals: "Engeza izilwane ukubona imibiko nokuhlaziya.",
    herdSummary: {
      title: "Isifinyezo Somhlambi",
      totalHead: "Inani Eliphelele",
    },
    bySex: {
      title: "Ngobulili",
    },
    byBreed: {
      title: "Ngohlobo",
    },
    records: {
      title: "Amarekhodi",
      healthRecords: "Amarekhodi empilo",
      weightRecords: "Amarekhodi esisindo",
      breedingRecords: "Amarekhodi okuzalanisa",
      avgWeight: "Isisindo esimaphakathi",
      calvingSuccess: "Impumelelo yokuzala",
    },
    treatmentStats: {
      title: "Izibalo Zokwelapha",
      vaccinations: "Imigomo",
      treatments: "Ukwelashwa",
      deworming: "Ukukhipha izikelemu",
      totalHealthEvents: "Inani lezenzakalo zempilo",
    },
    animalsNeedingAttention: {
      title: "Izilwane Ezidinga Ukunakwa",
      count_one: "{{count}} isilwane sidinga ukunakwa",
      count_other: "{{count}} izilwane zidinga ukunakwa",
      monthsOld: "Zinezinyanga ezingu-{{months}}",
      reasons: {
        noVaccinations: "Ayikho imigomo eyabhalwa - amathole kufanele agonywe zingakapheli izinyanga ezi-2",
        needsBooster: "Kungase kudinge umjovo wokuqinisa - ojwayele ukudingeka zingakapheli izinyanga ezi-6",
      },
    },
    exportButton: "Khipha Umhlambi njenge-CSV",
    traceability: {
      title: "Imibiko Yokulandelela Izilwane",
      description: "Khiqiza imibiko ephelele yokulandelela yezilwane ngazinye noma amaqembu. Imibiko ifaka umlando ophelele: amarekhodi empilo, izisindo, ukuzalanisa, ukunyakaza, nezithombe.",
      selected: "{{count}} okukhethiwe",
      selectAll: "Khetha Konke",
      clear: "Sula",
      generateButton: "Khiqiza Futhi Wabelane Ngombiko",
      generating: "Kukhiqizwa Umbiko...",
      noSelection: "Sicela ukhethe okungenani isilwane esisodwa ukukhiqiza umbiko wokulandelela.",
    },
  },
  herdListScreen: {
    title: "Umhlambi",
    addButton: "+ Engeza",
    searchPlaceholder: "Sesha ngethegi, igama, noma uhlobo...",
    count_one: "{{count}} isilwane",
    count_other: "{{count}} izilwane",
    tag: "Ithegi: {{tag}}",
    breedAndSex: "{{breed}} | {{sex}}",
    empty: {
      loading: "Iyalayisha...",
      title: "Qala Ukwakha Umhlambi Wakho",
      description: "Engeza isilwane sakho sokuqala ukuze uqale ukulandelela amarekhodi empilo, izisindo, ukuzalanisa, nokunye.",
      onboarding: {
        step1: {
          title: "Engeza Imininingwane Yesilwane",
          description: "Faka inombolo yethegi, uhlobo, ubulili, nesithombe esikhethekayo",
        },
        step2: {
          title: "Landelela Konke",
          description: "Rekhoda ukwelashwa, izisindo, ukuzalanisa, nokunyakaza",
        },
        step3: {
          title: "Khipha Imibiko",
          description: "Khiqiza imibiko elungiselwe ukuhambisana nemithetho yokuthengisa nokuhlolwa",
        },
      },
      button: "Engeza Isilwane Sakho Sokuqala",
      tip: "Ithiphu: Sebenzisa iskena sekhamera ukufunda izinombolo zamathegi endlebe ngokuzenzakalela",
    },
  },
  chuteScreen: {
    title: "Imodi Ye-Chute",
    selectMode: "Khetha ukuthi urekhoda ini namuhla",
    modes: {
      weight: {
        title: "Linganisa Isisindo",
        description: "Rekhoda isisindo namaphuzu esimo (okukhethekayo)",
        sessionTitle: "Iseshini Yokulinganisa",
      },
      protocol: {
        title: "Goma / Yelapha",
        description: "Sebenzisa iziqondiso zomgomo noma zokwelapha ngamadosi azibalelwe ngokuzenzakalela",
        sessionTitle: "Iseshini Yokugoma / Yokwelapha",
      },
      weightAndTreatment: {
        title: "Linganisa + Yelapha",
        description: "Rekhoda isisindo bese usebenzisa isiqondiso ngesikhathi esisodwa",
        sessionTitle: "Iseshini Yokulinganisa + Yokwelapha",
      },
      condition: {
        title: "Amaphuzu Esimo",
        description: "Rekhoda amaphuzu esimo somzimba",
        sessionTitle: "Iseshini Yamaphuzu Esimo",
      },
    },
    session: {
      processed: "{{count}} esekwenziwe",
      previousSession: "Iseshini edlule: {{count}} esekwenziwe",
      endSession: "Qeda Iseshini",
    },
    scan: {
      title: "SKENA ITHEGI",
      placeholder: "Faka ithegi noma sebenzisa ikhamera",
      lookUp: "Bheka",
      searching: "Iyasesha...",
      notFound: "Asikho isilwane esitholakele ngethegi elithi \"{{tag}}\". Sengeze kuqala kuthebhu Yomhlambi.",
      scanning: "Iyaskena...",
      pullTrigger: "Donsa unozinti ukuze uskene ithegi",
      orManualEntry: "Noma faka ngesandla ngezansi:",
    },
    animalInfo: {
      rfid: "RFID",
      visualTag: "Ithegi Elibonakalayo",
      dob: "Usuku Lokuzalwa",
      lastWeight: "Isisindo Sokugcina",
      lastWeightValue: "{{weight}} kg",
    },
    weight: {
      previousWeight: "Isisindo sangaphambili:",
      weightValue: "{{weight}} kg",
      newWeightLabel: "Isisindo Esisha (kg)",
      weightPlaceholder: "isb. 450",
      conditionScoreLabel: "Amaphuzu Esimo (1-9)",
      conditionScorePlaceholder: "Okukhethekayo, isb. 6",
      saveAndNext: "Londoloza & Okulandelayo",
      invalidWeight: "Faka isisindo esivumelekile nge-kg",
      invalidConditionScore: "Amaphuzu esimo kumele abe ngu-1-9",
    },
    weightAndTreatment: {
      step1: "1. Rekhoda Isisindo",
      step2: "2. Khetha Ukwelashwa",
      weightLabel: "Isisindo (kg)",
      conditionScoreLabel: "Amaphuzu Esimo (1-9)",
      noProtocols: "Azikho iziqondiso ezisebenzayo ezitholakalayo",
      manageProtocols: "Phatha Iziqondiso",
      changeProtocol: "Shintsha Isiqondiso",
      saveBoth: "Londoloza Kokubili & Okulandelayo",
      calculatedDosage: {
        title: "Idosi Ebaliwe",
        atWeight: "Ngesisindo se-{{weight}} kg:",
        give: "Nika: {{ml}} ml",
      },
      required: "Khetha isiqondiso sokwelapha",
    },
    condition: {
      labels: {
        thin: "Ondile",
        moderate: "Maphakathi",
        fat: "Ekhuluphele",
      },
    },
    protocol: {
      title: "Khetha Umgomo / Ukwelashwa",
      product: "Umkhiqizo: {{name}}",
      standardDosage: "Idosi Evamile: {{dosage}}",
      method: "Indlela: {{method}}",
      withdrawal: "Ukulinda: {{days}} izinsuku",
      autoCalculated: {
        title: "Idosi Ebalwe Ngokuzenzakalela",
        lastWeight: "Isisindo sokugcina: {{weight}} kg",
        give: "Nika: {{ml}} ml",
        based: "Kususelwa ku-{{ml}}ml nge-{{kg}}kg",
      },
      manualDosage: "Idosi yesandla iyadingeka - isiqondiso asicacisi izinga nge-kg",
      noWeight: {
        title: "Asikho Isisindo Esirekhodwe",
        message: "Linganisa lesi silwane kuqala ukuze ubale idosi efanele",
      },
      changeProtocol: "Shintsha Isiqondiso",
      apply: "Sebenzisa",
      applyAndNext: "Sebenzisa & Okulandelayo",
    },
  },
  pasturesScreen: {
    title: "Ukushintshaniswa Kwamadlelo",
    createButton: "+ Okusha",
    locked: {
      title: "Ukushintshaniswa Kwamadlelo",
      description: "Bhala amapadoki, nikeza imihlambi, futhi ulandelele izinsuku zokudla utshani ukuthuthukisa ukudla nempilo yenhlabathi.",
      proBadge: "PRO",
      upgradeButton: "Khuphukela ku-Pro",
    },
    stats: {
      pastures: "Amadlelo",
      animals: "Izilwane",
      occupied: "Esithathiwe",
    },
    card: {
      animals: "Izilwane",
      daysGrazed: "Izinsuku Zokudla",
      daysUntilRotation: "Izinsuku ezingu-{{days}} kuze kube ukushintshaniswa",
    },
    empty: {
      title: "Awekho Amadlelo Okwamanje",
      description: "Sizokuqondisa ngokudala idlelo lakho lokuqala ngezinyathelo ezi-3 nje ezilula",
      button: "Qala →",
    },
  },
  animalDetailScreen: {
    rescan: {
      scanning: "Iyaskena...",
      rfidLabel: "Skena kabusha ithegi ye-RFID",
      saveFailed: "Ayikwazanga ukulondoloza ithegi eskeniwe. Sicela uzame futhi.",
    },
    loading: "Iyalayisha...",
    notFound: "Isilwane asitholakali",
    backButton: "Emuva",
    editButton: "Hlela",
    deleteButton: "Susa Isilwane",
    tabs: {
      overview: "Uhlolojikelele",
      health: "Impilo",
      vaccinations: "Imigomo",
      weight: "Isisindo",
      breeding: "Ukuzalanisa",
    },
    overview: {
      rfidTag: "Ithegi le-RFID",
      visualTag: "Ithegi Elibonakalayo",
      dateOfBirth: "Usuku Lokuzalwa",
      registrationNumber: "Inombolo Yokubhalisa",
      notes: "Amanothi",
      noValue: "—",
    },
    health: {
      addButton: "+ Engeza Irekhodi Lempilo",
      empty: "Awekho amarekhodi empilo okwamanje.",
      product: "Umkhiqizo: {{product}}",
      recordedBy: "Kurekhodwe ngu-{{name}}",
    },
    weight: {
      addButton: "+ Engeza Irekhodi Lesisindo",
      empty: "Awekho amarekhodi esisindo okwamanje.",
      weightValue: "{{weight}} kg",
      condition: "Isimo: {{score}}/9",
      recordedBy: "Kurekhodwe ngu-{{name}}",
    },
    breeding: {
      addButton: "+ Engeza Irekhodi Lokuzalanisa",
      empty: "Awekho amarekhodi okuzalanisa okwamanje.",
      bred: "Kuzaliswe: {{date}}",
      expectedCalving: "Ukuzala okulindelekile: {{date}}",
      recordedBy: "Kurekhodwe ngu-{{name}}",
    },
  },
  animalFormScreen: {
    title: {
      edit: "Hlela Isilwane",
      add: "Engeza Isilwane",
    },
    farmLabel: "Ipulazi:",
    helperNote: "* Okungenani ithegi elilodwa (RFID noma Elibonakalayo) liyadingeka",
    fields: {
      rfidTag: {
        label: "Ithegi le-RFID",
        placeholder: "Faka inombolo yethegi le-RFID",
        scanPlaceholder: "Donsa unozinti ukuze uskene ithegi le-RFID",
        helpText: "Ithegi yokwe-elektroniki efakwe ethegini lendlebe - Ipulani le-Commercial lifaka ukusekelwa kweskena se-RFID",
        scanning: "Donsa unozinti ukuze uskene...",
      },
      visualTag: {
        label: "Ithegi Elibonakalayo (ithegi lendlebe/uphawu)",
        placeholder: "Ithegi lendlebe noma inombolo yophawu",
        helpText: "Sebenzisa inkinobho yeskena sekhamera ukufunda izinombolo zamathegi ngokuzenzakalela ezithombeni",
      },
      name: {
        label: "Igama (okukhethekayo)",
        placeholder: "Igama lesilwane",
      },
      photos: {
        label: "Izithombe (zokuhlonza)",
      },
      breed: {
        label: "Uhlobo *",
        placeholder: "Khetha uhlobo",
      },
      sex: {
        label: "Ubulili *",
        options: {
          male: "Inkunzi",
          female: "Imazi",
          castrated: "Inkabi",
          unknown: "Akwaziwa",
        },
      },
      vaccinationsUpToDate: {
        label: "Ukugoma kusesikhathini",
        helpOn: "Kuzohlelwa kuphela ukugoma kwesikhathi esizayo. Vala uma lesi silwane sisadinga imijovo yaso yangaphambilini.",
        helpOff: "Noma yikuphi ukugoma lesi silwane esesikuphuthelwe kuzofakwa njengokudlulelwe yisikhathi.",
      },
      dateOfBirth: {
        label: "Usuku Lokuzalwa",
        placeholder: "DD/MM/YYYY",
      },
      registrationNumber: {
        label: "Inombolo Yokubhalisa",
        placeholder: "Okukhethekayo",
      },
      herdTag: {
        label: "Ithegi Lomhlambi/Leqembu",
        placeholder: "isb., 23-C, XYZ, Iqembu A (okukhethekayo)",
      },
      notes: {
        label: "Amanothi",
        placeholder: "Anoma yimaphi amanothi engeziwe...",
      },
      tags: {
        label: "Amathegi",
        placeholder: "Engeza amathegi (isb., Eziyozalanisa, Ezithengiswayo...)",
      },
    },
    lineage: {
      title: "Uhlanga (okukhethekayo)",
      helpText: "Landelela ofuzo lwezinhlelo zokuzalanisa nokubhalwa kosendo",
      sire: {
        label: "Uyise (Ubaba)",
        placeholder: "+ Engeza uyise",
        noMales: "Engeza izilwane zesilisa emhlanjini wakho kuqala ukuze ukhethe njengaboyise",
      },
      dame: {
        label: "Unina (Umama)",
        placeholder: "+ Engeza unina",
        noFemales: "Engeza izilwane zesifazane emhlanjini wakho kuqala ukuze ukhethe njengabonina",
      },
    },
    buttons: {
      cancel: "Khansela",
      save: "Londoloza Izinguquko",
      add: "Engeza Isilwane",
      saving: "Iyalondoloza...",
    },
    modals: {
      breed: {
        title: "Khetha Uhlobo",
        cancel: "Khansela",
      },
      sex: {
        title: "Khetha Ubulili",
        cancel: "Khansela",
      },
      sire: {
        title: "Khetha Uyise",
        searchPlaceholder: "Sesha ngegama noma ithegi...",
        empty: "Azitholakali izinkunzi",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Khansela",
      },
      dame: {
        title: "Khetha Unina",
        searchPlaceholder: "Sesha ngegama noma ithegi...",
        empty: "Azitholakali izimazi",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Khansela",
      },
    },
    alerts: {
      animalLimit: {
        title: "Umkhawulo Wamahhala Ufinyelelwe",
        message: "Ufinyelele umkhawulo wohlelo lwakho wezilwane ezingu-{{limit}}. Thuthukisa ukuze uthole umkhawulo ophakeme — zonke izici sezifakiwe.",
        upgrade: "Thuthukisa",
      },
      validation: {
        duplicateTag: {
          title: "Ithegi Ephindaphindiwe",
          visualMessage: "Ithegi ebonakalayo ethi \"{{tag}}\" isetshenziswa kakade ngu-{{name}}. Sicela usebenzise ithegi eyingqayizivele.",
          rfidMessage: "Ithegi ye-RFID ethi \"{{tag}}\" isetshenziswa kakade ngu-{{name}}. Sicela usebenzise ithegi eyingqayizivele.",
        },
        tagRequired: {
          title: "Kuyadingeka",
          message: "Sicela ufake noma Ithegi le-RFID noma Ithegi Elibonakalayo (okungenani elilodwa liyadingeka)",
        },
        breedRequired: {
          title: "Kuyadingeka",
          message: "Uhlobo luyadingeka",
        },
        noOrganization: {
          title: "Iphutha",
          message: "Ayikho inhlangano ekhethiwe",
        },
      },
      saveError: {
        title: "Iphutha",
        message: "Yehlulekile ukulondoloza isilwane. Sicela uzame futhi.",
      },
    },
  },
  bulkAnimalAddScreen: {
    title: {
      setup: "Engeza Ngobuningi",
      entry: "Engeza Ngokushesha",
    },
    setup: {
      helpText: "Misa amasimu avamile kanye, bese uskena ngokushesha amathegi ezilwane eziningi ezinezici ezifanayo.",
      sectionTitle: "Amasimu Avamile (asebenza kuzo zonke izilwane)",
      tagTypeLabel: "Uhlobo Lwethegi",
      tagTypeModalTitle: "Khetha Uhlobo Lwethegi",
      tagType: {
        visual: "Ithegi Elibonakalayo (Ithegi Lendlebe)",
        rfid: "Ithegi le-RFID",
      },
      tagTypeDescription: {
        visual: "Inombolo yethegi engokoqobo ebonakala esilwaneni",
        rfid: "Inombolo yethegi le-RFID yokwe-elektroniki",
      },
      labelPrefixLabel: "Isandulela Selebula/Sethegi (okukhethekayo)",
      labelPrefixPlaceholder: "isb., BRN, COW, 2024-",
      labelPrefixHelper: "Lokhu kuzofakwa ngaphambi kwenombolo yethegi ngalinye",
      pastureLabel: "Idlelo/Iqembu Lamanje (okukhethekayo)",
      pasturePlaceholder: "+ Khetha idlelo",
      pastureModalTitle: "Khetha Idlelo",
      noPastures: "Awekho amadlelo atholakalayo",
      notesLabel: "Isifanekiselo Samanothi (okukhethekayo)",
      notesPlaceholder: "Kusebenza kuzo zonke izilwane kuleli qoqo...",
      startButton: "Qala Ukufaka Okusheshayo",
    },
    entry: {
      countLabel: "{{count}} Kwengeziwe",
      tagLabel: "Skena noma Faka Ithegi",
      tagPlaceholder: "Ithegi lendlebe noma RFID",
      weightLabel: "Isisindo (okukhethekayo)",
      weightPlaceholder: "kg",
      photoLabel: "Isithombe (okukhethekayo)",
      addButton: "Engeza Isilwane",
      adding: "Kuyengezwa...",
      recentTitle: "Okwengezwe Muva",
    },
    alerts: {
      breedRequired: {
        title: "Kuyadingeka",
        message: "Uhlobo luyadingeka ngaphambi kokuqala ukufaka ngobuningi",
      },
      tagRequired: {
        title: "Kuyadingeka",
        message: "Sicela ufake inombolo yethegi (Elibonakalayo noma RFID)",
      },
      noOrganization: {
        message: "Ayikho inhlangano ekhethiwe",
      },
      addError: {
        message: "Yehlulekile ukwengeza isilwane. Sicela uzame futhi.",
      },
      finish: {
        title: "Qeda Ukwengeza Ngobuningi?",
        message: "Usengeze izilwane ezingu-{{count}}. Usulungele ukuqeda?",
        cancel: "Qhubeka Wengeza",
        confirm: "Kwenziwe",
      },
    },
  },
  teamScreen: {
    title: "Iqembu",
    loading: "Iyalayisha...",
    inviteButton: "+ Mema",
    inviteForm: {
      title: "Mema Ilungu Leqembu",
      methodLabel: "Thumela nge",
      methodEmail: "I-imeyili",
      methodSMS: "SMS",
      methodWhatsApp: "WhatsApp",
      emailLabel: "Ikheli Le-imeyili",
      emailPlaceholder: "umsebenzi@isibonelo.com",
      phoneLabel: "Inombolo Yocingo",
      phonePlaceholder: "+27 82 123 4567",
      roleLabel: "Indima",
      roles: {
        admin: "Umphathi",
        worker: "Umsebenzi",
      },
      roleAdmin: "Umphathi",
      roleWorker: "Umsebenzi",
      sendButton: "Thumela Isimemo",
      sending: "Iyathunyelwa...",
      cancelButton: "Khansela",
      errors: {
        contactRequired: "Ulwazi lokuxhumana luyadingeka",
        emailRequired: "Ikheli le-imeyili liyadingeka",
        invalidEmail: "Sicela ufake ikheli le-imeyili elivumelekile",
        invalidPhone: "Sicela ufake inombolo yocingo evumelekile",
        failedToSend: "Yehlulekile ukuthumela isimemo. Sicela uzame futhi.",
      },
    },
    alerts: {
      inviteSent: {
        title: "Isimemo Sithunyelwe",
        message: "Isimemo sithunyelwe ku-{{contact}} nge-{{method}}. Ikhodi yesimemo: {{code}}",
        ok: "Kulungile",
      },
      cancelInvite: {
        title: "Khansela Isimemo",
        message: "Khansela isimemo se-{{email}}?",
        no: "Cha",
        yes: "Yebo, Khansela",
      },
      changeRole: {
        title: "Shintsha Indima",
        message: "Shintsha indima ka-{{name}} ibe yi-{{role}}?",
        cancel: "Khansela",
        change: "Shintsha Indima",
      },
      removeMember: {
        title: "Susa Ilungu",
        message: "Susa u-{{name}} eqenjini lakho? Bazolahlekelwa ukufinyelela kule nhlangano.",
        cancel: "Khansela",
        remove: "Susa",
      },
      error: {
        title: "Iphutha",
        sendFailed: "Yehlulekile ukuthumela isimemo. Sicela uzame futhi.",
        cancelInviteFailed: "Yehlulekile ukukhansela isimemo.",
        updateRoleFailed: "Yehlulekile ukushintsha indima.",
        removeMemberFailed: "Yehlulekile ukususa ilungu leqembu.",
      },
    },
    sections: {
      members: "Amalungu Eqembu ({{count}})",
      invites: "Izimemo Ezilindile ({{count}})",
    },
    member: {
      you: " (wena)",
      joined: "Wajoyina {{date}}",
      roleAdmin: "Umphathi",
      roleWorker: "Umsebenzi",
    },
    invite: {
      code: "Ikhodi: {{code}}",
      expires: "Iphelelwa {{date}}",
      cancelButton: "Khansela",
    },
    noAccess: "Abaphathi kuphela abangaphatha amalungu eqembu",
    syncNotice: {
      title: "Ukuvumelanisa Kuyadingeka",
      text: "Izinguquko zeqembu zidinga ukuvumelaniswa ukuze zisebenze kuwo wonke amadivayisi.",
      button: "Vumelanisa Manje",
    },
  },
  treatmentProtocolsScreen: {
    title: "Iziqondiso Zokwelapha",
    createButton: "+ Okusha",
    filters: {
      all: "Konke",
      vaccination: "Umgomo",
      treatment: "Ukwelashwa",
      deworming: "Ukukhipha izikelemu",
      other: "Okunye",
    },
    count_one: "{{count}} isiqondiso",
    count_other: "{{count}} iziqondiso",
    inactive: "Ayisebenzi",
    withdrawal: "Ukulinda: {{days}} izinsuku",
    empty: {
      title: "Azikho Iziqondiso Ezitholakele",
      noProtocols: "Dala isiqondiso sakho sokuqala sokwelapha ukusisebenzisa ku-Chute Mode",
      filtered: "Azikho iziqondiso ze-{{filter}} ezitholakele",
      showAll: "Bonisa Konke",
      loadDefaults: "Layisha Izimiselo ze-SA",
      createButton: "Dala Isiqondiso",
    },
    alerts: {
      toggleError: "Yehlulekile ukushintsha isimo sesiqondiso",
      defaultsAdded: "Iziqondiso ezingu-{{count}} zengezwe ngempumelelo",
    },
  },
  healthRecordFormScreen: {
    title: "Irekhodi Lempilo",
    cancelButton: "Khansela",
    typeLabel: "Uhlobo",
    recordTypes: {
      vaccination: "umgomo",
      treatment: "ukwelashwa",
      vet_visit: "ukuvakashelwa udokotela wezilwane",
      condition_score: "amaphuzu esimo",
      other: "okunye",
      vaccinationPro: "umgomo (PRO)",
    },
    protocol: {
      selectButton_one: "Khetha kusuka kwesilondoloziwe esingu-{{count}}",
      selectButton_other: "Khetha kusuka kwezilondoloziwe ezingu-{{count}}",
      selectedDetail: "{{productName}} • {{dosage}}",
      noProtocols: "Azikho iziqondiso ezitholakele. Dala esisodwa kuzilungiselelo → Iziqondiso Zokwelapha",
    },
    fields: {
      description: {
        label: "Incazelo *",
        placeholder: "Kwenziweni?",
      },
      productName: {
        label: "Igama Lomkhiqizo",
        placeholder: "isb. Covexin 10",
      },
      dosage: {
        label: "Idosi",
        placeholder: "isb. 2ml SC",
      },
      administeredBy: {
        label: "Inikezelwe ngu",
        placeholder: "Okukhethekayo",
      },
      notes: {
        label: "Amanothi",
        placeholder: "Amanothi engeziwe...",
      },
      photos: {
        label: "Izithombe (Okukhethekayo)",
      },
    },
    buttons: {
      save: "Londoloza Irekhodi",
      saving: "Iyalondoloza...",
    },
    alerts: {
      required: {
        title: "Kuyadingeka",
        message: "Incazelo iyadingeka",
      },
      noOrganization: {
        title: "Iphutha",
        message: "Ayikho inhlangano ekhethiwe",
      },
      saveError: {
        title: "Iphutha",
        message: "Yehlulekile ukulondoloza irekhodi lempilo",
      },
    },
  },
  weightRecordFormScreen: {
    title: "Irekhodi Lesisindo",
    cancelButton: "Khansela",
    fields: {
      weight: {
        label: "Isisindo (kg) *",
        placeholder: "isb. 450",
      },
      conditionScore: {
        label: "Amaphuzu Esimo (1-9)",
        placeholder: "Okukhethekayo, isb. 6",
      },
      notes: {
        label: "Amanothi",
        placeholder: "Amanothi engeziwe...",
      },
      photos: {
        label: "Izithombe (Okukhethekayo)",
      },
    },
    buttons: {
      save: "Londoloza Irekhodi",
      saving: "Iyalondoloza...",
    },
    alerts: {
      invalidWeight: {
        title: "Akuvumelekile",
        message: "Sicela ufake isisindo esivumelekile nge-kg",
      },
      invalidConditionScore: {
        title: "Akuvumelekile",
        message: "Amaphuzu esimo kumele abe phakathi kuka-1 no-9",
      },
      noOrganization: {
        title: "Iphutha",
        message: "Ayikho inhlangano ekhethiwe",
      },
      saveError: {
        title: "Iphutha",
        message: "Yehlulekile ukulondoloza irekhodi lesisindo",
      },
    },
  },
  breedingRecordFormScreen: {
    title: "Irekhodi Lokuzalanisa",
    cancelButton: "Khansela",
    methodLabel: "Indlela",
    methods: {
      natural: "ngokwemvelo",
      ai: "ai",
      embryo_transfer: "ukudluliselwa kwembryo",
    },
    outcomeLabel: "Umphumela",
    outcomes: {
      pending: "okulindile",
      live_calf: "ithole eliphilayo",
      stillborn: "ezalwe ifile",
      aborted: "ephuphunyelwe",
      open: "evulekile",
    },
    fields: {
      notes: {
        label: "Amanothi",
        placeholder: "Amanothi engeziwe...",
      },
      photos: {
        label: "Izithombe (Okukhethekayo)",
      },
    },
    buttons: {
      save: "Londoloza Irekhodi",
      saving: "Iyalondoloza...",
    },
    alerts: {
      noOrganization: {
        title: "Iphutha",
        message: "Ayikho inhlangano ekhethiwe",
      },
      saveError: {
        title: "Iphutha",
        message: "Yehlulekile ukulondoloza irekhodi lokuzalanisa",
      },
    },
    },
  calendarScreen: {
    badges: {
      overdue: "Kudlule isikhathi",
      soon: "Maduze",
    },
    tagPrefix: "Ithegi: {{tag}}",
    title: "Ikhalenda",
    unknownVaccination: "Ukugoma Okungaziwa",
    filters: {
      all: "Konke",
      today: "Namuhla",
      week: "Leli Sonto",
      month: "Le Nyanga",
    },
    empty: {
      title: "Azikho Izehlakalo Ezizayo",
      allCaughtUp: "Usuqedile konke!",
      today: "Azikho izehlakalo namuhla",
      week: "Azikho izehlakalo kuleli sonto",
      month: "Azikho izehlakalo kule nyanga",
    },
    manage: {
      action: "Phatha",
      title: "Phatha",
      schedules: "Amashejuli Okugoma",
      schedulesHelp: "Setha izikhumbuzi zokugoma ezizenzakalelayo zomhlambi wakho",
      protocols: "Imithi Yokugoma",
      protocolsHelp: "Imikhiqizo oyisebenzisayo — umthamo, indlela nesikhathi sokuyeka",
    },
  },
  vaccinationScheduleForm: {
    protocolPicker: {
      title: "Khetha Umuthi Wokugoma",
      search: "Sesha imithi yokugoma...",
      createNew: "+ Dala Umuthi Omusha",
      emptyTitle: "Ayikho imithi yokugoma okwamanje",
      emptyHelp: "Faka umuthi wokugoma owusebenzisayo — igama lomkhiqizo, umthamo nesikhathi sokuyeka — bese ungawuhlela.",
      noMatches: "Ayikho imithi ehambisana nosesho lwakho",
    },
    scheduleTypes: {
      ageBased: "Ngeminyaka ethile",
      ageBasedHelp: "isb. umjovo wokuqala we-FMD ezinyangeni ezingu-4",
      dateBased: "Ngosuku olumisiwe",
      dateBasedHelp: "isb. njalo ngo-Agasti, ngaphambi kwemvula",
      groupBased: "Ngekamu noma idlelo",
      groupBasedHelp: "isb. konke okusekamu elisenyakatho, njalo ezinyangeni ezingu-6",
    },
    sex: {
      all: "Konke",
    },
    errors: {
      nameRequired: "Igama leshejuli liyadingeka",
      protocolRequired: "Sicela ukhethe umuthi wokugoma",
      targetAgeRequired: "Iminyaka okuhlosiwe iyadingeka uma uhlela ngeminyaka",
      dateRequired: "Usuku luyadingeka uma uhlela ngosuku",
      groupRequired: "Idlelo nesikhawu kuyadingeka uma uhlela ngeqembu",
    },
  },
  vaccinationScheduleScreen: {
    title: "Imihlelo Yemigomo",
    createButton: "+ Okusha",
    count: "{{count}} imihlelo",
    filters: {
      all: "Konke",
      ageBased: "Ngeminyaka",
      dateBased: "Ngosuku",
      groupBased: "Ngeqembu",
    },
    badges: {
      inactive: "Ayisebenzi",
    },
    details: {
      booster: "{{count}} amadosi, umjovo wokuqinisa ngemuva kwezinsuku ezingu-{{days}}",
    },
    empty: {
      title: "Ayikho Imihlelo Yemigomo",
      noFilter: "Dala imihlelo ukuze uzenzakalele izikhumbuzo zemigomo ngokusekelwe eminyakeni, osukwini, noma eqenjini.",
      withFilter: "Ayikho imihlelo ye-{{filter}} etholakele.",
      showAllButton: "Bonisa Konke",
      createButton: "Dala Uhlelo",
    },
    alerts: {
      toggleError: {
        title: "Iphutha",
        message: "Yehlulekile ukushintsha isimo sohlelo",
      },
      deleteConfirm: {
        title: "Susa Uhlelo",
        message: "Susa uhlelo lomgomo '{{name}}'? Lokhu ngeke kuthinte amarekhodi empilo akhona.",
      },
      deleteError: {
        title: "Iphutha",
        message: "Yehlulekile ukususa uhlelo",
      },
    },
  },
  biometricLock: {
    title: "I-HerdTrackr ikhiyiwe",
    prompt: "Vula i-HerdTrackr",
    unlockButton: "Vula",
  },
}

export default zu
export type Translations = typeof zu
