import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { stories } from "./index";
import CheckboxStory from "./Checkbox.ui.story.vue";
import DialogStory from "./Dialog.ui.story.vue";
import DrawerStory from "./Drawer.ui.story.vue";
import InputStory from "./Input.ui.story.vue";
import RadioStory from "./Radio.ui.story.vue";

const expectedUiIds = [
  "backdrop",
  "button",
  "checkbox",
  "dialog",
  "drawer",
  "image",
  "input",
  "radio",
  "skeleton",
  "text",
];

const storyMountOptions = {
  global: {
    stubs: {
      teleport: true,
      "Stories.layout": {
        template: '<main><slot name="demo" /></main>',
      },
    },
  },
};

describe("UI story catalog", () => {
  it("registers every exported UI component with complete metadata", () => {
    const uiStories = stories.filter((entry) => entry.category === "ui");

    expect(uiStories.map((entry) => entry.id).sort()).toEqual(expectedUiIds);
    expect(new Set(uiStories.map((entry) => entry.id)).size).toBe(
      uiStories.length,
    );

    for (const entry of uiStories) {
      expect(entry.meta.category).toBe("ui");
      expect(entry.meta.name.trim()).not.toBe("");
      expect(entry.meta.description.trim()).not.toBe("");
      expect(entry.meta.usageCode).toContain('from "~/components/ui"');
      expect(entry.meta.whenToUse.length).toBeGreaterThan(0);
      expect(entry.meta.api?.rows.length).toBeGreaterThan(0);
    }
  });

  it("updates the interactive Input value and reports committed changes", async () => {
    const wrapper = mount(InputStory, storyMountOptions);
    const input = wrapper.get('input[type="email"]');

    await input.setValue("person@example.com");
    await input.trigger("change");

    expect(wrapper.text()).toContain("person@example.com");
    expect(wrapper.text()).toContain("change: person@example.com");
  });

  it("updates the interactive Checkbox model", async () => {
    const wrapper = mount(CheckboxStory, storyMountOptions);
    const checkbox = wrapper.findAll('input[type="checkbox"]')[0];

    await checkbox.setValue(true);

    expect(wrapper.text()).toContain("accepted: true");
  });

  it("renders Radio variants and boolean model output", () => {
    const wrapper = mount(RadioStory, storyMountOptions);

    expect(wrapper.findAll('input[type="radio"]').length).toBeGreaterThan(4);
    expect(wrapper.text()).toContain("checked: true");
    expect(wrapper.text()).toContain("Input on the left");
    expect(wrapper.text()).toContain("Error state");
  });

  it("opens and explicitly closes the Dialog demo", async () => {
    const wrapper = mount(DialogStory, storyMountOptions);

    await wrapper.get('[data-testid="open-dialog"]').trigger("click");
    expect(wrapper.get('[role="dialog"]').attributes("aria-label")).toBe(
      "Confirm profile update",
    );

    await wrapper.get('[data-testid="close-dialog"]').trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("opens and explicitly closes the Drawer demo", async () => {
    const wrapper = mount(DrawerStory, storyMountOptions);

    await wrapper.get('[data-testid="open-drawer"]').trigger("click");
    const drawer = wrapper.get('[role="dialog"]');
    expect(drawer.attributes("aria-label")).toBe("Choose delivery speed");
    expect(drawer.classes()).toContain("bottom-0");

    await wrapper.get('[data-testid="close-drawer"]').trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
});
