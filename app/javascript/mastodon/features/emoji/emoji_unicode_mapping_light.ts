import emojiData from './emoji_data.json';
import emojiMap from './emoji_map.json';

interface EmojiData {
  emojis: Record<string, { b: string }>;
}

interface UnicodeMappingEntry {
  filename: string;
  shortCode: string;
}

const emojiFilenames = emojiMap as Record<string, string>;
const emojiShortCodes = (emojiData as EmojiData).emojis;

const filenameToShortCode = Object.entries(emojiShortCodes).reduce<
  Record<string, string>
>((result, [shortCode, { b: filename }]) => {
  result[filename.toLowerCase()] = shortCode;
  return result;
}, {});

export const unicodeMapping = Object.entries(emojiFilenames).reduce<
  Record<string, UnicodeMappingEntry>
>((result, [emoji, filename]) => {
  result[emoji] = {
    filename,
    shortCode: filenameToShortCode[filename] ?? '',
  };
  return result;
}, {});
