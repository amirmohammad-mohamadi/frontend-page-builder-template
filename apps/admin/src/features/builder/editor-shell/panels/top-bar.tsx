"use client";

import type { Editor } from "grapesjs";
import {
  EyeIcon,
  MonitorIcon,
  Redo2Icon,
  SmartphoneIcon,
  SquareDashedIcon,
  TabletIcon,
  Undo2Icon,
} from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { Button, Separator, ToggleGroup, ToggleGroupItem } from "@components";
import { TEXTS } from "@/texts";
import { useTopBar, type DeviceId } from "./top-bar.hook";

type Props = {
  editor: Editor | null;
};

/** Icons for core's default device ids. */
const DEVICE_ICONS: Record<DeviceId, ReactNode> = {
  desktop: <MonitorIcon />,
  tablet: <TabletIcon />,
  mobilePortrait: <SmartphoneIcon />,
};

/**
 * The core shell's top bar controls over the canvas: the device toggle, undo/redo, and the
 * block-outline and preview toggles.
 */
export function TopBar({ editor }: Props) {
  const t = TEXTS.builder.shell;
  const vm = useTopBar({ editor });

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={vm.deviceId}
        onValueChange={vm.selectDevice}
        aria-label={t.deviceLabel}
        disabled={!editor}
      >
        {vm.devices.map((device) => (
          <ToggleGroupItem key={device.id} value={device.id} aria-label={device.name}>
            {DEVICE_ICONS[device.id]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="ms-auto flex items-center gap-1">
        {renderIconButton(t.undo, <Undo2Icon />, vm.undo, { disabled: !vm.hasUndo })}
        {renderIconButton(t.redo, <Redo2Icon />, vm.redo, { disabled: !vm.hasRedo })}
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
        {renderIconButton(t.outline, <SquareDashedIcon />, vm.toggleOutline, {
          pressed: vm.outline,
          disabled: !editor,
        })}
        {renderIconButton(t.previewMode, <EyeIcon />, vm.startPreview, { disabled: !editor })}
      </div>
    </div>
  );
}

/** Keeps focus where it was (usually the canvas) so its keyboard shortcuts keep working. */
const keepFocus = (event: MouseEvent) => event.preventDefault();

/** A small icon-only top bar button; `pressed` makes it a toggle button. */
function renderIconButton(
  label: string,
  icon: ReactNode,
  onClick: () => void,
  { pressed, disabled }: { pressed?: boolean; disabled?: boolean }
) {
  return (
    <Button
      type="button"
      variant={pressed ? "secondary" : "ghost"}
      size="icon"
      className="size-8"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={keepFocus}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
}
