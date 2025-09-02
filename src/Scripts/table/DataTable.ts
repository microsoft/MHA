import { TableSection } from "./TableSection";

export abstract class DataTable extends TableSection {
    protected abstract sortColumnInternal: string;
    protected abstract sortOrderInternal: number;
    public abstract doSort(col: string): void;
    public abstract get rows(): unknown[]; // typed per implementation

    public readonly paneClass = "tableCaption" as const;

    public get sortColumn(): string { return this.sortColumnInternal; }
    public get sortOrder(): number { return this.sortOrderInternal; }

    // Default exists implementation for data tables
    public exists(): boolean {
        return this.rows.length > 0;
    }
}
