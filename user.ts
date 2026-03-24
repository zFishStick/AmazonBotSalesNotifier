export class User {
    name: string;
    location: string;
    language: string;

    constructor(name: string) {
        this.name = name;
        this.location = "Unknown";
        this.language = "en"; // Default language
    }
}