import type { AssetsCustomData } from "grapesjs";
import {
  createAssetPickerController,
  resolveAssetPick,
  toAcceptedTypes,
} from "./asset-picker-controller";

/** A stand-in for what core's `open-assets` command hands `assetManager.custom.open`. */
const customData = (options: AssetsCustomData["options"] = {}) =>
  ({
    types: ["image"],
    select: jest.fn(),
    close: jest.fn(),
    options,
  }) as unknown as AssetsCustomData;

const PICK = { src: "https://cdn.example/a.webp", name: "a.webp", type: "image" };

describe("createAssetPickerController", () => {
  it("publishes each open with a new id and clears it on close", () => {
    const controller = createAssetPickerController();
    const listener = jest.fn();
    controller.subscribe(listener);

    const first = customData();
    controller.open(first);
    expect(controller.getSnapshot()).toMatchObject({ types: ["image"], openId: 1 });
    expect(controller.getSnapshot()?.close).toBe(first.close);

    controller.close(first);
    expect(controller.getSnapshot()).toBeNull();

    controller.open(customData());
    expect(controller.getSnapshot()?.openId).toBe(2);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("stops notifying after unsubscribe", () => {
    const controller = createAssetPickerController();
    const listener = jest.fn();
    controller.subscribe(listener)();
    controller.open(customData());
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("resolveAssetPick", () => {
  it("hands the caller's own select a detached asset, never core's adding select, then closes", () => {
    const callerSelect = jest.fn();
    const request = customData({ select: callerSelect });

    resolveAssetPick(request, PICK);

    expect(request.select).not.toHaveBeenCalled();
    const [asset, complete] = callerSelect.mock.calls[0];
    expect(complete).toBe(true);
    expect(asset.src).toBe(PICK.src);
    expect(asset.getSrc()).toBe(PICK.src);
    expect(request.close).toHaveBeenCalledTimes(1);
  });

  it("falls back to core's select when the caller passed none", () => {
    const request = customData({});

    resolveAssetPick(request, PICK);

    expect(request.select).toHaveBeenCalledWith(PICK, true);
    expect(request.close).toHaveBeenCalledTimes(1);
  });
});

describe("toAcceptedTypes", () => {
  it("keeps the image and video kinds a request names", () => {
    expect(toAcceptedTypes(["image"])).toEqual(["image"]);
    expect(toAcceptedTypes(["video"])).toEqual(["video"]);
    expect(toAcceptedTypes(["image", "video"])).toEqual(["image", "video"]);
  });

  it("accepts both when the request names none it knows", () => {
    expect(toAcceptedTypes([])).toEqual(["image", "video"]);
    expect(toAcceptedTypes(["document"])).toEqual(["image", "video"]);
  });
});
