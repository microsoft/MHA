import { TableSection } from "./TableSection";
import { Row } from "../row/Row";

export abstract class SummaryTable extends TableSection {
    public abstract get rows(): Row[];
    public abstract readonly tag: string;
    public readonly paneClass = "sectionHeader" as const;

    // Default exists implementation for summary tables
    public exists(): boolean {
        return this.rows.some(row => !!row.value);
    }
}