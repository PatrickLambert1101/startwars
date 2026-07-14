const xh = {
  common: {
    ok: "KULUNGILE",
    cancel: "Rhoxisa",
    back: "Buya",
    save: "Gcina",
    delete: "Cima",
    edit: "Hlela",
    add: "Yongeza",
    done: "Kwenziwe",
    search: "Khangela",
    logOut: "Phuma",
    next: "Okulandelayo",
    skip: "Tsiba",
    loading: "Iyalayisha...",
    required: "Iyafuneka",
    optional: "ngokuzithandela",
    error: "Impazamo",
    notFound: "Ayifumanekanga",
    failedToLoad: "Akukwazanga kulayishwa idatha",
  },
  errors: {
    invalidEmail: "Idilesi ye-imeyile ayichanekanga.",
    somethingWentWrong: "Kukho into engahambanga kakuhle!",
    tryAgain: "Nceda zama kwakhona.",
  },
  errorScreen: {
    title: "Kukho into engahambanga kakuhle!",
    friendlySubtitle:
      "Kuvele impazamo engalindelekanga. Nceda zama ukuvula kwakhona usetyenziso. Ukuba ingxaki iyaqhubeka, qhagamshelana nenkxaso.",
    reset: "SETHA KWAKHONA USETYENZISO",
    traceTitle: "Impazamo evela kwi-stack ye-{{name}}",
  },
  emptyStateComponent: {
    generic: {
      heading: "Akukho nto apha okwangoku",
      content: "Akukho datha ifumanekayo. Yongeza iirekhodi ukuze uqalise.",
      button: "Hlaziya",
    },
  },
  authScreen: {
    title: "HerdTrackr",
    subtitle: "Lawula imfuyo yakho ngokulula",
    formTitle: "Ngena ngeimeyile yakho",
    formSubtitle: "Siza kukuthumelela ikhowudi yamanani asi-7 - akukho gama lokugqitha lifunekayo!",
    emailLabel: "Idilesi ye-Imeyile",
    emailPlaceholder: "umlimi@umzekelo.com",
    sendCode: "Thumela Ikhowudi",
    sending: "Iyathunyelwa...",
    enterCode: "Faka Ikhowudi",
    checkEmail: "Khangela kwi-imeyile yakho ikhowudi yamanani asi-7",
    sentTo: "Ithunyelwe ku",
    codeLabel: "Ikhowudi Yamanani asi-7",
    codePlaceholder: "0000000",
    verifyCode: "Qinisekisa Ikhowudi",
    verifying: "Iyaqinisekiswa...",
    didntReceive: "Awuyifumananga ikhowudi?",
    resend: "Thumela Kwakhona",
    termsNotice: "Ngokuqhubeka, uyavuma kwiMigaqo yeNkonzo yethu",
    benefits: {
      title: "Onokukwenza:",
      animals: "Landelela izilwanyana, impilo nokuzala",
      pastures: "Lawula amadlelo nojikelezo",
      team: "Mema abasebenzi befama yakho",
      sync: "Hlanganisa kuzo zonke izixhobo",
    },
  },
  dashboardScreen: {
    title: "Ibhodi yoLawulo",
    welcomeBack: "Wamkelekile kwakhona, {{name}}",
    currentFarm: "Ifama Yangoku",
    switchFarm: "Tshintsha Ifama",
    createNewFarm: "+ Yenza Ifama Entsha",
    setupCard: {
      title: "Wamkelekile kwiHerdTrackr",
      subtitle: "Misela ifama yakho ukuze uqalise ukulawula umhlambi wakho.",
      button: "Misela Ifama",
    },
    stats: {
      totalHead: "Iintloko Zizonke",
      active: "Esebenzayo",
      dueToCalve: "Eza Kuzala",
      pendingSync: "Ukuhlanganisa Okulindileyo",
    },
    vaccinations: {
      title: "Ugonyo Olufunekayo",
      overdue: "Sele Ludlulile",
      dueToday: "Lufuneka Namhlanje",
      dueSoon: "Lufuneka Kungekudala",
      viewAll: "Jonga Onke Amaxesha",
    },
    reports: {
      title: "Iingxelo Nohlalutyo",
      description: "Jonga ukusebenza komhlambi, iindlela zobunzima, neengxelo zokuzala",
    },
    recentAnimals: {
      title: "Izilwanyana Zakutsha",
      empty: "Akukho zilwanyana okwangoku. Yiya kwithebhu yoMhlambi ukuze wongeze isilwanyana sakho sokuqala.",
    },
  },
  settingsScreen: {
    title: "Iisetingi",
    sections: {
      appearance: "INKANGELEKO",
      language: "ULWIMI",
      account: "I-AKHAWUNTI",
      subscription: "URHWEBO",
      management: "ULAWULO",
      rfidScanner: "ISIKENA SE-RFID",
      dangerZone: "INDAWO EYINGOZI",
    },
    appearance: {
      darkMode: "Imo Emnyama",
      darkThemeEnabled: "Itimu emnyama yenziwe yasebenza",
      lightThemeEnabled: "Itimu ekhanyayo yenziwe yasebenza",
    },
    language: {
      appLanguage: "Ulwimi loSetyenziso",
      current: "Lwangoku: {{language}}",
    },
    account: {
      notSignedIn: "Akungenanga",
      org: "Umbutho: {{orgName}}",
      noOrg: "Awukho",
    },
    subscription: {
      plans: {
        commercial: "Commercial",
        farm: "Farm",
        starter: "Starter",
      },
      status: {
        loading: "Iyalayisha...",
        commercialAccess: "Ukufikelela okupheleleyo + iimpawu zeqela",
        farmAccess: "Iimpawu ze-Premium zivuliwe",
        freeTier: "Inqanaba lasimahla",
      },
      badges: {
        com: "COM",
        farm: "FARM",
      },
      descriptions: {
        commercial: "Ukufikelela okupheleleyo: Izilwanyana ezingenamda, amadlelo, izitofu, amalungu eqela, neengxelo eziphucukileyo.",
        farm: "Ukufikelela kwe-Premium: Izilwanyana ezingenamda, ulawulo lwamadlelo, nokulandelela izitofu.",
        starter: "Phakamisa ukuze uvule ulawulo lwamadlelo, ukulandelela izitofu, izilwanyana ezingenamda, nokunye.",
      },
      buttons: {
        manageSubscription: "Lawula Urhwebo",
        viewPlans: "Jonga Izicwangciso",
      },
    },
    management: {
      team: "Iqela",
      treatmentProtocols: "Iiprotocol zoNyango",
      vaccinationSchedules: "Amaxesha oGonyo",
    },
    rfid: {
      connected: "Isikena sesandla siqhagamshelwe",
      readerPower: "Amandla esiFundisi",
      powerSaved: "Amandla amiselwe ku {{power}}",
      rangeHint: "Uluhlu: {{min}} (omfutshane) ukuya ku {{max}} (omde). Amandla aphezulu atshisa ibhetri ngokukhawuleza.",
      presets: {
        low: "Ephantsi",
        med: "Phakathi",
        high: "Phezulu",
        max: "Eyona Phezulu",
      },
    },
    dangerZone: {
      resetTitle: "Setha Kwakhona Idatha Yendawo",
      resetDescription: "Icima YONKE idatha yendawo. Sebenzisa kuphela xa uqala phantsi emva kokuba ucime iSupabase.",
      resetButton: "Cima Idatha Yendawo",
      alerts: {
        confirmTitle: "Setha Kwakhona Idatha Yendawo",
        confirmMessage: "Oku kuya kucima YONKE idatha yendawo kuquka umbutho wakho, izilwanyana, neerekhodi. Oku akunakubuyiselwa!\\n\\nYenza oku kuphela ukuba uqala phantsi emva kokuba ucime iSupabase.",
        wipeButton: "CIMA YONKE INTO",
        successTitle: "Impumelelo",
        successMessage: "Idatha yendawo isethwe kwakhona! Nceda vula usetyenziso kwakhona.",
        errorTitle: "Impazamo",
        errorMessage: "Akukwazanga kusethwa kwakhona idatha: {{error}}",
      },
    },
    signOut: "Phuma",
    version: "HerdTrackr v0.1.0",
  },
  orgSetupScreen: {
    title: "HerdTrackr",
    subtitle: "Misela umsebenzi wakho",
    allSet: "Ulungile ngoku!",
    step1: {
      title: "Ifama Yakho",
      description: "Sixelele ngomsebenzi wakho. Oku kuyenza indawo yakho yokusebenzela.",
      yourNameLabel: "Igama Lakho *",
      yourNamePlaceholder: "umz. UJohn Smith",
      farmNameLabel: "Igama leFama / leRanch *",
      farmNamePlaceholder: "umz. Sunrise Livestock, Bosveld Game Farm",
      locationLabel: "Indawo (ngokuzithandela)",
      locationPlaceholder: "umz. Limpopo, Free State, KZN",
      ownerBadge: "Umnini",
      alerts: {
        nameRequired: "Nceda faka igama lakho",
        farmRequired: "Nika ifama okanye iranch yakho igama",
      },
    },
    step2: {
      title: "Yintoni oyilimayo?",
      description: "Khetha zonke iintlobo zezilwanyana ozilawulayo.",
      livestock: {
        cattle: {
          label: "Iinkomo",
          desc: "Nguni, Bonsmara, Brahman, Angus...",
        },
        buffalo: {
          label: "Iinyathi",
          desc: "Inyathi yaseKapa, inyathi yamanzi",
        },
        horses: {
          label: "Amahashe",
          desc: "Boerperd, Nooitgedachter, Thoroughbred...",
        },
        sheep: {
          label: "Igusha",
          desc: "Dorper, Merino, Damara, Dohne...",
        },
        goats: {
          label: "Iibhokhwe",
          desc: "Boer, Angora, Kalahari Red, Savanna...",
        },
        game: {
          label: "Inyamakazi",
          desc: "Springbok, Impala, Kudu, Eland...",
        },
        pigs: {
          label: "Iihagu",
          desc: "Large White, Landrace, Duroc...",
        },
        poultry: {
          label: "Iinkukhu",
          desc: "Boschveld, Koekoek, Rhode Island Red...",
        },
      },
      nextButton: "Okulandelayo ({{count}} ezikhethiweyo)",
      alert: "Khetha iintlobo zezilwanyana ozilawulayo",
    },
    step3: {
      title: "Misela iintlobo ezimisiweyo",
      description: "Khetha iintlobo ezisetyenziswa rhoqo. Ungatshintsha ezi nanini emva kwexesha.",
      breedLabel: "Uhlobo lwe-{{livestock}}",
    },
    step4: {
      title: "Sixelele ngomhlambi wakho",
      description: "Oku kusinceda silungelelanise inkqubo yomsebenzi wakho.",
      herdSizeLabel: "Ubukhulu obukhuselayo bomhlambi",
      herdSizes: {
        small: {
          label: "1 – 50",
          desc: "Ifama encinci / umhlambi wokuqala",
        },
        medium: {
          label: "50 – 200",
          desc: "Umsebenzi ophakathi",
        },
        large: {
          label: "200 – 500",
          desc: "Urhwebo olukhulu",
        },
        xlarge: {
          label: "500+",
          desc: "Ubukhulu beshishini",
        },
      },
      purposeLabel: "Injongo ephambili (ngokuzithandela)",
      purposes: {
        breeding: "Ukuzala / Stud",
        fattening: "Ukutyebisa / Feedlot",
        dairy: "Ubisi",
        mixed: "Ukulima Okuxubileyo",
        game: "Ukulima Inyamakazi",
      },
      createButton: "Yenza Ifama",
      creating: "Iyenziwa Iyahlanganiswa...",
      alert: "Khetha ubukhulu obukhuselayo bomhlambi wakho",
    },
    step5: {
      title: "{{farmName}} ilungile!",
      subtitle: "Ungathanda ukwenza ntoni kuqala?",
      options: {
        addAnimals: {
          title: "Yongeza izilwanyana zam zokuqala",
          description: "Bhalisa umhlambi wakho ngamnye okanye uthumele uluhlu",
        },
        explore: {
          title: "Hlola usetyenziso",
          description: "Khangela ujikeleze ubone okwenziwa yiHerdTrackr",
        },
      },
    },
  },
  reportsScreen: {
    title: "Iingxelo",
    noAnimals: "Yongeza izilwanyana ukuze ubone iingxelo nohlalutyo.",
    herdSummary: {
      title: "Isishwankathelo soMhlambi",
      totalHead: "Iintloko Zizonke",
    },
    bySex: {
      title: "NgesiNi",
    },
    byBreed: {
      title: "NgoHlobo",
    },
    records: {
      title: "Iirekhodi",
      healthRecords: "Iirekhodi zempilo",
      weightRecords: "Iirekhodi zobunzima",
      breedingRecords: "Iirekhodi zokuzala",
      avgWeight: "Ubunzima obuphakathi",
      calvingSuccess: "Impumelelo yokuzala",
    },
    treatmentStats: {
      title: "Iinkcukacha zoNyango",
      vaccinations: "Ugonyo",
      treatments: "Unyango",
      deworming: "Ukukhupha izikhwekhwe",
      totalHealthEvents: "Iziganeko zempilo zizonke",
    },
    animalsNeedingAttention: {
      title: "Izilwanyana eziDinga uKuhoywa",
      count_one: "{{count}} isilwanyana sidinga ukuhoywa",
      count_other: "{{count}} izilwanyana zidinga ukuhoywa",
      monthsOld: "Iinyanga ezi-{{months}} ubudala",
      reasons: {
        noVaccinations: "Akukho gonyo lurekhodiweyo - amathole kufuneka egonywe phambi kweenyanga ezi-2",
        needsBooster: "Anokufuna izitofu zomgcwalisi - zifuneka ngokwesiqhelo phambi kweenyanga ezi-6",
      },
    },
    exportButton: "Khupha uMhlambi njenge-CSV",
    traceability: {
      title: "Iingxelo zoKulandelela iSilwanyana",
      description: "Yenza iingxelo ezipheleleyo zokulandelela izilwanyana ngazinye okanye amaqela. Iingxelo ziquka imbali epheleleyo: iirekhodi zempilo, ubunzima, ukuzala, ukushukuma, neefoto.",
      selected: "{{count}} ezikhethiweyo",
      selectAll: "Khetha Zonke",
      clear: "Sula",
      generateButton: "Yenza Wabelane Ngengxelo",
      generating: "Iyenza Ingxelo...",
      noSelection: "Nceda khetha ubuncinane isilwanyana esinye ukuze wenze ingxelo yokulandelela.",
    },
  },
  herdListScreen: {
    title: "Umhlambi",
    addButton: "+ Yongeza",
    searchPlaceholder: "Khangela ngethegi, igama, okanye uhlobo...",
    count_one: "{{count}} isilwanyana",
    count_other: "{{count}} izilwanyana",
    tag: "Ithegi: {{tag}}",
    breedAndSex: "{{breed}} | {{sex}}",
    empty: {
      loading: "Iyalayisha...",
      title: "Qalisa Ukwakha uMhlambi Wakho",
      description: "Yongeza isilwanyana sakho sokuqala ukuze uqalise ukulandelela iirekhodi zempilo, ubunzima, ukuzala, nokunye.",
      onboarding: {
        step1: {
          title: "Yongeza Iinkcukacha zeSilwanyana",
          description: "Faka inombolo yethegi, uhlobo, isini, kunye nefoto ngokuzithandela",
        },
        step2: {
          title: "Landelela Yonke Into",
          description: "Rekhoda unyango, ubunzima, ukuzala, nokushukuma",
        },
        step3: {
          title: "Khupha Iingxelo",
          description: "Yenza iingxelo ezilungele ukuthengisa nokuhlolwa",
        },
      },
      button: "Yongeza Isilwanyana Sakho Sokuqala",
      tip: "Iqhinga: Sebenzisa isikena sekhamera ukufunda iinombolo zethegi zendlebe ngokuzenzekelayo",
    },
  },
  chuteScreen: {
    title: "Imo ye-Chute",
    selectMode: "Khetha into oyirekhodayo namhlanje",
    modes: {
      weight: {
        title: "Linganisa Ubunzima",
        description: "Rekhoda ubunzima kunye nesikora sembonakalo ngokuzithandela",
        sessionTitle: "Iseshoni yokuLinganisa Ubunzima",
      },
      protocol: {
        title: "Gonya / Nyanga",
        description: "Sebenzisa iiprotocol zogonyo okanye unyango ngamayeza abalwe ngokuzenzekelayo",
        sessionTitle: "Iseshoni yokuGonya / Nyanga",
      },
      weightAndTreatment: {
        title: "Linganisa + Nyanga",
        description: "Rekhoda ubunzima kwaye usebenzise iprotocol ngokunye",
        sessionTitle: "Iseshoni yokuLinganisa + Nyanga",
      },
      condition: {
        title: "Isikora sembonakalo",
        description: "Rekhoda iiskora zembonakalo yomzimba",
        sessionTitle: "Iseshoni yeSikora sembonakalo",
      },
    },
    session: {
      processed: "{{count}} eziphathiweyo",
      previousSession: "Iseshoni edluleyo: {{count}} eziphathiweyo",
      endSession: "Phelisa Iseshoni",
    },
    scan: {
      title: "SKENA ITHEGI",
      placeholder: "Faka ithegi okanye sebenzisa ikhamera",
      lookUp: "Khangela",
      searching: "Iyakhangela...",
      notFound: "Akukho silwanyana sifumanekayo ngethegi \"{{tag}}\". Yongeza kuqala kwithebhu yoMhlambi.",
      scanning: "Iyaskena...",
      pullTrigger: "Tsala isikhuphulisi ukuskena ithegi",
      orManualEntry: "Okanye faka ngesandla ngezantsi:",
    },
    animalInfo: {
      rfid: "RFID",
      visualTag: "Ithegi Ebonakalayo",
      dob: "Umhla wokuZalwa",
      lastWeight: "Ubunzima Bokugqibela",
      lastWeightValue: "{{weight}} kg",
    },
    weight: {
      previousWeight: "Ubunzima bangaphambili:",
      weightValue: "{{weight}} kg",
      newWeightLabel: "Ubunzima Obutsha (kg)",
      weightPlaceholder: "umz. 450",
      conditionScoreLabel: "Isikora sembonakalo (1-9)",
      conditionScorePlaceholder: "Ngokuzithandela, umz. 6",
      saveAndNext: "Gcina Uqhubeke",
      invalidWeight: "Faka ubunzima obufanelekileyo nge-kg",
      invalidConditionScore: "Isikora sembonakalo kufuneka sibe phakathi kuka-1-9",
    },
    weightAndTreatment: {
      step1: "1. Rekhoda Ubunzima",
      step2: "2. Khetha Unyango",
      weightLabel: "Ubunzima (kg)",
      conditionScoreLabel: "Isikora sembonakalo (1-9)",
      noProtocols: "Akukho iiprotocol ezisebenzayo ezifumanekayo",
      manageProtocols: "Lawula Iiprotocol",
      changeProtocol: "Tshintsha Iprotocol",
      saveBoth: "Gcina zombini Uqhubeke",
      calculatedDosage: {
        title: "Umlinganiso oBaliweyo",
        atWeight: "Kubunzima obuyi-{{weight}} kg:",
        give: "Nika: {{ml}} ml",
      },
      required: "Khetha iprotocol yonyango",
    },
    condition: {
      labels: {
        thin: "Bhityileyo",
        moderate: "Phakathi",
        fat: "Tyebileyo",
      },
    },
    protocol: {
      title: "Khetha Ugonyo / Unyango",
      product: "Imveliso: {{name}}",
      standardDosage: "Umlinganiso oQhelekileyo: {{dosage}}",
      method: "Indlela: {{method}}",
      withdrawal: "Ukurhoxiswa: iintsuku ezi-{{days}}",
      autoCalculated: {
        title: "Umlinganiso oBaliwe ngokuZenzekelayo",
        lastWeight: "Ubunzima bokugqibela: {{weight}} kg",
        give: "Nika: {{ml}} ml",
        based: "Ngokusekelwe ku-{{ml}}ml nge-{{kg}}kg",
      },
      manualDosage: "Umlinganiso wesandla uyafuneka - iprotocol ayichazi umyinge nge-kg",
      noWeight: {
        title: "Akukho buNzima Burekhodiweyo",
        message: "Linganisa esi silwanyana kuqala ukuze umlinganiso ubalwe ngokuchanekileyo",
      },
      changeProtocol: "Tshintsha Iprotocol",
      apply: "Sebenzisa",
      applyAndNext: "Sebenzisa Uqhubeke",
    },
  },
  pasturesScreen: {
    title: "Ujikelezo lwaMadlelo",
    createButton: "+ Entsha",
    locked: {
      title: "Ujikelezo lwaMadlelo",
      description: "Yenza imephu yamadlelo, wabela imihlambi, kwaye ulandelele iintsuku zokutya ukuze uphucule ingca nempilo yomhlaba.",
      proBadge: "PRO",
      upgradeButton: "Phakamisa kwiPro",
    },
    stats: {
      pastures: "Amadlelo",
      animals: "Izilwanyana",
      occupied: "Esebenza",
    },
    card: {
      animals: "Izilwanyana",
      daysGrazed: "Iintsuku Zokutya",
      daysUntilRotation: "Iintsuku ezi-{{days}} kuze kufike ujikelezo",
    },
    empty: {
      title: "Akukho Madlelo Okwangoku",
      description: "Sizakukukhokela ekudaleni idlelo lakho lokuqala ngamanyathelo amathathu nje alula",
      button: "Qalisa →",
    },
  },
  animalDetailScreen: {
    loading: "Iyalayisha...",
    notFound: "Isilwanyana asifumanekanga",
    backButton: "Buya",
    editButton: "Hlela",
    deleteButton: "Cima Isilwanyana",
    tabs: {
      overview: "Inkangeleko",
      health: "Impilo",
      vaccinations: "Ugonyo",
      weight: "Ubunzima",
      breeding: "Ukuzala",
    },
    overview: {
      rfidTag: "Ithegi ye-RFID",
      visualTag: "Ithegi Ebonakalayo",
      dateOfBirth: "Umhla wokuZalwa",
      registrationNumber: "Inombolo yokuBhalisa",
      notes: "Amanqaku",
      noValue: "—",
    },
    health: {
      addButton: "+ Yongeza Irekhodi yeMpilo",
      empty: "Akukho irekhodi yempilo okwangoku.",
      product: "Imveliso: {{product}}",
      recordedBy: "Irekhodwe ngu-{{name}}",
    },
    weight: {
      addButton: "+ Yongeza Irekhodi yoBunzima",
      empty: "Akukho irekhodi yobunzima okwangoku.",
      weightValue: "{{weight}} kg",
      condition: "Imeko: {{score}}/9",
      recordedBy: "Irekhodwe ngu-{{name}}",
    },
    breeding: {
      addButton: "+ Yongeza Irekhodi yokuZala",
      empty: "Akukho irekhodi yokuzala okwangoku.",
      bred: "Lakhwelwe: {{date}}",
      expectedCalving: "Ukuzala okulindelekayo: {{date}}",
      recordedBy: "Irekhodwe ngu-{{name}}",
    },
  },
  animalFormScreen: {
    title: {
      edit: "Hlela Isilwanyana",
      add: "Yongeza Isilwanyana",
    },
    farmLabel: "Ifama:",
    helperNote: "* Ubuncinane ithegi enye (RFID okanye Ebonakalayo) iyafuneka",
    fields: {
      rfidTag: {
        label: "Ithegi ye-RFID",
        placeholder: "Faka inombolo yethegi ye-RFID",
        scanPlaceholder: "Tsala isikhuphulisi ukuskena ithegi ye-RFID",
        helpText: "Ithegi yombane efakwe kwithegi yendlebe - isicwangciso seCommercial siquka inkxaso yesikena se-RFID",
        scanning: "Tsala isikhuphulisi ukuskena...",
      },
      visualTag: {
        label: "Ithegi Ebonakalayo (ithegi yendlebe/uphawu)",
        placeholder: "Ithegi yendlebe okanye inombolo yophawu",
        helpText: "Sebenzisa iqhosha lesikena sekhamera ukufunda iinombolo zethegi ngokuzenzekelayo kwiifoto",
      },
      name: {
        label: "Igama (ngokuzithandela)",
        placeholder: "Igama lesilwanyana",
      },
      photos: {
        label: "Iifoto (zokuchonga)",
      },
      breed: {
        label: "Uhlobo *",
        placeholder: "Khetha uhlobo",
      },
      sex: {
        label: "Isini *",
        options: {
          male: "Inkunzi",
          female: "Imazi",
          castrated: "Inkabi",
          unknown: "Akwaziwa",
        },
      },
      dateOfBirth: {
        label: "Umhla wokuZalwa",
        placeholder: "DD/MM/YYYY",
      },
      registrationNumber: {
        label: "Inombolo yokuBhalisa",
        placeholder: "Ngokuzithandela",
      },
      herdTag: {
        label: "Ithegi yoMhlambi/yeQela",
        placeholder: "umz., 23-C, XYZ, Iqela A (ngokuzithandela)",
      },
      notes: {
        label: "Amanqaku",
        placeholder: "Naliphi na inqaku elongezelelweyo...",
      },
      tags: {
        label: "Iithegi",
        placeholder: "Yongeza iithegi (umz., Imfuyo yokuZala, IyaThengiswa...)",
      },
    },
    lineage: {
      title: "Umnombo (ngokuzithandela)",
      helpText: "Landelela imfuza yeenkqubo zokuzala nesityhilelo somnombo",
      sire: {
        label: "Uyise (Utata)",
        placeholder: "+ Yongeza uyise",
        noMales: "Yongeza izilwanyana zamadoda kumhlambi wakho kuqala ukuze uzikhethe njengoyise",
      },
      dame: {
        label: "Unina (Umama)",
        placeholder: "+ Yongeza unina",
        noFemales: "Yongeza izilwanyana zabasetyhini kumhlambi wakho kuqala ukuze uzikhethe njengoonina",
      },
    },
    buttons: {
      cancel: "Rhoxisa",
      save: "Gcina Utshintsho",
      add: "Yongeza Isilwanyana",
      saving: "Iyagcinwa...",
    },
    modals: {
      breed: {
        title: "Khetha Uhlobo",
        cancel: "Rhoxisa",
      },
      sex: {
        title: "Khetha Isini",
        cancel: "Rhoxisa",
      },
      sire: {
        title: "Khetha uYise",
        searchPlaceholder: "Khangela ngegama okanye ithegi...",
        empty: "Akukho zinkunzi zifumanekayo",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Rhoxisa",
      },
      dame: {
        title: "Khetha uNina",
        searchPlaceholder: "Khangela ngegama okanye ithegi...",
        empty: "Akukho mazi zifumanekayo",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Rhoxisa",
      },
    },
    alerts: {
      validation: {
        tagRequired: {
          title: "Iyafuneka",
          message: "Nceda faka mhlawumbi ithegi ye-RFID okanye Ithegi Ebonakalayo (ubuncinane enye iyafuneka)",
        },
        breedRequired: {
          title: "Iyafuneka",
          message: "Uhlobo luyafuneka",
        },
        noOrganization: {
          title: "Impazamo",
          message: "Akukho mbutho ukhethiweyo",
        },
      },
      saveError: {
        title: "Impazamo",
        message: "Akukwazanga kugcinwa isilwanyana. Nceda zama kwakhona.",
      },
    },
  },
  bulkAnimalAddScreen: {
    title: {
      setup: "Yongeza Ngobuninzi",
      entry: "Yongeza Ngokukhawuleza",
    },
    setup: {
      helpText: "Misela amasimi aqhelekileyo kanye, emva koko skena iithegi ngokukhawuleza kwizilwanyana ezininzi ezineempawu ezifanayo.",
      sectionTitle: "Amasimi Aqhelekileyo (asebenza kuzo zonke izilwanyana)",
      tagTypeLabel: "Uhlobo lweThegi",
      tagTypeModalTitle: "Khetha Uhlobo lweThegi",
      tagType: {
        visual: "Ithegi Ebonakalayo (Ithegi Yendlebe)",
        rfid: "Ithegi ye-RFID",
      },
      tagTypeDescription: {
        visual: "Inombolo yethegi yenyama ebonakalayo kwisilwanyana",
        rfid: "Inombolo yethegi yombane ye-RFID",
      },
      labelPrefixLabel: "Isandulela seLebhile/seThegi (ngokuzithandela)",
      labelPrefixPlaceholder: "umz., BRN, COW, 2024-",
      labelPrefixHelper: "Oku kuya kongezwa phambi kwenombolo nganye yethegi",
      pastureLabel: "Idlelo/iQela Langoku (ngokuzithandela)",
      pasturePlaceholder: "+ Khetha idlelo",
      pastureModalTitle: "Khetha Idlelo",
      noPastures: "Akukho madlelo afumanekayo",
      notesLabel: "Itemplate yamaNqaku (ngokuzithandela)",
      notesPlaceholder: "Isebenza kuzo zonke izilwanyana kweli qela...",
      startButton: "Qalisa Ufakelo oluKhawulezayo",
    },
    entry: {
      countLabel: "{{count}} Eyongeziweyo",
      tagLabel: "Skena okanye Faka Ithegi",
      tagPlaceholder: "Ithegi yendlebe okanye RFID",
      weightLabel: "Ubunzima (ngokuzithandela)",
      weightPlaceholder: "kg",
      photoLabel: "Ifoto (ngokuzithandela)",
      addButton: "Yongeza Isilwanyana",
      adding: "Iyongezwa...",
      recentTitle: "Eyongezwe Kutsha Nje",
    },
    alerts: {
      breedRequired: {
        title: "Iyafuneka",
        message: "Uhlobo luyafuneka phambi kokuqala ufakelo lobuninzi",
      },
      tagRequired: {
        title: "Iyafuneka",
        message: "Nceda faka inombolo yethegi (Ebonakalayo okanye RFID)",
      },
      noOrganization: {
        message: "Akukho mbutho ukhethiweyo",
      },
      addError: {
        message: "Akukwazanga kongezwa isilwanyana. Nceda zama kwakhona.",
      },
      finish: {
        title: "Gqibezela ukuYongeza Ngobuninzi?",
        message: "Sele wongeze izilwanyana ezi-{{count}}. Sele ukulungele ukugqibezela?",
        cancel: "Qhubeka uYongeza",
        confirm: "Kwenziwe",
      },
    },
  },
  teamScreen: {
    title: "Iqela",
    loading: "Iyalayisha...",
    inviteButton: "+ Mema",
    inviteForm: {
      title: "Mema iLungu leQela",
      methodLabel: "Thumela nge",
      methodEmail: "Imeyile",
      methodSMS: "SMS",
      methodWhatsApp: "WhatsApp",
      emailLabel: "Idilesi ye-Imeyile",
      emailPlaceholder: "umsebenzi@umzekelo.com",
      phoneLabel: "Inombolo yeFoni",
      phonePlaceholder: "+27 82 123 4567",
      roleLabel: "Indima",
      roles: {
        admin: "uMlawuli",
        worker: "uMsebenzi",
      },
      roleAdmin: "uMlawuli",
      roleWorker: "uMsebenzi",
      sendButton: "Thumela isiMemo",
      sending: "Iyathunyelwa...",
      cancelButton: "Rhoxisa",
      errors: {
        contactRequired: "Iinkcukacha zoqhagamshelwano ziyafuneka",
        emailRequired: "Idilesi ye-imeyile iyafuneka",
        invalidEmail: "Nceda faka idilesi ye-imeyile efanelekileyo",
        invalidPhone: "Nceda faka inombolo yefoni efanelekileyo",
        failedToSend: "Akukwazanga kuthunyelwa isimemo. Nceda zama kwakhona.",
      },
    },
    alerts: {
      inviteSent: {
        title: "isiMemo siThunyelwe",
        message: "Isimemo sithunyelwe ku-{{contact}} nge-{{method}}. Ikhowudi yesimemo: {{code}}",
        ok: "KULUNGILE",
      },
      cancelInvite: {
        title: "Rhoxisa isiMemo",
        message: "Rhoxisa isimemo sika-{{email}}?",
        no: "Hayi",
        yes: "Ewe, Rhoxisa",
      },
      changeRole: {
        title: "Tshintsha iNdima",
        message: "Tshintsha indima ka-{{name}} ibe ngu-{{role}}?",
        cancel: "Rhoxisa",
        change: "Tshintsha iNdima",
      },
      removeMember: {
        title: "Susa iLungu",
        message: "Susa u-{{name}} kwiqela lakho? Baya kuphulukana nokufikelela kulo mbutho.",
        cancel: "Rhoxisa",
        remove: "Susa",
      },
      error: {
        title: "Impazamo",
        sendFailed: "Akukwazanga kuthunyelwa isimemo. Nceda zama kwakhona.",
        cancelInviteFailed: "Akukwazanga kurhoxiswa isimemo.",
        updateRoleFailed: "Akukwazanga kutshintshwa indima.",
        removeMemberFailed: "Akukwazanga kususwa ilungu leqela.",
      },
    },
    sections: {
      members: "Amalungu eQela ({{count}})",
      invites: "Izimemo eziLindileyo ({{count}})",
    },
    member: {
      you: " (wena)",
      joined: "Wajoyina nge-{{date}}",
      roleAdmin: "uMlawuli",
      roleWorker: "uMsebenzi",
    },
    invite: {
      code: "Ikhowudi: {{code}}",
      expires: "Iphelelwa nge-{{date}}",
      cancelButton: "Rhoxisa",
    },
    noAccess: "Ngabalawuli kuphela abanokulawula amalungu eqela",
    syncNotice: {
      title: "Ukuhlanganisa kuyaFuneka",
      text: "Utshintsho lweqela lufuna ukuhlanganiswa ukuze lusebenze kuzo zonke izixhobo.",
      button: "Hlanganisa Ngoku",
    },
  },
  treatmentProtocolsScreen: {
    title: "Iiprotocol zoNyango",
    createButton: "+ Entsha",
    filters: {
      all: "Zonke",
      vaccination: "Ugonyo",
      treatment: "Unyango",
      deworming: "Ukukhupha izikhwekhwe",
      other: "Okunye",
    },
    count_one: "{{count}} iprotocol",
    count_other: "{{count}} iiprotocol",
    inactive: "Ayisebenzi",
    withdrawal: "Ukurhoxiswa: iintsuku ezi-{{days}}",
    empty: {
      title: "Akukho Protocol Zifumanekayo",
      noProtocols: "Yenza iprotocol yakho yokuqala yonyango ukuze uyisebenzise kwiMo ye-Chute",
      filtered: "Akukho protocol ze-{{filter}} zifumanekayo",
      showAll: "Bonisa Zonke",
      loadDefaults: "Layisha Iimisileyo zaseSA",
      createButton: "Yenza Iprotocol",
    },
    alerts: {
      toggleError: "Akukwazanga kutshintshwa imo yeprotocol",
      defaultsAdded: "Iiprotocol ezi-{{count}} zongezwe ngempumelelo",
    },
  },
  healthRecordFormScreen: {
    title: "Irekhodi yeMpilo",
    cancelButton: "Rhoxisa",
    typeLabel: "Uhlobo",
    recordTypes: {
      vaccination: "ugonyo",
      treatment: "unyango",
      vet_visit: "utyelelo lukagqirha wezilwanyana",
      condition_score: "isikora sembonakalo",
      other: "okunye",
      vaccinationPro: "ugonyo (PRO)",
    },
    protocol: {
      selectButton_one: "Khetha kwi-{{count}} protocol egciniweyo",
      selectButton_other: "Khetha kwi-{{count}} protocol ezigciniweyo",
      selectedDetail: "{{productName}} • {{dosage}}",
      noProtocols: "Akukho protocol zifumanekayo. Yenza enye kwiiSetingi → IiProtocol zoNyango",
    },
    fields: {
      description: {
        label: "Inkcazo *",
        placeholder: "Yintoni eyenziweyo?",
      },
      productName: {
        label: "Igama leMveliso",
        placeholder: "umz. Covexin 10",
      },
      dosage: {
        label: "Umlinganiso",
        placeholder: "umz. 2ml SC",
      },
      administeredBy: {
        label: "Inikwe ngu",
        placeholder: "Ngokuzithandela",
      },
      notes: {
        label: "Amanqaku",
        placeholder: "Amanqaku angaphezulu...",
      },
      photos: {
        label: "Iifoto (Ngokuzithandela)",
      },
    },
    buttons: {
      save: "Gcina iRekhodi",
      saving: "Iyagcinwa...",
    },
    alerts: {
      required: {
        title: "Iyafuneka",
        message: "Inkcazo iyafuneka",
      },
      noOrganization: {
        title: "Impazamo",
        message: "Akukho mbutho ukhethiweyo",
      },
      saveError: {
        title: "Impazamo",
        message: "Akukwazanga kugcinwa irekhodi yempilo",
      },
    },
  },
  weightRecordFormScreen: {
    title: "Irekhodi yoBunzima",
    cancelButton: "Rhoxisa",
    fields: {
      weight: {
        label: "Ubunzima (kg) *",
        placeholder: "umz. 450",
      },
      conditionScore: {
        label: "Isikora sembonakalo (1-9)",
        placeholder: "Ngokuzithandela, umz. 6",
      },
      notes: {
        label: "Amanqaku",
        placeholder: "Amanqaku angaphezulu...",
      },
      photos: {
        label: "Iifoto (Ngokuzithandela)",
      },
    },
    buttons: {
      save: "Gcina iRekhodi",
      saving: "Iyagcinwa...",
    },
    alerts: {
      invalidWeight: {
        title: "Ayichanekanga",
        message: "Nceda faka ubunzima obufanelekileyo nge-kg",
      },
      invalidConditionScore: {
        title: "Ayichanekanga",
        message: "Isikora sembonakalo kufuneka sibe phakathi kuka-1 no-9",
      },
      noOrganization: {
        title: "Impazamo",
        message: "Akukho mbutho ukhethiweyo",
      },
      saveError: {
        title: "Impazamo",
        message: "Akukwazanga kugcinwa irekhodi yobunzima",
      },
    },
  },
  breedingRecordFormScreen: {
    title: "Irekhodi yokuZala",
    cancelButton: "Rhoxisa",
    methodLabel: "Indlela",
    methods: {
      natural: "yendalo",
      ai: "ai",
      embryo_transfer: "ukufudusa umbungu",
    },
    outcomeLabel: "Isiphumo",
    outcomes: {
      pending: "kulindiwe",
      live_calf: "ithole eliphilayo",
      stillborn: "lifile xa lizalwa",
      aborted: "yakhutshwa",
      open: "kuvuliwe",
    },
    fields: {
      notes: {
        label: "Amanqaku",
        placeholder: "Amanqaku angaphezulu...",
      },
      photos: {
        label: "Iifoto (Ngokuzithandela)",
      },
    },
    buttons: {
      save: "Gcina iRekhodi",
      saving: "Iyagcinwa...",
    },
    alerts: {
      noOrganization: {
        title: "Impazamo",
        message: "Akukho mbutho ukhethiweyo",
      },
      saveError: {
        title: "Impazamo",
        message: "Akukwazanga kugcinwa irekhodi yokuzala",
      },
    },
    },
  vaccinationScheduleScreen: {
    title: "Amaxesha oGonyo",
    createButton: "+ Entsha",
    count: "{{count}} amaxesha",
    filters: {
      all: "Onke",
      ageBased: "Ngokweminyaka",
      dateBased: "Ngomhla",
      groupBased: "Ngeqela",
    },
    badges: {
      inactive: "Ayisebenzi",
    },
    details: {
      booster: "{{count}} amayeza, umgcwalisi emva kweentsuku ezi-{{days}}",
    },
    empty: {
      title: "Akukho Maxesha oGonyo",
      noFilter: "Yenza amaxesha ukuze izikhumbuzi zogonyo zenziwe ngokuzenzekelayo ngokweminyaka, umhla, okanye iqela.",
      withFilter: "Akukho maxesha e-{{filter}} afumanekayo.",
      showAllButton: "Bonisa Onke",
      createButton: "Yenza iXesha",
    },
    alerts: {
      toggleError: {
        title: "Impazamo",
        message: "Akukwazanga kutshintshwa imo yexesha",
      },
      deleteConfirm: {
        title: "Cima iXesha",
        message: "Cima ixesha logonyo elithi '{{name}}'? Oku akuyi kuchaphazela iirekhodi zempilo ezikhoyo.",
      },
      deleteError: {
        title: "Impazamo",
        message: "Akukwazanga kucinywa ixesha",
      },
    },
  },
}

export default xh
export type Translations = typeof xh
