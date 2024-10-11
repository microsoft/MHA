export class Column {
    constructor(id: string, label: string, columnClass: string) {
        this.id = id;
        this.label = label;
        this.class = columnClass;
    }
    id: string;
    label: string;
    class: string;
}
