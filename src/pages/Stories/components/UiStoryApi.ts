import type { StoryApiTable } from "~/layouts/Stories/Stories.interface";

export type UiApiRow = [
  prop: string,
  type: string,
  defaultValue: string,
  description: string,
];

export const uiApi = (rows: UiApiRow[]): StoryApiTable => ({
  columns: [
    { key: "prop", label: "Prop / API" },
    { key: "type", label: "Type" },
    { key: "default", label: "Default" },
    { key: "description", label: "Description" },
  ],
  rows: rows.map(([prop, type, defaultValue, description]) => ({
    prop,
    type,
    default: defaultValue,
    description,
  })),
});
