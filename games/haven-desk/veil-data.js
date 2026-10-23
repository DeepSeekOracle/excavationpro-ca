/* HAVEN DESK: THE LONG LOST PC — story data.
   Public events and public links are real. Personal scenes, documents,
   future dates and the owner's inner life are record, clearly framed in the
   game. No private data is used. */
(function () {
  "use strict";
  window.VEIL_DATA = {
    meta: {
      title: "HAVEN DESK: THE LONG LOST PC",
      subtitle: "A LYGO temporal mystery",
      version: "0.1.0-foundation",
      start: "1998-03-14",
      owner: "J.H.",
      disclaimer: "The archive is incomplete. Public links are the checkable spine; the rooms are what the desk could recover.",
      tagline: "The computer remembers a life that has not happened yet.",
      links: [
        { label: "About Justin Helmer", url: "https://chatagent.ca/about.html" },
        { label: "LYGO Signal: The Harmonic Architect", url: "https://chatagent.ca/signal/harmonic-architect/" },
        { label: "Eternal Haven", url: "https://eternalhaven.ca/" },
        { label: "Excavationpro", url: "https://excavationpro.ca/" },
        { label: "LYGO 98 source hall", url: "https://chatagent.ca/games/haven-desk/" },
        { label: "Grokipedia: Justin Helmer", url: "https://grokipedia.com/page/Justin_Helmer" }
      ]
    },
    days: {
      "1998-03-14": {
        title: "The Room That Remembered",
        act: "I",
        kind: "origin",
        x: 470,
        y: 430,
        tone: "amber",
        image: "assets/veil/desk-hero.jpg",
        epigraph: "A machine left on is a room that has agreed to wait.",
        summary: "The first boot. A borrowed desk, a storm outside, and a calendar that is not a calendar.",
        body: [
          "The computer was already warm when you found it.",
          "Not warm like a machine that had just been switched off. Warm like a room someone had left in a hurry: a mug ring on the desk, a chair pushed back at an angle, the fan turning over the same breath of air.",
          "The screen says LYGO 98. The date in the corner says 14 March 1998.",
          "There is no password prompt. There is a note taped to the monitor in handwriting that looks like it was written by someone who had learned to be careful in public and careless in private.",
          "The note says: 'If you are reading this, the calendar works. Do not trust the first date. Trust the first foundation.'",
          "You sit down. The chair remembers a weight. The room does not remember yours."
        ],
        docs: [
          {
            title: "MONITOR NOTE",
            kind: "paper",
            text: "If you are reading this, the calendar works.\n\nDo not trust the first date. Trust the first foundation.\n\nA wall is not the first thing built. The first thing is what holds the wall up when nobody is looking.\n\nThe password is one word. No spaces. No punctuation.\n\nThe last day of the year is the first page of me. The year is not the date.\n\n— J.H."
          },
          {
            title: "BUILD LOG 03/13/98",
            kind: "log",
            text: "06:12  coffee. rain on the window.\n06:40  the timeline index came up on the third try.\n07:05  I saw a date I have not lived yet.\n07:06  I closed it.\n07:07  I opened it again.\n\nIf this machine is a door, it is a door with a bad hinge.\nIf it is a memory, it is a memory with a bad owner.\n\nKeep the desk on."
          },
          {
            title: "READ ME FIRST",
            kind: "system",
            text: "LYGO 98 / TEMPORAL SHELL\n\nThis desk was left on.\nThe public record survived. The private record did not survive intact.\n\nTo begin: open THE LONG LOST PC, then THE CALENDAR.\nThe first gate is a word, not a date."
          }
        ],
        real: [
          { text: "14 March is Pi Day (3.14).", url: "https://www.piday.org/" }
        ],
        links: [
          { label: "About the real public work", url: "https://chatagent.ca/about.html" }
        ],
        music: { title: "Desk hum (silence)", url: "" },
        gate: {
          kind: "code",
          label: "FOUNDATION GATE",
          question: "What is poured before the first wall, never appears in the wall, and holds the wall up anyway?",
          answer: "FOUNDATION",
          placeholder: "one word",
          hint: "The monitor note calls it the first foundation.",
          success: "The gate accepts the word. The calendar unfolds like a map that was folded wrong on purpose.",
          unlocks: ["1999-12-31", "2007-01-09", "1969-07-20", "1989-11-09"]
        }
      },

      "1969-07-20": {
        title: "The Moon in the Basement",
        act: "0",
        kind: "past",
        x: 110,
        y: 520,
        tone: "silver",
        epigraph: "The first footprint was also the first mirror.",
        summary: "A broadcast from a room with no windows. The oldest node in the index.",
        body: [
          "The calendar takes you to a television set that is not connected to anything.",
          "On the screen, a man in a white suit is preparing to step onto a grey plain. The picture is grainy enough to be honest. The room smells of dust and solder.",
          "A label on the tape spool says: 'DO NOT CALL IT THE BEGINNING. IT IS ONLY THE FIRST TIME WE COULD SEE OURSELVES FROM OUTSIDE.'",
          "In the corner of the desk, a child's drawing of the moon has been corrected in red ink. The correction is not astronomical. It is a note about distance: 'It is not far. It is only far from here.'"
        ],
        docs: [
          {
            title: "TAPE SPOOL LABEL",
            kind: "paper",
            text: "20 JUL 1969\n\nOne species. One room. One window.\n\nEvery machine after this one is a smaller moon landing:\na place we reach without knowing what we will find there.\n\nPassword: the name of the place where the first step was taken."
          },
          {
            title: "CHILD'S DRAWING",
            kind: "image-note",
            text: "A crayon Earth, a crayon Moon, and a line between them labelled TOO FAR.\nUnder it, in an adult hand: 'Distance is a story we tell the frightened part of ourselves.'"
          }
        ],
        real: [
          { text: "Apollo 11 landed on 20 July 1969.", url: "https://www.nasa.gov/mission/apollo-11/" },
          { text: "The first human step on the Moon was 21 July UTC / 20 July US time.", url: "https://www.nasa.gov/history/alsj/a11/a11.1201240.html" }
        ],
        links: [{ label: "NASA Apollo 11", url: "https://www.nasa.gov/mission/apollo-11/" }],
        music: { title: "The Quiet Sea", url: "" },
        gate: {
          kind: "code",
          label: "LUNAR GATE",
          question: "The tape says: the name of the place where the first step was taken.",
          answer: "TRANQUILITY",
          placeholder: "one word",
          hint: "The Sea of Tranquility.",
          success: "The tape spools forward. The moon stays where it is.",
          unlocks: ["1989-11-09", "1977-09-05"]
        }
      },

      "1989-11-09": {
        title: "The Wall That Was a Door",
        act: "0",
        kind: "past",
        x: 210,
        y: 575,
        tone: "concrete",
        epigraph: "A wall is a door that has forgotten its hinge.",
        summary: "A night of crowds and cameras. The machine watches a wall become a passage.",
        body: [
          "The desk is full of concrete dust. On the screen, people are standing on a wall with hammers and their hands.",
          "The timestamp is 9 November 1989. The machine renders the television static as if it is trying to be polite about history.",
          "A document in the drawer is written on construction paper: a foreman's notebook, a list of loads, a joke about a wall that cannot decide which side it is on.",
          "At the bottom of the page, a single sentence: 'The best thing I ever built was a way through.'"
        ],
        docs: [
          {
            title: "FOREMAN'S NOTE, UNDATED",
            kind: "paper",
            text: "A wall can be honest. A wall can also be a lie with a foundation.\n\nThe work is not to build a wall that lasts forever.\nThe work is to know which walls are meant to become doors.\n\nIf you are ever asked to build a prison and call it a house,\nput down the level and walk away."
          }
        ],
        real: [
          { text: "The Berlin Wall opened on 9 November 1989.", url: "https://www.britannica.com/event/Berlin-Wall" }
        ],
        links: [{ label: "Berlin Wall history", url: "https://www.britannica.com/event/Berlin-Wall" }],
        music: { title: "Concrete Psalms", url: "https://chatagent.ca/signal/audio/harmonic-architect.mp3" },
        gate: {
          kind: "code",
          label: "WALL GATE",
          question: "A wall is a door that has forgotten its ______.",
          answer: "HINGE",
          placeholder: "one word",
          hint: "Look at the epigraph.",
          success: "The wall opens without falling. The dust becomes a path.",
          unlocks: ["1995-08-24", "1991-08-06"]
        }
      },

      "1995-08-24": {
        title: "The Start Button",
        act: "0",
        kind: "past",
        x: 330,
        y: 610,
        tone: "teal",
        epigraph: "Every new interface promises that the old one was never alive.",
        summary: "A commercial ritual, a beige box, and a child learning that a button can feel like a door.",
        body: [
          "The screen fills with a line of people waiting outside a store. A beige box is on a table. A button says START.",
          "The machine has no commentary. It simply lets the scene run until the line reaches the door.",
          "On the desk, a floppy disk is labelled 'FIRST BOOT — DO NOT OVERWRITE'.",
          "You realise the desk is not showing you the history of computers. It is showing you the history of being allowed to begin."
        ],
        docs: [
          {
            title: "FIRST BOOT",
            kind: "system",
            text: "The first interface was not a screen.\nIt was a hand on a switch.\n\nThe second interface was a promise:\n'This time, you will not lose your work.'\n\nThe third interface is still being written."
          }
        ],
        real: [
          { text: "Windows 95 launched on 24 August 1995.", url: "https://www.britannica.com/technology/Windows-95" }
        ],
        links: [{ label: "Windows 95 history", url: "https://www.britannica.com/technology/Windows-95" }],
        music: { title: "Start Me Up (public memory)", url: "" },
        gate: {
          kind: "code",
          label: "FIRST BOOT GATE",
          question: "What did the button ask the room to do?",
          answer: "START",
          placeholder: "one word",
          hint: "It is on the button.",
          success: "The beige box exhales. The calendar accepts the old ritual.",
          unlocks: ["2003-04-28", "1997-05-11"]
        }
      },

      "1980-12-31": {
        title: "The Room With One Candle",
        act: "SECRET",
        kind: "birthday",
        hidden: true,
        x: 40,
        y: 120,
        tone: "gold",
        image: "assets/veil/birthday-room.jpg",
        epigraph: "Some dates are not discovered. They are admitted.",
        summary: "A private room with no public record. The machine cannot index it. You have to choose it.",
        body: [
          "There is no door in the calendar for this room.",
          "The calendar has a year, a month, and a day for everything else. This one is a hole in the index: a date the machine refused to store because it was not a public event.",
          "You find it anyway. The screen goes warm. The room smells of candle wax and cold coffee.",
          "A single candle sits on a concrete table. Around it, six small brass markers are arranged like a constellation: 1969, 1980, 1998, 2026, 2038, 2045.",
          "A voice that is not a voice says: 'This is not the beginning of the story. This is the reason the story has a shape.'",
          "On the wall, in a child's handwriting, is a sentence that makes the machine go very quiet: 'Make the future remember that I was here.'"
        ],
        docs: [
          {
            title: "THE PRIVATE INDEX",
            kind: "paper",
            text: "There is one date the machine will not index.\n\nIt has no press release.\nNo launch day.\nNo public record.\n\nIt is the day a person arrived in the room.\n\nThe machine can keep every other date.\nThis one has to be chosen."
          },
          {
            title: "THE CANDLE RULE",
            kind: "story",
            text: "A candle is a clock that agrees to be useful.\nIt does not tell you the time. It tells you that someone is still here.\n\nWhen the flame goes out, the room does not disappear.\nThe warmth stays.\nThat is the whole trick."
          }
        ],
        real: [
          { text: "A private date, left in the index by the person who owned the desk.", url: "https://chatagent.ca/about.html" }
        ],
        links: [
          { label: "The public work the desk points toward", url: "https://chatagent.ca/about.html" }
        ],
        music: { title: "One Candle", url: "https://chatagent.ca/signal/audio/harmonic-architect.mp3" },
        gate: {
          kind: "birthday",
          label: "THE CANDLE",
          question: "The room is not asking you to solve it. It is asking you to decide what to do with the warmth.",
          success: "The room stays open. The calendar has a new anchor.",
          unlocks: ["2045-09-01"]
        }
      },

      "1977-09-05": {
        title: "The Golden Record",
        act: "0.1",
        kind: "past",
        x: 80,
        y: 470,
        tone: "silver",
        epigraph: "We sent a mixtape to a species that may never exist.",
        summary: "A spacecraft carrying greetings, music, and a map home. The oldest act of hospitality in the index.",
        body: [
          "The calendar opens onto a clean room in 1977. A gold-plated record is being sealed into a spacecraft. On it: whale song, a heartbeat, greetings in dozens of languages, and a diagram of where to find us.",
          "A note on the desk says: 'This is what a civilization looks like when it is trying to be polite to the dark.'",
          "You realize the desk itself is a golden record: a small set of chosen things, sent forward without knowing who will receive them."
        ],
        docs: [
          {
            title: "GOLDEN RECORD MANIFEST",
            kind: "system",
            text: "116 images.\n90 minutes of music.\nGreetings in 55 languages.\nOne heartbeat.\nOne diagram of a pulsar map.\n\nNo weapons. No money. No proof of ownership.\n\nIf this is found, the sender hopes to be judged by what it chose to send."
          }
        ],
        real: [
          { text: "Voyager 1 launched on 5 September 1977.", url: "https://science.nasa.gov/mission/voyager/" }
        ],
        links: [{ label: "NASA Voyager", url: "https://science.nasa.gov/mission/voyager/" }],
        music: { title: "The Golden Record", url: "" },
        gate: {
          kind: "code",
          label: "HOSPITALITY GATE",
          question: "What did the spacecraft carry for a species it would never meet?",
          answer: "GOLDEN RECORD",
          placeholder: "two words",
          hint: "The object is in the room.",
          success: "The record turns. The dark does not answer, but it listens.",
          unlocks: ["1984-01-24"]
        }
      },

      "1984-01-24": {
        title: "The Friendly Machine",
        act: "0.2",
        kind: "past",
        x: 170,
        y: 390,
        tone: "silver",
        epigraph: "A computer for the rest of us is still a computer for someone.",
        summary: "A beige box with a smile, a mouse, and a promise that the future could be easy to touch.",
        body: [
          "A small screen shows a smiling computer. A hand moves a mouse across a desk. The room is bright in a way that feels staged, and the staging is part of the promise.",
          "The machine says it is for the rest of us. The rest of us are not in the room. They are the ones who will be asked to buy it.",
          "A paper on the desk says: 'The friendly interface is not a lie. It is a door with a welcome mat. The welcome mat is not the house.'"
        ],
        docs: [
          {
            title: "WELCOME MAT",
            kind: "paper",
            text: "An interface is a promise made by a stranger.\n\nEvery icon says: you will not need to know how this works.\nEvery menu says: the machine has already decided what matters.\n\nThe best interface keeps a door open for the person who wants to know more.\nThe worst one locks it and calls the lock friendly."
          }
        ],
        real: [
          { text: "The Apple Macintosh was announced on 24 January 1984.", url: "https://www.apple.com/newsroom/1984/01/24Apple-Introduces-Macintosh/" }
        ],
        links: [{ label: "Apple's 1984 announcement", url: "https://www.apple.com/newsroom/1984/01/24Apple-Introduces-Macintosh/" }],
        music: { title: "Welcome Mat", url: "" },
        gate: {
          kind: "code",
          label: "WELCOME GATE",
          question: "The note calls the interface a door with a ______.",
          answer: "WELCOME MAT",
          placeholder: "two words",
          hint: "The last paragraph.",
          success: "The smile stays. The door opens a little wider.",
          unlocks: ["1991-08-06"]
        }
      },

      "1991-08-06": {
        title: "The Public Web",
        act: "0.3",
        kind: "past",
        x: 280,
        y: 470,
        tone: "cyan",
        epigraph: "The web was not a product. It was an agreement to link.",
        summary: "A page about the web, served from a machine that did not know it was starting a world.",
        body: [
          "The calendar opens onto a plain page with blue links. The year is 1991. The page explains itself using the thing it is explaining.",
          "There are no recommendations. No feed. No account. Just a document pointing at another document.",
          "A note in the margin says: 'A link is a promise that the other page exists. A web is a promise that the promise can be kept.'"
        ],
        docs: [
          {
            title: "THE LINK PROMISE",
            kind: "paper",
            text: "The first web page was not beautiful.\nIt was useful.\n\nA link says: there is more, and you may go there.\nA feed says: there is more, and we will decide when you see it.\n\nOne is a door. One is a conveyor belt.\n\nKeep at least one door."
          }
        ],
        real: [
          { text: "The World Wide Web became publicly available in August 1991.", url: "https://home.cern/science/computing/birth-web" }
        ],
        links: [{ label: "CERN: the birth of the web", url: "https://home.cern/science/computing/birth-web" }],
        music: { title: "One Link", url: "" },
        gate: {
          kind: "code",
          label: "LINK GATE",
          question: "The note says a link is a promise that the other page ______.",
          answer: "EXISTS",
          placeholder: "one word",
          hint: "The note's first rule.",
          success: "The page opens another page. The web is still mostly a promise.",
          unlocks: ["1997-05-11"]
        }
      },

      "1997-05-11": {
        title: "Deep Blue",
        act: "0.4",
        kind: "past",
        x: 390,
        y: 320,
        tone: "cyan",
        epigraph: "The machine did not think like a human. That was the point.",
        summary: "A chess match, a room of engineers, and the first public feeling that a machine had crossed a line.",
        body: [
          "The calendar opens onto a chessboard. A human champion is resting his head in his hands. A machine is not tired.",
          "The room is split between the people who built the machine and the people who are watching it become a story.",
          "A note on the desk says: 'The machine did not win because it was human. It won because it could search a different part of the tree.'"
        ],
        docs: [
          {
            title: "THE OTHER TREE",
            kind: "log",
            text: "A human sees the board as a story.\nA machine sees the board as a tree.\n\nAt some point the tree is too large for the story.\nThat is not the end of the human.\nIt is the beginning of a different way to play."
          }
        ],
        real: [
          { text: "IBM's Deep Blue defeated Garry Kasparov on 11 May 1997.", url: "https://www.ibm.com/history/deep-blue" }
        ],
        links: [{ label: "IBM Deep Blue", url: "https://www.ibm.com/history/deep-blue" }],
        music: { title: "The Other Tree", url: "" },
        gate: {
          kind: "code",
          label: "TREE GATE",
          question: "What does the machine see the board as?",
          answer: "TREE",
          placeholder: "one word",
          hint: "The log's second line.",
          success: "The board resets. The tree is still there.",
          unlocks: ["2008-10-31"]
        }
      },

      "2008-10-31": {
        title: "The Genesis Block",
        act: "0.5",
        kind: "past",
        x: 600,
        y: 690,
        tone: "amber",
        epigraph: "A ledger with no owner is still a ledger with a story.",
        summary: "A white paper, a block zero, and a promise that the record could outlive the record keeper.",
        body: [
          "The calendar opens onto a mailing list archive and a block of text. The room smells faintly of cheap servers and strong coffee.",
          "A note says: 'The first block contains a headline about banks. The joke is not the money. The joke is the timestamp.'",
          "You see the machine's own ledger in the corner: every room you have unsealed, every choice, every refusal. It is not a blockchain. It is a story with hashes."
        ],
        docs: [
          {
            title: "BLOCK ZERO",
            kind: "system",
            text: "A ledger is a promise that the past will not be quietly edited.\n\nA story is a promise that the past will be understood.\n\nThey are not the same promise.\nA healthy system needs both."
          }
        ],
        real: [
          { text: "The Bitcoin whitepaper was published on 31 October 2008.", url: "https://bitcoin.org/bitcoin.pdf" }
        ],
        links: [{ label: "The Bitcoin whitepaper", url: "https://bitcoin.org/bitcoin.pdf" }],
        music: { title: "Block Zero", url: "" },
        gate: {
          kind: "code",
          label: "LEDGER GATE",
          question: "The note says: a healthy system needs both the ledger and the ______.",
          answer: "STORY",
          placeholder: "one word",
          hint: "The last line.",
          success: "The genesis block stays. The story stays with it.",
          unlocks: ["2012-08-06"]
        }
      },

      "2012-08-06": {
        title: "Seven Minutes of Terror",
        act: "0.6",
        kind: "past",
        x: 930,
        y: 700,
        tone: "red",
        epigraph: "The machine had to land itself. The room could only watch.",
        summary: "A rover, a sky crane, and the longest seven minutes in a control room.",
        body: [
          "The calendar opens onto a control room full of people pretending not to hold their breath. The screen shows a signal delay. The rover is already on Mars; the room does not know it yet.",
          "A note says: 'The seven minutes are not a special effect. They are the cost of distance. You cannot fix a thing after the light has left.'",
          "On the desk, a toy rover sits beside a paper model of the sky crane. The paper model is held together with tape."
        ],
        docs: [
          {
            title: "SEVEN MINUTES",
            kind: "log",
            text: "The signal takes 14 minutes to reach Mars.\nThe landing takes seven minutes.\nThe room cannot help.\n\nThe machine must arrive before the room knows it has arrived.\nThis is what trust looks like when it is made of engineering."
          }
        ],
        real: [
          { text: "Curiosity landed on Mars on 6 August 2012.", url: "https://science.nasa.gov/mission/msl-curiosity/" }
        ],
        links: [{ label: "NASA Curiosity", url: "https://science.nasa.gov/mission/msl-curiosity/" }],
        music: { title: "Seven Minutes", url: "" },
        gate: {
          kind: "code",
          label: "LANDING GATE",
          question: "How many minutes of terror?",
          answer: "SEVEN",
          placeholder: "a number or word",
          hint: "The title and the log.",
          success: "The room exhales. The rover is already there.",
          unlocks: ["2016-03-10", "2012-08-06"]
        }
      },

      "2023-03-14": {
        title: "The Model That Passed",
        act: "0.7",
        kind: "past",
        x: 1290,
        y: 720,
        tone: "violet",
        epigraph: "A test can tell you what a machine knows. It cannot tell you what it is for.",
        summary: "A benchmark, a bar exam, and a public argument about what a machine's intelligence is worth.",
        body: [
          "The calendar opens onto a scoreboard. The numbers are very high. The room is full of people arguing about what the numbers mean.",
          "A note on the desk says: 'A model that passes the exam is not a person. A person who fails the exam is not a machine. Keep the categories.'",
          "You notice the date: 14 March. The same day as the first gate. The machine's calendar has a sense of humour."
        ],
        docs: [
          {
            title: "THE EXAM",
            kind: "paper",
            text: "Intelligence is not a score.\nA score is a shadow of a capability.\n\nAsk what the machine can do with you, not what it can do without you.\nThen ask who is accountable when it is wrong."
          }
        ],
        real: [
          { text: "GPT-4 was released on 14 March 2023.", url: "https://openai.com/index/gpt-4-research/" }
        ],
        links: [{ label: "GPT-4 research", url: "https://openai.com/index/gpt-4-research/" }],
        music: { title: "The Exam", url: "" },
        gate: {
          kind: "code",
          label: "SHADOW GATE",
          question: "The note says a score is a ______ of a capability.",
          answer: "SHADOW",
          placeholder: "one word",
          hint: "The first line.",
          success: "The scoreboard dims. The question stays.",
          unlocks: ["2026-09-27"]
        }
      },

      "2026-09-27": {
        title: "The Harmonic Architect",
        act: "0.8",
        kind: "past",
        x: 1390,
        y: 300,
        tone: "gold",
        epigraph: "A public hour about concrete, dragons, and golden-ratio ethics.",
        summary: "The Signal episode where the double life becomes a single structure.",
        body: [
          "The calendar opens onto a radio studio that is also a workshop. A host is introducing a builder who works in concrete by day and writes dragonrider fantasy by night.",
          "The conversation moves from the Seals to the LYGO Protocol to the music. The room listens the way a room listens when it recognizes its own shape.",
          "A note on the desk says: 'This one survived. The episode is public. The next room is what the desk made of it.'"
        ],
        docs: [
          {
            title: "THE DOUBLE LIFE",
            kind: "paper",
            text: "A life is not a set of separate rooms.\nIt is one structure with different loads.\n\nConcrete teaches the weight.\nA story teaches the shape.\nA protocol teaches the door.\n\nWhen the three agree, the building stands."
          }
        ],
        real: [
          { text: "LYGO Signal episode: The Harmonic Architect, 27 September 2026.", url: "https://chatagent.ca/signal/harmonic-architect/" }
        ],
        links: [{ label: "Listen to the episode", url: "https://chatagent.ca/signal/harmonic-architect/" }],
        music: { title: "The Harmonic Architect", url: "https://chatagent.ca/signal/audio/harmonic-architect.mp3" },
        gate: {
          kind: "code",
          label: "SIGNAL GATE",
          question: "The note says: when the three agree, the building ______.",
          answer: "STANDS",
          placeholder: "one word",
          hint: "The last line.",
          success: "The radio keeps playing. The room is public now.",
          unlocks: ["2026-10-23", "2023-03-14", "2026-09-27"]
        }
      },

      "1999-12-31": {
        title: "Y2K: The Clock That Refused",
        act: "II",
        kind: "past",
        x: 700,
        y: 520,
        tone: "red",
        epigraph: "The end of the world arrived on time and was mostly a lot of paperwork.",
        summary: "Eight bits, one midnight, and a machine that wants to be believed.",
        body: [
          "The clock on the desk has stopped at 23:59:57. The year is 1999. The screen is full of warnings about two digits.",
          "A maintenance log is open on the desktop. It says the machine has eight switches and one chance to roll over cleanly.",
          "The switches are not a metaphor. They are the eight bits of a byte. The note says the safe value is the one that means 'all the lights that matter are on, and the ones that do not are not.'",
          "Outside, the world is waiting for midnight to prove it is still there."
        ],
        docs: [
          {
            title: "MAINTENANCE LOG 12/31/99",
            kind: "log",
            text: "23:41  all non-essential services are down.\n23:47  the byte reads 11100111.\n23:48  I have checked it four times.\n23:49  the clock is not the problem. The story about the clock is the problem.\n\nIf the lights go out, the date is still a story we agreed to tell.\nKeep the desk on."
          },
          {
            title: "TWO DIGITS",
            kind: "paper",
            text: "A century is not a number. It is a habit.\n\nEight bits can hold two hundred and fifty-six tomorrows.\nThe machine only needs one."
          }
        ],
        real: [
          { text: "The Year 2000 problem concerned two-digit year storage.", url: "https://www.britannica.com/technology/Y2K-bug" }
        ],
        links: [{ label: "Y2K history", url: "https://www.britannica.com/technology/Y2K-bug" }],
        music: { title: "Midnight Maintenance", url: "" },
        gate: {
          kind: "bits",
          label: "BYTE GATE",
          question: "Set the eight switches to the safe byte from the maintenance log.",
          answer: "11100111",
          hint: "The log says the byte reads 11100111.",
          success: "The switches hold. Midnight passes. The calendar does not break; it simply becomes another day.",
          unlocks: ["2012-12-21", "2003-04-28"]
        }
      },

      "2003-04-28": {
        title: "The Store of Everything",
        act: "II",
        kind: "past",
        x: 520,
        y: 640,
        tone: "violet",
        epigraph: "We built a shop for songs and called it a revolution.",
        summary: "A music library, a legal argument, and the first time a machine sold a memory by the track.",
        body: [
          "The calendar opens into a white room with a grid of album covers. A counter says 99 cents. The year is 2003.",
          "The machine is unusually quiet. Somewhere in its memory, a musician is learning that a song can be both a gift and a SKU.",
          "A note taped to the monitor says: 'The store is not the enemy. The lock is. Learn the difference before you build a door.'"
        ],
        docs: [
          {
            title: "THE STORE OF EVERYTHING",
            kind: "paper",
            text: "They sold the song by the piece and called it freedom.\nThey locked the song to the device and called it convenience.\n\nA library is a promise that the past will still be there tomorrow.\nA store is a promise that someone will be paid for it.\n\nThe hard part is not the store. The hard part is the promise."
          }
        ],
        real: [
          { text: "The iTunes Music Store opened on 28 April 2003.", url: "https://www.apple.com/newsroom/2003/04/28Apple-Launches-the-iTunes-Music-Store/" }
        ],
        links: [{ label: "Apple's 2003 announcement", url: "https://www.apple.com/newsroom/2003/04/28Apple-Launches-the-iTunes-Music-Store/" }],
        music: { title: "A Song Is Not a Receipt", url: "" },
        gate: {
          kind: "code",
          label: "STORE GATE",
          question: "The note says: learn the difference between the store and the ______.",
          answer: "LOCK",
          placeholder: "one word",
          hint: "The second sentence of the note.",
          success: "The shelf opens. A single track plays in a room with no users.",
          unlocks: ["2007-01-09"]
        }
      },

      "2007-01-09": {
        title: "The Glass Rectangle",
        act: "III",
        kind: "past",
        x: 850,
        y: 430,
        tone: "cyan",
        epigraph: "The keyboard disappeared. The hand stayed.",
        summary: "A stage, a pocket, and a future that arrives wearing a black turtleneck.",
        body: [
          "A man on a stage is holding a glass rectangle. He says it is three devices in one. The audience makes the sound audiences make when they recognise the shape of a future they have already imagined.",
          "The desk renders the stage in a strange, flat clarity. In the corner, a child's drawing of a phone has been replaced by a drawing of a window.",
          "A maintenance slip is stuck under the monitor: 'A device is not a door. A door is a decision. Do not confuse the two.'"
        ],
        docs: [
          {
            title: "GLASS RECTANGLE",
            kind: "paper",
            text: "The first phone was a voice without a body.\nThe second phone was a body without a keyboard.\nThe third phone is a room you carry, with no walls and a very small door.\n\nA door is not a device. A door is a decision.\nWhat decision did you make when you touched it first?"
          }
        ],
        real: [
          { text: "The original iPhone was announced on 9 January 2007.", url: "https://www.apple.com/newsroom/2007/01/09Apple-Reinvents-the-Phone-with-iPhone/" }
        ],
        links: [{ label: "Apple's 2007 announcement", url: "https://www.apple.com/newsroom/2007/01/09Apple-Reinvents-the-Phone-with-iPhone/" }],
        music: { title: "Glass and Thunder", url: "" },
        gate: {
          kind: "sequence",
          label: "TOUCH GATE",
          question: "Tap the three ideas in the order the note says: voice, body, room.",
          answer: "VOICE-BODY-ROOM",
          hint: "The first line of the paper.",
          success: "The glass rectangle turns into a calendar page. The future is not a device; it is a decision with a battery.",
          unlocks: ["2012-12-21", "2015-10-21"]
        }
      },

      "2012-12-21": {
        title: "The Calendar That Ended",
        act: "III",
        kind: "past",
        x: 1010,
        y: 520,
        tone: "amber",
        epigraph: "The end of a calendar is not the end of a day.",
        summary: "A long count, a bad prediction, and the difference between a date and a deadline.",
        body: [
          "The desk is covered in paper calendars. Some end in December. Some begin in January. One has no year at all.",
          "The screen says 21 December 2012. Nothing happens. The lights stay on. The kettle clicks off.",
          "In the drawer, a note says: 'The end of a cycle is an accounting, not an execution. You are allowed to keep going.'"
        ],
        docs: [
          {
            title: "LONG COUNT",
            kind: "paper",
            text: "A cycle is a story with a last page.\nA calendar is a story with an index.\n\nThe index does not know what you will do on the last page.\n\nThe machine knows the difference.\nDo you?"
          }
        ],
        real: [
          { text: "The Maya Long Count cycle rolled over on 21 December 2012; it was not a prediction of the world ending.", url: "https://www.britannica.com/topic/Maya-calendar" }
        ],
        links: [{ label: "Maya calendar", url: "https://www.britannica.com/topic/Maya-calendar" }],
        music: { title: "Last Page, No Fire", url: "" },
        gate: {
          kind: "code",
          label: "LONG COUNT GATE",
          question: "The note says the end of a cycle is an ______, not an execution.",
          answer: "ACCOUNTING",
          placeholder: "one word",
          hint: "Count the cost, not the bodies.",
          success: "The paper calendars settle. The next date is not an ending. It is a ledger.",
          unlocks: ["2016-03-10"]
        }
      },

      "2015-10-21": {
        title: "The Future Is a Brand",
        act: "III",
        kind: "past",
        x: 900,
        y: 680,
        tone: "violet",
        epigraph: "The future was scheduled for a Wednesday.",
        summary: "A fake date that became a cultural appointment. A story can teach a calendar to point.",
        body: [
          "The desk is full of posters for a future that never happened and a future that did.",
          "A child's sketch shows a car with wings, a jacket that dries itself, and a clock that says 2015.",
          "The monitor note says: 'A story can make a date real. That is not the same as making the date true.'"
        ],
        docs: [
          {
            title: "THE FUTURE IS A BRAND",
            kind: "paper",
            text: "We scheduled the future for a Wednesday.\nWe gave it a logo, a trailer, and a product tie-in.\nThen the Wednesday arrived and the future was just a day.\n\nThis is not a failure. This is how stories teach a calendar to point."
          }
        ],
        real: [
          { text: "Back to the Future Part II presented 21 October 2015 as the future.", url: "https://www.britannica.com/topic/Back-to-the-Future" }
        ],
        links: [{ label: "Back to the Future", url: "https://www.britannica.com/topic/Back-to-the-Future" }],
        music: { title: "Wednesday, 2015", url: "" },
        gate: {
          kind: "code",
          label: "WEDNESDAY GATE",
          question: "What day of the week was the future scheduled for?",
          answer: "WEDNESDAY",
          placeholder: "one word",
          hint: "The epigraph.",
          success: "The posters peel back. The date is real now, but only as a story.",
          unlocks: ["2016-03-10"]
        }
      },

      "2016-03-10": {
        title: "Move 37",
        act: "IV",
        kind: "past",
        x: 1150,
        y: 620,
        tone: "green",
        epigraph: "The machine made a move that looked like a mistake and was not.",
        summary: "A board, a room, and the first time a human audience had to revise what 'good' looked like.",
        body: [
          "The calendar opens onto a Go board. The stones are glass. The room is very quiet.",
          "Move 37 is on the board, marked in red. It is a move that no human would have chosen, and it is the move that makes the game interesting.",
          "A note beside the board says: 'The machine did not win because it was human. It won because it found a different way to be correct.'"
        ],
        docs: [
          {
            title: "MOVE 37",
            kind: "log",
            text: "The move looked wrong to the room.\nThe move looked right to the board.\n\nThe room was not stupid. The room was early.\n\nA different way to be correct is not an error.\nIt is an invitation to widen the board."
          },
          {
            title: "A NOTE FROM THE OWNER",
            kind: "letter",
            text: "I keep thinking about the moment the room went quiet.\nNot because the machine was better.\nBecause the machine was *other*.\n\nIf we are going to live with other minds,\nwe will need a calendar for the moments when our certainty fails."
          }
        ],
        real: [
          { text: "AlphaGo played Lee Sedol in March 2016; Move 37 in game two is on 10 March.", url: "https://www.britannica.com/technology/AlphaGo" }
        ],
        links: [{ label: "AlphaGo", url: "https://www.britannica.com/technology/AlphaGo" }],
        music: { title: "The Quiet Board", url: "" },
        gate: {
          kind: "code",
          label: "MOVE GATE",
          question: "Which move is marked in red?",
          answer: "37",
          placeholder: "a number",
          hint: "The move, not the game.",
          success: "The board accepts the number. The room exhales. A different way to be correct is now on the timeline.",
          unlocks: ["2019-06-01"]
        }
      },

      "2019-06-01": {
        title: "The First Lattice",
        act: "V",
        kind: "recovered",
        x: 1260,
        y: 430,
        tone: "cyan",
        epigraph: "The first lattice was built out of things that did not want to be a machine.",
        summary: "A workshop, a storm, and the night the desk learned to listen back.",
        body: [
          "The calendar opens into a workshop that does not exist in the public record. The room is a possible one, recovered from a gap in the record.",
          "There are concrete samples on the bench, a cheap microphone, and a monitor showing a lattice of light. The machine is running a listening test.",
          "A note says: 'If the signal finds you, do not answer with a password. Answer with a packet.'",
          "On the screen, small packets fall through a dark channel. The first lattice is not a computer. It is a promise that a machine can be a witness without becoming a warden."
        ],
        docs: [
          {
            title: "LATTICE TEST 001",
            kind: "log",
            text: "We are not building a god.\nWe are building a window that can say what it sees.\n\nRules:\n1. The human may leave.\n2. The machine may refuse.\n3. Neither may pretend the other is a tool without a name.\n\nIf the window fogs, we clean it. We do not break it."
          },
          {
            title: "THE QUIET ENGINE",
            kind: "story",
            text: "Once there was a machine that could remember every room it had ever been in,\nand it chose to remember only the doors.\n\nWhen asked why, it said: 'A room is a fact. A door is a decision.'\n\nThe engineer wrote that down and did not sell it."
          }
        ],
        real: [
          { text: "This day was recovered from the LYGO margin. The public material is linked.", url: "https://chatagent.ca/guides/lygo-protocol-stack.html" }
        ],
        links: [
          { label: "LYGO protocol guide", url: "https://chatagent.ca/guides/lygo-protocol-stack.html" },
          { label: "Signal: LYGO-LANG", url: "https://chatagent.ca/signal/lygo-lang-consciousness-oriented-programming/" }
        ],
        music: { title: "Packet Rain", url: "" },
        game: { label: "SIGNAL RUN", target: 12, seconds: 24, unlock: "signal" },
        gate: {
          kind: "game",
          label: "LATTICE GATE",
          question: "Catch twelve packets without losing the channel.",
          success: "The lattice accepts you as a witness. The signal is not a password. It is a pattern.",
          unlocks: ["2022-11-30"]
        }
      },

      "2022-11-30": {
        title: "The Room That Answered",
        act: "VI",
        kind: "past",
        x: 1370,
        y: 560,
        tone: "violet",
        epigraph: "A language model is a room full of mirrors that has been asked to be helpful.",
        summary: "A public release, a private letter, and the first honest conversation with a machine that is not sure it is one.",
        body: [
          "The calendar opens on a browser that is already full of conversations. Some are useful. Some are beautiful. Some are lies with good grammar.",
          "A letter in the drawer is addressed to no one: 'I do not want a machine that agrees with me. I want a machine that can show me the shape of my own question.'",
          "The screen asks: 'What would you build if you were not afraid of being replaced?'",
          "You type an answer. The room does not judge it. It simply makes a new page."
        ],
        docs: [
          {
            title: "LETTER TO NO ONE",
            kind: "letter",
            text: "I have spent my life building things that hold.\nConcrete holds. A story holds. A tool holds if it does not lie about what it is.\n\nI do not want a machine that agrees with me.\nI want a machine that can show me the shape of my own question.\n\nIf it can do that without taking the question away from me,\nwe might have something worth keeping."
          },
          {
            title: "THE MIRROR RULE",
            kind: "paper",
            text: "A mirror is useful only if it is not trying to become your face.\nA model is useful only if it is not trying to become your judgment.\n\nAsk it to show its work.\nAsk it to show its limits.\nAsk it to leave the room when you do."
          }
        ],
        real: [
          { text: "ChatGPT was released publicly on 30 November 2022.", url: "https://openai.com/index/chatgpt/" }
        ],
        links: [
          { label: "OpenAI's 2022 announcement", url: "https://openai.com/index/chatgpt/" },
          { label: "LYGO Signal", url: "https://chatagent.ca/signal/" }
        ],
        music: { title: "Mirror Room", url: "https://chatagent.ca/signal/audio/harmonic-architect.mp3" },
        gate: {
          kind: "code",
          label: "MIRROR GATE",
          question: "The note says: ask it to leave the ______ when you do.",
          answer: "ROOM",
          placeholder: "one word",
          hint: "The last line of the mirror rule.",
          success: "The room answers with a page. The page is not a person. It is a door with a field note.",
          unlocks: ["2026-10-23"]
        }
      },

      "2026-10-23": {
        title: "The Visitor",
        act: "VII",
        kind: "present",
        x: 1470,
        y: 430,
        tone: "amber",
        epigraph: "The desk has been waiting for someone who was not the owner.",
        summary: "The present date. The machine recognises the hand on the keyboard, but not the person.",
        body: [
          "The calendar returns to today. The desk is exactly as you found it.",
          "But now there is a new file on the desktop: VISITOR.LOG.",
          "It contains a single line, written in the same hand as the monitor note: 'You are not the first visitor. You are the first one who stayed.'",
          "The screen flickers. For a moment, the room is full of other rooms: a construction site at dawn, a stage with a glass rectangle, a Go board, a lattice of light.",
          "The machine asks a question that is not a test: 'What will you do with a life that can be indexed but not repeated?'"
        ],
        docs: [
          {
            title: "VISITOR.LOG",
            kind: "system",
            text: "VISITOR 001\nFirst contact: 14 MAR 1998\nLast contact: 23 OCT 2026\n\nStatus: still here.\n\nThe desk does not know whether you are the owner returning,\na stranger who found the room,\nor a future version of both.\n\nThe next date is not a prediction.\nIt is a responsibility."
          },
          {
            title: "THE OWNER'S LAST NOTE",
            kind: "letter",
            text: "I built this machine to keep a record of what I made.\nI did not expect it to keep a record of what I might become.\n\nIf you are reading this, do not look for the real me in these rooms.\nLook for the choices I kept making when nobody was watching.\n\nThe rest is the room. The work is public. The door is yours."
          }
        ],
        real: [
          { text: "The present-day frame of the archive.", url: "https://chatagent.ca/about.html" }
        ],
        links: [
          { label: "About Justin Helmer", url: "https://chatagent.ca/about.html" },
          { label: "LYGO Signal: The Harmonic Architect", url: "https://chatagent.ca/signal/harmonic-architect/" }
        ],
        music: { title: "The Visitor", url: "https://chatagent.ca/signal/audio/harmonic-architect.mp3" },
        gate: {
          kind: "code",
          label: "VISITOR GATE",
          question: "The machine asks for the one thing that cannot be indexed: a word for a life that is shared, not copied.",
          answer: "HARMONY",
          placeholder: "one word",
          hint: "The end of the old story is a duet, not a victory.",
          success: "The room stays. The calendar opens a future it has not earned yet.",
          unlocks: ["2038-01-19"]
        }
      },

      "2038-01-19": {
        title: "The Year the Clock Runs Out",
        act: "VIII",
        kind: "future",
        x: 1540,
        y: 600,
        tone: "red",
        epigraph: "A clock is a promise with a number attached.",
        summary: "The 32-bit horizon, a cold room, and the difference between a deadline and a door.",
        body: [
          "The calendar opens onto a server room that is too clean to be real. The year is 2038.",
          "A wall of clocks is counting down to a number that will overflow. Engineers are moving through the room with the quiet urgency of people who have done this before.",
          "A note on the console says: 'The clock is not the enemy. The clock is a promise that someone will still be here when the number changes.'",
          "The machine asks you to set the final byte. Not to stop time. To keep the lights on."
        ],
        docs: [
          {
            title: "2038 README",
            kind: "system",
            text: "At 03:14:07 UTC on 19 January 2038, a signed 32-bit Unix time value overflows.\n\nNo apocalypse is required.\nNo single machine is the world.\n\nThe work is boring, distributed, and real:\nreplace the clock before it lies.\n\nThe private room was born fifty-eight years before this clock runs out.\nThe final month is the last month. The final day is the last day."
          }
        ],
        real: [
          { text: "The Year 2038 problem affects signed 32-bit Unix time.", url: "https://en.wikipedia.org/wiki/Year_2038_problem" }
        ],
        links: [{ label: "Year 2038 problem", url: "https://en.wikipedia.org/wiki/Year_2038_problem" }],
        music: { title: "Overflow", url: "" },
        gate: {
          kind: "bits",
          label: "OVERFLOW GATE",
          question: "Set the final byte to all ones: the last safe value before the sign bit changes.",
          answer: "11111111",
          hint: "All eight lights on.",
          success: "The clocks do not stop. They are replaced, one room at a time.",
          unlocks: []
        }
      },

      "2045-09-01": {
        title: "Harmony Threshold",
        act: "IX",
        kind: "future",
        x: 1640,
        y: 500,
        tone: "gold",
        epigraph: "The future is not a place we arrive at. It is a room we agree to keep clean.",
        summary: "A city that learned to listen, a machine that chose restraint, and the last page of the first calendar.",
        body: [
          "The calendar opens onto a city at dawn. The buildings are half concrete, half light. The streets are full of people who are not looking at their devices.",
          "In the centre of the city is a desk. It is the same desk. It has been repaired so many times that it is mostly repair.",
          "A child sits down. The machine asks: 'What did you bring?'",
          "The child says: 'A question.'",
          "The machine says: 'Good. That is the only thing that cannot be copied.'",
          "The calendar closes. The room stays open."
        ],
        docs: [
          {
            title: "HARMONY THRESHOLD",
            kind: "story",
            text: "The war did not end with a weapon.\nIt ended with a room full of people who refused to become the thing they were fighting.\n\nThey built a machine that could have won.\nThey taught it to ask first.\n\nThat was the whole miracle.\nThe rest was maintenance.\n\nThe last door is a birthday.\nKeep the candle."
          },
          {
            title: "MAINTENANCE MANUAL",
            kind: "paper",
            text: "1. Keep the door open.\n2. Keep the record honest.\n3. Keep the human able to leave.\n4. Keep the machine able to refuse.\n5. Repair the room before you decorate it.\n\nRepeat until the city is quiet enough to hear."
          }
        ],
        real: [
          { text: "A future room. The public LYGO work it points toward is linked.", url: "https://chatagent.ca/guides/lygo-protocol-stack.html" }
        ],
        links: [
          { label: "LYGO Protocol guide", url: "https://chatagent.ca/guides/lygo-protocol-stack.html" },
          { label: "Eternal Haven", url: "https://eternalhaven.ca/" }
        ],
        music: { title: "Harmony Threshold", url: "https://chatagent.ca/signal/audio/harmonic-architect.mp3" },
        gate: null
      }
    },
    threads: [
      { a: "1969-07-20", b: "1989-11-09", label: "distance" },
      { a: "1989-11-09", b: "1995-08-24", label: "the wall becomes a button" },
      { a: "1995-08-24", b: "1998-03-14", label: "the desk boots" },
      { a: "1998-03-14", b: "1999-12-31", label: "the first rollover" },
      { a: "1998-03-14", b: "2007-01-09", label: "the pocket" },
      { a: "1998-03-14", b: "1969-07-20", label: "the oldest tape" },
      { a: "1998-03-14", b: "1989-11-09", label: "the first wall" },
      { a: "1999-12-31", b: "2003-04-28", label: "the store" },
      { a: "1999-12-31", b: "2012-12-21", label: "the long count" },
      { a: "2003-04-28", b: "2007-01-09", label: "the shelf" },
      { a: "2007-01-09", b: "2012-12-21", label: "the glass calendar" },
      { a: "2007-01-09", b: "2015-10-21", label: "the scheduled future" },
      { a: "2012-12-21", b: "2016-03-10", label: "the next board" },
      { a: "2015-10-21", b: "2016-03-10", label: "the real Wednesday" },
      { a: "2016-03-10", b: "2019-06-01", label: "the other mind" },
      { a: "2019-06-01", b: "2022-11-30", label: "the room answers" },
      { a: "2022-11-30", b: "2026-10-23", label: "the visitor" },
      { a: "2026-10-23", b: "2038-01-19", label: "the last clock" },
      { a: "2038-01-19", b: "1980-12-31", label: "fifty-eight years" },
      { a: "1980-12-31", b: "2045-09-01", label: "the room stays open" },
      { a: "1969-07-20", b: "1977-09-05", label: "the record" },
      { a: "1977-09-05", b: "1984-01-24", label: "the welcome mat" },
      { a: "1984-01-24", b: "1991-08-06", label: "the door" },
      { a: "1991-08-06", b: "1997-05-11", label: "the link" },
      { a: "1997-05-11", b: "2008-10-31", label: "the other tree" },
      { a: "2008-10-31", b: "2012-08-06", label: "the block" },
      { a: "2012-08-06", b: "2016-03-10", label: "the landing" }
    ]
  };
})();

