export const didKey = process.env.DID_KEY;

export const ceramicUrl =
	process.env.CERAMIC_URL || "https://ceramic-clay.3boxlabs.com";

if (!didKey) {
	throw new Error("DID Key is required!");
}
