import type { Editor } from "grapesjs";
import { useMemo } from "react";
import { useEditorEvents } from "../../use-editor-events";

/** The core commands behind the top bar's controls. */
export const CORE_COMMANDS = {
  undo: "core:undo",
  redo: "core:redo",
  outline: "core:component-outline",
  preview: "core:preview",
} as const;

type ToggleCommand = (typeof CORE_COMMANDS)["outline" | "preview"];

type TopBarState = {
  deviceId: string;
  hasUndo: boolean;
  hasRedo: boolean;
  outline: boolean;
};

/**
 * Events after which the top bar re-reads the editor: edits (`update`), undo/redo, a project
 * load (which resets the undo stack), a device switch, and every command run or stop.
 */
const TOP_BAR_EVENTS = "update undo redo load project:load device:select command:call";

const EMPTY_STATE: TopBarState = { deviceId: "", hasUndo: false, hasRedo: false, outline: false };

/** Core's default device ids the toggle offers, in order. */
const DEVICE_IDS = ["desktop", "tablet", "mobilePortrait"] as const;

export type DeviceId = (typeof DEVICE_IDS)[number];

const readState = (editor: Editor): TopBarState => ({
  deviceId: String(editor.Devices.getSelected()?.id ?? ""),
  hasUndo: editor.UndoManager.hasUndo(),
  hasRedo: editor.UndoManager.hasRedo(),
  outline: editor.Commands.isActive(CORE_COMMANDS.outline),
});

type Props = {
  editor: Editor | null;
};

/**
 * State and handlers for the core shell's top bar: the device toggle, undo/redo availability,
 * and the outline and preview toggles, all read from the editor.
 */
export const useTopBar = ({ editor }: Props) => {
  const state = useEditorEvents(editor, TOP_BAR_EVENTS, readState, EMPTY_STATE);
  const devices = useMemo(
    () =>
      DEVICE_IDS.filter((id) => !!editor?.Devices.get(id)).map((id) => ({
        id,
        name: editor?.Devices.get(id)?.getName() || id,
      })),
    [editor]
  );

  const selectDevice = (id: string) => {
    if (id) editor?.Devices.select(id);
  };
  const undo = () => {
    editor?.runCommand(CORE_COMMANDS.undo);
  };
  const redo = () => {
    editor?.runCommand(CORE_COMMANDS.redo);
  };

  const toggle = (command: ToggleCommand) => {
    if (!editor) return;
    if (editor.Commands.isActive(command)) editor.stopCommand(command);
    else editor.runCommand(command);
  };

  return {
    ...state,
    devices,
    selectDevice,
    undo,
    redo,
    toggleOutline: () => toggle(CORE_COMMANDS.outline),
    startPreview: () => toggle(CORE_COMMANDS.preview),
  };
};
