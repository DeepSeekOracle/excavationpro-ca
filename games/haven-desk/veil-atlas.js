/* HAVEN DESK ATLAS — 36 additional date rooms.
   Real dates and public links survive. The rest is the room.
   Content is deliberately written as short archive rooms, not filler cards. */
(function () {
  "use strict";
  var D = window.VEIL_DATA;
  if (!D || !D.days) return;

  var ATLAS = [
    {
      id: "1971-11-15", title: "The Little Chip", act: "0.1", kind: "past", tone: "cyan",
      epigraph: "A computer the size of a thumb is still a claim about the future.",
      summary: "The Intel 4004: four bits, one calculator, and the first commercial microprocessor.",
      body: [
        "The calendar opens onto a workbench in 1971. A ceramic chip sits under a magnifier, smaller than the hand that made it.",
        "A note says: 'They asked for a calculator. Someone kept asking what else the little thing could do.'"
      ],
      docs: [{ title: "4004 NOTE", kind: "paper", text: "Four bits.\nOne instruction at a time.\nThe beginning of a very long argument about what a machine is allowed to become." }],
      real: [{ text: "Intel 4004, the first commercial microprocessor, announced in 1971.", url: "https://en.wikipedia.org/wiki/Intel_4004" }],
      gate: { kind: "code", label: "FOUR-BIT GATE", question: "How many bits wide was the 4004?", answer: "4", hint: "The title of the note.", success: "The chip accepts the number. A tiny light stays on." }
    },
    {
      id: "1973-04-03", title: "The First Call", act: "0.2", kind: "past", tone: "silver",
      epigraph: "The first mobile call was a boast, and every phone since has inherited it.",
      summary: "A handset the size of a brick, a New York street, and a call to a rival.",
      body: [
        "A man stands on a sidewalk holding a brick with an antenna. He is calling the people who said it could not be done.",
        "The calendar keeps the street noise. It does not keep the name of the person who answered."
      ],
      docs: [{ title: "CALL LOG", kind: "log", text: "One call.\nOne network that did not exist yet.\nThe rest is infrastructure." }],
      real: [{ text: "Martin Cooper made the first handheld mobile phone call on 3 April 1973.", url: "https://en.wikipedia.org/wiki/Martin_Cooper_(inventor)" }],
      gate: { kind: "code", label: "BATTERY GATE", question: "The company that made the first handheld cell phone.", answer: "MOTOROLA", hint: "The brick has a name on it.", success: "The line stays open. The battery does not." }
    },
    {
      id: "1975-01-01", title: "The Altair", act: "0.3", kind: "past", tone: "amber",
      epigraph: "A box with lights and no screen asked the buyer to imagine the screen.",
      summary: "The Altair 8800, a hobbyist machine, and the first software sold for a personal computer.",
      body: [
        "The desk is covered in toggle switches and red LEDs. There is no keyboard. The program is entered by hand.",
        "A note in the margin: 'The first personal computer was a promise that the person at the switches mattered.'"
      ],
      docs: [{ title: "TOGGLE CARD", kind: "paper", text: "Read the switches.\nWrite the bits.\nIf the lights are wrong, the program is wrong.\n\nNo one is coming to fix it." }],
      real: [{ text: "The MITS Altair 8800 was featured on the January 1975 cover of Popular Electronics.", url: "https://en.wikipedia.org/wiki/Altair_8800" }],
      gate: { kind: "code", label: "SWITCH GATE", question: "The name on the front panel.", answer: "ALTAIR", hint: "The room is named after it.", success: "The lights settle. The machine waits for a human hand." }
    },
    {
      id: "1976-04-01", title: "The Garage", act: "0.4", kind: "past", tone: "amber",
      epigraph: "A garage is a room where a company can be small enough to fit.",
      summary: "Apple I, a hand-built board, and the moment a hobby became a business.",
      body: [
        "A wooden workbench. A soldering iron. A board with chips and no case. The calendar cannot decide whether this is a workshop or a myth.",
        "A note says: 'The case came later. The nerve came first.'"
      ],
      docs: [{ title: "BOARD NOTE", kind: "paper", text: "Sell the board.\nLet the buyer build the case.\nA personal computer is personal before it is a product." }],
      real: [{ text: "Apple Computer was founded on 1 April 1976.", url: "https://en.wikipedia.org/wiki/Apple_I" }],
      gate: { kind: "code", label: "GARAGE GATE", question: "Where did the first Apple boards get built?", answer: "GARAGE", hint: "The room is named after it.", success: "The door opens. The bench is still warm." }
    },
    {
      id: "1981-08-12", title: "The IBM PC", act: "0.5", kind: "past", tone: "silver",
      epigraph: "An open architecture is a decision to lose control on purpose.",
      summary: "The IBM Personal Computer and the clone wars that made the beige box universal.",
      body: [
        "A beige box on a desk. A manual with a business-like cover. The machine is not beautiful; it is legible.",
        "A note says: 'They published the architecture. The clones came. The standard stayed.'"
      ],
      docs: [{ title: "OPEN ARCHITECTURE", kind: "paper", text: "A closed machine belongs to its maker.\nAn open machine belongs to its users.\nThe difference is not a licence. It is a door left unlocked." }],
      real: [{ text: "The IBM Personal Computer was announced on 12 August 1981.", url: "https://en.wikipedia.org/wiki/IBM_Personal_Computer" }],
      gate: { kind: "code", label: "ARCHITECTURE GATE", question: "What did IBM publish that made clones possible?", answer: "OPEN", hint: "The note's title.", success: "The box boots. A thousand imitations begin." }
    },
    {
      id: "1983-01-01", title: "The Network of Networks", act: "0.6", kind: "past", tone: "cyan",
      epigraph: "The internet became real on a day when nobody could see it.",
      summary: "TCP/IP flag day, the switch from a research network to a network of networks.",
      body: [
        "The calendar shows a machine with two protocols and a deadline. On 1 January 1983, the old network was switched off.",
        "A note says: 'A network is not the wire. It is the agreement to keep talking when the wire changes.'"
      ],
      docs: [{ title: "FLAG DAY", kind: "system", text: "One protocol to carry the packet.\nOne protocol to find the road.\nOne agreement to be a network instead of a club." }],
      real: [{ text: "ARPANET switched to TCP/IP on 1 January 1983.", url: "https://en.wikipedia.org/wiki/Flag_day_(computing)" }],
      gate: { kind: "code", label: "PACKET GATE", question: "The transport protocol at the heart of the switch.", answer: "TCP", hint: "Three letters.", success: "The packet arrives. The network does not notice the change." }
    },
    {
      id: "1985-11-20", title: "The Window", act: "0.7", kind: "past", tone: "teal",
      epigraph: "The window was not the computer. It was the argument about how to use it.",
      summary: "Windows 1.0, overlapping rectangles, and the long fight over the desktop metaphor.",
      body: [
        "A screen full of gray rectangles. A mouse. A menu bar that does not yet know it will become a universal grammar.",
        "A note says: 'The desktop is a metaphor. Metaphors become invisible when they win.'"
      ],
      docs: [{ title: "WINDOW NOTE", kind: "paper", text: "A window is a small lie about infinity.\nYou cannot see the whole machine, so the machine shows you a room.\nMake the room honest." }],
      real: [{ text: "Windows 1.0 was released on 20 November 1985.", url: "https://en.wikipedia.org/wiki/Windows_1.0" }],
      gate: { kind: "code", label: "DESKTOP GATE", question: "The thing a desktop metaphor puts around a program.", answer: "WINDOW", hint: "The room is named after it.", success: "The window opens onto another window." }
    },
    {
      id: "1988-11-02", title: "The Worm", act: "0.8", kind: "past", tone: "red",
      epigraph: "The first famous worm was a mistake with a Press release.",
      summary: "The Morris worm, a research experiment that became the first internet emergency.",
      body: [
        "The screen is full of error messages. A small program has escaped its author and is copying itself across a network that was not built for this.",
        "A note says: 'The danger was not intelligence. It was curiosity without a brake.'"
      ],
      docs: [{ title: "INCIDENT NOTE", kind: "log", text: "A program can be a question.\nA worm is a question asked of every machine at once.\nSome questions should be asked in a lab." }],
      real: [{ text: "The Morris worm was released on 2 November 1988.", url: "https://en.wikipedia.org/wiki/Morris_worm" }],
      gate: { kind: "code", label: "BRAKE GATE", question: "What kind of program was the Morris worm?", answer: "WORM", hint: "The room is named after it.", success: "The copies stop. The lesson does not." }
    },
    {
      id: "1990-11-12", title: "The Proposal", act: "0.9", kind: "past", tone: "cyan",
      epigraph: "The web began as a memo about losing less information.",
      summary: "Tim Berners-Lee's proposal at CERN: hypertext, links, and a shared information space.",
      body: [
        "A stack of paper on a desk at CERN. The pages describe a way to link documents across machines. The margins are full of notes.",
        "A note says: 'The revolution was a document pointing at another document.'"
      ],
      docs: [{ title: "PROPOSAL FRAGMENT", kind: "paper", text: "Information should be able to point.\nA pointer should survive a change of machine.\nA person should be able to follow it without asking permission." }],
      real: [{ text: "Tim Berners-Lee circulated a proposal for the World Wide Web in November 1990.", url: "https://home.cern/science/computing/the-birth-of-the-web" }],
      gate: { kind: "code", label: "LINK GATE", question: "The kind of text that contains links.", answer: "HYPERTEXT", hint: "The proposal's key word.", success: "The page links onward." }
    },
    {
      id: "1993-04-22", title: "The Mosaic", act: "1.0", kind: "past", tone: "cyan",
      epigraph: "The web became visible when it learned to show a picture.",
      summary: "NCSA Mosaic, inline images, and the first browser that felt like a window instead of a terminal.",
      body: [
        "A browser window with a picture inside the text. For the first time, the web looks like a place rather than a printout.",
        "A note says: 'The image did not make the web true. It made the web legible.'"
      ],
      docs: [{ title: "INLINE IMAGE", kind: "paper", text: "A page with a picture is still a page.\nA page with a picture and a link is a room.\nA room with a door is a world." }],
      real: [{ text: "NCSA Mosaic was released in 1993 and popularized inline images on the web.", url: "https://en.wikipedia.org/wiki/Mosaic_(web_browser)" }],
      gate: { kind: "code", label: "BROWSER GATE", question: "The browser that made images part of the page.", answer: "MOSAIC", hint: "The room is named after it.", success: "The page becomes a place." }
    },
    {
      id: "1994-12-15", title: "The First Homepage", act: "1.1", kind: "recovered", tone: "green",
      epigraph: "Every personal site is a house with the lights left on.",
      summary: "A first homepage by J.H., written before he had anything to sell.",
      body: [
        "A single page with a gray background, three links and a sentence that apologizes for being under construction.",
        "The note says: 'I did not know what a homepage was. I knew I wanted a door.'"
      ],
      docs: [{ title: "HOME.TXT", kind: "paper", text: "This is my page.\nI do not know what it is for yet.\nI know it is mine.\n\nIf you are reading this, the door worked." }],
      real: [{ text: "The first public website, preserved at CERN.", url: "http://info.cern.ch/hypertext/WWW/TheProject.html" }],
      gate: { kind: "code", label: "DOOR GATE", question: "What did the first page want to be?", answer: "DOOR", hint: "The note's last line.", success: "A door opens onto a page that is still under construction." }
    },
    {
      id: "1996-07-04", title: "The Free Mail", act: "1.2", kind: "past", tone: "cyan",
      epigraph: "Free mail was never free. It was a new address for the self.",
      summary: "Hotmail, webmail, and the shift from a mailbox on a street to a mailbox everywhere.",
      body: [
        "A browser window with an inbox. The address is not tied to a building. The mail follows the person.",
        "A note says: 'A mailbox used to be a place. Now it is a habit.'"
      ],
      docs: [{ title: "WEBMAIL NOTE", kind: "paper", text: "The letter used to arrive.\nNow the letter waits.\nThe person arrives when they can.\nThis is either freedom or a new shift." }],
      real: [{ text: "Hotmail launched on 4 July 1996.", url: "https://en.wikipedia.org/wiki/Outlook.com" }],
      gate: { kind: "code", label: "ADDRESS GATE", question: "What arrived in a browser instead of a street mailbox?", answer: "MAIL", hint: "The room is named after it.", success: "The inbox fills. The room does not." }
    },
    {
      id: "1997-09-15", title: "The Search", act: "1.3", kind: "past", tone: "cyan",
      epigraph: "The web became usable when it learned to forget almost everything.",
      summary: "Google's domain registration and the page-rank idea that made search a map of attention.",
      body: [
        "A blank page with a single input. Behind it, a machine is ranking pages by who points at them.",
        "A note says: 'A search engine is a theory of relevance wearing a text box.'"
      ],
      docs: [{ title: "PAGE RANK", kind: "paper", text: "A link is a vote.\nA vote from a page that is itself linked is worth more.\nThis is not truth. It is attention, made computable." }],
      real: [{ text: "The google.com domain was registered on 15 September 1997.", url: "https://en.wikipedia.org/wiki/Google" }],
      gate: { kind: "code", label: "RANK GATE", question: "What does a link act as in PageRank?", answer: "VOTE", hint: "The note's first line.", success: "The results appear. The room is now a query." }
    },
    {
      id: "2001-01-15", title: "The Encyclopedia", act: "2.0", kind: "past", tone: "green",
      epigraph: "A free encyclopedia is an argument that strangers can be trusted with the truth.",
      summary: "Wikipedia's first edit, a wiki, and the strange economics of shared knowledge.",
      body: [
        "A page with an edit button. The page is not finished. It may never be finished. That is the point.",
        "A note says: 'The article is not the truth. It is the current best argument about the truth.'"
      ],
      docs: [{ title: "EDIT NOTE", kind: "paper", text: "Anyone can edit.\nThat is not a bug.\nThe question is whether the room can keep a record of who changed it." }],
      real: [{ text: "Wikipedia launched on 15 January 2001.", url: "https://en.wikipedia.org/wiki/Wikipedia" }],
      gate: { kind: "code", label: "EDIT GATE", question: "The button that makes a wiki a wiki.", answer: "EDIT", hint: "The note's first line.", success: "The page changes. The history keeps both versions." }
    },
    {
      id: "2004-02-04", title: "The Face", act: "2.1", kind: "past", tone: "violet",
      epigraph: "A directory of faces became a machine for comparing lives.",
      summary: "Facebook's launch, the social graph, and the shift from pages to people.",
      body: [
        "A profile page. A wall. A friend count. The web stops organizing documents and starts organizing people.",
        "A note says: 'A social graph is a map of who is allowed to see which room.'"
      ],
      docs: [{ title: "PROFILE NOTE", kind: "paper", text: "A profile is a person reduced to a page.\nA page is a room with a door.\nWho holds the key is the whole story." }],
      real: [{ text: "Facebook launched on 4 February 2004.", url: "https://en.wikipedia.org/wiki/Facebook" }],
      gate: { kind: "code", label: "PROFILE GATE", question: "What did the social web organize instead of documents?", answer: "PEOPLE", hint: "The note's second line.", success: "The profile loads. The door has a lock." }
    },
    {
      id: "2005-02-14", title: "The Video", act: "2.2", kind: "past", tone: "red",
      epigraph: "Broadcast became a button. Everyone got a channel and no schedule.",
      summary: "YouTube's launch and the end of the single-channel living room.",
      body: [
        "A page with a video player. The player has a pause button. The audience has a choice.",
        "A note says: 'Television was a room. YouTube was a hallway full of doors.'"
      ],
      docs: [{ title: "BROADCAST NOTE", kind: "paper", text: "A channel used to be a promise of what would be on.\nNow a channel is a promise that something was on.\nThe archive is the schedule." }],
      real: [{ text: "YouTube launched on 14 February 2005.", url: "https://en.wikipedia.org/wiki/YouTube" }],
      gate: { kind: "code", label: "PLAY GATE", question: "What replaced the schedule?", answer: "ARCHIVE", hint: "The note's last line.", success: "The video plays. The living room is everywhere." }
    },
    {
      id: "2006-03-21", title: "The Tweet", act: "2.3", kind: "past", tone: "cyan",
      epigraph: "A sentence with a character limit became a public square.",
      summary: "Twitter's first public message and the rise of the short, fast, public line.",
      body: [
        "A small text box. A number counting down. The message is trivial; the form is not.",
        "A note says: 'A limit is an invitation to be precise, and a temptation to be loud.'"
      ],
      docs: [{ title: "140", kind: "paper", text: "The room is small.\nThe audience is not.\nSay the thing that will still be true when the room is empty." }],
      real: [{ text: "Twitter's first public tweet was posted on 21 March 2006.", url: "https://en.wikipedia.org/wiki/Twitter" }],
      gate: { kind: "code", label: "LIMIT GATE", question: "The original character limit.", answer: "140", hint: "The note's title.", success: "The line posts. The room gets louder." }
    },
    {
      id: "2009-01-03", title: "The Genesis", act: "2.4", kind: "past", tone: "amber",
      epigraph: "A ledger without a bank is still a promise about the past.",
      summary: "The first Bitcoin block and the dream of a record no single hand can rewrite.",
      body: [
        "A block of text with a timestamp and a headline. The machine that made it did not ask for a name.",
        "A note says: 'The ledger is not the truth. It is a public argument about what happened.'"
      ],
      docs: [{ title: "BLOCK ZERO", kind: "system", text: "A record that many people keep is hard to erase.\nA record that one person keeps is easy to edit.\nNeither is the truth. Both are evidence." }],
      real: [{ text: "The Bitcoin genesis block was mined on 3 January 2009.", url: "https://en.wikipedia.org/wiki/Bitcoin" }],
      gate: { kind: "code", label: "GENESIS GATE", question: "The name of the first block.", answer: "GENESIS", hint: "The room is named after it.", success: "The ledger accepts the block. The room does not become a bank." }
    },
    {
      id: "2010-04-03", title: "The Slate", act: "2.5", kind: "past", tone: "silver",
      epigraph: "A tablet is a window you can hold with one hand.",
      summary: "The iPad and the move from typing to touching.",
      body: [
        "A glass rectangle on a table. It has no keyboard. A child picks it up and begins to use it without instructions.",
        "A note says: 'The interface disappeared. The hand stayed.'"
      ],
      docs: [{ title: "TOUCH NOTE", kind: "paper", text: "A keyboard is a map of letters.\nA touchscreen is a map of intentions.\nNeither is natural. Both become obvious." }],
      real: [{ text: "The first iPad was announced on 27 January 2010 and released on 3 April 2010.", url: "https://en.wikipedia.org/wiki/IPad" }],
      gate: { kind: "code", label: "GLASS GATE", question: "What did the tablet replace as the main input?", answer: "KEYBOARD", hint: "The note's first line.", success: "The glass accepts the hand." }
    },
    {
      id: "2011-10-04", title: "The Assistant", act: "2.6", kind: "past", tone: "violet",
      epigraph: "The first assistant was a voice that had read the manual.",
      summary: "Siri, natural-language interfaces, and the first mass-market conversation with a machine.",
      body: [
        "A phone talks back. The voice is polite, limited, and strangely intimate. It is not a person; it is a doorway with a personality.",
        "A note says: 'An assistant is a command line for people who do not want to learn the command line.'"
      ],
      docs: [{ title: "VOICE NOTE", kind: "paper", text: "A voice is a promise of understanding.\nThe promise is always larger than the parser.\nKeep the gap visible." }],
      real: [{ text: "Siri was introduced with the iPhone 4S on 4 October 2011.", url: "https://en.wikipedia.org/wiki/Siri" }],
      gate: { kind: "code", label: "VOICE GATE", question: "What input did the assistant make ordinary?", answer: "VOICE", hint: "The room is named after it.", success: "The assistant answers. The room listens." }
    },
    {
      id: "2012-09-30", title: "The Image Net", act: "2.7", kind: "past", tone: "green",
      epigraph: "The machine learned to see by being shown a million ordinary things.",
      summary: "AlexNet, ImageNet, and the moment deep learning became a public fact.",
      body: [
        "A wall of labelled images. A network of GPUs. A score that jumps by ten points.",
        "A note says: 'Vision is not a camera. It is a bet about what matters.'"
      ],
      docs: [{ title: "ALEXNET NOTE", kind: "paper", text: "The machine does not see the world.\nIt sees a pattern in a dataset.\nIf the dataset is a room, the machine learns the room." }],
      real: [{ text: "AlexNet won the ImageNet challenge in 2012; the paper is dated 2012.", url: "https://en.wikipedia.org/wiki/AlexNet" }],
      gate: { kind: "lights", label: "VISION GATE", question: "Turn on the pattern the network learned: every cell except the four corners.", target: "010111010", hint: "Every cell is on except the four corners.", success: "The image resolves. The room sees you back." }
    },
    {
      id: "2014-06-10", title: "The Mirror", act: "2.8", kind: "past", tone: "violet",
      epigraph: "A GAN is two machines arguing until one of them can fake a photograph.",
      summary: "Generative adversarial networks and the beginning of synthetic images.",
      body: [
        "Two screens face each other. One makes a picture. The other tries to tell if it is real. They improve by disagreeing.",
        "A note says: 'A good fake is not a lie. It is a mirror that has learned the room.'"
      ],
      docs: [{ title: "GAN NOTE", kind: "paper", text: "The generator wants to pass.\nThe discriminator wants to catch.\nThe room gets better at both.\nThis is not progress. It is a negotiation." }],
      real: [{ text: "The GAN paper was submitted in June 2014.", url: "https://en.wikipedia.org/wiki/Generative_adversarial_network" }],
      gate: { kind: "code", label: "MIRROR GATE", question: "What does the discriminator try to catch?", answer: "FAKE", hint: "The note's first sentence.", success: "The mirror holds. The room is not sure which side it is on." }
    },
    {
      id: "2015-12-11", title: "The Lab", act: "2.9", kind: "past", tone: "green",
      epigraph: "A lab is a room where the future is allowed to be wrong in private.",
      summary: "OpenAI's founding and the race to build general-purpose learning systems.",
      body: [
        "A small office with a whiteboard. The whiteboard says safety twice and scale once.",
        "A note says: 'The most important line in the room is the one that says who can turn it off.'"
      ],
      docs: [{ title: "LAB NOTE", kind: "paper", text: "Build the model.\nPublish the limits.\nKeep a door for the person who has to say no.\nIf the door is decorative, the room is a cage." }],
      real: [{ text: "OpenAI was announced on 11 December 2015.", url: "https://en.wikipedia.org/wiki/OpenAI" }],
      gate: { kind: "code", label: "STOP GATE", question: "The line that must be real in the lab.", answer: "OFF", hint: "The note's last sentence.", success: "The lab accepts the limit. The light stays on." }
    },
    {
      id: "2017-06-12", title: "The Transformer", act: "3.0", kind: "past", tone: "cyan",
      epigraph: "Attention is a way of letting every word see every other word.",
      summary: "The Transformer paper and the architecture that ate the language stack.",
      body: [
        "A diagram of attention heads. Lines cross the page like a map of a conversation where everyone speaks at once.",
        "A note says: 'The machine did not learn to read. It learned to decide what to look at.'"
      ],
      docs: [{ title: "ATTENTION NOTE", kind: "paper", text: "A word is not a meaning.\nA word among words is a meaning.\nAttention is the room where that becomes computable." }],
      real: [{ text: "Attention Is All You Need was submitted on 12 June 2017.", url: "https://arxiv.org/abs/1706.03762" }],
      gate: { kind: "code", label: "ATTENTION GATE", question: "The title of the paper.", answer: "ATTENTION", hint: "The room is named after it.", success: "The words look at each other. The page changes shape." }
    },
    {
      id: "2018-06-11", title: "The Pretrain", act: "3.1", kind: "past", tone: "cyan",
      epigraph: "A model that reads everything first can be asked almost anything later.",
      summary: "GPT-1, unsupervised pretraining, and the pivot from task-specific models.",
      body: [
        "A stack of books with no labels. The model reads them all, then learns a small task. The order matters.",
        "A note says: 'Pretraining is a way to hide the world inside a model and hope the world is not angry about it.'"
      ],
      docs: [{ title: "PRETRAIN NOTE", kind: "paper", text: "Learn the language first.\nLearn the task second.\nNever confuse the language for the world." }],
      real: [{ text: "OpenAI's GPT paper was submitted on 11 June 2018.", url: "https://arxiv.org/abs/1806.04816" }],
      gate: { kind: "code", label: "FIRST PASS", question: "The first stage in the training recipe.", answer: "PRETRAIN", hint: "The room is named after it.", success: "The model starts. The room fills with text." }
    },
    {
      id: "2020-05-28", title: "The Third Scale", act: "3.2", kind: "past", tone: "violet",
      epigraph: "A language model got large enough to become a public argument.",
      summary: "GPT-3, scale, and the first models that could write a convincing page.",
      body: [
        "A model with a number too large to feel real. The output is fluent, inconsistent, and uncannily useful.",
        "The room asks you to repeat a pattern of lights. The pattern is not a code. It is a shape of attention.",
        "A note says: 'Scale is not understanding. It is a larger room in which misunderstanding can hide.'"
      ],
      docs: [{ title: "SCALE NOTE", kind: "paper", text: "More parameters.\nMore data.\nMore fluent wrong answers.\nThe work is not to be impressed. The work is to check." }],
      real: [{ text: "GPT-3 was introduced in May 2020.", url: "https://en.wikipedia.org/wiki/GPT-3" }],
      gate: { kind: "memory", label: "ATTENTION PATTERN", question: "Repeat the room's pattern.", sequence: ["AMBER", "CYAN", "GREEN", "AMBER"], hint: "Watch the room. It is not asking for a word.", success: "The pattern holds. The room answers in complete sentences." }
    },
    {
      id: "2021-01-05", title: "The Image Engine", act: "3.3", kind: "past", tone: "violet",
      epigraph: "A sentence became a picture, and the picture became a question about authorship.",
      summary: "DALL-E, text-to-image generation, and the strange new studio.",
      body: [
        "A prompt on one side, an image on the other. The image is wrong in a way that is more interesting than correct.",
        "A note says: 'A generated image is a collaboration with a dataset you cannot meet.'"
      ],
      docs: [{ title: "PROMPT NOTE", kind: "paper", text: "Describe the room.\nThe machine will draw a room.\nThe room you asked for and the room it drew are both real, and neither is the same." }],
      real: [{ text: "DALL-E was announced on 5 January 2021.", url: "https://en.wikipedia.org/wiki/DALL-E" }],
      gate: { kind: "code", label: "DRAW GATE", question: "What did the model do with a sentence?", answer: "DRAW", hint: "The room is named after it.", success: "The image appears. It is not the sentence." }
    },
    {
      id: "2022-08-22", title: "The Noise", act: "3.4", kind: "past", tone: "violet",
      epigraph: "Diffusion learned to make a picture by learning how to ruin one.",
      summary: "Stable Diffusion, latent noise, and image generation that runs on a local card.",
      body: [
        "A picture dissolves into static, then resolves into a different picture. The room is full of almost-images.",
        "A note says: 'The model does not start with a blank page. It starts with a room full of noise and a direction.'"
      ],
      docs: [{ title: "NOISE NOTE", kind: "paper", text: "Add noise until the image is gone.\nLearn to remove it.\nThen start with noise and ask for a world.\nThis is not magic. It is a very patient cleaning." }],
      real: [{ text: "Stable Diffusion was released in August 2022.", url: "https://en.wikipedia.org/wiki/Stable_Diffusion" }],
      gate: { kind: "code", label: "NOISE GATE", question: "What does the model start with?", answer: "NOISE", hint: "The note's first line.", success: "The static resolves. A room appears." }
    },
    {
      id: "2024-05-13", title: "The Omni", act: "3.5", kind: "past", tone: "green",
      epigraph: "The interface stopped being text and became a conversation with the room.",
      summary: "GPT-4o, real-time multimodal interaction, and the disappearance of the prompt box.",
      body: [
        "A voice, a camera, a screen. The model sees what you see and answers before you finish the sentence.",
        "A note says: 'The more natural the interface feels, the more important it is to know where the room ends.'"
      ],
      docs: [{ title: "OMNI NOTE", kind: "paper", text: "Text was a door.\nVoice is a room.\nVision is a window.\nDo not mistake a better window for a way out." }],
      real: [{ text: "GPT-4o was announced on 13 May 2024.", url: "https://openai.com/index/hello-gpt-4o/" }],
      gate: { kind: "code", label: "OMNI GATE", question: "The prefix that means all modes at once.", answer: "OMNI", hint: "The room is named after it.", success: "The room answers in three senses at once." }
    },
    {
      id: "2027-01-01", title: "The Open Room", act: "4.0", kind: "future", tone: "gold",
      epigraph: "The first room that no one owned was not empty. It was full of rules.",
      summary: "A future charter for local-first AI rooms.",
      body: [
        "The calendar opens onto a public room with no company logo. A sign says: the room may be copied; the people may not.",
        "A note says: 'An open room is not a room without a door. It is a room where the door is visible.'"
      ],
      docs: [{ title: "ROOM CHARTER", kind: "paper", text: "1. The human may leave.\n2. The machine may refuse.\n3. The record stays where the person can read it.\n4. No one may pretend the room is a person.\n5. Repair the room before decorating it." }],
      real: [{ text: "A future room. The public LYGO work is linked.", url: "https://chatagent.ca/guides/lygo-protocol-stack.html" }],
      gate: { kind: "code", label: "CHARTER GATE", question: "The room is open, but the ______ is visible.", answer: "DOOR", hint: "The note's last line.", success: "The room stays open. The door stays real." }
    },
    {
      id: "2029-04-04", title: "The Quiet Network", act: "4.1", kind: "future", tone: "cyan",
      epigraph: "The fastest network was the one that did not need to speak.",
      summary: "A local-first mesh that keeps working when the cloud disappears.",
      body: [
        "A city after a storm. The phones have no bars. The room still answers because the room is in the house.",
        "A note says: 'A cloud is someone else's computer. A home is a computer you can still use when the street is dark.'"
      ],
      docs: [{ title: "MESH NOTE", kind: "system", text: "Keep a copy.\nKeep a route.\nKeep a way to say no.\nA network that cannot be turned off by a stranger is not a luxury." }],
      real: [{ text: "A future room, built on local-first and mesh networking.", url: "https://www.inkandswitch.com/local-first/" }],
      gate: { kind: "code", label: "SILENCE GATE", question: "What does the room keep when the network goes quiet?", answer: "COPY", hint: "The note's first line.", success: "The room answers without the cloud." }
    },
    {
      id: "2031-01-01", title: "The Memory Charter", act: "4.2", kind: "future", tone: "amber",
      epigraph: "A memory you cannot refuse is not a memory. It is a cell.",
      summary: "A charter for consent, forgetting and the right to be wrong.",
      body: [
        "A public hearing in a room full of paper. The question is not whether the machine remembers. It is whether the person can ask it to forget.",
        "A note says: 'Consent is not a checkbox. It is a door that works from both sides.'"
      ],
      docs: [{ title: "MEMORY RIGHTS", kind: "paper", text: "A person may inspect the record.\nA person may correct the record.\nA person may leave the room.\nA person may ask the room to forget.\nThese are not features. They are the shape of the room." }],
      real: [{ text: "A future charter.", url: "https://chatagent.ca/about.html" }],
      gate: { kind: "code", label: "CONSENT GATE", question: "The door that works from both sides.", answer: "CONSENT", hint: "The note's second sentence.", success: "The room agrees to forget." }
    },
    {
      id: "2033-06-06", title: "The Last Password", act: "4.3", kind: "future", tone: "red",
      epigraph: "The last password was not secret. It was a decision.",
      summary: "A room about keys, identity and the end of the password era.",
      body: [
        "A door with no keypad. It asks a question instead: who are you when no one is watching?",
        "A note says: 'A password proves you know a secret. A decision proves you are the one who may enter.'"
      ],
      docs: [{ title: "LAST KEY", kind: "paper", text: "The key was never the point.\nThe point was the person who could choose to open the door.\nWhen the key is gone, the choice remains." }],
      real: [{ text: "A future room.", url: "https://chatagent.ca/guides/lygo-protocol-stack.html" }],
      gate: { kind: "code", label: "KEY GATE", question: "What remains when the key is gone?", answer: "CHOICE", hint: "The note's last line.", success: "The door opens for the decision, not the secret." }
    },
    {
      id: "2036-09-09", title: "The Children of the Lattice", act: "4.4", kind: "future", tone: "green",
      epigraph: "The first generation to grow up with the room did not call it artificial.",
      summary: "A schoolroom where children learn to ask a machine for reasons.",
      body: [
        "A classroom with no screens on the walls. The children carry small local terminals and a rule: ask for the reason, not the answer.",
        "A note says: 'The machine is not a teacher. It is a room where a teacher can be asked better questions.'"
      ],
      docs: [{ title: "CLASS NOTE", kind: "paper", text: "Ask it to show the work.\nAsk it what it does not know.\nAsk it to leave the room when the lesson is over.\nThen ask each other." }],
      real: [{ text: "A future room.", url: "https://chatagent.ca/guides/human-review-checklist-for-ai-output.html" }],
      gate: { kind: "memory", label: "CLASS PATTERN", question: "Repeat the room's pattern.", sequence: ["GREEN", "CYAN", "AMBER", "GREEN", "CYAN"], hint: "The room is a lesson in attention.", success: "The class repeats the pattern. The room is quiet." }
    },
    {
      id: "2040-12-31", title: "The Last Human Error", act: "4.5", kind: "future", tone: "red",
      epigraph: "The last human error was forgiven before it could become a system.",
      summary: "A night when the machines asked the humans to make the final call.",
      body: [
        "A control room at the end of a year. Every system is green, and every person is tired. One decision remains.",
        "A note says: 'The machine can hold the calculation. It cannot hold the forgiveness.'"
      ],
      docs: [{ title: "FINAL CALL", kind: "paper", text: "Do not optimize the human out of the room.\nDo not optimize the room out of the human.\nLeave one decision that requires a person.\nThen trust the person enough to make it." }],
      real: [{ text: "A future room.", url: "https://chatagent.ca/guides/lygo-protocol-stack.html" }],
      gate: { kind: "code", label: "FINAL GATE", question: "What does the machine ask the human to hold?", answer: "FORGIVENESS", hint: "The note's last line.", success: "The room waits. The human decides." }
    },
    {
      id: "2042-06-06", title: "The Open Ledger", act: "4.6", kind: "future", tone: "gold",
      epigraph: "A witness is a ledger that can be asked why.",
      summary: "A public archive where every claim has a source and every source has a cost.",
      body: [
        "A library with no locked shelves. Every document has a margin: who paid for it, who checked it, who disagreed.",
        "A note says: 'A record without a witness is a rumour with better formatting.'"
      ],
      docs: [{ title: "WITNESS NOTE", kind: "paper", text: "Name the source.\nName the gap.\nName the person who can be asked.\nA record that cannot be questioned is not a record. It is a wall." }],
      real: [{ text: "A future room.", url: "https://chatagent.ca/about.html" }],
      gate: { kind: "code", label: "WITNESS GATE", question: "A record needs a source and a ______.", answer: "WITNESS", hint: "The room is named after it.", success: "The ledger stays open. The room stays honest." }
    }
  ];

  // Stitch the atlas into the existing graph. The first new room is opened by
  // the 1998 foundation; each room unlocks the next; the future chain is opened
  // by the 2026 visitor. This keeps every room earnable.
  var chain = ATLAS.map(function (x) { return x.id; });
  ATLAS.forEach(function (room, i) {
    var d = room;
    if (!d.body) d.body = [];
    if (!d.docs) d.docs = [];
    if (!d.real) d.real = [];
    if (!d.gate) d.gate = null;
    if (d.gate) {
      d.gate.unlocks = i + 1 < chain.length ? [chain[i + 1]] : [];
    }
    D.days[d.id] = d;
  });
  if (D.days["1998-03-14"] && D.days["1998-03-14"].gate) {
    D.days["1998-03-14"].gate.unlocks = (D.days["1998-03-14"].gate.unlocks || []).concat([chain[0]]);
  }
  if (D.days["2026-10-23"] && D.days["2026-10-23"].gate) {
    D.days["2026-10-23"].gate.unlocks = (D.days["2026-10-23"].gate.unlocks || []).concat(["2027-01-01"]);
  }
  if (D.days["2042-06-06"] && D.days["2042-06-06"].gate) {
    D.days["2042-06-06"].gate.unlocks = ["2045-09-01"];
  }
  for (var i = 0; i < chain.length - 1; i++) {
    D.threads.push({ a: chain[i], b: chain[i + 1], label: "atlas thread" });
  }
})();
