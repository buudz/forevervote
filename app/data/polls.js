const defaultYesNoOptions = [
  { text: "Yes", isNeutral: false },
  { text: "No", isNeutral: false },
  { text: "Don't care", isNeutral: true }
];

const classicClassOptions = [
  "Warrior",
  "Paladin",
  "Hunter",
  "Rogue",
  "Priest",
  "Shaman",
  "Mage",
  "Warlock",
  "Druid",
  "Undecided"
];

const nextRaceOptions = [
  "Ogres",
  "High Elves",
  "Blood Elves",
  "Draenei",
  "Goblins",
  "Worgen",
  "Murloc",
  "Naga",
  "Dracthyr",
  "Pandaren",
  "No preference"
];

const mainRaceOptions = [
  "Human",
  "Dwarf",
  "Night Elf",
  "Gnome",
  "Orc",
  "Undead",
  "Tauren",
  "Troll",
  "Skyborne",
  "Undecided"
];

export const polls = [
  {
    id: "arena",
    slug: "should-wow-forever-add-arena-arena",
    category: "PvP",
    title: "Should WoW Forever add Arena?",
    context: "A place for small-team competition, or a step away from the Classic experience?",
    options: defaultYesNoOptions
  },
  {
    id: "raid-size",
    slug: "should-old-40-player-raids-stay-40-player-raid-size",
    category: "PvE",
    title: "Should old 40-player raids stay 40-player?",
    context: "Preserve the scale of the originals, or make room for smaller groups?",
    options: defaultYesNoOptions
  },
  {
    id: "skyborne-opinion",
    slug: "do-you-like-the-new-skyborne-race-skyborne-opinion",
    category: "RolePlay",
    title: "Do you like the new Skyborne race?",
    context: "Share whether Skyborne feels like a good fit for World of Warcraft: Forever.",
    options: defaultYesNoOptions
  },
  {
    id: "main-class",
    slug: "what-class-will-you-main-main-class",
    category: "General",
    title: "What class will you main?",
    context: "Vote for the class you are most likely to play as your main character.",
    options: classicClassOptions.map((text) => ({ text, isNeutral: text === "Undecided" }))
  },
  {
    id: "future-races",
    slug: "should-more-races-be-introduced-in-the-future-future-races",
    category: "RolePlay",
    title: "Should more races be introduced in the future?",
    context: "Should WoW Forever keep the playable race list focused, or expand it later?",
    options: defaultYesNoOptions
  },
  {
    id: "preferred-next-race",
    slug: "what-is-your-preferred-next-race-preferred-next-race",
    category: "RolePlay",
    title: "What is your preferred next race?",
    context: "Choose the race you would most like to see added next if the playable roster expands.",
    options: nextRaceOptions.map((text) => ({ text, isNeutral: text === "No preference" }))
  },
  {
    id: "main-race",
    slug: "what-will-be-the-race-of-your-main-main-race",
    category: "RolePlay",
    title: "What will be the race of your main?",
    context: "Pick the race you plan to main when you start playing.",
    options: mainRaceOptions.map((text) => ({ text, isNeutral: text === "Undecided" }))
  },
  {
    id: "new-class",
    slug: "should-blizzard-add-a-new-class-to-forever-new-class",
    category: "General",
    title: "Should Blizzard add a new class to Forever?",
    context: "New ways to play, new class fantasies, and a different balance to strike.",
    options: defaultYesNoOptions
  },
  {
    id: "hardcore",
    slug: "should-hardcore-characters-be-able-to-transfer-after-death-hardcore",
    category: "Hardcore",
    title: "Should Hardcore characters be able to transfer after death?",
    context: "A final end to the adventure, or a new beginning on a regular realm?",
    options: defaultYesNoOptions
  },
  {
    id: "flying",
    slug: "should-forever-ever-add-flying-flying",
    category: "World",
    title: "Should Forever ever add flying?",
    context: "Take to the skies, or keep exploration firmly on the ground?",
    options: defaultYesNoOptions
  },
  {
    id: "level-cap",
    slug: "should-forever-stay-level-60-permanently-level-cap",
    category: "General",
    title: "Should Forever stay level 60 permanently?",
    context: "Expand the adventure without raising the level cap?",
    options: defaultYesNoOptions
  }
];

export const pollCategories = ["All", "PvE", "PvP", "World", "RolePlay", "Hardcore", "General"];

export function withFallbackOptions(poll) {
  const sourceOptions = poll.options?.length ? poll.options : defaultYesNoOptions;

  return {
    ...poll,
    rationale: poll.context,
    options: sourceOptions.map((option, index) => ({
      id: `${poll.slug}-${index + 1}`,
      text: option.text,
      position: index + 1,
      isNeutral: Boolean(option.isNeutral),
      voteCount: 0
    })),
    totalVotes: 0,
    userVoteOptionId: null
  };
}
