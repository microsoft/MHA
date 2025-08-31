export abstract class TableSection {
    public abstract readonly tableName: string;
    public abstract readonly displayName: string;
    public abstract readonly paneClass: "sectionHeader" | "tableCaption";
    public abstract exists(): boolean;
    public abstract toString(): string;

    // Shared accessibility methods
    public getTableCaption(): string {
        return this.displayName;
    }

    public getAriaLabel(): string {
        return `${this.displayName} table`;
    }
}
