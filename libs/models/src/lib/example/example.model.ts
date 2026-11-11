import { BaseModel } from "../base";
import type { ExampleStatus, IExampleModel } from "./example.interface";

export class ExampleModel extends BaseModel<IExampleModel> {
  getTitle(): string {
    return this.props.title ?? "";
  }

  getDescription(): string {
    return this.props.description ?? "";
  }

  getStatus(): ExampleStatus {
    return this.props.status ?? "draft";
  }

  isActive(): boolean {
    return this.getStatus() === "active";
  }
}
