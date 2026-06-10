import type { InstrumentCategory } from '@/lib/types'

export const INSTRUMENT_CATEGORIES: InstrumentCategory[] = [
  {
    id: 'woodwinds',
    label: 'Woodwinds',
    instruments: [
      { id: 'flute', label: 'Flute', emoji: '🎵', family: 'woodwind' },
      { id: 'oboe', label: 'Oboe', emoji: '🎵', family: 'woodwind' },
      { id: 'clarinet', label: 'Clarinet', emoji: '🎵', family: 'woodwind' },
      { id: 'bass-clarinet', label: 'Bass Clarinet', emoji: '🎵', family: 'woodwind' },
      { id: 'bassoon', label: 'Bassoon', emoji: '🎵', family: 'woodwind' },
      { id: 'alto-saxophone', label: 'Alto Saxophone', emoji: '🎷', family: 'woodwind' },
      { id: 'tenor-saxophone', label: 'Tenor Saxophone', emoji: '🎷', family: 'woodwind' },
      { id: 'baritone-saxophone', label: 'Baritone Saxophone', emoji: '🎷', family: 'woodwind' },
      { id: 'soprano-saxophone', label: 'Soprano Saxophone', emoji: '🎷', family: 'woodwind' },
    ],
  },
  {
    id: 'brass',
    label: 'Brass',
    instruments: [
      { id: 'trumpet', label: 'Trumpet', emoji: '🎺', family: 'brass' },
      { id: 'french-horn', label: 'French Horn', emoji: '🎺', family: 'brass' },
      { id: 'trombone', label: 'Trombone', emoji: '🎺', family: 'brass' },
      { id: 'bass-trombone', label: 'Bass Trombone', emoji: '🎺', family: 'brass' },
      { id: 'euphonium', label: 'Euphonium', emoji: '🎺', family: 'brass' },
      { id: 'tuba', label: 'Tuba', emoji: '🎺', family: 'brass' },
    ],
  },
  {
    id: 'strings',
    label: 'Strings',
    instruments: [
      { id: 'violin', label: 'Violin', emoji: '🎻', family: 'string' },
      { id: 'viola', label: 'Viola', emoji: '🎻', family: 'string' },
      { id: 'cello', label: 'Cello', emoji: '🎻', family: 'string' },
      { id: 'double-bass', label: 'Double Bass', emoji: '🎻', family: 'string' },
      { id: 'harp', label: 'Harp', emoji: '🎻', family: 'string' },
    ],
  },
  {
    id: 'keyboard-percussion',
    label: 'Keyboard & Percussion',
    instruments: [
      { id: 'piano', label: 'Piano', emoji: '🎹', family: 'keyboard' },
      { id: 'marimba', label: 'Marimba', emoji: '🪘', family: 'percussion' },
      { id: 'vibraphone', label: 'Vibraphone', emoji: '🪘', family: 'percussion' },
      { id: 'snare-drum', label: 'Snare Drum', emoji: '🥁', family: 'percussion' },
      { id: 'timpani', label: 'Timpani', emoji: '🥁', family: 'percussion' },
    ],
  },
]

export const ALL_INSTRUMENTS = INSTRUMENT_CATEGORIES.flatMap((c) => c.instruments)

export function getInstrumentById(id: string) {
  return ALL_INSTRUMENTS.find((i) => i.id === id)
}
