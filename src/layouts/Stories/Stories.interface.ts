import type { Component } from "vue";

export type StoryCategory = "ui" | "urb";

export interface StoryApiColumn {
  key: string;
  label: string;
}

export interface StoryApiTable {
  columns: StoryApiColumn[];
  rows: Record<string, string>[];
}

/**
 * Metadata describing a story. Doubles as the props accepted by
 * `StoriesLayout`, so each story only declares its content once and
 * the same object feeds both the list page and the rendered layout.
 */
export interface StoriesLayoutProps {
  name: string;
  category: StoryCategory;
  description: string;
  usageCode: string;
  whenToUse: string[];
  api?: StoryApiTable;
}

export interface StoryEntry {
  id: string;
  category: StoryCategory;
  component: Component;
  meta: StoriesLayoutProps;
}
