export interface BibleLanguage {
  id: string;
  name: string;
  nameLocal: string;
}

export interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  language: BibleLanguage;
  description?: string;
  isFallback?: boolean;
}

export interface Book {
  id: string;
  bibleId: string;
  name: string;
  nameLong?: string;
  abbreviation?: string;
  chapterCount: number;
}

export interface Verse {
  id: string;
  number: number;
  text: string;
}

export interface Section {
  heading?: string;
  verses: Verse[];
}

export interface Chapter {
  id: string;
  bibleId: string;
  bookId: string;
  bookName: string;
  number: string;
  reference: string;
  copyright?: string;
  sections: Section[];
  prevId?: string;
  nextId?: string;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface Highlight {
  verseId: string;
  color: HighlightColor;
  at: number;
}

export type BibleFontSize = 'sm' | 'md' | 'lg' | 'xl';
