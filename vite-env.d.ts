/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WHOP_API_KEY: string;
    readonly VITE_WHOP_COMPANY_ID: string;
    readonly VITE_CRYPTOCOMPARE_API_KEY: string;
    // add more env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.png" {
    const value: string;
    export default value;
}

declare module "*.jpg" {
    const value: string;
    export default value;
}

declare module "*.svg" {
    const value: string;
    export default value;
}
