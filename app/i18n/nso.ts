const nso = {
  common: {
    ok: "Go lokile",
    cancel: "Khansela",
    back: "Morago",
    save: "Boloka",
    delete: "Phumola",
    edit: "Fetola",
    add: "Oketša",
    done: "Go feditšwe",
    search: "Nyaka",
    logOut: "Tšwa",
    next: "Ye e latelago",
    skip: "Tlola",
    loading: "Go a laiša...",
    required: "Go a nyakega",
    optional: "ka boithaopo",
    error: "Phošo",
    notFound: "Ga se ya hwetšwa",
    failedToLoad: "Go paletšwe go laiša datha",
  },
  errors: {
    invalidEmail: "Aterese ya imeile ga e a nepagala.",
    somethingWentWrong: "Go na le se se sego sa sepela gabotse!",
    tryAgain: "Hle leka gape.",
  },
  errorScreen: {
    title: "Go na le se se sego sa sepela gabotse!",
    friendlySubtitle:
      "Go diregile phošo yeo e sa letelwago. Hle leka go thoma sešupanako gape. Ge bothata bo tšwela pele, ikgokaganye le thušo.",
    reset: "THOMA SEŠUPANAKO GAPE",
    traceTitle: "Phošo go tšwa mokgobong wa {{name}}",
  },
  emptyStateComponent: {
    generic: {
      heading: "Ga go na selo mo go fihla bjale",
      content: "Ga go na datha yeo e hweditšwego. Oketša direkhoto tše dingwe go thoma.",
      button: "Mpshafatša",
    },
  },
  authScreen: {
    title: "HerdTrackr",
    subtitle: "Laola diruiwa tša gago gabonolo",
    formTitle: "Tsena ka imeile ya gago",
    formSubtitle: "Re tla go romela khoutu ya dinomoro tše 7 - ga go nyakege lentšuphetišo!",
    emailLabel: "Aterese ya Imeile",
    emailPlaceholder: "molemi@mohlala.com",
    sendCode: "Romela Khoutu",
    sending: "Go a romela...",
    enterCode: "Tsenya Khoutu",
    checkEmail: "Lekola imeile ya gago go hwetša khoutu ya dinomoro tše 7",
    sentTo: "E rometšwe go",
    codeLabel: "Khoutu ya Dinomoro tše 7",
    codePlaceholder: "0000000",
    verifyCode: "Netefatša Khoutu",
    verifying: "Go a netefatša...",
    didntReceive: "Ga se wa amogela khoutu?",
    resend: "Romela gape",
    termsNotice: "Ka go tšwela pele, o dumela Melawana ya rena ya Tirelo",
    benefits: {
      title: "Seo o ka se dirago:",
      animals: "Latelela diphoofolo, maphelo & tswalo",
      pastures: "Laola mafulo & diphetogo",
      team: "Laletša bašomi ba gago ba polasa",
      sync: "Kopanya go didirišwa ka moka",
    },
  },
  dashboardScreen: {
    title: "Dashiboto",
    welcomeBack: "Re a go amogela gape, {{name}}",
    currentFarm: "Polasa ya Bjale",
    switchFarm: "Fetola Polasa",
    createNewFarm: "+ Hlama Polasa e Mpsha",
    setupCard: {
      title: "Re a go amogela go HerdTrackr",
      subtitle: "Beakanya polasa ya gago go thoma go laola mohlape wa gago.",
      button: "Beakanya Polasa",
    },
    stats: {
      totalHead: "Palomoka ya Dihlogo",
      active: "E a šoma",
      dueToCalve: "E tla Belega",
      pendingSync: "Kopanyo e Emetšego",
    },
    vaccinations: {
      title: "Dienti tše di Swanetšego",
      overdue: "Di fetile nako",
      dueToday: "Di Swanetše Lehono",
      dueSoon: "Di Swanetše Kgauswinyane",
      viewAll: "Lebelela Ditšhenyulo ka Moka",
    },
    reports: {
      title: "Dipego & Tshekatsheko",
      description: "Lebelela tiragatšo ya mohlape, mekgwa ya boima, le dipego tša tswalo",
    },
    recentAnimals: {
      title: "Diphoofolo tša Morago Bjale",
      empty: "Ga go na diphoofolo go fihla bjale. Eya go thepe ya Mohlape go oketša phoofolo ya gago ya mathomo.",
    },
  },
  settingsScreen: {
    title: "Dipeakanyo",
    sections: {
      appearance: "PONAGALO",
      language: "LELEME",
      account: "AKHAONTE",
      subscription: "PEELETŠO",
      management: "TAOLO",
      rfidScanner: "SESKENARA SA RFID",
      dangerZone: "LEFELO LA KOTSI",
    },
    appearance: {
      darkMode: "Mokgwa wo o Fifetšego",
      darkThemeEnabled: "Sehlogo se se fifetšego se dumeletšwe",
      lightThemeEnabled: "Sehlogo se se bonatšego se dumeletšwe",
    },
    language: {
      appLanguage: "Leleme la Sediriša",
      current: "Bjale: {{language}}",
    },
    account: {
      notSignedIn: "Ga se wa tsena",
      org: "Mokgatlo: {{orgName}}",
      noOrg: "Ga go gona",
      appLock: "Go Notlela Sediriša",
      appLockHint: "Nyaka Face ID goba monwana go bula sediriša",
    },
    subscription: {
      plans: {
        commercial: "Kgwebo",
        farm: "Polasa",
        starter: "Mothomi",
      },
      status: {
        loading: "Go a laiša...",
        commercialAccess: "Phihlelelo e feletšego + dielemente tša sehlopha",
        farmAccess: "Dielemente tša premiamo di bulegile",
        freeTier: "Legato la mahala",
      },
      badges: {
        com: "KGW",
        farm: "POLASA",
      },
      descriptions: {
        commercial: "Diphoofolo tše di sa lekanywago, gammogo le elemente e nngwe le e nngwe.",
        farm: "Diphoofolo tše di sa lekanywago, gammogo le elemente e nngwe le e nngwe.",
        starter:
          "Elemente e nngwe le e nngwe e akareditšwe mahala, go fihla go diphoofolo tše 50. Kaonafatša bakeng sa diphoofolo tše di sa lekanywago.",
      },
      buttons: {
        manageSubscription: "Laola Peeletšo",
        viewPlans: "Lebelela Maano",
      },
    },
    management: {
      team: "Sehlopha",
      treatmentProtocols: "Diprothokholo tša Kalafo",
      vaccinationSchedules: "Ditšhenyulo tša Dienti",
    },
    rfid: {
      connected: "Seskenara sa seatla se kgokagane",
      readerPower: "Maatla a Balo ya RFID",
      powerSaved: "Maatla a balo a beilwe go {{power}} dBm",
      rangeHint:
        "{{min}}–{{max}} dBm. Maatla a magolo a balo a ka fihlela ditagi tša kgole, eupša a ka bala le diphoofolo tša kgauswi. Bophara ga se bja tlhamalalo.",
      presets: {
        low: "Fasana",
        med: "Magareng",
        high: "Godimo",
        max: "Bogolo",
      },
    },
    dangerZone: {
      resetTitle: "Thoma Datapeisi ya Selegae Gape",
      resetDescription: "E phumola datha ka MOKA ya selegae. Diriša fela ge o thoma leswa ka morago ga go phumola Supabase.",
      resetButton: "Phumola Datapeisi ya Selegae",
      alerts: {
        confirmTitle: "Thoma Datapeisi ya Selegae Gape",
        confirmMessage:
          "Se se tla phumola datha ka MOKA ya selegae go akaretša mokgatlo wa gago, diphoofolo, le direkhoto. Se se ka se dirwe gape!\\n\\nDira se fela ge o thoma leswa ka morago ga go phumola Supabase.",
        wipeButton: "PHUMOLA TŠOHLE",
        successTitle: "Katlego",
        successMessage: "Datapeisi ya selegae e thomilwe gape! Hle thoma sediriša gape.",
        errorTitle: "Phošo",
        errorMessage: "Go paletšwe go thoma datapeisi gape: {{error}}",
      },
    },
    signOut: "Tšwa",
    version: "HerdTrackr v0.1.0",
  },
  orgSetupScreen: {
    title: "HerdTrackr",
    subtitle: "Beakanya tirišo ya gago",
    allSet: "O beakantšwe ka moka!",
    step1: {
      title: "Polasa ya Gago",
      description: "Re botše ka tirišo ya gago. Se se hlama lefelo la gago la mošomo.",
      yourNameLabel: "Leina la Gago *",
      yourNamePlaceholder: "mohlala. John Smith",
      farmNameLabel: "Leina la Polasa / Rentšhi *",
      farmNamePlaceholder: "mohlala. Sunrise Livestock, Bosveld Game Farm",
      locationLabel: "Lefelo (ka boithaopo)",
      locationPlaceholder: "mohlala. Limpopo, Free State, KZN",
      ownerBadge: "Mong",
      alerts: {
        nameRequired: "Hle tsenya leina la gago",
        farmRequired: "Fa polasa goba rentšhi ya gago leina",
      },
    },
    step2: {
      title: "O rua eng?",
      description: "Kgetha mehuta ka moka ya diphoofolo tšeo o di laolago.",
      livestock: {
        cattle: {
          label: "Dikgomo",
          desc: "Nguni, Bonsmara, Brahman, Angus...",
        },
        buffalo: {
          label: "Dinare",
          desc: "Nare ya Kapa, nare ya meetse",
        },
        horses: {
          label: "Dipere",
          desc: "Boerperd, Nooitgedachter, Thoroughbred...",
        },
        sheep: {
          label: "Dinku",
          desc: "Dorper, Merino, Damara, Dohne...",
        },
        goats: {
          label: "Dipudi",
          desc: "Boer, Angora, Kalahari Red, Savanna...",
        },
        game: {
          label: "Diphoofolo tša Naga",
          desc: "Springbok, Impala, Kudu, Eland...",
        },
        pigs: {
          label: "Dikolobe",
          desc: "Large White, Landrace, Duroc...",
        },
        poultry: {
          label: "Dikgogo",
          desc: "Boschveld, Koekoek, Rhode Island Red...",
        },
      },
      nextButton: "Ye e latelago ({{count}} di kgethilwe)",
      alert: "Kgetha mehuta ya diphoofolo tšeo o di laolago",
    },
    step3: {
      title: "Beakanya mehuta ya kamehla",
      description: "Kgetha mehuta ya gago yeo e tlwaelegilego. O ka fetola tše ka mehla ka morago.",
      breedLabel: "Mohuta wa {{livestock}}",
    },
    step4: {
      title: "Re botše ka mohlape wa gago",
      description: "Se se re thuša go beakanya boitemogelo bakeng sa tirišo ya gago.",
      herdSizeLabel: "Bogolo bja mohlape bja tekanyetšo",
      herdSizes: {
        small: {
          label: "1 – 50",
          desc: "Polaseng ye nnyane / mohlape wa go thoma",
        },
        medium: {
          label: "50 – 200",
          desc: "Tirišo ya magareng",
        },
        large: {
          label: "200 – 500",
          desc: "Kgwebo e kgolo",
        },
        xlarge: {
          label: "500+",
          desc: "Tekanyo ya kgwebo",
        },
      },
      purposeLabel: "Morero wa motheo (ka boithaopo)",
      purposes: {
        breeding: "Tswalo / Stud",
        fattening: "Go Nontšha / Feedlot",
        dairy: "Maswi",
        mixed: "Temo ye e Hlakantšwego",
        game: "Temo ya Diphoofolo tša Naga",
      },
      createButton: "Hlama Polasa",
      creating: "Go a Hlama & Kopanya...",
      alert: "Kgetha bogolo bja mohlape bja tekanyetšo",
    },
    step5: {
      title: "{{farmName}} e loketše!",
      subtitle: "Ke eng seo o ka ratago go se dira pele?",
      options: {
        addAnimals: {
          title: "Oketša diphoofolo tša ka tša mathomo",
          description: "Ngwadiša mohlape wa gago o tee ka o tee goba o tsentšhe go tšwa lenaneong",
        },
        explore: {
          title: "Utolla sediriša",
          description: "Lebelela go dikologa gomme o bone seo HerdTrackr e ka se dirago",
        },
      },
    },
  },
  reportsScreen: {
    title: "Dipego",
    noAnimals: "Oketša diphoofolo go bona dipego le tshekatsheko.",
    herdSummary: {
      title: "Kakaretšo ya Mohlape",
      totalHead: "Palomoka ya Dihlogo",
    },
    bySex: {
      title: "Ka Bong",
    },
    byBreed: {
      title: "Ka Mohuta",
    },
    records: {
      title: "Direkhoto",
      healthRecords: "Direkhoto tša maphelo",
      weightRecords: "Direkhoto tša boima",
      breedingRecords: "Direkhoto tša tswalo",
      avgWeight: "Boima bja palogare",
      calvingSuccess: "Katlego ya go belega",
    },
    treatmentStats: {
      title: "Dipalopalo tša Kalafo",
      vaccinations: "Dienti",
      treatments: "Dikalafo",
      deworming: "Go bolaya diboko",
      totalHealthEvents: "Palomoka ya ditiragalo tša maphelo",
    },
    animalsNeedingAttention: {
      title: "Diphoofolo tše di Nyakago Tlhokomelo",
      count_one: "Phoofolo e {{count}} e nyaka tlhokomelo",
      count_other: "Diphoofolo tše {{count}} di nyaka tlhokomelo",
      monthsOld: "Dikgwedi tše {{months}}",
      reasons: {
        noVaccinations: "Ga go na dienti tše di ngwadilwego - manamane a swanetše go entwa ka dikgwedi tše 2",
        needsBooster: "E ka nyaka dienti tša matlafatšo - gantši di nyakega ka dikgwedi tše 6",
      },
    },
    exportButton: "Ntšha Mohlape bjalo ka CSV",
    traceability: {
      title: "Dipego tša Bolatedišwa bja Diphoofolo",
      description:
        "Tšweletša dipego tše di feletšego tša bolatedišwa bakeng sa diphoofolo tše di itšego goba dihlopha. Dipego di akaretša histori e feletšego: direkhoto tša maphelo, boima, tswalo, dihuduego, le diswantšho.",
      selected: "{{count}} di kgethilwe",
      selectAll: "Kgetha Tšohle",
      clear: "Phumola",
      generateButton: "Tšweletša & Abelana Pego",
      generating: "Go tšweletša Pego...",
      noSelection: "Hle kgetha bonyane phoofolo e tee go tšweletša pego ya bolatedišwa.",
    },
  },
  herdListScreen: {
    title: "Mohlape",
    addButton: "+ Oketša",
    searchPlaceholder: "Nyaka ka tagi, leina, goba mohuta...",
    count_one: "Phoofolo e {{count}}",
    count_other: "Diphoofolo tše {{count}}",
    tag: "Tagi: {{tag}}",
    breedAndSex: "{{breed}} | {{sex}}",
    empty: {
      loading: "Go a laiša...",
      title: "Thoma go Aga Mohlape wa Gago",
      description:
        "Oketša phoofolo ya gago ya mathomo go thoma go latelela direkhoto tša maphelo, boima, tswalo, le tše dingwe.",
      onboarding: {
        step1: {
          title: "Oketša Dintlha tša Phoofolo",
          description: "Tsenya nomoro ya tagi, mohuta, bong, le seswantšho sa boithaopo",
        },
        step2: {
          title: "Latelela Tšohle",
          description: "Rekhota dikalafo, boima, tswalo, le dihuduego",
        },
        step3: {
          title: "Ntšha Dipego",
          description: "Tšweletša dipego tše di loketšego bakeng sa thekišo le ditlhahlobo",
        },
      },
      button: "Oketša Phoofolo ya Gago ya Mathomo",
      tip: "Keletšo: Diriša seskenara sa khamera go bala dinomoro tša ditagi tša ditsebe ka boitshepelo",
    },
    rfidScan: {
      title: "Skena Tagi ya RFID",
      instruction: "Goga sekgohli go skena tagi",
      scanning: "Go a skena...",
      hint: "Swara sebadi kgauswi le tagi ya phoofolo",
      close: "Khansela",
    },
  },
  chuteScreen: {
    title: "Mokgwa wa Sekgoro",
    selectMode: "Kgetha seo o se rekhotago lehono",
    modes: {
      weight: {
        title: "Kala Boima",
        description: "Rekhota boima le peakanyo ya seemo ka boithaopo",
        sessionTitle: "Sešene sa go Kala Boima",
      },
      protocol: {
        title: "Enta / Alafa",
        description: "Diriša diprothokholo tša dienti goba kalafo ka dikelo tše di baletšwego ka boitshepelo",
        sessionTitle: "Sešene sa go Enta / Alafa",
      },
      weightAndTreatment: {
        title: "Kala + Alafa",
        description: "Rekhota boima le go diriša prothokholo ka nako e tee",
        sessionTitle: "Sešene sa go Kala + Alafa",
      },
      condition: {
        title: "Peakanyo ya Seemo",
        description: "Rekhota dipeakanyo tša seemo sa mmele",
        sessionTitle: "Sešene sa Peakanyo ya Seemo",
      },
    },
    session: {
      processed: "{{count}} di dirilwe",
      previousSession: "Sešene sa pele: {{count}} di dirilwe",
      endSession: "Fetša Sešene",
    },
    scan: {
      title: "SKENA TAGI",
      placeholder: "Tsenya tagi goba diriša khamera",
      lookUp: "Nyaka",
      searching: "Go a nyaka...",
      notFound: 'Ga go na phoofolo e hweditšwego ka tagi "{{tag}}". E oketše pele go thepe ya Mohlape.',
      scanning: "Go a skena...",
      pullTrigger: "Goga sekgohli go skena tagi",
      orManualEntry: "Goba tsenya ka seatla fasana:",
    },
    animalInfo: {
      rfid: "RFID",
      visualTag: "Tagi ya Ponagalo",
      dob: "Letšatši la Matswalo",
      lastWeight: "Boima bja Mafelelo",
      lastWeightValue: "{{weight}} kg",
    },
    weight: {
      previousWeight: "Boima bja pele:",
      weightValue: "{{weight}} kg",
      newWeightLabel: "Boima bjo Bofsa (kg)",
      weightPlaceholder: "mohlala. 450",
      conditionScoreLabel: "Peakanyo ya Seemo (1-9)",
      conditionScorePlaceholder: "Ka boithaopo, mohlala. 6",
      saveAndNext: "Boloka & Ye e latelago",
      invalidWeight: "Tsenya boima bjo bo nepagetšego ka kg",
      invalidConditionScore: "Peakanyo ya seemo e swanetše go ba 1-9",
    },
    weightAndTreatment: {
      step1: "1. Rekhota Boima",
      step2: "2. Kgetha Kalafo",
      weightLabel: "Boima (kg)",
      conditionScoreLabel: "Peakanyo ya Seemo (1-9)",
      noProtocols: "Ga go na diprothokholo tše di šomago",
      manageProtocols: "Laola Diprothokholo",
      changeProtocol: "Fetola Prothokholo",
      saveBoth: "Boloka ka Bobedi & Ye e latelago",
      calculatedDosage: {
        title: "Kelo e Baletšwego",
        atWeight: "Ka {{weight}} kg:",
        give: "Fa: {{ml}} ml",
      },
      required: "Kgetha prothokholo ya kalafo",
    },
    condition: {
      labels: {
        thin: "E otile",
        moderate: "Magareng",
        fat: "E nonne",
      },
    },
    protocol: {
      title: "Kgetha Enti / Kalafo",
      product: "Setšweletšwa: {{name}}",
      standardDosage: "Kelo ya Motheo: {{dosage}}",
      method: "Mokgwa: {{method}}",
      withdrawal: "Go Emiša: matšatši a {{days}}",
      autoCalculated: {
        title: "Kelo e Baletšwego ka Boitshepelo",
        lastWeight: "Boima bja mafelelo: {{weight}} kg",
        give: "Fa: {{ml}} ml",
        based: "Go ya ka {{ml}}ml go {{kg}}kg",
      },
      manualDosage: "Go nyakega kelo ya seatla - prothokholo ga e laetše kelo ka kg",
      noWeight: {
        title: "Ga go na Boima bjo bo Ngwadilwego",
        message: "Kala phoofolo ye pele bakeng sa palo ya kelo ye e nepagetšego",
      },
      changeProtocol: "Fetola Prothokholo",
      apply: "Diriša",
      applyAndNext: "Diriša & Ye e latelago",
    },
  },
  pasturesScreen: {
    title: "Phetogo ya Mafulo",
    createButton: "+ E Mpsha",
    locked: {
      title: "Phetogo ya Mafulo",
      description:
        "Beakanya mafulo, abela mehlape, gomme o latelele matšatši a go fula go kaonafatša mafulo le maphelo a mobu.",
      proBadge: "PRO",
      upgradeButton: "Kaonafatšetša go Pro",
    },
    stats: {
      pastures: "Mafulo",
      animals: "Diphoofolo",
      occupied: "A dirišwa",
    },
    card: {
      animals: "Diphoofolo",
      daysGrazed: "Matšatši a Go Fula",
      daysUntilRotation: "matšatši a {{days}} go fihla phetogong",
    },
    empty: {
      title: "Ga go na Mafulo go Fihla Bjale",
      description: "Re tla go hlahla ka go hlama lefulo la gago la mathomo ka magato a 3 fela",
      button: "Thoma →",
    },
  },
  animalDetailScreen: {
    rescan: {
      scanning: "Go a skena...",
      rfidLabel: "Skena tagi ya RFID gape",
      saveFailed: "Ga se ya kgona go boloka tagi e skennwego. Hle leka gape.",
    },
    loading: "Go a laiša...",
    notFound: "Phoofolo ga se ya hwetšwa",
    backButton: "Morago",
    editButton: "Fetola",
    deleteButton: "Phumola Phoofolo",
    tabs: {
      overview: "Kakaretšo",
      health: "Maphelo",
      vaccinations: "Dienti",
      weight: "Boima",
      breeding: "Tswalo",
    },
    overview: {
      rfidTag: "Tagi ya RFID",
      visualTag: "Tagi ya Ponagalo",
      dateOfBirth: "Letšatši la Matswalo",
      registrationNumber: "Nomoro ya Ngwadišo",
      notes: "Dintlha",
      noValue: "—",
    },
    health: {
      addButton: "+ Oketša Rekhoto ya Maphelo",
      empty: "Ga go na direkhoto tša maphelo go fihla bjale.",
      product: "Setšweletšwa: {{product}}",
      recordedBy: "E ngwadilwe ke {{name}}",
    },
    weight: {
      addButton: "+ Oketša Rekhoto ya Boima",
      empty: "Ga go na direkhoto tša boima go fihla bjale.",
      weightValue: "{{weight}} kg",
      condition: "Seemo: {{score}}/9",
      recordedBy: "E ngwadilwe ke {{name}}",
    },
    breeding: {
      addButton: "+ Oketša Rekhoto ya Tswalo",
      empty: "Ga go na direkhoto tša tswalo go fihla bjale.",
      bred: "E tswaditšwe: {{date}}",
      expectedCalving: "Go belega mo go letetšwego: {{date}}",
      recordedBy: "E ngwadilwe ke {{name}}",
    },
  },
  animalFormScreen: {
    title: {
      edit: "Fetola Phoofolo",
      add: "Oketša Phoofolo",
    },
    farmLabel: "Polasa:",
    helperNote: "* Bonyane tagi e tee (RFID goba Ponagalo) e a nyakega",
    fields: {
      rfidTag: {
        label: "Tagi ya RFID",
        placeholder: "Tsenya nomoro ya tagi ya RFID",
        scanPlaceholder: "Goga sekgohli go skena tagi ya RFID",
        helpText:
          "Tagi ya elektroniki e tsentšwego taging ya tsebe - Leano la Kgwebo le akaretša thekgo ya seskenara sa RFID",
        scanning: "Goga sekgohli go skena...",
      },
      visualTag: {
        label: "Tagi ya Ponagalo (tagi ya tsebe/leswao)",
        placeholder: "Nomoro ya tagi ya tsebe goba leswao",
        helpText: "Diriša konope ya seskenara sa khamera go bala dinomoro tša ditagi ka boitshepelo go tšwa diswantšhong",
      },
      name: {
        label: "Leina (ka boithaopo)",
        placeholder: "Leina la phoofolo",
      },
      photos: {
        label: "Diswantšho (bakeng sa go tsebja)",
      },
      breed: {
        label: "Mohuta *",
        placeholder: "Kgetha mohuta",
      },
      sex: {
        label: "Bong *",
        options: {
          male: "Poo",
          female: "Kgomo ya Tshadi",
          castrated: "Pholo/Kgabo",
          unknown: "Ga se tsebje",
        },
      },
      vaccinationsUpToDate: {
        label: "Dienti di lokile go fihla bjale",
        helpOn:
          "Ke dienti tša ka moso tše di tla beakanywago fela. Tima ge phoofolo ye e sa nyaka dienti tša yona tša pele.",
        helpOff: "Dienti dife goba dife tšeo phoofolo ye e šego ya di hwetša di tla oketšwa bjalo ka tše di fetilego nako.",
      },
      dateOfBirth: {
        label: "Letšatši la Matswalo",
        placeholder: "LL/KK/NNNN",
      },
      registrationNumber: {
        label: "Nomoro ya Ngwadišo",
        placeholder: "Ka boithaopo",
      },
      herdTag: {
        label: "Tagi ya Mohlape/Sehlopha",
        placeholder: "mohlala. 23-C, XYZ, Sehlopha A (ka boithaopo)",
      },
      notes: {
        label: "Dintlha",
        placeholder: "Dintlha dife goba dife tša tlaleletšo...",
      },
      tags: {
        label: "Ditagi",
        placeholder: "Oketša ditagi (mohlala. Diruiwa tša Tswalo, tša Thekišo...)",
      },
    },
    lineage: {
      title: "Leloko (ka boithaopo)",
      helpText: "Latelela ditshika bakeng sa mananeo a tswalo le ditokumente tša pedigri",
      sire: {
        label: "Poo (Tate)",
        placeholder: "+ Oketša poo",
        noMales: "Oketša diphoofolo tša banna mohlapeng wa gago pele go kgetha bjalo ka dipoo",
      },
      dame: {
        label: "Kgomo ya Tshadi (Mma)",
        placeholder: "+ Oketša kgomo ya tshadi",
        noFemales: "Oketša diphoofolo tša basadi mohlapeng wa gago pele go kgetha bjalo ka dikgomo tša tshadi",
      },
    },
    buttons: {
      cancel: "Khansela",
      save: "Boloka Diphetogo",
      add: "Oketša Phoofolo",
      saving: "Go a boloka...",
    },
    modals: {
      breed: {
        title: "Kgetha Mohuta",
        cancel: "Khansela",
      },
      sex: {
        title: "Kgetha Bong",
        cancel: "Khansela",
      },
      sire: {
        title: "Kgetha Poo",
        searchPlaceholder: "Nyaka ka leina goba tagi...",
        empty: "Ga go na dipoo tše di hweditšwego",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Khansela",
      },
      dame: {
        title: "Kgetha Kgomo ya Tshadi",
        searchPlaceholder: "Nyaka ka leina goba tagi...",
        empty: "Ga go na dikgomo tša tshadi tše di hweditšwego",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Khansela",
      },
    },
    alerts: {
      animalLimit: {
        title: "Tekanyo ya Mahala e Fihleletšwe",
        message:
          "O fihleletše tekanyo ya leano la gago la diphoofolo tše {{limit}}. Kaonafatša bakeng sa tekanyo ye kgolo — elemente e nngwe le e nngwe e šetše e akareditšwe.",
        upgrade: "Kaonafatša",
      },
      validation: {
        duplicateTag: {
          title: "Tagi ye e Boeleditšwego",
          visualMessage:
            'Tagi ya ponagalo "{{tag}}" e šetše e dirišwa ke {{name}}. Hle diriša tagi ye e ikgethilego.',
          rfidMessage: 'Tagi ya RFID "{{tag}}" e šetše e dirišwa ke {{name}}. Hle diriša tagi ye e ikgethilego.',
        },
        tagRequired: {
          title: "Go a nyakega",
          message: "Hle tsenya Tagi ya RFID goba Tagi ya Ponagalo (bonyane e tee e a nyakega)",
        },
        breedRequired: {
          title: "Go a nyakega",
          message: "Mohuta o a nyakega",
        },
        noOrganization: {
          title: "Phošo",
          message: "Ga go na mokgatlo o kgethilwego",
        },
      },
      saveError: {
        title: "Phošo",
        message: "Go paletšwe go boloka phoofolo. Hle leka gape.",
      },
    },
  },
  bulkAnimalAddScreen: {
    title: {
      setup: "Oketša ka Bontši",
      entry: "Oketša ka Lebelo",
    },
    setup: {
      helpText:
        "Beakanya mašeleng a tlwaelegilego gatee, ke moka o skene ditagi ka lebelo bakeng sa diphoofolo tše ntši tše di nago le dipharologantšho tše di swanago.",
      sectionTitle: "Mašeleng a Tlwaelegilego (a šoma go diphoofolo ka moka)",
      tagTypeLabel: "Mohuta wa Tagi",
      tagTypeModalTitle: "Kgetha Mohuta wa Tagi",
      tagType: {
        visual: "Tagi ya Ponagalo (Tagi ya Tsebe)",
        rfid: "Tagi ya RFID",
      },
      tagTypeDescription: {
        visual: "Nomoro ya tagi ya kgonthe yeo e bonagalago godimo ga phoofolo",
        rfid: "Nomoro ya tagi ya elektroniki ya RFID",
      },
      labelPrefixLabel: "Leswao/Sethomi sa Tagi (ka boithaopo)",
      labelPrefixPlaceholder: "mohlala. BRN, COW, 2024-",
      labelPrefixHelper: "Se se tla oketšwa pele ga nomoro e nngwe le e nngwe ya tagi",
      pastureLabel: "Lefulo/Sehlopha sa Bjale (ka boithaopo)",
      pasturePlaceholder: "+ Kgetha lefulo",
      pastureModalTitle: "Kgetha Lefulo",
      noPastures: "Ga go na mafulo a hweditšwego",
      notesLabel: "Sebopego sa Dintlha (ka boithaopo)",
      notesPlaceholder: "Se šoma go diphoofolo ka moka ka gare ga sehlopha se...",
      startButton: "Thoma go Tsenya ka Lebelo",
    },
    entry: {
      countLabel: "{{count}} di Oketšwe",
      tagLabel: "Skena goba Tsenya Tagi",
      tagPlaceholder: "Tagi ya tsebe goba RFID",
      weightLabel: "Boima (ka boithaopo)",
      weightPlaceholder: "kg",
      photoLabel: "Seswantšho (ka boithaopo)",
      addButton: "Oketša Phoofolo",
      adding: "Go a oketša...",
      recentTitle: "Tše di Oketšwego Morago Bjale",
    },
    alerts: {
      breedRequired: {
        title: "Go a nyakega",
        message: "Mohuta o a nyakega pele ga go thoma go tsenya ka bontši",
      },
      tagRequired: {
        title: "Go a nyakega",
        message: "Hle tsenya nomoro ya tagi (Ponagalo goba RFID)",
      },
      noOrganization: {
        message: "Ga go na mokgatlo o kgethilwego",
      },
      addError: {
        message: "Go paletšwe go oketša phoofolo. Hle leka gape.",
      },
      finish: {
        title: "Fetša go Oketša ka Bontši?",
        message: "O oketša diphoofolo tše {{count}}. O loketše go fetša?",
        cancel: "Tšwela pele go Oketša",
        confirm: "Go feditšwe",
      },
    },
  },
  teamScreen: {
    title: "Sehlopha",
    loading: "Go a laiša...",
    inviteButton: "+ Laletša",
    inviteForm: {
      title: "Laletša Setho sa Sehlopha",
      methodLabel: "Romela ka",
      methodEmail: "Imeile",
      methodSMS: "SMS",
      methodWhatsApp: "WhatsApp",
      emailLabel: "Aterese ya Imeile",
      emailPlaceholder: "mošomi@mohlala.com",
      phoneLabel: "Nomoro ya Mogala",
      phonePlaceholder: "+27 82 123 4567",
      roleLabel: "Mošomo",
      roles: {
        admin: "Molaodi",
        worker: "Mošomi",
      },
      roleAdmin: "Molaodi",
      roleWorker: "Mošomi",
      sendButton: "Romela Taletšo",
      sending: "Go a romela...",
      cancelButton: "Khansela",
      errors: {
        contactRequired: "Tshedimošo ya boikgokaganyo e a nyakega",
        emailRequired: "Aterese ya imeile e a nyakega",
        invalidEmail: "Hle tsenya aterese ya imeile ye e nepagetšego",
        invalidPhone: "Hle tsenya nomoro ya mogala ye e nepagetšego",
        failedToSend: "Go paletšwe go romela taletšo. Hle leka gape.",
      },
    },
    alerts: {
      inviteSent: {
        title: "Taletšo e Rometšwe",
        message: "Taletšo e rometšwe go {{contact}} ka {{method}}. Khoutu ya taletšo: {{code}}",
        ok: "Go lokile",
      },
      cancelInvite: {
        title: "Khansela Taletšo",
        message: "Khansela taletšo ya {{email}}?",
        no: "Aowa",
        yes: "Ee, Khansela",
      },
      changeRole: {
        title: "Fetola Mošomo",
        message: "Fetola mošomo wa {{name}} go ba {{role}}?",
        cancel: "Khansela",
        change: "Fetola Mošomo",
      },
      removeMember: {
        title: "Tloša Setho",
        message: "Tloša {{name}} sehlopheng sa gago? Ba tla lahlegelwa ke phihlelelo ya mokgatlo wo.",
        cancel: "Khansela",
        remove: "Tloša",
      },
      error: {
        title: "Phošo",
        sendFailed: "Go paletšwe go romela taletšo. Hle leka gape.",
        cancelInviteFailed: "Go paletšwe go khansela taletšo.",
        updateRoleFailed: "Go paletšwe go fetola mošomo.",
        removeMemberFailed: "Go paletšwe go tloša setho sa sehlopha.",
      },
    },
    sections: {
      members: "Ditho tša Sehlopha ({{count}})",
      invites: "Ditaletšo tše di Emetšego ({{count}})",
    },
    member: {
      you: " (wena)",
      joined: "O tsene ka {{date}}",
      roleAdmin: "Molaodi",
      roleWorker: "Mošomi",
    },
    invite: {
      code: "Khoutu: {{code}}",
      expires: "E felela {{date}}",
      cancelButton: "Khansela",
    },
    noAccess: "Ke balaodi fela bao ba ka laolago ditho tša sehlopha",
    syncNotice: {
      title: "Go a Nyakega Kopanyo",
      text: "Diphetogo tša sehlopha di nyaka kopanyo go šoma go didirišwa ka moka.",
      button: "Kopanya Bjale",
    },
  },
  treatmentProtocolsScreen: {
    title: "Diprothokholo tša Kalafo",
    createButton: "+ E Mpsha",
    filters: {
      all: "Tšohle",
      vaccination: "Enti",
      treatment: "Kalafo",
      deworming: "Go bolaya diboko",
      other: "Tše dingwe",
    },
    count_one: "Prothokholo e {{count}}",
    count_other: "Diprothokholo tše {{count}}",
    inactive: "Ga e šome",
    withdrawal: "Go Emiša: matšatši a {{days}}",
    empty: {
      title: "Ga go na Diprothokholo tše di Hweditšwego",
      noProtocols: "Hlama prothokholo ya gago ya mathomo ya kalafo go e diriša ka Mokgweng wa Sekgoro",
      filtered: "Ga go na diprothokholo tša {{filter}} tše di hweditšwego",
      showAll: "Bontšha Tšohle",
      loadDefaults: "Laiša Ditlwaelo tša SA",
      createButton: "Hlama Prothokholo",
    },
    alerts: {
      toggleError: "Go paletšwe go fetola seemo sa prothokholo",
      defaultsAdded: "Diprothokholo tše {{count}} di oketšwe ka katlego",
    },
  },
  healthRecordFormScreen: {
    title: "Rekhoto ya Maphelo",
    cancelButton: "Khansela",
    typeLabel: "Mohuta",
    recordTypes: {
      vaccination: "enti",
      treatment: "kalafo",
      vet_visit: "leeto la ngaka ya diphoofolo",
      condition_score: "peakanyo ya seemo",
      other: "tše dingwe",
      vaccinationPro: "enti (PRO)",
    },
    protocol: {
      selectButton_one: "Kgetha go tšwa prothokholong e {{count}} e bolokilwego",
      selectButton_other: "Kgetha go tšwa diprothokholong tše {{count}} tše di bolokilwego",
      selectedDetail: "{{productName}} • {{dosage}}",
      noProtocols: "Ga go na diprothokholo tše di hweditšwego. Hlama e nngwe go Dipeakanyo → Diprothokholo tša Kalafo",
    },
    fields: {
      description: {
        label: "Tlhaloso *",
        placeholder: "Go dirilwe eng?",
      },
      productName: {
        label: "Leina la Setšweletšwa",
        placeholder: "mohlala. Covexin 10",
      },
      dosage: {
        label: "Kelo",
        placeholder: "mohlala. 2ml SC",
      },
      administeredBy: {
        label: "E Filwe ke",
        placeholder: "Ka boithaopo",
      },
      notes: {
        label: "Dintlha",
        placeholder: "Dintlha tša tlaleletšo...",
      },
      photos: {
        label: "Diswantšho (Ka boithaopo)",
      },
    },
    buttons: {
      save: "Boloka Rekhoto",
      saving: "Go a boloka...",
    },
    alerts: {
      required: {
        title: "Go a nyakega",
        message: "Tlhaloso e a nyakega",
      },
      noOrganization: {
        title: "Phošo",
        message: "Ga go na mokgatlo o kgethilwego",
      },
      saveError: {
        title: "Phošo",
        message: "Go paletšwe go boloka rekhoto ya maphelo",
      },
    },
  },
  weightRecordFormScreen: {
    title: "Rekhoto ya Boima",
    cancelButton: "Khansela",
    fields: {
      weight: {
        label: "Boima (kg) *",
        placeholder: "mohlala. 450",
      },
      conditionScore: {
        label: "Peakanyo ya Seemo (1-9)",
        placeholder: "Ka boithaopo, mohlala. 6",
      },
      notes: {
        label: "Dintlha",
        placeholder: "Dintlha tša tlaleletšo...",
      },
      photos: {
        label: "Diswantšho (Ka boithaopo)",
      },
    },
    buttons: {
      save: "Boloka Rekhoto",
      saving: "Go a boloka...",
    },
    alerts: {
      invalidWeight: {
        title: "Ga e a Nepagala",
        message: "Hle tsenya boima bjo bo nepagetšego ka kg",
      },
      invalidConditionScore: {
        title: "Ga e a Nepagala",
        message: "Peakanyo ya seemo e swanetše go ba magareng ga 1 le 9",
      },
      noOrganization: {
        title: "Phošo",
        message: "Ga go na mokgatlo o kgethilwego",
      },
      saveError: {
        title: "Phošo",
        message: "Go paletšwe go boloka rekhoto ya boima",
      },
    },
  },
  breedingRecordFormScreen: {
    title: "Rekhoto ya Tswalo",
    cancelButton: "Khansela",
    methodLabel: "Mokgwa",
    methods: {
      natural: "tlhago",
      ai: "ai",
      embryo_transfer: "phetišetšo ya embriyo",
    },
    outcomeLabel: "Sephetho",
    outcomes: {
      pending: "se emetšego",
      live_calf: "namane e phelago",
      stillborn: "e belegwe e hwile",
      aborted: "go folotšwe",
      open: "e bulegile",
    },
    fields: {
      notes: {
        label: "Dintlha",
        placeholder: "Dintlha tša tlaleletšo...",
      },
      photos: {
        label: "Diswantšho (Ka boithaopo)",
      },
    },
    buttons: {
      save: "Boloka Rekhoto",
      saving: "Go a boloka...",
    },
    alerts: {
      noOrganization: {
        title: "Phošo",
        message: "Ga go na mokgatlo o kgethilwego",
      },
      saveError: {
        title: "Phošo",
        message: "Go paletšwe go boloka rekhoto ya tswalo",
      },
    },
  },
  calendarScreen: {
    badges: {
      overdue: "E fetile nako",
      soon: "Kgauswinyane",
    },
    tagPrefix: "Tagi: {{tag}}",
    title: "Khalentara",
    unknownVaccination: "Enti e sa Tsebjego",
    filters: {
      all: "Tšohle",
      today: "Lehono",
      week: "Beke Ye",
      month: "Kgwedi Ye",
    },
    empty: {
      title: "Ga go na Ditiragalo tša ka Moso",
      allCaughtUp: "O feditše tšohle!",
      today: "Ga go na ditiragalo lehono",
      week: "Ga go na ditiragalo beke ye",
      month: "Ga go na ditiragalo kgwedi ye",
    },
    manage: {
      action: "Laola",
      title: "Laola",
      setUp: "Beakanya",
      schedules: "Ditšhenyulo tša Dienti",
      schedulesHelp: "Beakanya dikgopotšo tša dienti tša boitshepelo bakeng sa mohlape wa gago",
      protocols: "Dienti",
      protocolsHelp: "Ditšweletšwa tšeo o di dirišago — kelo, mokgwa le nako ya go emiša",
    },
  },
  vaccinationScheduleForm: {
    protocolPicker: {
      title: "Kgetha Enti",
      search: "Nyaka dienti...",
      createNew: "+ Hlama Enti e Mpsha",
      emptyTitle: "Ga go na dienti go fihla bjale",
      emptyHelp:
        "Oketša enti yeo o e dirišago — leina la setšweletšwa, kelo le nako ya go emiša — ke moka o ka e beakanya.",
      noMatches: "Ga go na dienti tše di sepelelanago le nyako ya gago",
    },
    scheduleTypes: {
      ageBased: "Ka mengwaga e itšego",
      ageBasedHelp: "mohlala. enti ya mathomo ya FMD ka dikgwedi tše 4",
      dateBased: "Ka letšatši le le beilwego",
      dateBasedHelp: "mohlala. Agostose e nngwe le e nngwe, pele ga dipula",
      groupBased: "Ka lešaka goba lefulo",
      groupBasedHelp: "mohlala. tšohle tša lešaka la leboa, dikgwedi tše 6 tše dingwe le tše dingwe",
    },
    sex: {
      all: "Tšohle",
    },
    errors: {
      nameRequired: "Leina la tšhenyulo le a nyakega",
      protocolRequired: "Hle kgetha enti",
      targetAgeRequired: "Mengwaga ye e nepišitšwego e a nyakega ge o beakanya ka mengwaga",
      dateRequired: "Letšatši le a nyakega ge o beakanya ka letšatši",
      groupRequired: "Lefulo le sebaka di a nyakega ge o beakanya ka sehlopha",
    },
  },
  vaccinationScheduleScreen: {
    title: "Ditšhenyulo tša Dienti",
    createButton: "+ E Mpsha",
    count: "Ditšhenyulo tše {{count}}",
    filters: {
      all: "Tšohle",
      ageBased: "Go ya ka mengwaga",
      dateBased: "Go ya ka letšatši",
      groupBased: "Go ya ka sehlopha",
    },
    badges: {
      inactive: "Ga e šome",
    },
    details: {
      booster: "dikelo tše {{count}}, matlafatšo ka morago ga matšatši a {{days}}",
    },
    empty: {
      title: "Ga go na Ditšhenyulo tša Dienti",
      noFilter: "Hlama ditšhenyulo go dira dikgopotšo tša dienti ka boitshepelo go ya ka mengwaga, letšatši, goba sehlopha.",
      withFilter: "Ga go na ditšhenyulo tša {{filter}} tše di hweditšwego.",
      showAllButton: "Bontšha Tšohle",
      createButton: "Hlama Tšhenyulo",
    },
    alerts: {
      toggleError: {
        title: "Phošo",
        message: "Go paletšwe go fetola seemo sa tšhenyulo",
      },
      deleteConfirm: {
        title: "Phumola Tšhenyulo",
        message:
          "Phumola tšhenyulo ya dienti ya '{{name}}'? Se se ka se ame direkhoto tša maphelo tše di lego gona.",
      },
      deleteError: {
        title: "Phošo",
        message: "Go paletšwe go phumola tšhenyulo",
      },
    },
  },
  biometricLock: {
    title: "HerdTrackr e notletšwe",
    prompt: "Notlolla HerdTrackr",
    unlockButton: "Notlolla",
  },
}

export default nso
export type Translations = typeof nso
