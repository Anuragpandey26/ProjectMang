import arcjet, {
    detectBot,
    shield,
    tokenBucket,
    validateEmail,
} from "@arcjet/node";

class ArcjetAdapter {
    constructor() {
        this.aj = arcjet({
            key: process.env.ARCJET_KEY,
            characteristics: ["ip.src"],
            rules: [
                shield({ mode: "LIVE" }),
                detectBot({
                    mode: "LIVE",
                    allow: [
                        "CATEGORY:SEARCH_ENGINE",
                    ],
                }),
                validateEmail({
                    mode: "LIVE",
                    deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
                }),
                tokenBucket({
                    mode: "LIVE",
                    refillRate: 5,
                    interval: 10,
                    capacity: 10,
                }),
            ],
        });
    }

    async protect(req, context = {}) {
        return await this.aj.protect(req, context);
    }
}

export default new ArcjetAdapter();
