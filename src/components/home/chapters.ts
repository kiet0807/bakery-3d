/**
 * The scroll story, top to bottom. The 3D camera has one shot per chapter (StoryScene SHOTS), so the order and
 * the count matter; the words live in the home dictionary (`story.chapters`).
 */
export const CHAPTERS = ['intro', 'sponge', 'filling', 'finish', 'crown', 'build'] as const

export type ChapterId = (typeof CHAPTERS)[number]

/** The chapters that tell part of the story, with a heading and a note. */
export type StoryChapterId = Exclude<ChapterId, 'intro' | 'build'>

export const isStoryChapter = (id: ChapterId): id is StoryChapterId => id !== 'intro' && id !== 'build'
