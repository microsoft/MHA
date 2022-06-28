export abstract class iTable {
    protected abstract _sortColumn: string;
    protected abstract _sortOrder: number;
    public abstract readonly tableName: string;
    public abstract doSort(col: string): void;
    public get sortColumn(): string { return this._sortColumn; };
    public get sortOrder(): number { return this._sortOrder; };
    public abstract toString(): string;
}