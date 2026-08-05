/* =====================================================================
   INNHOLDSFIL – Voss Chalet
   ---------------------------------------------------------------------
   ALT tekstinnhold på nettsiden ligger i denne filen. Du trenger ikke
   røre HTML, CSS eller JavaScript for å endre teksten.

   Slik redigerer du:
   • Tekst står inne i "anførselstegn". Bytt teksten, behold tegnene.
   • Lister står i [firkantklammer], adskilt med komma.
   • Alt under `no:` er norsk, alt under `en:` er engelsk.
     Endrer du noe på norsk, husk å endre tilsvarende på engelsk.
   • Linjer som starter med // er kommentarer og vises ikke på siden.

   Beskrivelse, fasiliteter, husregler og anmeldelser er hentet fra
   Airbnb-annonsen. Punkter merket TODO er praktisk info Airbnb ikke
   viser offentlig (wifi-passord, koder, telefonnummer osv.) – de må
   fylles inn manuelt.
   ===================================================================== */

window.SITE = {
  /* -------------------------------------------------------------------
     1. GRUNNOPPSETT – gjelder begge språk
     ------------------------------------------------------------------- */
  meta: {
    siteName: "Voss Chalet",
    // Lenken gjestene sendes til for å booke
    airbnbUrl: "https://www.airbnb.com/h/vosschalet",

    hostName: "Michelle og Marius",
    // TODO: fyll inn e-post dere vil bruke utad (eller la stå tom for å skjule)
    email: "",
    // TODO: telefonnummer gjestene kan ringe hvis det haster
    phone: "",
    address: "Tråstølen, Voss, Vestland",

    // Nøkkelfakta fra Airbnb-annonsen
    facts: { guests: 9, bedrooms: 4, beds: 6, baths: 2 },

    // Inn- og utsjekk (fra husreglene på Airbnb)
    checkIn: "15:00",
    checkOut: "11:00",

    // Vurdering fra Airbnb – vises som et lite merke i toppen
    rating: { score: "5,0", scoreEn: "5.0", count: 37, badgeNo: "Gjestefavoritt", badgeEn: "Guest favourite" },

    // TODO: ekte wifi-info. Vises i husmanualen med kopier-knapp.
    wifi: { ssid: "TODO-nettverksnavn", password: "TODO-passord" },

    // TODO: sjekk at numrene stemmer, og fyll inn eget telefonnummer
    emergency: [
      { label: "Nød (brann / politi / ambulanse)", value: "110 · 112 · 113" },
      { label: "Legevakt", value: "116 117" },
      { label: "Veihjelp (Viking)", value: "06000" },
      { label: "Vert – Michelle og Marius", value: "TODO: telefonnummer" }
    ],

    // Google Maps: åpne kartet, trykk Del → Bygg inn kart, og lim inn
    // KUN adressen fra src="..." her. La stå tom for å skjule kartet.
    mapEmbed: "",

    // Kartlenke som åpnes i ny fane (fungerer selv uten innebygd kart)
    mapLink: "https://www.google.com/maps/search/?api=1&query=Tr%C3%A5st%C3%B8len+Voss"
  },

  /* -------------------------------------------------------------------
     2. BILDER OG VIDEO
     ---------------------------------------------------------------------
     Last ned bildene dere allerede har på Airbnb, legg dem i mappen
     assets/img/ og skriv filnavnet her, f.eks. "assets/img/stue.jpg".
     Filer som ikke finnes vises som en pen plassholder, så siden ser
     aldri ødelagt ut.
     Anbefalt: bredde ca. 1600 px, .jpg eller .webp, under 400 kB.
     ------------------------------------------------------------------- */
  media: {
    hero: "assets/img/hero.jpg",
    // Galleriet på forsiden. Legg til/fjern linjer etter behov.
    gallery: [
      { src: "assets/img/gallery-1.jpg", captionNo: "Stue med gulv-til-tak-vinduer mot Lønavatnet", captionEn: "Living room with floor-to-ceiling windows facing Lønavatnet" },
      { src: "assets/img/gallery-2.jpg", captionNo: "Åpen kjøkken- og spiseløsning", captionEn: "Open-plan kitchen and dining" },
      { src: "assets/img/gallery-3.jpg", captionNo: "Saltvannsjacuzzi på terrassen", captionEn: "Salt-water hot tub on the terrace" },
      { src: "assets/img/gallery-4.jpg", captionNo: "Badstue", captionEn: "Sauna" },
      { src: "assets/img/gallery-5.jpg", captionNo: "Terrassen med panoramautsikt", captionEn: "Terrace with panoramic views" },
      { src: "assets/img/gallery-6.jpg", captionNo: "Soverom", captionEn: "Bedroom" },
      { src: "assets/img/gallery-7.jpg", captionNo: "TV-stue og lekerom", captionEn: "TV lounge and playroom" },
      { src: "assets/img/gallery-8.jpg", captionNo: "Hytta om vinteren – ski in/ski out", captionEn: "The chalet in winter – ski in/ski out" }
    ]
  },

  /* ===================================================================
     3. NORSK INNHOLD
     =================================================================== */
  no: {
    nav: {
      home: "Hjem",
      manual: "Husmanual",
      rules: "Husregler",
      area: "Området",
      book: "Book på Airbnb"
    },

    facts: {
      guests: "gjester",
      bedrooms: "soverom",
      beds: "senger",
      baths: "bad"
    },

    hero: {
      eyebrow: "Tråstølen · Voss",
      title: "Moderne hytte i Voss",
      subtitle:
        "Ny hytte med ekte ski in/ski out i Tråstølen. Fire soverom, badstue, saltvannsjacuzzi og stor terrasse med panoramautsikt over Lønavatnet.",
      ctaPrimary: "Sjekk ledige datoer",
      ctaSecondary: "Se husmanualen"
    },

    about: {
      title: "Om hytta",
      lead:
        "Velkommen til en moderne og innholdsrik hytte i Tråstølen på Voss, perfekt plassert med ekte ski in/ski out. Den store, solrike terrassen byr på panoramautsikt over Lønavatnet.",
      paragraphs: [
        "Hytten har fire soverom, to bad, badstue, TV-stue, lekerom og hems. Stuen og kjøkkenet ligger i en åpen løsning med peis, store vinduer og fullt utstyrt kjøkken.",
        "På terrassen står en Arctic Spa saltvannsjacuzzi som gir ekstra komfort etter en aktiv dag. Det miljøvennlige saltvannssystemet er skånsomt for hud og hår og gir en behagelig spaopplevelse med avslappende hydroterapi.",
        "Hytten har moderne fasiliteter, god lagringsplass, garasje, elbillading og gjesteparkering til fem biler. Sengetøy og håndklær er inkludert.",
        "Med kort vei til Voss sentrum, fjellturer, ski og aktiviteter året rundt er dette et ideelt sted for både familier og vennegjenger som vil kombinere komfort med natur og opplevelser."
      ]
    },

    highlights: {
      title: "Det gjestene liker best",
      items: [
        { icon: "ski", title: "Ski in / ski out", text: "Skiheisene ligger rett utenfor døren, med over 40 km preparerte løyper i Voss Resort." },
        { icon: "hottub", title: "Saltvannsjacuzzi", text: "Arctic Spa med hudvennlig saltvann, tilgjengelig hele året og døgnet rundt." },
        { icon: "sauna", title: "Badstue", text: "Perfekt etter en dag i bakken eller på fjellet." },
        { icon: "mountain", title: "Utsikt over Lønavatnet", text: "Gulv-til-tak-vinduer i stuen og stor, solrik terrasse med panoramautsikt." },
        { icon: "fire", title: "Peis i åpen stue", text: "Åpen stue- og kjøkkenløsning med peis og fullt utstyrt kjøkken." },
        { icon: "car", title: "Garasje og elbillading", text: "Elbillader nivå 2 i garasjen, og gjesteparkering til fem biler." },
        { icon: "kids", title: "Familievennlig", text: "Lekerom, hems, TV-stue og sprinkelseng — godt egnet for barnefamilier." },
        { icon: "bed", title: "Alt er klart", text: "Sengetøy, håndklær og forbruksvarer som såpe, sjampo og toalettpapir er inkludert." }
      ]
    },

    sleeping: {
      title: "Hvor dere sover",
      subtitle: "Fire soverom, seks senger, plass til ni gjester.",
      rooms: [
        { title: "Soverom 1", beds: "1 køyeseng" },
        { title: "Soverom 2", beds: "1 køyeseng" },
        { title: "Soverom 3", beds: "1 dobbeltseng" },
        { title: "Soverom 4", beds: "1 dobbeltseng, 1 sprinkelseng" }
      ],
      note: "I tillegg kommer hems, TV-stue og lekerom."
    },

    amenities: {
      title: "Fasiliteter",
      subtitle: "Alt dette står klart når dere kommer.",
      groups: [
        {
          title: "Ute og spa",
          items: ["Privat saltvannsjacuzzi – hele året, hele døgnet", "Badstue", "Stor terrasse med panoramautsikt", "Utendørsdusj", "Grill", "Nær skiløype/-bakke"]
        },
        {
          title: "Kjøkken og stue",
          items: ["Fullt utstyrt kjøkken", "Åpen stue- og kjøkkenløsning", "Peis", "TV", "TV-stue og lekerom", "Hems"]
        },
        {
          title: "Praktisk",
          items: ["Trådløst nettverk", "Vaskemaskin", "Klimaanlegg", "Sengetøy og håndklær inkludert", "Forbruksvarer (såpe, sjampo, toalettpapir)", "Røykvarsler"]
        },
        {
          title: "Parkering",
          items: ["Garasje", "Elbillader – nivå 2", "Gjesteparkering til 5 biler", "Gratis parkering på stedet"]
        }
      ],
      // Airbnb oppgir at karbonmonoksidvarsler ikke er installert – vi sier det ærlig her.
      noteTitle: "Verdt å vite",
      note: "Hytta har røykvarslere. Karbonmonoksidvarsler er foreløpig ikke installert. Innkjørselen ned til garasjen er bratt, og kan være krevende når det er mye snø — det er god parkering på andre siden av veien."
    },

    gallery: {
      title: "Bilder",
      subtitle: "Klikk på et bilde for å se det større."
    },

    reviews: {
      title: "Hva gjestene sier",
      subtitle: "Utdrag fra anmeldelser på Airbnb.",
      cta: "Les alle anmeldelsene på Airbnb",
      items: [
        {
          text: "Vi hadde et fantastisk opphold i denne vakre og moderne hytten. Det føltes rent og luksuriøst, sengene var gode og hytten var godt utstyrt med kjøkkenartikler, håndklær, sengetøy og toalettartikler.",
          author: "Camilla",
          meta: "mars 2026"
        },
        {
          text: "Vi elsket saunaen og jacuzzien etter en dag i snøen! Vi hadde fantastiske familiemiddager i et veldig vakkert, fredelig, rent og imøtekommende hjem!",
          author: "Frances",
          meta: "mars 2026 · gruppetur"
        },
        {
          text: "Fra det øyeblikket vi gikk inn, ble vi møtt av fantastiske vinduer fra gulv til tak med utsikt over de nydelige fjellene i Voss. Det føltes virkelig som om vi bodde i en koselig hytte høyt oppe i fjellet.",
          author: "Joel",
          meta: "Singapore"
        },
        {
          text: "Både barn og voksne satte pris på jacuzzien og utendørsdusjen. Det var veldig praktisk at huset var utstyrt med forbruksvarer som toalettpapir, såpe, oppvaskmiddel og sjampo.",
          author: "Puck",
          meta: "sommer 2026 · to familier"
        },
        {
          text: "Hjemmet er vakkert, privat og utrolig koselig. Sengene var veldig komfortable. Beliggenheten var utmerket, og vi vil alltid verdsette minnene om å se nordlyset fra dette stedet.",
          author: "Hannah",
          meta: "januar 2026 · Colorado"
        },
        {
          text: "Dette er en flott hytte med skisenteret i umiddelbar nærhet! Vertskapet er hyggelig og svarte raskt på henvendelser.",
          author: "Isak",
          meta: "mars 2026"
        }
      ]
    },

    location: {
      title: "Beliggenhet",
      text:
        "Hytta ligger i Tråstølen på Voss, med skiheisene rett utenfor døren og kort vei til Voss sentrum. Nøyaktig adresse og adkomstinfo sendes på Airbnb-melding før ankomst.",
      distancesTitle: "Avstander",
      // TODO: juster minuttene hvis noe ikke stemmer
      distances: [
        { label: "Skiheis / skiløype", value: "Rett utenfor døren" },
        { label: "Voss Resort", value: "Ski in / ski out" },
        { label: "Nærmeste dagligvare", value: "ca. 10 min med bil" },
        { label: "Voss sentrum og togstasjon", value: "ca. 15 min med bil" },
        { label: "Myrkdalen", value: "ca. 30 min med bil" },
        { label: "Nærøyfjorden / Flåm", value: "ca. 1–1,5 t med bil" },
        { label: "Hardangerfjorden", value: "ca. 1–1,5 t med bil" },
        { label: "Bergen", value: "ca. 1,5 t med bil" }
      ],
      mapCta: "Åpne i Google Maps"
    },

    host: {
      title: "Vertskapet",
      name: "Michelle og Marius",
      badge: "Superhost",
      text:
        "Vi bor i Bergen og har vært verter i tre år. Vi svarer normalt innen en time, og hjelper gjerne med lokale tips før og under oppholdet. Ta kontakt via Airbnb hvis dere lurer på noe.",
      stats: [
        { value: "5,0", label: "gjennomsnittlig vurdering" },
        { value: "37", label: "anmeldelser" },
        { value: "100 %", label: "svarprosent" }
      ]
    },

    cta: {
      title: "Ledig for din neste tur?",
      text: "Priser, kalender og booking ligger på Airbnb. Har du spørsmål før du bestiller, er det bare å ta kontakt.",
      button: "Se ledige datoer på Airbnb"
    },

    /* --- HUSMANUAL -------------------------------------------------
       Dette er den delen Airbnb ikke viser offentlig. Innholdet under
       er et utgangspunkt basert på hva hytta faktisk har – gå gjennom
       hvert punkt og rett opp der det ikke stemmer.
       ---------------------------------------------------------------- */
    manual: {
      title: "Husmanual",
      intro:
        "Alt dere trenger å vite mens dere er her — ankomst, hvordan tingene i hytta fungerer, og hva som skal gjøres før avreise. Klikk på et punkt for å åpne det.",
      wifiTitle: "Wifi",
      wifiNetwork: "Nettverk",
      wifiPassword: "Passord",
      wifiCopy: "Kopier",
      wifiCopied: "Kopiert",
      checkInLabel: "Innsjekk",
      checkOutLabel: "Utsjekk",
      printCta: "Skriv ut manualen",
      emergencyTitle: "Viktige numre",
      sections: [
        {
          id: "ankomst",
          icon: "key",
          title: "Ankomst og smartlås",
          paragraphs: [
            "Innsjekk er fra kl. 15:00, og dere sjekker inn selv med smartlåsen — dere trenger ikke møte noen."
          ],
          steps: [
            "TODO: Koden til ytterdøren sendes på Airbnb-melding før ankomst.",
            "TODO: Beskriv hvordan låsen betjenes (tast koden, trykk på …).",
            "TODO: Beskriv hvor reservenøkkel eventuelt ligger.",
            "Innkjørselen ned til garasjen er bratt. Kjør rolig, spesielt når det er snø og is — det er også god parkering på andre siden av veien."
          ],
          tip: "Trenger dere tidlig innsjekk eller sen utsjekk, send en melding i god tid. Vi er fleksible når hytta er ledig.",
          image: "assets/img/manual-ankomst.jpg",
          video: ""
        },
        {
          id: "jacuzzi",
          icon: "hottub",
          title: "Saltvannsjacuzzi",
          paragraphs: [
            "Jacuzzien er en Arctic Spa med saltvannssystem. Den står klar og varm hele året, døgnet rundt — dere trenger ikke å fylle eller varme den opp selv."
          ],
          steps: [
            "Skyv lokket forsiktig av og legg det på lokkholderen — ikke på bakken eller snøen.",
            "Dusj før dere går uti. Såpe, sjampo og kremer ødelegger vannbalansen.",
            "TODO: Slik styres temperatur og bobler (panel / app / knapp).",
            "Legg lokket på igjen med én gang dere er ferdige, ellers faller temperaturen og strømforbruket øker.",
            "Ikke bruk glass i eller ved jacuzzien."
          ],
          tip: "Saltvannet er skånsomt mot hud og hår, men badetøy kan bleknes over tid — akkurat som i et vanlig spa.",
          image: "assets/img/manual-jacuzzi.jpg",
          video: ""
        },
        {
          id: "badstue",
          icon: "sauna",
          title: "Badstue",
          paragraphs: [
            "TODO: skriv hvor badstuen ligger, og omtrent hvor lang tid den bruker på å bli varm (typisk 30–45 minutter)."
          ],
          steps: [
            "TODO: Slik skrur dere den på (bryter / panel).",
            "TODO: Anbefalt temperatur og maks tid.",
            "Legg alltid et håndkle under dere på benken.",
            "Vann på steinene: bruk øsekaret, litt om gangen.",
            "Ikke tørk klær eller sko inne i badstuen — det er brannfarlig."
          ],
          tip: "Badstue først, så jacuzzi, så utedusj — den rekkefølgen anbefaler gjestene våre.",
          image: "assets/img/manual-badstue.jpg",
          video: ""
        },
        {
          id: "peis",
          icon: "fire",
          title: "Peisen",
          paragraphs: [
            "Peisen i stua er trygg å bruke, men les gjennom punktene under før dere fyrer første gang."
          ],
          steps: [
            "Åpne spjeldet helt før dere tenner.",
            "Legg opptenningsbriketter nederst, deretter tynn ved i kryss.",
            "Tenn på, la døren stå på gløtt i et par minutter, og lukk den så.",
            "Når det brenner godt, skyv spjeldet halvveis inn.",
            "Legg aldri i mer enn tre kubber om gangen, og la aldri peisen stå ubevoktet.",
            "TODO: Hvor finnes ved og opptenning, og hvor tømmes asken (kun når den er helt kald)?"
          ],
          tip: "Hytta har røykvarslere, men foreløpig ikke karbonmonoksidvarsler. Luft godt hvis det ryker inn, og la aldri peisen brenne mens dere sover.",
          image: "assets/img/manual-peis.jpg",
          // Legg en film i assets/video/ og skriv filnavnet her,
          // eller lim inn en YouTube-/Vimeo-lenke.
          video: ""
        },
        {
          id: "varme",
          icon: "thermo",
          title: "Varme og klimaanlegg",
          paragraphs: [
            "Hytta har klimaanlegg som både varmer og kjøler."
          ],
          steps: [
            "TODO: Hvor står panelet/fjernkontrollen, og hvordan justeres temperaturen?",
            "TODO: Anbefalt temperatur inne (typisk 20–22 °C).",
            "TODO: Har soverommene egen varmestyring?",
            "Hold vinduer og terrassedør lukket når varmen eller kjølingen står på."
          ],
          tip: "Skru ned til normal temperatur i stedet for å skru helt av når dere er ute på dagstur — det bruker mindre strøm enn å varme opp igjen fra kaldt.",
          image: "",
          video: ""
        },
        {
          id: "kjokken",
          icon: "kitchen",
          title: "Kjøkken og hvitevarer",
          paragraphs: [
            "Kjøkkenet er fullt utstyrt med det dere trenger for å lage mat til hele følget."
          ],
          steps: [
            "TODO: Type komfyr/platetopp, og eventuelle triks.",
            "TODO: Oppvaskmaskin — hvor ligger tablettene, og hvilket program anbefaler dere?",
            "TODO: Kaffetrakter/kaffemaskin — hva slags, og hvor er filtre/kapsler?",
            "La kjøleskapet stå på når dere reiser."
          ],
          tip: "Grillen på terrassen er fin til middag ute. TODO: skriv hvor gass/kull står, og hvordan den tennes.",
          image: "assets/img/manual-kjokken.jpg",
          video: ""
        },
        {
          id: "tv",
          icon: "tv",
          title: "TV, wifi og lyd",
          paragraphs: [
            "TV-en i stua er en smart-TV. Dere kan logge inn på egne strømmekontoer — husk bare å logge ut igjen før avreise."
          ],
          steps: [
            "TODO: Slik skrur dere på TV-en og velger riktig kilde.",
            "Wifi-navn og passord finner dere øverst på denne siden.",
            "TODO: Bluetooth-høyttaler eller lydanlegg — hva heter enheten?",
            "Er nettet borte: TODO — hvor står ruteren, og kan den restartes?"
          ],
          tip: "",
          image: "",
          video: ""
        },
        {
          id: "ski",
          icon: "ski",
          title: "Ski, sko og tørking",
          paragraphs: [
            "Med ski in/ski out kommer dere rett fra bakken og inn — og da trengs et sted for alt det våte."
          ],
          steps: [
            "TODO: Hvor settes ski, staver og brett?",
            "TODO: Finnes tørkeskap eller støvelvarmer, og hvordan brukes det?",
            "Vått yttertøy henger på knaggene, ikke over gulvet inne.",
            "Ta av skistøvlene før dere går inn i stua."
          ],
          tip: "",
          image: "assets/img/manual-ski.jpg",
          video: ""
        },
        {
          id: "lading",
          icon: "car",
          title: "Parkering, garasje og elbillading",
          paragraphs: [
            "Det er gratis parkering på stedet med plass til fem biler, samt garasje med elbillader (nivå 2)."
          ],
          steps: [
            "Innkjørselen til garasjen er bratt — kjør rolig, særlig ved snø og is.",
            "TODO: Hvordan åpnes garasjeporten?",
            "TODO: Hvordan brukes elbilladeren — egen kabel eller fast kabel? Er lading inkludert?",
            "Ved mye snø er det også god parkering på andre siden av veien."
          ],
          tip: "",
          image: "",
          video: ""
        },
        {
          id: "soppel",
          icon: "trash",
          title: "Søppel og kildesortering",
          paragraphs: [
            "TODO: Beskriv hvordan avfall sorteres på hytta, og hvor poser finnes."
          ],
          steps: [
            "TODO: Restavfall — hvilken dunk og hvor står den?",
            "TODO: Papir og papp.",
            "TODO: Glass og metall — nærmeste returpunkt.",
            "TODO: Panteflasker."
          ],
          tip: "Ta gjerne med full restavfallspose ut ved avreise, selv om dunken er full.",
          image: "",
          video: ""
        },
        {
          id: "avreise",
          icon: "check",
          title: "Før dere reiser",
          paragraphs: [
            "Utsjekk er innen kl. 11:00. Dere trenger ikke vaske hytta, men denne listen hjelper oss mye."
          ],
          steps: [
            "Kjør oppvaskmaskinen, eller sett oppvasken i den.",
            "Kast mat som ikke skal være igjen, og ta ut søppelet.",
            "Legg brukte håndklær i dusjen eller i kurven på badet.",
            "Legg lokket på jacuzzien og skru av badstuen.",
            "Sett temperaturen tilbake til normal, lukk alle vinduer og terrassedøren.",
            "Skru av lys, logg ut av strømmetjenester, og lukk ytterdøren godt."
          ],
          tip: "Glemt noe igjen? Send en melding, så finner vi en løsning med å sende det etter.",
          image: "",
          video: ""
        }
      ]
    },

    /* --- HUSREGLER ------------------------------------------------- */
    rules: {
      title: "Husregler",
      intro:
        "Hytta er hjemmet vårt, og vi leier den ut fordi vi vil at flere skal få oppleve Voss. Disse reglene er der for at både dere og neste gjest skal ha det bra.",
      keyPointsTitle: "Kort oppsummert",
      items: [
        { icon: "clock", title: "Inn- og utsjekk", text: "Innsjekk etter kl. 15:00, utsjekk før kl. 11:00. Vi er fleksible når hytta er ledig — send en melding i god tid." },
        { icon: "users", title: "Maks 9 gjester", text: "Alle skal være registrert i bookingen, også barn. Besøk på dagtid er greit, men gi oss beskjed." },
        { icon: "moon", title: "Nattero", text: "Vis hensyn til naboene, og hold det rolig ute og inne mellom kl. 23:00 og 07:00." },
        { icon: "party", title: "Ingen fester", text: "Hytta er ikke egnet for fester eller arrangementer. Rolig samvær med dem som bor her er selvsagt helt fint." },
        { icon: "smoke", title: "Røykfritt innendørs", text: "Røyking er ikke tillatt inne, heller ikke på soverom eller bad. Ute er det greit — vær nøye med sneiper." },
        { icon: "hottub", title: "Jacuzzi og badstue", text: "Dusj før bruk, ikke bruk glass i eller ved jacuzzien, og legg alltid på lokket etterpå. Barn skal ha tilsyn." },
        { icon: "fire", title: "Peis og levende lys", text: "Følg fyringsanvisningen i husmanualen. La aldri peis eller stearinlys stå ubevoktet, og slukk alt før dere legger dere." },
        { icon: "shoe", title: "Sko av innendørs", text: "Skiutstyr og sko settes igjen i gangen, ikke i stua." },
        { icon: "lock", title: "Privat bod", text: "Hele hytten kan brukes. Boden i 2. etasje er låst og forbeholdt eier." },
        { icon: "shield", title: "Skader og uhell", text: "Uhell skjer. Si fra med én gang, så ordner vi det sammen — det er bedre enn at neste gjest oppdager det." }
      ],
      moreTitle: "Litt mer om praktiske ting",
      more: [
        "Det er gratis parkering på stedet til fem biler, og elbillader (nivå 2) i garasjen.",
        "Innkjørselen til garasjen er bratt og kan være krevende ved mye snø. Det er også parkering på andre siden av veien.",
        "Hytta har røykvarslere. Karbonmonoksidvarsler er foreløpig ikke installert.",
        "Det finnes ikke videoovervåking inne eller ute på eiendommen.",
        "Kjæledyr: send oss en melding før booking, så avklarer vi det.",
        "Avbestillingsvilkår følger det som står i Airbnb-annonsen."
      ],
      contactTitle: "Spørsmål underveis?",
      contactText: "Send oss en melding på Airbnb — vi svarer normalt innen en time."
    },

    /* --- OMRÅDET ---------------------------------------------------- */
    area: {
      title: "Voss og området rundt",
      intro:
        "Voss er kjent som Norges ekstremsporthovedstad, men her er like mye rolige turer, god mat og fine bad. Her er noen av favorittene våre.",
      categories: [
        {
          title: "Vinter",
          items: [
            { name: "Voss Resort", desc: "Over 40 km preparerte løyper, og skiheisene ligger rett utenfor døren.", meta: "Ski in / ski out" },
            { name: "Myrkdalen", desc: "Snøsikkert alpinanlegg med god variasjon hvis dere vil bytte bakke for en dag.", meta: "ca. 30 min" },
            { name: "Hanguren", desc: "Ta gondolen fra Voss sentrum opp for spektakulær utsikt og lett tilgjengelige løyper.", meta: "ca. 15 min" },
            { name: "Nordlys", desc: "På klare vinterkvelder har gjester sett nordlyset rett fra terrassen.", meta: "Fra hytta" }
          ]
        },
        {
          title: "Sommer og fjelltur",
          items: [
            { name: "Lønahorgi", desc: "Kjent topptur — dere kan gå rett fra hytta.", meta: "Fra døren" },
            { name: "Sykling og terrengsykling", desc: "Familievennlige sykkelstier rundt Vangsvatnet, og krevende stier i fjellet. Gondolen tar deg og sykkelen opp.", meta: "ca. 15 min" },
            { name: "Rafting og elvesport", desc: "Rafting, juving og elvepadling med erfarne guider i Voss sentrum.", meta: "ca. 15 min" },
            { name: "Paragliding og fallskjermhopp", desc: "Tandemhopp fra fjellet, eller fallskjermhopp fra hoppfeltet på Bømoen.", meta: "ca. 20 min" },
            { name: "Voss Golfklubb", desc: "9-hulls bane i naturskjønne omgivelser, for både nybegynnere og erfarne.", meta: "ca. 20 min" },
            { name: "Bading i Vangsvatnet", desc: "Fin strand som er populær blant både lokale og besøkende.", meta: "ca. 15 min" }
          ]
        },
        {
          title: "Mat, kultur og familie",
          items: [
            { name: "Tre Brør", desc: "Hyggelig kafé og bar i sentrum — bra for lunsj eller en øl etter skiing.", meta: "ca. 15 min" },
            { name: "Park Hotel Vossevangen", desc: "Lokal mat i sentrum, fint for en middag ute.", meta: "ca. 15 min" },
            { name: "Voss Folkemuseum", desc: "Lokalhistorie i vakre omgivelser.", meta: "ca. 15 min" },
            { name: "Vossabadet", desc: "Svømmehall, utendørsbasseng og egen barneavdeling — perfekt på regnværsdager.", meta: "ca. 15 min" },
            { name: "Bømoen", desc: "Turstier, sykkelmuligheter og lekeplasser barna elsker.", meta: "ca. 20 min" }
          ]
        },
        {
          title: "Dagsturer",
          items: [
            { name: "Flåmsbanen og Nærøyfjorden", desc: "En av verdens vakreste togturer, og en UNESCO-fjord i verdensklasse.", meta: "ca. 1–1,5 t" },
            { name: "Hardangerfjorden", desc: "Fossefall, frukthager og fjord — flott på en dagstur.", meta: "ca. 1–1,5 t" },
            { name: "Bergen", desc: "Bryggen, Fløyen og fisketorget. Fint som stopp på vei til eller fra flyplassen.", meta: "ca. 1,5 t" }
          ]
        },
        {
          title: "Praktisk",
          items: [
            { name: "Dagligvare", desc: "Flere butikker å velge mellom, alle en kort kjøretur unna.", meta: "ca. 10 min" },
            { name: "Vinmonopolet Voss", desc: "I sentrum. Merk kortere åpningstid lørdag og stengt søndag.", meta: "ca. 15 min" },
            { name: "Apotek og legevakt", desc: "Begge i sentrum. Legevakt: ring 116 117.", meta: "ca. 15 min" },
            { name: "Voss stasjon", desc: "Tog til Bergen og Oslo — praktisk hvis noen kommer uten bil.", meta: "ca. 15 min" }
          ]
        }
      ]
    },

    footer: {
      about: "Moderne utleiehytte i Tråstølen på Voss, med ski in/ski out, badstue og saltvannsjacuzzi. Booking skjer via Airbnb.",
      linksTitle: "Sider",
      contactTitle: "Kontakt",
      bookTitle: "Booking",
      bookText: "Kalender, priser og bestilling ligger på Airbnb.",
      rights: "Alle rettigheter forbeholdt."
    },

    common: {
      back: "Tilbake til forsiden",
      close: "Lukk",
      openMenu: "Meny",
      langLabel: "Språk",
      themeLabel: "Bytt mellom lyst og mørkt tema",
      imagePlaceholder: "Bilde kommer"
    }
  },

  /* ===================================================================
     4. ENGELSK INNHOLD
     =================================================================== */
  en: {
    nav: {
      home: "Home",
      manual: "House manual",
      rules: "House rules",
      area: "The area",
      book: "Book on Airbnb"
    },

    facts: {
      guests: "guests",
      bedrooms: "bedrooms",
      beds: "beds",
      baths: "bathrooms"
    },

    hero: {
      eyebrow: "Tråstølen · Voss, Norway",
      title: "Modern chalet in Voss",
      subtitle:
        "A new chalet with true ski-in/ski-out in Tråstølen. Four bedrooms, sauna, salt-water hot tub and a large terrace with panoramic views over Lønavatnet.",
      ctaPrimary: "Check availability",
      ctaSecondary: "Read the house manual"
    },

    about: {
      title: "About the chalet",
      lead:
        "Welcome to a modern, well-equipped chalet in Tråstølen near Voss, perfectly placed with true ski-in/ski-out access. The large, sunny terrace offers panoramic views over lake Lønavatnet.",
      paragraphs: [
        "The chalet has four bedrooms, two bathrooms, a sauna, a TV lounge, a playroom and a mezzanine. The living room and kitchen form one open space with a fireplace, large windows and a fully equipped kitchen.",
        "On the terrace you will find an Arctic Spa salt-water hot tub — the perfect way to wind down after an active day. The eco-friendly salt-water system is gentle on skin and hair and gives a comfortable spa experience with relaxing hydrotherapy.",
        "The chalet has modern amenities, plenty of storage, a garage, EV charging and guest parking for five cars. Bed linen and towels are included.",
        "With Voss town centre, mountain hikes, skiing and year-round activities close by, this is an ideal base for families and groups of friends who want comfort as well as nature and adventure."
      ]
    },

    highlights: {
      title: "What guests mention most",
      items: [
        { icon: "ski", title: "Ski-in / ski-out", text: "The lifts are right outside the door, with over 40 km of groomed slopes at Voss Resort." },
        { icon: "hottub", title: "Salt-water hot tub", text: "An Arctic Spa with skin-friendly salt water, available all year and around the clock." },
        { icon: "sauna", title: "Sauna", text: "Hard to beat after a day on the slopes or in the mountains." },
        { icon: "mountain", title: "Views over Lønavatnet", text: "Floor-to-ceiling windows in the living room and a large, sunny terrace with panoramic views." },
        { icon: "fire", title: "Fireplace in an open living room", text: "Open-plan living room and kitchen with a fireplace and everything you need to cook." },
        { icon: "car", title: "Garage and EV charging", text: "Level 2 EV charger in the garage, plus guest parking for five cars." },
        { icon: "kids", title: "Family friendly", text: "Playroom, mezzanine, TV lounge and a travel cot — well suited for families with children." },
        { icon: "bed", title: "Everything is ready", text: "Bed linen, towels and consumables such as soap, shampoo and toilet paper are included." }
      ]
    },

    sleeping: {
      title: "Where you sleep",
      subtitle: "Four bedrooms, six beds, room for nine guests.",
      rooms: [
        { title: "Bedroom 1", beds: "1 bunk bed" },
        { title: "Bedroom 2", beds: "1 bunk bed" },
        { title: "Bedroom 3", beds: "1 double bed" },
        { title: "Bedroom 4", beds: "1 double bed, 1 cot" }
      ],
      note: "Plus a mezzanine, a TV lounge and a playroom."
    },

    amenities: {
      title: "Amenities",
      subtitle: "All of this is ready when you arrive.",
      groups: [
        {
          title: "Outdoors and spa",
          items: ["Private salt-water hot tub – all year, 24 hours", "Sauna", "Large terrace with panoramic views", "Outdoor shower", "Barbecue", "Close to ski slopes and trails"]
        },
        {
          title: "Kitchen and living room",
          items: ["Fully equipped kitchen", "Open-plan living and kitchen", "Fireplace", "TV", "TV lounge and playroom", "Mezzanine"]
        },
        {
          title: "Practical",
          items: ["Wi-Fi", "Washing machine", "Air conditioning", "Bed linen and towels included", "Consumables (soap, shampoo, toilet paper)", "Smoke alarm"]
        },
        {
          title: "Parking",
          items: ["Garage", "EV charger – level 2", "Guest parking for 5 cars", "Free parking on the property"]
        }
      ],
      noteTitle: "Good to know",
      note: "The chalet has smoke alarms. A carbon monoxide alarm is not currently installed. The driveway down to the garage is steep and can be demanding in heavy snow — there is also plenty of parking across the road."
    },

    gallery: {
      title: "Photos",
      subtitle: "Click an image to view it larger."
    },

    reviews: {
      title: "What guests say",
      subtitle: "Excerpts from Airbnb reviews.",
      cta: "Read all reviews on Airbnb",
      items: [
        {
          text: "We had a fantastic stay in this beautiful, modern chalet. It felt clean and luxurious, the beds were good and the house was well equipped with kitchenware, towels, bed linen and toiletries.",
          author: "Camilla",
          meta: "March 2026"
        },
        {
          text: "We loved the sauna and hot tub after a day in the snow! We had wonderful family dinners in a very beautiful, peaceful, clean and welcoming home.",
          author: "Frances",
          meta: "March 2026 · group trip"
        },
        {
          text: "From the moment we walked in we were met by amazing floor-to-ceiling windows overlooking the beautiful mountains of Voss. It really felt like staying in a cosy cabin high up in the mountains.",
          author: "Joel",
          meta: "Singapore"
        },
        {
          text: "Both children and adults appreciated the hot tub and the outdoor shower. It was very practical that the house was stocked with consumables such as toilet paper, soap, washing-up liquid and shampoo.",
          author: "Puck",
          meta: "Summer 2026 · two families"
        },
        {
          text: "The home is beautiful, private and incredibly cosy. The beds were very comfortable. The location was excellent, and we will always treasure the memory of seeing the northern lights from this place.",
          author: "Hannah",
          meta: "January 2026 · Colorado"
        },
        {
          text: "This is a great chalet with the ski resort right nearby! The hosts are friendly and answered questions quickly.",
          author: "Isak",
          meta: "March 2026"
        }
      ]
    },

    location: {
      title: "Location",
      text:
        "The chalet is in Tråstølen near Voss, with the ski lifts right outside the door and a short drive to Voss town centre. The exact address and access details are sent by Airbnb message before arrival.",
      distancesTitle: "Distances",
      distances: [
        { label: "Ski lift / slope", value: "Right outside the door" },
        { label: "Voss Resort", value: "Ski-in / ski-out" },
        { label: "Nearest grocery store", value: "approx. 10 min by car" },
        { label: "Voss centre and train station", value: "approx. 15 min by car" },
        { label: "Myrkdalen", value: "approx. 30 min by car" },
        { label: "Nærøyfjord / Flåm", value: "approx. 1–1.5 h by car" },
        { label: "Hardangerfjord", value: "approx. 1–1.5 h by car" },
        { label: "Bergen", value: "approx. 1.5 h by car" }
      ],
      mapCta: "Open in Google Maps"
    },

    host: {
      title: "Your hosts",
      name: "Michelle and Marius",
      badge: "Superhost",
      text:
        "We live in Bergen and have been hosting for three years. We normally reply within an hour and are happy to help with local tips before and during your stay. Get in touch through Airbnb if there is anything you are wondering about.",
      stats: [
        { value: "5.0", label: "average rating" },
        { value: "37", label: "reviews" },
        { value: "100%", label: "response rate" }
      ]
    },

    cta: {
      title: "Free for your next trip?",
      text: "Rates, calendar and booking are on Airbnb. If you have questions before you book, just get in touch.",
      button: "See available dates on Airbnb"
    },

    manual: {
      title: "House manual",
      intro:
        "Everything you need while you are here — arrival, how things work, and what to do before you leave. Click a section to open it.",
      wifiTitle: "Wi-Fi",
      wifiNetwork: "Network",
      wifiPassword: "Password",
      wifiCopy: "Copy",
      wifiCopied: "Copied",
      checkInLabel: "Check-in",
      checkOutLabel: "Check-out",
      printCta: "Print the manual",
      emergencyTitle: "Important numbers",
      sections: [
        {
          id: "ankomst",
          icon: "key",
          title: "Arrival and smart lock",
          paragraphs: [
            "Check-in is from 15:00, and you check in yourself using the smart lock — there is no need to meet anyone."
          ],
          steps: [
            "TODO: The door code is sent by Airbnb message before arrival.",
            "TODO: Describe how the lock works (enter the code, press …).",
            "TODO: Describe where the spare key is, if there is one.",
            "The driveway down to the garage is steep. Take it slowly, especially in snow and ice — there is also good parking across the road."
          ],
          tip: "If you need an early check-in or late check-out, send us a message in good time. We are flexible when the chalet is free.",
          image: "assets/img/manual-ankomst.jpg",
          video: ""
        },
        {
          id: "jacuzzi",
          icon: "hottub",
          title: "Salt-water hot tub",
          paragraphs: [
            "The hot tub is an Arctic Spa with a salt-water system. It is kept hot all year, around the clock — you do not need to fill or heat it yourself."
          ],
          steps: [
            "Slide the cover off carefully and place it on the cover lifter — not on the ground or in the snow.",
            "Shower before getting in. Soap, shampoo and lotions upset the water balance.",
            "TODO: How to control the temperature and jets (panel / app / button).",
            "Put the cover back on as soon as you are done, otherwise the temperature drops and power use rises.",
            "No glass in or near the hot tub."
          ],
          tip: "The salt water is gentle on skin and hair, but swimwear may fade over time — just like in any spa.",
          image: "assets/img/manual-jacuzzi.jpg",
          video: ""
        },
        {
          id: "badstue",
          icon: "sauna",
          title: "Sauna",
          paragraphs: [
            "TODO: describe where the sauna is and roughly how long it takes to heat up (typically 30–45 minutes)."
          ],
          steps: [
            "TODO: How to switch it on (switch / panel).",
            "TODO: Recommended temperature and maximum time.",
            "Always sit on a towel.",
            "Water on the stones: use the ladle, a little at a time.",
            "Never dry clothes or boots inside the sauna — it is a fire hazard."
          ],
          tip: "Sauna first, then hot tub, then the outdoor shower — that is the order our guests recommend.",
          image: "assets/img/manual-badstue.jpg",
          video: ""
        },
        {
          id: "peis",
          icon: "fire",
          title: "The fireplace",
          paragraphs: [
            "The fireplace in the living room is safe to use, but please read these steps before your first fire."
          ],
          steps: [
            "Open the damper fully before lighting.",
            "Place firelighters at the bottom, then thin logs in a cross pattern.",
            "Light it, leave the door slightly ajar for a couple of minutes, then close it.",
            "Once burning well, push the damper halfway in.",
            "Never add more than three logs at a time, and never leave the fire unattended.",
            "TODO: Where are firewood and firelighters kept, and where is ash emptied (only when completely cold)?"
          ],
          tip: "The chalet has smoke alarms but no carbon monoxide alarm at present. Air the room well if smoke comes back in, and never leave the fire burning while you sleep.",
          image: "assets/img/manual-peis.jpg",
          video: ""
        },
        {
          id: "varme",
          icon: "thermo",
          title: "Heating and air conditioning",
          paragraphs: ["The chalet has air conditioning that both heats and cools."],
          steps: [
            "TODO: Where is the panel or remote, and how do you adjust the temperature?",
            "TODO: Recommended indoor temperature (typically 20–22 °C).",
            "TODO: Do the bedrooms have their own controls?",
            "Keep windows and the terrace door closed while heating or cooling is running."
          ],
          tip: "Turn it down rather than off when you head out for the day — that uses less power than heating up from cold.",
          image: "",
          video: ""
        },
        {
          id: "kjokken",
          icon: "kitchen",
          title: "Kitchen and appliances",
          paragraphs: ["The kitchen is fully equipped for cooking for the whole group."],
          steps: [
            "TODO: Type of cooker/hob and any quirks worth knowing.",
            "TODO: Dishwasher — where are the tablets, and which programme do you recommend?",
            "TODO: Coffee maker — what type, and where are filters or capsules?",
            "Please leave the fridge switched on when you go."
          ],
          tip: "The barbecue on the terrace is great for dinner outside. TODO: note where the gas or charcoal is kept and how to light it.",
          image: "assets/img/manual-kjokken.jpg",
          video: ""
        },
        {
          id: "tv",
          icon: "tv",
          title: "TV, Wi-Fi and sound",
          paragraphs: [
            "The living room TV is a smart TV. You are welcome to sign in to your own streaming accounts — just remember to sign out before you leave."
          ],
          steps: [
            "TODO: How to turn the TV on and select the right source.",
            "The Wi-Fi name and password are at the top of this page.",
            "TODO: Bluetooth speaker or sound system — what is the device called?",
            "If the internet drops: TODO — where is the router, and can it be restarted?"
          ],
          tip: "",
          image: "",
          video: ""
        },
        {
          id: "ski",
          icon: "ski",
          title: "Skis, boots and drying",
          paragraphs: [
            "With ski-in/ski-out you come straight off the slope and inside — which means there needs to be a place for all the wet gear."
          ],
          steps: [
            "TODO: Where do skis, poles and boards go?",
            "TODO: Is there a drying cabinet or boot warmer, and how is it used?",
            "Hang wet outerwear on the hooks, not over the floor indoors.",
            "Please take ski boots off before going into the living room."
          ],
          tip: "",
          image: "assets/img/manual-ski.jpg",
          video: ""
        },
        {
          id: "lading",
          icon: "car",
          title: "Parking, garage and EV charging",
          paragraphs: [
            "There is free parking on the property for five cars, plus a garage with a level 2 EV charger."
          ],
          steps: [
            "The driveway to the garage is steep — take it slowly, especially in snow and ice.",
            "TODO: How do you open the garage door?",
            "TODO: How is the EV charger used — own cable or fixed cable? Is charging included?",
            "In heavy snow there is also good parking across the road."
          ],
          tip: "",
          image: "",
          video: ""
        },
        {
          id: "soppel",
          icon: "trash",
          title: "Waste and recycling",
          paragraphs: ["TODO: Describe how waste is sorted at the chalet and where the bags are kept."],
          steps: [
            "TODO: General waste — which bin and where?",
            "TODO: Paper and cardboard.",
            "TODO: Glass and metal — nearest collection point.",
            "TODO: Deposit bottles."
          ],
          tip: "Please take the full waste bag out when you leave, even if the bin is full.",
          image: "",
          video: ""
        },
        {
          id: "avreise",
          icon: "check",
          title: "Before you leave",
          paragraphs: [
            "Check-out is by 11:00. You do not need to clean, but this short list helps us a lot."
          ],
          steps: [
            "Run the dishwasher, or at least load it.",
            "Throw away food you are not leaving behind and take out the rubbish.",
            "Leave used towels in the shower or the bathroom basket.",
            "Put the cover back on the hot tub and switch off the sauna.",
            "Set the temperature back to normal and close all windows and the terrace door.",
            "Turn off the lights, sign out of streaming services and pull the front door shut."
          ],
          tip: "Left something behind? Send us a message and we will work out how to get it back to you.",
          image: "",
          video: ""
        }
      ]
    },

    rules: {
      title: "House rules",
      intro:
        "This chalet is our home, and we rent it out because we want more people to experience Voss. These rules are here so that both you and the next guest have a good stay.",
      keyPointsTitle: "The short version",
      items: [
        { icon: "clock", title: "Check-in and check-out", text: "Check-in after 15:00, check-out before 11:00. We are flexible when the chalet is free — just message us in good time." },
        { icon: "users", title: "Maximum 9 guests", text: "Everyone must be listed in the booking, children included. Daytime visitors are fine — just let us know." },
        { icon: "moon", title: "Quiet hours", text: "Please be considerate of the neighbours and keep it quiet inside and outside between 23:00 and 07:00." },
        { icon: "party", title: "No parties", text: "The chalet is not suitable for parties or events. A relaxed evening with the people staying here is of course welcome." },
        { icon: "smoke", title: "No smoking indoors", text: "Smoking is not allowed inside, including bedrooms and bathrooms. Outside is fine — please dispose of cigarette ends carefully." },
        { icon: "hottub", title: "Hot tub and sauna", text: "Shower before use, no glass in or near the hot tub, and always put the cover back on afterwards. Children must be supervised." },
        { icon: "fire", title: "Fireplace and candles", text: "Follow the instructions in the house manual. Never leave a fire or candle unattended, and put everything out before bed." },
        { icon: "shoe", title: "Shoes off indoors", text: "Leave ski gear and shoes in the hallway, not in the living room." },
        { icon: "lock", title: "Private storage", text: "The whole chalet is yours. The storage room on the second floor is locked and reserved for the owners." },
        { icon: "shield", title: "Damage and accidents", text: "Accidents happen. Tell us straight away and we will sort it out together — much better than the next guest finding it." }
      ],
      moreTitle: "A few more practical things",
      more: [
        "There is free parking on the property for five cars, and a level 2 EV charger in the garage.",
        "The driveway to the garage is steep and can be demanding in heavy snow. There is also parking across the road.",
        "The chalet has smoke alarms. A carbon monoxide alarm is not currently installed.",
        "There is no video surveillance inside or outside the property.",
        "Pets: send us a message before booking so we can confirm.",
        "Cancellation terms follow the Airbnb listing."
      ],
      contactTitle: "Questions during your stay?",
      contactText: "Send us a message on Airbnb — we normally reply within an hour."
    },

    area: {
      title: "Voss and around",
      intro:
        "Voss is known as Norway's extreme sports capital, but there is just as much quiet hiking, good food and fine swimming. Here are some of our favourites.",
      categories: [
        {
          title: "Winter",
          items: [
            { name: "Voss Resort", desc: "Over 40 km of groomed slopes, with the lifts right outside the door.", meta: "Ski-in / ski-out" },
            { name: "Myrkdalen", desc: "Snow-sure ski resort with plenty of variety if you fancy a change for a day.", meta: "approx. 30 min" },
            { name: "Hanguren", desc: "Take the gondola up from Voss centre for spectacular views and easily accessible trails.", meta: "approx. 15 min" },
            { name: "Northern lights", desc: "On clear winter evenings guests have watched the aurora straight from the terrace.", meta: "From the chalet" }
          ]
        },
        {
          title: "Summer and hiking",
          items: [
            { name: "Lønahorgi", desc: "A well-known summit hike — you can walk straight from the chalet.", meta: "From the door" },
            { name: "Cycling and mountain biking", desc: "Family-friendly paths around Vangsvatnet and demanding trails in the mountains. The gondola takes you and your bike up.", meta: "approx. 15 min" },
            { name: "Rafting and river sports", desc: "Rafting, canyoning and river kayaking with experienced guides in Voss centre.", meta: "approx. 15 min" },
            { name: "Paragliding and skydiving", desc: "Tandem flights from the mountain, or skydiving from the airfield at Bømoen.", meta: "approx. 20 min" },
            { name: "Voss Golf Club", desc: "A scenic 9-hole course for beginners and experienced players alike.", meta: "approx. 20 min" },
            { name: "Swimming in Vangsvatnet", desc: "A nice beach popular with locals and visitors alike.", meta: "approx. 15 min" }
          ]
        },
        {
          title: "Food, culture and family",
          items: [
            { name: "Tre Brør", desc: "A friendly café and bar in the centre — good for lunch or an après-ski beer.", meta: "approx. 15 min" },
            { name: "Park Hotel Vossevangen", desc: "Local food in the centre, good for dinner out.", meta: "approx. 15 min" },
            { name: "Voss Folk Museum", desc: "Local history in beautiful surroundings.", meta: "approx. 15 min" },
            { name: "Vossabadet", desc: "Indoor pool, outdoor pool and a children's area — perfect on a rainy day.", meta: "approx. 15 min" },
            { name: "Bømoen", desc: "Walking trails, cycling and playgrounds the children love.", meta: "approx. 20 min" }
          ]
        },
        {
          title: "Day trips",
          items: [
            { name: "Flåm Railway and the Nærøyfjord", desc: "One of the world's most beautiful train journeys, and a UNESCO-listed fjord.", meta: "approx. 1–1.5 h" },
            { name: "Hardangerfjord", desc: "Waterfalls, orchards and fjord — a great day out.", meta: "approx. 1–1.5 h" },
            { name: "Bergen", desc: "Bryggen, Mount Fløyen and the fish market. A good stop on the way to or from the airport.", meta: "approx. 1.5 h" }
          ]
        },
        {
          title: "Practical",
          items: [
            { name: "Grocery stores", desc: "Several to choose from, all a short drive away.", meta: "approx. 10 min" },
            { name: "Vinmonopolet Voss", desc: "The state alcohol shop in the centre. Short hours on Saturday, closed Sunday.", meta: "approx. 15 min" },
            { name: "Pharmacy and out-of-hours clinic", desc: "Both in the centre. Medical helpline: 116 117.", meta: "approx. 15 min" },
            { name: "Voss train station", desc: "Trains to Bergen and Oslo — handy if someone arrives without a car.", meta: "approx. 15 min" }
          ]
        }
      ]
    },

    footer: {
      about: "A modern rental chalet in Tråstølen, Voss, with ski-in/ski-out, a sauna and a salt-water hot tub. Booking through Airbnb.",
      linksTitle: "Pages",
      contactTitle: "Contact",
      bookTitle: "Booking",
      bookText: "Calendar, rates and reservations are on Airbnb.",
      rights: "All rights reserved."
    },

    common: {
      back: "Back to the home page",
      close: "Close",
      openMenu: "Menu",
      langLabel: "Language",
      themeLabel: "Switch between light and dark theme",
      imagePlaceholder: "Photo coming"
    }
  }
};
