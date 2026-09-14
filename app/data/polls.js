export const polls = [
  {
    id: "arena",
    slug: "arena",
    category: "PvP",
    title: "Should WoW Forever eventually add Arena?",
    context: "A place for small-team competition, or a step away from the Classic experience?"
  },
  {
    id: "raid-size",
    slug: "raid-size",
    category: "PvE",
    title: "Should old 40-player raids stay 40-player?",
    context: "Preserve the scale of the originals, or make room for smaller groups?"
  },
  {
    id: "new-class",
    slug: "new-class",
    category: "General",
    title: "Should Blizzard add a new class to Forever?",
    context: "New ways to play, new class fantasies, and a different balance to strike."
  },
  {
    id: "hardcore",
    slug: "hardcore",
    category: "General",
    title: "Should Hardcore characters be able to transfer after death?",
    context: "A final end to the adventure, or a new beginning on a regular realm?"
  },
  {
    id: "flying",
    slug: "flying",
    category: "World",
    title: "Should Forever ever add flying?",
    context: "Take to the skies, or keep exploration firmly on the ground?"
  },
  {
    id: "level-cap",
    slug: "level-cap",
    category: "General",
    title: "Should Forever stay level 60 permanently?",
    context: "Expand the adventure without raising the level cap?"
  }
];

export const pollCategories = ["All", "PvE", "PvP", "World", "General"];

export function withFallbackOptions(poll) {
  return {
    ...poll,
    options: [
      { id: `${poll.slug}-yes`, text: "Yes", position: 1, voteCount: 0 },
      { id: `${poll.slug}-no`, text: "No", position: 2, voteCount: 0 }
    ],
    totalVotes: 0,
    userVoteOptionId: null
  };
}
