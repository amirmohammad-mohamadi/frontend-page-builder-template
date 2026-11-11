import type { IBaseModel } from "../base";

export type ExampleStatus = "draft" | "active" | "archived";

export type IExampleModel = IBaseModel & {
  title: string;
  description: string | null;
  status: ExampleStatus;
};
