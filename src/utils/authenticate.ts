import { DID } from "dids";
import * as uint8arrays from "uint8arrays";
import ono from "@jsdevtools/ono";
import { Sha256 } from "@aws-crypto/sha256-js";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { getResolver as getKeyResolver } from "key-did-resolver";
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { ThreeIdProvider } from "@3id/did-provider";
import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";

import getArweaveClient from "@/utils/arweave-client";
import { Chains, Connections, IDataModel, IDIDDataStore } from "@/types";
import { ceramicUrl } from "./env-config";
import { AdvertiserModel } from "@/models";

const arweave = getArweaveClient();

class Authenticate {
	private static instance: Authenticate | null;

	protected _did!: DID;

	protected _ceramic;

	protected model: IDataModel;

	protected store: IDIDDataStore;

	constructor() {
		this._ceramic = new CeramicClient(ceramicUrl); // new instance of ceramic client for each DID;
		const model = new DataModel({
			ceramic: this._ceramic,
			aliases: AdvertiserModel
		});
		const store = new DIDDataStore({ ceramic: this._ceramic, model });
		this.model = model;
		this.store = store;
	}

	public getDID() {
		return this._did;
	}

	public getCeramic() {
		return this._ceramic;
	}

	/**
	 * Deterministically produce a secret for DID production
	 */
	public async withArweave(
		walletAddress: string,
		provider:
			| typeof window.arweaveWallet
			| {
					signature: (
						data: Uint8Array,
						algorithm: RsaPssParams
					) => Promise<Uint8Array>;
			  },
		connection: Connections
	): Promise<void> {
		const arr = uint8arrays.fromString(walletAddress);
		const sig = await provider.signature(arr, {
			name: "RSA-PSS",
			saltLength: 0 // This ensures that no additional salt is produced and added to the message signed.
		});

		//* We have to SHA256 hash here because the Seed is required to be 32 bytes
		const hash = new Sha256();
		hash.update(uint8arrays.toString(sig));
		const entropy = await hash.digest();

		const id = [Chains.ARWEAVE, walletAddress].join(":");

		// Connect/Auth DID
		const threeIDAuth = await ThreeIdProvider.create({
			ceramic: this._ceramic,
			authId: id,
			authSecret: entropy,
			getPermission: (request: any) => Promise.resolve(request.payload.paths)
		});

		const did = new DID({
			// Get the DID provider from the 3ID Connect instance
			provider: threeIDAuth.getDidProvider(),
			resolver: {
				...get3IDResolver(this._ceramic),
				...getKeyResolver()
			}
		});
		// Authenticate the DID using the 3ID provider from 3ID Connect, this will trigger the
		// authentication flow using 3ID Connect and the Ethereum provider
		await did.authenticate();

		this._ceramic.did = did;

		this._did = did;
	}

	private static nativeArweaveProvider(jwk: Object) {
		return {
			// We're reimplementing the signature mechanism to allow for 0 salt length -- as the ArweaveJS forces 32
			async signature(data: Uint8Array, algorithm: RsaPssParams) {
				// For reference, see https://github.com/ArweaveTeam/arweave-js/blob/master/src/common/lib/crypto/webcrypto-driver.ts#L110
				const k = await crypto.subtle.importKey(
					"jwk",
					jwk,
					{
						name: "RSA-PSS",
						hash: {
							name: "SHA-256"
						}
					},
					false,
					["sign"]
				);
				// For reference, see: https://github.com/ArweaveTeam/arweave-js/blob/master/src/common/lib/crypto/webcrypto-driver.ts#L48
				const sig = await crypto.subtle.sign(algorithm, k, data);
				return new Uint8Array(sig);
			}
		};
	}

	public static getInstance() {
		if (!this.instance) {
			this.instance = new Authenticate();
		}
		return this.instance;
	}
}

export default Authenticate;
