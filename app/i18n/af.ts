const af = {
  common: {
    ok: "OK",
    cancel: "Kanselleer",
    back: "Terug",
    save: "Stoor",
    delete: "Verwyder",
    edit: "Wysig",
    add: "Voeg by",
    done: "Klaar",
    search: "Soek",
    logOut: "Teken uit",
    next: "Volgende",
    skip: "Slaan oor",
    loading: "Laai...",
    required: "Verpligtend",
    optional: "opsioneel",
    error: "Fout",
    notFound: "Nie gevind nie",
    failedToLoad: "Kon nie data laai nie",
  },
  errors: {
    invalidEmail: "Ongeldige e-posadres.",
    somethingWentWrong: "Iets het verkeerd geloop!",
    tryAgain: "Probeer asseblief weer.",
  },
  errorScreen: {
    title: "Iets het verkeerd geloop!",
    friendlySubtitle:
      "'n Onverwagte fout het voorgekom. Probeer asseblief om die toepassing te herbegin. As die probleem voortduur, kontak ondersteuning.",
    reset: "HERSTEL TOEPASSING",
    traceTitle: "Fout vanaf {{name}} stapel",
  },
  emptyStateComponent: {
    generic: {
      heading: "Nog niks hier nie",
      content: "Geen data gevind nie. Voeg rekords by om te begin.",
      button: "Verfris",
    },
  },
  authScreen: {
    title: "HerdTrackr",
    subtitle: "Bestuur jou vee met gemak",
    formTitle: "Teken in met jou e-pos",
    formSubtitle: "Ons stuur jou 'n 7-syfer kode - geen wagwoord nodig nie!",
    emailLabel: "E-posadres",
    emailPlaceholder: "boer@voorbeeld.com",
    sendCode: "Stuur Kode",
    sending: "Stuur tans...",
    enterCode: "Voer Kode In",
    checkEmail: "Kyk in jou e-pos vir die 7-syfer kode",
    sentTo: "Gestuur na",
    codeLabel: "7-Syfer Kode",
    codePlaceholder: "0000000",
    verifyCode: "Verifieer Kode",
    verifying: "Verifieer tans...",
    didntReceive: "Het jy nie die kode ontvang nie?",
    resend: "Stuur weer",
    termsNotice: "Deur voort te gaan, stem jy in tot ons Diensbepalings",
    benefits: {
      title: "Wat jy kan doen:",
      animals: "Hou diere, gesondheid en teling dop",
      pastures: "Bestuur weivelde en rotasies",
      team: "Nooi jou plaaswerkers uit",
      sync: "Sinchroniseer oor alle toestelle",
    },
  },
  dashboardScreen: {
    title: "Paneelbord",
    welcomeBack: "Welkom terug, {{name}}",
    currentFarm: "Huidige Plaas",
    switchFarm: "Wissel Plaas",
    createNewFarm: "+ Skep Nuwe Plaas",
    setupCard: {
      title: "Welkom by HerdTrackr",
      subtitle: "Stel jou plaas op om jou kudde te begin bestuur.",
      button: "Stel Plaas Op",
    },
    stats: {
      totalHead: "Totale Koppe",
      active: "Aktief",
      dueToCalve: "Verwag om te Kalf",
      pendingSync: "Hangende Sinchronisering",
    },
    vaccinations: {
      title: "Inentings Verskuldig",
      overdue: "Agterstallig",
      dueToday: "Verskuldig Vandag",
      dueSoon: "Binnekort Verskuldig",
      viewAll: "Bekyk Alle Skedules",
    },
    reports: {
      title: "Verslae en Analise",
      description: "Bekyk kudde-prestasie, gewigstendense en telingverslae",
    },
    recentAnimals: {
      title: "Onlangse Diere",
      empty: "Nog geen diere nie. Gaan na die Kudde-oortjie om jou eerste dier by te voeg.",
    },
  },
  settingsScreen: {
    title: "Instellings",
    sections: {
      appearance: "VOORKOMS",
      language: "TAAL",
      account: "REKENING",
      subscription: "INTEKENING",
      management: "BESTUUR",
      rfidScanner: "RFID SKANDEERDER",
      dangerZone: "GEVAARSONE",
    },
    appearance: {
      darkMode: "Donker Modus",
      darkThemeEnabled: "Donker tema geaktiveer",
      lightThemeEnabled: "Ligte tema geaktiveer",
    },
    language: {
      appLanguage: "Toepassing Taal",
      current: "Huidig: {{language}}",
    },
    account: {
      notSignedIn: "Nie ingeteken nie",
      org: "Org: {{orgName}}",
      noOrg: "Geen",
      appLock: "Programslot",
      appLockHint: "Vereis Face ID of vingerafdruk om die program oop te maak",
    },
    subscription: {
      plans: {
        commercial: "Commercial",
        farm: "Farm",
        starter: "Starter",
      },
      status: {
        loading: "Laai...",
        commercialAccess: "Volle toegang + spanfunksies",
        farmAccess: "Premium funksies ontsluit",
        freeTier: "Gratis vlak",
      },
      badges: {
        com: "COM",
        farm: "FARM",
      },
      descriptions: {
        commercial: "Onbeperkte diere, plus elke kenmerk.",
        farm: "Onbeperkte diere, plus elke kenmerk.",
        starter:
          "Elke kenmerk is gratis ingesluit, vir tot 50 diere. Gradeer op vir onbeperkte diere.",
      },
      buttons: {
        manageSubscription: "Bestuur Intekening",
        viewPlans: "Bekyk Planne",
      },
    },
    management: {
      team: "Span",
      treatmentProtocols: "Behandelingsprotokolle",
      vaccinationSchedules: "Inentingskedules",
    },
    rfid: {
      connected: "Handskandeerder gekoppel",
      readerPower: "RFID-leeskrag",
      powerSaved: "Leeskrag gestel op {{power}} dBm",
      rangeHint:
        "{{min}}–{{max}} dBm. Hoër leeskrag kan verder lees, maar kan ook nabygeleë diere se etikette lees. Reikwydte is nie lineêr nie.",
      presets: {
        low: "Laag",
        med: "Med",
        high: "Hoog",
        max: "Maks",
      },
    },
    dangerZone: {
      resetTitle: "Herstel Plaaslike Databasis",
      resetDescription:
        "Vee ALLE plaaslike data uit. Gebruik slegs as jy van voor af begin nadat Supabase uitgevee is.",
      resetButton: "Vee Plaaslike Databasis Uit",
      alerts: {
        confirmTitle: "Herstel Plaaslike Databasis",
        confirmMessage:
          "Dit sal ALLE plaaslike data uitvee insluitend jou organisasie, diere en rekords. Dit kan nie ongedaan gemaak word nie!\\n\\nDoen dit slegs as jy van voor af begin nadat Supabase uitgevee is.",
        wipeButton: "VEE ALLES UIT",
        successTitle: "Sukses",
        successMessage: "Plaaslike databasis herstel! Herbegin asseblief die toepassing.",
        errorTitle: "Fout",
        errorMessage: "Kon nie databasis herstel nie: {{error}}",
      },
    },
    signOut: "Teken Uit",
    version: "HerdTrackr v0.1.0",
  },
  orgSetupScreen: {
    title: "HerdTrackr",
    subtitle: "Stel jou bedryf op",
    allSet: "Jy is gereed!",
    step1: {
      title: "Jou Plaas",
      description: "Vertel ons van jou bedryf. Dit skep jou werkspasie.",
      yourNameLabel: "Jou Naam *",
      yourNamePlaceholder: "bv. Jan Smit",
      farmNameLabel: "Plaas / Boerdery Naam *",
      farmNamePlaceholder: "bv. Sonop Vee, Bosveld Wildplaas",
      locationLabel: "Ligging (opsioneel)",
      locationPlaceholder: "bv. Limpopo, Vrystaat, KZN",
      ownerBadge: "Eienaar",
      alerts: {
        nameRequired: "Voer asseblief jou naam in",
        farmRequired: "Gee jou plaas of boerdery 'n naam",
      },
    },
    step2: {
      title: "Wat boer jy?",
      description: "Kies al die tipes diere wat jy bestuur.",
      livestock: {
        cattle: {
          label: "Beeste",
          desc: "Nguni, Bonsmara, Brahman, Angus...",
        },
        buffalo: {
          label: "Buffel",
          desc: "Kaapse buffel, waterbuffel",
        },
        horses: {
          label: "Perde",
          desc: "Boerperd, Nooitgedachter, Volbloed...",
        },
        sheep: {
          label: "Skape",
          desc: "Dorper, Merino, Damara, Dohne...",
        },
        goats: {
          label: "Bokke",
          desc: "Boer, Angora, Kalahari Red, Savanna...",
        },
        game: {
          label: "Wild",
          desc: "Springbok, Rooibok, Koedoe, Eland...",
        },
        pigs: {
          label: "Varke",
          desc: "Large White, Landras, Duroc...",
        },
        poultry: {
          label: "Pluimvee",
          desc: "Boschveld, Koekoek, Rhode Island Red...",
        },
      },
      nextButton: "Volgende ({{count}} gekies)",
      alert: "Kies die tipes diere wat jy bestuur",
    },
    step3: {
      title: "Stel verstekrasse",
      description: "Kies jou mees algemene rasse. Jy kan dit altyd later verander.",
      breedLabel: "{{livestock}} ras",
    },
    step4: {
      title: "Vertel ons van jou kudde",
      description: "Dit help ons om die ervaring vir jou bedryf aan te pas.",
      herdSizeLabel: "Geskatte kuddegrootte",
      herdSizes: {
        small: {
          label: "1 – 50",
          desc: "Kleinhoewe / beginner kudde",
        },
        medium: {
          label: "50 – 200",
          desc: "Medium bedryf",
        },
        large: {
          label: "200 – 500",
          desc: "Groot kommersieel",
        },
        xlarge: {
          label: "500+",
          desc: "Ondernemingskaal",
        },
      },
      purposeLabel: "Primêre doel (opsioneel)",
      purposes: {
        breeding: "Teling / Stoet",
        fattening: "Vetmaak / Voerkraal",
        dairy: "Suiwel",
        mixed: "Gemengde Boerdery",
        game: "Wildboerdery",
      },
      createButton: "Skep Plaas",
      creating: "Skep en sinchroniseer tans...",
      alert: "Kies jou geskatte kuddegrootte",
    },
    step5: {
      title: "{{farmName}} is gereed!",
      subtitle: "Wat wil jy eerste doen?",
      options: {
        addAnimals: {
          title: "Voeg my eerste diere by",
          description: "Registreer jou kudde een vir een of voer in vanaf 'n lys",
        },
        explore: {
          title: "Verken die toepassing",
          description: "Kyk rond en sien wat HerdTrackr kan doen",
        },
      },
    },
  },
  reportsScreen: {
    title: "Verslae",
    noAnimals: "Voeg diere by om verslae en analise te sien.",
    herdSummary: {
      title: "Kudde Opsomming",
      totalHead: "Totale Koppe",
    },
    bySex: {
      title: "Volgens Geslag",
    },
    byBreed: {
      title: "Volgens Ras",
    },
    records: {
      title: "Rekords",
      healthRecords: "Gesondheidsrekords",
      weightRecords: "Gewigsrekords",
      breedingRecords: "Telingrekords",
      avgWeight: "Gem. gewig",
      calvingSuccess: "Kalfsukses",
    },
    treatmentStats: {
      title: "Behandelingstatistiek",
      vaccinations: "Inentings",
      treatments: "Behandelings",
      deworming: "Ontwurming",
      totalHealthEvents: "Totale gesondheidsgebeure",
    },
    animalsNeedingAttention: {
      title: "Diere wat Aandag Benodig",
      count_one: "{{count}} dier benodig aandag",
      count_other: "{{count}} diere benodig aandag",
      monthsOld: "{{months}} maande oud",
      reasons: {
        noVaccinations: "Geen inentings aangeteken nie - kalwers moet teen 2 maande ingeënt word",
        needsBooster: "Mag versterkerskote benodig - tipies vereis teen 6 maande",
      },
    },
    exportButton: "Voer Kudde uit as CSV",
    traceability: {
      title: "Dier Naspeurbaarheidsverslae",
      description:
        "Genereer omvattende naspeurbaarheidsverslae vir individuele diere of groepe. Verslae sluit volledige geskiedenis in: gesondheidsrekords, gewigte, teling, bewegings en foto's.",
      selected: "{{count}} gekies",
      selectAll: "Kies Almal",
      clear: "Maak Skoon",
      generateButton: "Genereer en Deel Verslag",
      generating: "Genereer Verslag...",
      noSelection: "Kies asseblief ten minste een dier om 'n naspeurbaarheidsverslag te genereer.",
    },
  },
  herdListScreen: {
    title: "Kudde",
    addButton: "+ Voeg by",
    searchPlaceholder: "Soek volgens merker, naam of ras...",
    count_one: "{{count}} dier",
    count_other: "{{count}} diere",
    tag: "Merker: {{tag}}",
    breedAndSex: "{{breed}} | {{sex}}",
    empty: {
      loading: "Laai...",
      title: "Begin Bou aan Jou Kudde",
      description:
        "Voeg jou eerste dier by om gesondheidsrekords, gewigte, teling en meer dop te hou.",
      onboarding: {
        step1: {
          title: "Voeg Dierbesonderhede By",
          description: "Voer merkernommer, ras, geslag en opsionele foto in",
        },
        step2: {
          title: "Hou Alles Dop",
          description: "Teken behandelings, gewigte, teling en bewegings aan",
        },
        step3: {
          title: "Voer Verslae Uit",
          description: "Genereer voldoeningsgereed verslae vir verkope en oudits",
        },
      },
      button: "Voeg Jou Eerste Dier By",
      tip: "Wenk: Gebruik die kamera-skandeerder om oormerkernommers outomaties te lees",
    },
  },
  chuteScreen: {
    title: "Drukgang Modus",
    selectMode: "Kies wat jy vandag aanteken",
    modes: {
      weight: {
        title: "Weeg",
        description: "Teken gewig en opsionele kondisietelling aan",
        sessionTitle: "Weeg Sessie",
      },
      protocol: {
        title: "Ent in / Behandel",
        description: "Pas inenting- of behandelingsprotokolle toe met outomaties-berekende dosisse",
        sessionTitle: "Ent in / Behandel Sessie",
      },
      weightAndTreatment: {
        title: "Weeg + Behandel",
        description: "Teken gewig aan en pas protokol in een keer toe",
        sessionTitle: "Weeg + Behandel Sessie",
      },
      condition: {
        title: "Kondisietelling",
        description: "Teken liggaamskondisietellings aan",
        sessionTitle: "Kondisietelling Sessie",
      },
    },
    session: {
      processed: "{{count}} verwerk",
      previousSession: "Vorige sessie: {{count}} verwerk",
      endSession: "Eindig Sessie",
    },
    scan: {
      title: "SKANDEER MERKER",
      placeholder: "Voer merker in of gebruik kamera",
      lookUp: "Soek Op",
      searching: "Soek tans...",
      notFound: 'Geen dier gevind met merker "{{tag}}" nie. Voeg dit eers by in die Kudde-oortjie.',
      scanning: "Skandeer tans...",
      pullTrigger: "Trek sneller om merker te skandeer",
      orManualEntry: "Of voer handmatig hieronder in:",
    },
    animalInfo: {
      rfid: "RFID",
      visualTag: "Visuele Merker",
      dob: "Geb. Datum",
      lastWeight: "Laaste Gewig",
      lastWeightValue: "{{weight}} kg",
    },
    weight: {
      previousWeight: "Vorige gewig:",
      weightValue: "{{weight}} kg",
      newWeightLabel: "Nuwe Gewig (kg)",
      weightPlaceholder: "bv. 450",
      conditionScoreLabel: "Kondisietelling (1-9)",
      conditionScorePlaceholder: "Opsioneel, bv. 6",
      saveAndNext: "Stoor en Volgende",
      invalidWeight: "Voer 'n geldige gewig in kg in",
      invalidConditionScore: "Kondisietelling moet 1-9 wees",
    },
    weightAndTreatment: {
      step1: "1. Teken Gewig Aan",
      step2: "2. Kies Behandeling",
      weightLabel: "Gewig (kg)",
      conditionScoreLabel: "Kondisietelling (1-9)",
      noProtocols: "Geen aktiewe protokolle beskikbaar nie",
      manageProtocols: "Bestuur Protokolle",
      changeProtocol: "Verander Protokol",
      saveBoth: "Stoor Albei en Volgende",
      calculatedDosage: {
        title: "Berekende Dosis",
        atWeight: "By {{weight}} kg:",
        give: "Gee: {{ml}} ml",
      },
      required: "Kies 'n behandelingsprotokol",
    },
    condition: {
      labels: {
        thin: "Maer",
        moderate: "Matig",
        fat: "Vet",
      },
    },
    protocol: {
      title: "Kies Inenting / Behandeling",
      product: "Produk: {{name}}",
      standardDosage: "Standaard Dosis: {{dosage}}",
      method: "Metode: {{method}}",
      withdrawal: "Onttrekking: {{days}} dae",
      autoCalculated: {
        title: "Outomaties-Berekende Dosis",
        lastWeight: "Laaste gewig: {{weight}} kg",
        give: "Gee: {{ml}} ml",
        based: "Gebaseer op {{ml}}ml per {{kg}}kg",
      },
      manualDosage: "Handmatige dosis benodig - protokol spesifiseer nie tempo per kg nie",
      noWeight: {
        title: "Geen Gewig op Rekord nie",
        message: "Weeg hierdie dier eers vir akkurate dosisberekening",
      },
      changeProtocol: "Verander Protokol",
      apply: "Pas Toe",
      applyAndNext: "Pas Toe en Volgende",
    },
  },
  pasturesScreen: {
    title: "Weiveldrotasie",
    createButton: "+ Nuut",
    locked: {
      title: "Weiveldrotasie",
      description:
        "Karteer kampe, ken kuddes toe en hou weidae dop om voer en grondgesondheid te optimaliseer.",
      proBadge: "PRO",
      upgradeButton: "Opgradeer na Pro",
    },
    stats: {
      pastures: "Weivelde",
      animals: "Diere",
      occupied: "Beset",
    },
    card: {
      animals: "Diere",
      daysGrazed: "Dae Gewei",
      daysUntilRotation: "{{days}} dae tot rotasie",
    },
    empty: {
      title: "Nog Geen Weivelde nie",
      description: "Ons sal jou lei deur die skep van jou eerste weiveld in net 3 maklike stappe",
      button: "Begin →",
    },
  },
  animalDetailScreen: {
    rescan: {
      scanning: "Besig om te skandeer...",
      rfidLabel: "Herskandeer RFID-etiket",
      saveFailed: "Kon nie die geskandeerde etiket stoor nie. Probeer asseblief weer.",
    },
    loading: "Laai...",
    notFound: "Dier nie gevind nie",
    backButton: "Terug",
    editButton: "Wysig",
    deleteButton: "Verwyder Dier",
    tabs: {
      overview: "Oorsig",
      health: "Gesondheid",
      vaccinations: "Inentings",
      weight: "Gewig",
      breeding: "Teling",
    },
    overview: {
      rfidTag: "RFID Merker",
      visualTag: "Visuele Merker",
      dateOfBirth: "Geboortedatum",
      registrationNumber: "Registrasie #",
      notes: "Notas",
      noValue: "—",
    },
    health: {
      addButton: "+ Voeg Gesondheidsrekord By",
      empty: "Nog geen gesondheidsrekords nie.",
      product: "Produk: {{product}}",
      recordedBy: "Aangeteken deur {{name}}",
    },
    weight: {
      addButton: "+ Voeg Gewigsrekord By",
      empty: "Nog geen gewigsrekords nie.",
      weightValue: "{{weight}} kg",
      condition: "Kondisie: {{score}}/9",
      recordedBy: "Aangeteken deur {{name}}",
    },
    breeding: {
      addButton: "+ Voeg Telingrekord By",
      empty: "Nog geen telingrekords nie.",
      bred: "Geteel: {{date}}",
      expectedCalving: "Verwagte kalwing: {{date}}",
      recordedBy: "Aangeteken deur {{name}}",
    },
  },
  animalFormScreen: {
    title: {
      edit: "Wysig Dier",
      add: "Voeg Dier By",
    },
    farmLabel: "Plaas:",
    helperNote: "* Ten minste een merker (RFID of Visueel) word vereis",
    fields: {
      rfidTag: {
        label: "RFID Merker",
        placeholder: "Voer RFID-merkernommer in",
        scanPlaceholder: "Trek sneller om RFID-merker te skandeer",
        helpText:
          "Elektroniese merker ingebed in oormerker - Commercial plan sluit RFID-skandeerderondersteuning in",
        scanning: "Trek sneller om te skandeer...",
      },
      visualTag: {
        label: "Visuele Merker (oormerker/brandmerk)",
        placeholder: "Oormerker- of brandmerknommer",
        helpText:
          "Gebruik kamera-skandeerderknoppie om merkernommers outomaties vanaf foto's te lees",
      },
      name: {
        label: "Naam (opsioneel)",
        placeholder: "Dier se naam",
      },
      photos: {
        label: "Foto's (vir identifikasie)",
      },
      breed: {
        label: "Ras *",
        placeholder: "Kies ras",
      },
      sex: {
        label: "Geslag *",
        options: {
          male: "Bul",
          female: "Koei",
          castrated: "Os",
          unknown: "Onbekend",
        },
      },
      vaccinationsUpToDate: {
        label: "Inentings op datum",
        helpOn:
          "Slegs toekomstige inentings sal geskeduleer word. Skakel af as hierdie dier nog sy vroeëre inspuitings benodig.",
        helpOff:
          "Enige inentings wat hierdie dier reeds gemis het, sal as agterstallig bygevoeg word.",
      },
      dateOfBirth: {
        label: "Geboortedatum",
        placeholder: "DD/MM/JJJJ",
      },
      registrationNumber: {
        label: "Registrasienommer",
        placeholder: "Opsioneel",
      },
      herdTag: {
        label: "Kudde/Groep Merker",
        placeholder: "bv. 23-C, XYZ, Groep A (opsioneel)",
      },
      notes: {
        label: "Notas",
        placeholder: "Enige addisionele notas...",
      },
      tags: {
        label: "Etikette",
        placeholder: "Voeg etikette by (bv. Teelvee, Vir Verkoop...)",
      },
    },
    lineage: {
      title: "Afkoms (opsioneel)",
      helpText: "Hou genetika dop vir telingsprogramme en stamboomdokumentasie",
      sire: {
        label: "Vaar (Vader)",
        placeholder: "+ Voeg vaar by",
        noMales: "Voeg eers manlike diere by jou kudde om as vare te kies",
      },
      dame: {
        label: "Moer (Moeder)",
        placeholder: "+ Voeg moer by",
        noFemales: "Voeg eers vroulike diere by jou kudde om as moere te kies",
      },
    },
    buttons: {
      cancel: "Kanselleer",
      save: "Stoor Veranderinge",
      add: "Voeg Dier By",
      saving: "Stoor tans...",
    },
    modals: {
      breed: {
        title: "Kies Ras",
        cancel: "Kanselleer",
      },
      sex: {
        title: "Kies Geslag",
        cancel: "Kanselleer",
      },
      sire: {
        title: "Kies Vaar",
        searchPlaceholder: "Soek volgens naam of merker...",
        empty: "Geen bulle gevind nie",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Kanselleer",
      },
      dame: {
        title: "Kies Moer",
        searchPlaceholder: "Soek volgens naam of merker...",
        empty: "Geen koeie gevind nie",
        rfidLabel: "RFID: {{tag}}",
        cancel: "Kanselleer",
      },
    },
    alerts: {
      animalLimit: {
        title: "Gratis Limiet Bereik",
        message:
          "Jy het jou plan se limiet van {{limit}} diere bereik. Gradeer op vir 'n hoër limiet — elke kenmerk is reeds ingesluit.",
        upgrade: "Gradeer Op",
      },
      validation: {
        duplicateTag: {
          title: "Dubbele Etiket",
          visualMessage:
            'Visuele etiket "{{tag}}" word reeds deur {{name}} gebruik. Gebruik asseblief \'n unieke etiket.',
          rfidMessage:
            'RFID-etiket "{{tag}}" word reeds deur {{name}} gebruik. Gebruik asseblief \'n unieke etiket.',
        },
        tagRequired: {
          title: "Verpligtend",
          message:
            "Voer asseblief óf 'n RFID-merker óf Visuele Merker in (ten minste een word vereis)",
        },
        breedRequired: {
          title: "Verpligtend",
          message: "Ras word vereis",
        },
        noOrganization: {
          title: "Fout",
          message: "Geen organisasie gekies nie",
        },
      },
      saveError: {
        title: "Fout",
        message: "Kon nie dier stoor nie. Probeer asseblief weer.",
      },
    },
  },
  bulkAnimalAddScreen: {
    title: {
      setup: "Grootmaat Byvoeg",
      entry: "Vinnige Byvoeg",
    },
    setup: {
      helpText:
        "Stel algemene velde een keer, skandeer dan vinnig merkers vir verskeie diere met dieselfde eienskappe.",
      sectionTitle: "Algemene Velde (van toepassing op alle diere)",
      tagTypeLabel: "Merker Tipe",
      tagTypeModalTitle: "Kies Merker Tipe",
      tagType: {
        visual: "Visuele Merker (Oormerker)",
        rfid: "RFID Merker",
      },
      tagTypeDescription: {
        visual: "Fisiese merkernommer sigbaar op die dier",
        rfid: "Elektroniese RFID-merkernommer",
      },
      labelPrefixLabel: "Etiket/Merker Voorvoegsel (opsioneel)",
      labelPrefixPlaceholder: "bv. BRN, COW, 2024-",
      labelPrefixHelper: "Dit sal voor elke merkernommer bygevoeg word",
      pastureLabel: "Huidige Weiveld/Groep (opsioneel)",
      pasturePlaceholder: "+ Kies weiveld",
      pastureModalTitle: "Kies Weiveld",
      noPastures: "Geen weivelde gevind nie",
      notesLabel: "Notas Sjabloon (opsioneel)",
      notesPlaceholder: "Geld vir alle diere in hierdie groep...",
      startButton: "Begin Vinnige Invoer",
    },
    entry: {
      countLabel: "{{count}} Bygevoeg",
      tagLabel: "Skandeer of Voer Merker In",
      tagPlaceholder: "Oormerker of RFID",
      weightLabel: "Gewig (opsioneel)",
      weightPlaceholder: "kg",
      photoLabel: "Foto (opsioneel)",
      addButton: "Voeg Dier By",
      adding: "Voeg by...",
      recentTitle: "Onlangs Bygevoeg",
    },
    alerts: {
      breedRequired: {
        title: "Verpligtend",
        message: "Ras word vereis voordat grootmaat-invoer begin",
      },
      tagRequired: {
        title: "Verpligtend",
        message: "Voer asseblief 'n merkernommer in (Visueel of RFID)",
      },
      noOrganization: {
        message: "Geen organisasie gekies nie",
      },
      addError: {
        message: "Kon nie dier byvoeg nie. Probeer asseblief weer.",
      },
      finish: {
        title: "Voltooi Grootmaat Byvoeg?",
        message: "Jy het {{count}} diere bygevoeg. Gereed om te voltooi?",
        cancel: "Hou Aan Byvoeg",
        confirm: "Klaar",
      },
    },
  },
  teamScreen: {
    title: "Span",
    loading: "Laai...",
    inviteButton: "+ Nooi Uit",
    inviteForm: {
      title: "Nooi Spanlid Uit",
      methodLabel: "Stuur via",
      methodEmail: "E-pos",
      methodSMS: "SMS",
      methodWhatsApp: "WhatsApp",
      emailLabel: "E-posadres",
      emailPlaceholder: "werker@voorbeeld.com",
      phoneLabel: "Telefoonnommer",
      phonePlaceholder: "+27 82 123 4567",
      roleLabel: "Rol",
      roles: {
        admin: "Admin",
        worker: "Werker",
      },
      roleAdmin: "Admin",
      roleWorker: "Werker",
      sendButton: "Stuur Uitnodiging",
      sending: "Stuur tans...",
      cancelButton: "Kanselleer",
      errors: {
        contactRequired: "Kontakinligting word vereis",
        emailRequired: "E-posadres word vereis",
        invalidEmail: "Voer asseblief 'n geldige e-posadres in",
        invalidPhone: "Voer asseblief 'n geldige telefoonnommer in",
        failedToSend: "Kon nie uitnodiging stuur nie. Probeer asseblief weer.",
      },
    },
    alerts: {
      inviteSent: {
        title: "Uitnodiging Gestuur",
        message: "Uitnodiging gestuur na {{contact}} via {{method}}. Uitnodigingskode: {{code}}",
        ok: "OK",
      },
      cancelInvite: {
        title: "Kanselleer Uitnodiging",
        message: "Kanselleer die uitnodiging vir {{email}}?",
        no: "Nee",
        yes: "Ja, Kanselleer",
      },
      changeRole: {
        title: "Verander Rol",
        message: "Verander {{name}} se rol na {{role}}?",
        cancel: "Kanselleer",
        change: "Verander Rol",
      },
      removeMember: {
        title: "Verwyder Lid",
        message:
          "Verwyder {{name}} uit jou span? Hulle sal toegang tot hierdie organisasie verloor.",
        cancel: "Kanselleer",
        remove: "Verwyder",
      },
      error: {
        title: "Fout",
        sendFailed: "Kon nie uitnodiging stuur nie. Probeer asseblief weer.",
        cancelInviteFailed: "Kon nie uitnodiging kanselleer nie.",
        updateRoleFailed: "Kon nie rol verander nie.",
        removeMemberFailed: "Kon nie spanlid verwyder nie.",
      },
    },
    sections: {
      members: "Spanlede ({{count}})",
      invites: "Hangende Uitnodigings ({{count}})",
    },
    member: {
      you: " (jy)",
      joined: "Aangesluit {{date}}",
      roleAdmin: "Admin",
      roleWorker: "Werker",
    },
    invite: {
      code: "Kode: {{code}}",
      expires: "Verval {{date}}",
      cancelButton: "Kanselleer",
    },
    noAccess: "Slegs admins kan spanlede bestuur",
    syncNotice: {
      title: "Sinchronisering Vereis",
      text: "Spanveranderinge vereis sinchronisering om in werking te tree oor alle toestelle.",
      button: "Sinchroniseer Nou",
    },
  },
  treatmentProtocolsScreen: {
    title: "Behandelingsprotokolle",
    createButton: "+ Nuut",
    filters: {
      all: "Almal",
      vaccination: "Inenting",
      treatment: "Behandeling",
      deworming: "Ontwurming",
      other: "Ander",
    },
    count_one: "{{count}} protokol",
    count_other: "{{count}} protokolle",
    inactive: "Onaktief",
    withdrawal: "Onttrekking: {{days}} dae",
    empty: {
      title: "Geen Protokolle Gevind nie",
      noProtocols: "Skep jou eerste behandelingsprotokol om in Drukgang Modus te gebruik",
      filtered: "Geen {{filter}} protokolle gevind nie",
      showAll: "Wys Almal",
      loadDefaults: "Laai SA Verstekke",
      createButton: "Skep Protokol",
    },
    alerts: {
      toggleError: "Kon nie protokol-status wissel nie",
      defaultsAdded: "{{count}} protokolle suksesvol bygevoeg",
    },
  },
  healthRecordFormScreen: {
    title: "Gesondheidsrekord",
    cancelButton: "Kanselleer",
    typeLabel: "Tipe",
    recordTypes: {
      vaccination: "inenting",
      treatment: "behandeling",
      vet_visit: "veearts besoek",
      condition_score: "kondisietelling",
      other: "ander",
      vaccinationPro: "inenting (PRO)",
    },
    protocol: {
      selectButton_one: "Kies uit {{count}} gestoorde protokol",
      selectButton_other: "Kies uit {{count}} gestoorde protokolle",
      selectedDetail: "{{productName}} • {{dosage}}",
      noProtocols: "Geen protokolle gevind nie. Skep een in Instellings → Behandelingsprotokolle",
    },
    fields: {
      description: {
        label: "Beskrywing *",
        placeholder: "Wat is gedoen?",
      },
      productName: {
        label: "Produknaam",
        placeholder: "bv. Covexin 10",
      },
      dosage: {
        label: "Dosis",
        placeholder: "bv. 2ml SC",
      },
      administeredBy: {
        label: "Toegedien Deur",
        placeholder: "Opsioneel",
      },
      notes: {
        label: "Notas",
        placeholder: "Addisionele notas...",
      },
      photos: {
        label: "Foto's (Opsioneel)",
      },
    },
    buttons: {
      save: "Stoor Rekord",
      saving: "Stoor tans...",
    },
    alerts: {
      required: {
        title: "Verpligtend",
        message: "Beskrywing word vereis",
      },
      noOrganization: {
        title: "Fout",
        message: "Geen organisasie gekies nie",
      },
      saveError: {
        title: "Fout",
        message: "Kon nie gesondheidsrekord stoor nie",
      },
    },
  },
  weightRecordFormScreen: {
    title: "Gewigsrekord",
    cancelButton: "Kanselleer",
    fields: {
      weight: {
        label: "Gewig (kg) *",
        placeholder: "bv. 450",
      },
      conditionScore: {
        label: "Kondisietelling (1-9)",
        placeholder: "Opsioneel, bv. 6",
      },
      notes: {
        label: "Notas",
        placeholder: "Addisionele notas...",
      },
      photos: {
        label: "Foto's (Opsioneel)",
      },
    },
    buttons: {
      save: "Stoor Rekord",
      saving: "Stoor tans...",
    },
    alerts: {
      invalidWeight: {
        title: "Ongeldig",
        message: "Voer asseblief 'n geldige gewig in kg in",
      },
      invalidConditionScore: {
        title: "Ongeldig",
        message: "Kondisietelling moet tussen 1 en 9 wees",
      },
      noOrganization: {
        title: "Fout",
        message: "Geen organisasie gekies nie",
      },
      saveError: {
        title: "Fout",
        message: "Kon nie gewigsrekord stoor nie",
      },
    },
  },
  breedingRecordFormScreen: {
    title: "Telingrekord",
    cancelButton: "Kanselleer",
    methodLabel: "Metode",
    methods: {
      natural: "natuurlik",
      ai: "ki",
      embryo_transfer: "embrio-oorplasing",
    },
    outcomeLabel: "Uitkoms",
    outcomes: {
      pending: "hangend",
      live_calf: "lewende kalf",
      stillborn: "doodgebore",
      aborted: "geaborteer",
      open: "oop",
    },
    fields: {
      notes: {
        label: "Notas",
        placeholder: "Addisionele notas...",
      },
      photos: {
        label: "Foto's (Opsioneel)",
      },
    },
    buttons: {
      save: "Stoor Rekord",
      saving: "Stoor tans...",
    },
    alerts: {
      noOrganization: {
        title: "Fout",
        message: "Geen organisasie gekies nie",
      },
      saveError: {
        title: "Fout",
        message: "Kon nie telingrekord stoor nie",
      },
    },
  },
  calendarScreen: {
    badges: {
      overdue: "Agterstallig",
      soon: "Binnekort",
    },
    tagPrefix: "Etiket: {{tag}}",
    title: "Kalender",
    unknownVaccination: "Onbekende Inenting",
    filters: {
      all: "Alles",
      today: "Vandag",
      week: "Hierdie Week",
      month: "Hierdie Maand",
    },
    empty: {
      title: "Geen Komende Gebeure",
      allCaughtUp: "Jy is op datum!",
      today: "Geen gebeure vandag nie",
      week: "Geen gebeure hierdie week nie",
      month: "Geen gebeure hierdie maand nie",
    },
    manage: {
      action: "Bestuur",
      title: "Bestuur",
      schedules: "Entingskedules",
      schedulesHelp: "Stel outomatiese entingherinneringe vir jou kudde op",
      protocols: "Entstowwe",
      protocolsHelp: "Die produkte wat jy gebruik — dosis, metode en onttrekkingstydperk",
    },
  },
  vaccinationScheduleForm: {
    protocolPicker: {
      title: "Kies Entstof",
      search: "Soek entstowwe...",
      createNew: "+ Skep Nuwe Entstof",
      emptyTitle: "Nog geen entstowwe nie",
      emptyHelp:
        "Voeg die entstof by wat jy gebruik — die produknaam, dosis en onttrekkingstydperk — dan kan jy dit skeduleer.",
      noMatches: "Geen entstowwe pas by jou soektog nie",
    },
    scheduleTypes: {
      ageBased: "Op \'n sekere ouderdom",
      ageBasedHelp: "bv. eerste BSM-inspuiting op 4 maande oud",
      dateBased: "Op \'n vasgestelde datum",
      dateBasedHelp: "bv. elke Augustus, voor die reën",
      groupBased: "Per kamp of weiding",
      groupBasedHelp: "bv. alles in die noordkamp, elke 6 maande",
    },
    sex: {
      all: "Almal",
    },
    errors: {
      nameRequired: "Skedulenaam word vereis",
      protocolRequired: "Kies asseblief \'n entstof",
      targetAgeRequired: "Teikenouderdom word vereis wanneer jy volgens ouderdom skeduleer",
      dateRequired: "\'n Datum word vereis wanneer jy volgens datum skeduleer",
      groupRequired: "Weiding en interval word vereis wanneer jy volgens groep skeduleer",
    },
  },
  vaccinationScheduleScreen: {
    title: "Inentingskedules",
    createButton: "+ Nuut",
    count: "{{count}} skedules",
    filters: {
      all: "Almal",
      ageBased: "Ouderdom-gebaseerd",
      dateBased: "Datum-gebaseerd",
      groupBased: "Groep-gebaseerd",
    },
    badges: {
      inactive: "Onaktief",
    },
    details: {
      booster: "{{count}} dosisse, versterker na {{days}} dae",
    },
    empty: {
      title: "Geen Inentingskedules nie",
      noFilter:
        "Skep skedules om inentingsherinneringe te outomatiseer gebaseer op ouderdom, datum of groep.",
      withFilter: "Geen {{filter}} skedules gevind nie.",
      showAllButton: "Wys Almal",
      createButton: "Skep Skedule",
    },
    alerts: {
      toggleError: {
        title: "Fout",
        message: "Kon nie skedule-status wissel nie",
      },
      deleteConfirm: {
        title: "Verwyder Skedule",
        message:
          "Verwyder inentingskedule '{{name}}'? Dit sal nie bestaande gesondheidsrekords beïnvloed nie.",
      },
      deleteError: {
        title: "Fout",
        message: "Kon nie skedule verwyder nie",
      },
    },
  },
  biometricLock: {
    title: "HerdTrackr is gesluit",
    prompt: "Ontsluit HerdTrackr",
    unlockButton: "Ontsluit",
  },
}

export default af
export type Translations = typeof af
