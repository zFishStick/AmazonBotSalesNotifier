
import { log } from "node:console";
import process from "node:process";

const params = {
    api_key: process.env.RAINFOREST_API_KEY || "",
    amazon_domain: "amazon.com", // Default
    asin: "", // Product ASIN
    type: "product"
}

export function setAmazonDomain(domain: string) {
    params.amazon_domain = domain;
}

export function getASIN(url: string): string | null {
    if (!url) return null;
    const asinMatch = new RegExp(/\/dp\/([A-Z0-9]{10})/).exec(url) || new RegExp(/\/gp\/product\/([A-Z0-9]{10})/).exec(url);
    return asinMatch ? asinMatch[1] : null;
}

async function checkPrice() {
    const queryString = new URLSearchParams(params).toString();
    const url = `https://api.rainforestapi.it/request?${queryString}`;

    try {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Errore API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("Prezzo attuale:", data.product?.buybox_winner?.price?.value);
    console.log("Risposta completa:", JSON.stringify(data, null, 2));

    } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Errore durante la chiamata:", errorMessage);
    }
}