import grapesjs from "grapesjs";
import type { AssetsConfig, CreateEditorOptions, ProjectData } from "@grapesjs/studio-sdk";
import type { QueryClient } from "@tanstack/react-query";
import { mediaLibraryAssetProvider, type BuilderAssetProvider } from "./asset-provider";
import { createBuilderPlugin, registerBuilderBlocks } from "./builder-plugin";
import { TEXTS } from "@/texts";

/**
 * Adapts the repo's asset provider to the Studio SDK's `assets` option: uploads and the
 * "Media library" provider tab both go through `provider`, so the Studio host and the Core shell
 * share one media library.
 */
export const toStudioAssetsConfig = (provider: BuilderAssetProvider): AssetsConfig => ({
  storageType: "self",
  onUpload: async ({ files }) => Promise.all(files.map((file) => provider.upload(file))),
  onDelete: async () => {
    // Deleting goes through the admin's Media page; the editor only picks.
  },
  providers: [
    {
      id: "media-library",
      types: provider.types,
      label: TEXTS.builder.traits.mediaLibrary,
      onLoad: async ({ pageIndex, searchValue }) =>
        provider.list({ page: pageIndex + 1, search: searchValue || undefined }),
    },
  ],
});

export type GetStudioEditorOptionsProps = {
  /** The project's own Studio licence key (empty on localhost is tolerated by the SDK's dev mode). */
  licenseKey: string;
  /** The project to open: the page's draft as GrapesJS project data. */
  project: ProjectData;
  /** Called with the project data the SDK wants saved (autosave and the save command). */
  onSave: (project: ProjectData) => Promise<void>;
  /** The host's React Query client, handed to the canvas renderer. */
  queryClient?: QueryClient;
  /** The media library the asset panel lists; the shared provider by default. */
  assets?: BuilderAssetProvider;
};

/**
 * Builds the Studio SDK options for the optional Studio host: the locally installed GrapesJS
 * (no CDN), self storage through `onSave`, the media library as the asset provider, a single
 * page with no page manager, and the same builder plugin the Core shell installs. The result
 * must be memoised by the caller: the SDK rebuilds the whole editor on a new options object.
 */
export const getStudioEditorOptions = ({
  licenseKey,
  project,
  onSave,
  queryClient,
  assets = mediaLibraryAssetProvider,
}: GetStudioEditorOptionsProps): CreateEditorOptions => ({
  licenseKey,
  // The locally installed grapesjs instead of the SDK's CDN copy; its CSS is imported by the host.
  gjsScript: grapesjs as unknown as CreateEditorOptions["gjsScript"],
  gjsStyle: "",
  assets: toStudioAssetsConfig(assets),
  storage: {
    type: "self",
    project,
    onSave: async ({ project: saved }) => onSave(saved),
    autosaveChanges: 50,
  },
  project: { type: "web", default: project },
  // One page per editor: the pages list owns creation, slugs and publishing.
  pages: false,
  plugins: [
    createBuilderPlugin({ queryClient }),
    // The SDK adds its own default blocks (forms, navbar, map, ...) after plugins run, replacing
    // ours where the ids match; once it is ready the palette is reset to the library's blocks.
    (editor) => editor.onReady(() => registerBuilderBlocks(editor)),
  ],
});
