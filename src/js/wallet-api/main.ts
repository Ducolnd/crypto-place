// Edited code from https://github.com/Felippo001/nami-wallet-api/blob/main/src/index.ts

import { MultiAsset, TransactionOutputs, TransactionUnspentOutput } from '@emurgo/cardano-serialization-lib-asmjs'
import { Buffer } from 'buffer'
import CoinSelection from './coinSelection.js';

type Delegate = {
    poolId: string,
    metadata?: any,
    metadataLabel?: string
}

type Utxo = {
    txHash: string,
    txId: number,
    amount: Asset[]
}

type Asset = {
    unit: string,
    quantity: string
}


type Send = {
    address: string,
    amount?: number,
    assets?: Asset[],
    metadata?: any,
    metadataLabel?: string
}

type SendMultiple = {
    recipients: {
        address: string,
        amount?: number,
        assets?: Asset[]
    }[],
    metadata?: any,
    metadataLabel?: string
}

const SupportedWallets = ["flint", "nami", "ccvault"];

const ERROR = {
    FAILED_PROTOCOL_PARAMETER: 'Couldnt fetch protocol parameters from blockfrost',
    TX_TOO_BIG: 'Transaction too big'
}

export class Wallet {
    S: any;
    CoinSelection = CoinSelection;

    walletFull: any;
    walletInitial: any;

    constructor(cardano: any, serializationLib?: any) {
        if (cardano) {
            this.walletInitial =
                cardano[SupportedWallets[0]] || // Flint
                cardano[SupportedWallets[1]] || // Nami
                cardano[SupportedWallets[2]] || // CCvault
                undefined;                      // No supported wallet
        }

        this.S = serializationLib;
    }

    isConnected(): boolean {
        if (this.walletFull) return true
        else return false
    }

    isInstalled(): boolean {
        if (this.walletInitial) return true
        else return false
    }

    async isEnabled(): Promise<boolean> {
        if (!this.isInstalled()) return

        return await this.walletInitial.isEnabled()
    }

    async enable(): Promise<void> {
        if (!this.isInstalled()) return

        return this.walletInitial.enable().then(((full: any) => {
            this.walletFull = full;
        })).catch((err: any) => {
            throw err
        })
    }

    async getAddress(): Promise<string> {
        return this.S.Address.from_bytes(
            Buffer.from(
                await this.getAddressHex(),
                'hex'
            )
        ).to_bech32()
    }

    async getAddressHex(): Promise<string> {
        if (!this.isConnected()) return
        return await this.walletFull.getChangeAddress()
    }

    async getRewardAddress(): Promise<string> {
        return this.S.RewardAddress.from_address(
            this.S.Address.from_bytes(
                Buffer.from(
                    await this.getRewardAddressHex(),
                    'hex'
                )
            )
        )?.to_address().to_bech32()
    }

    async getRewardAddressHex(): Promise<string> {
        return await this.walletFull.getRewardAddress()
    }

    async getNetworkId(): Promise<{ id: number, network: string }> {
        let networkId = await this.walletFull.getNetworkId()
        return {
            id: networkId,
            network: networkId == 1 ? 'mainnet' : 'testnet'
        }
    }

    async getUtxos(): Promise<Utxo[]> {
        let Utxos = (await this.getUtxosHex()).map(u => this.S.TransactionUnspentOutput.from_bytes(
            Buffer.from(
                u,
                'hex'
            )
        )
        )
        let UTXOS = []
        for (let utxo of Utxos) {
            let assets = this._utxoToAssets(utxo)

            UTXOS.push({
                txHash: Buffer.from(
                    utxo.input().transaction_id().to_bytes(),
                    'hex'
                ).toString('hex'),
                txId: utxo.input().index(),
                amount: assets
            })
        }
        return UTXOS
    }

    async getAssets(): Promise<Asset[]> {
        let Utxos = await this.getUtxos()
        let AssetsRaw: Asset[] = []
        Utxos.forEach(u => {
            AssetsRaw.push(...u.amount.filter(a => a.unit != 'lovelace'))
        })
        let AssetsMap: any = {}

        for (let k of AssetsRaw) {
            let quantity = parseInt(k.quantity)
            if (!AssetsMap[k.unit]) AssetsMap[k.unit] = 0
            AssetsMap[k.unit] += quantity
        }
        return Object.keys(AssetsMap).map(k => ({ unit: k, quantity: AssetsMap[k].toString() }))
    }



    async getUtxosHex(): Promise<string[]> {
        return await this.walletFull.getUtxos()
    }


    async send({ address, amount = 0, assets = [], metadata = null, metadataLabel = '721' }: Send): Promise<string> {
        let PaymentAddress = await this.getAddress()

        let protocolParameter = await this._getProtocolParameter()
        let utxos = (await this.getUtxosHex()).map(u => this.S.TransactionUnspentOutput.from_bytes(
            Buffer.from(
                u,
                'hex'
            )
        ))

        let lovelace = Math.floor(amount * 1000000).toString()

        let ReceiveAddress = address


        let multiAsset = this._makeMultiAsset(assets)

        let outputValue = this.S.Value.new(
            this.S.BigNum.from_str(lovelace)
        )

        if (assets.length > 0) outputValue.set_multiasset(multiAsset)

        let minAda = this.S.min_ada_required(
            outputValue,
            this.S.BigNum.from_str(protocolParameter.minUtxo || "1000000")
        )
        if (this.S.BigNum.from_str(lovelace).compare(minAda) < 0) outputValue.set_coin(minAda)


        let outputs = this.S.TransactionOutputs.new()
        outputs.add(
            this.S.TransactionOutput.new(
                this.S.Address.from_bech32(ReceiveAddress),
                outputValue
            )
        )

        let RawTransaction = this._txBuilder({
            PaymentAddress: PaymentAddress,
            Utxos: utxos,
            Outputs: outputs,
            ProtocolParameter: protocolParameter,
            Metadata: metadata,
            MetadataLabel: metadataLabel,
            Delegation: null
        })

        return await this._signSubmitTx(RawTransaction)
    }

    async sendMultiple({ recipients = [], metadata = null, metadataLabel = '721' }: SendMultiple): Promise<string> {
        let PaymentAddress = await this.getAddress()

        let protocolParameter = await this._getProtocolParameter()
        let utxos = (await this.getUtxosHex()).map(u => this.S.TransactionUnspentOutput.from_bytes(
            Buffer.from(
                u,
                'hex'
            )
        ))

        let outputs = this.S.TransactionOutputs.new()

        for (let recipient of recipients) {
            let lovelace = Math.floor((recipient.amount || 0) * 1000000).toString()
            let ReceiveAddress = recipient.address
            let multiAsset = this._makeMultiAsset(recipient.assets || [])

            let outputValue = this.S.Value.new(
                this.S.BigNum.from_str(lovelace)
            )

            if ((recipient.assets || []).length > 0) outputValue.set_multiasset(multiAsset)

            let minAda = this.S.min_ada_required(
                outputValue,
                this.S.BigNum.from_str(protocolParameter.minUtxo || "1000000")
            )
            if (this.S.BigNum.from_str(lovelace).compare(minAda) < 0) outputValue.set_coin(minAda)


            outputs.add(
                this.S.TransactionOutput.new(
                    this.S.Address.from_bech32(ReceiveAddress),
                    outputValue
                )
            )
        }

        let RawTransaction = this._txBuilder({
            PaymentAddress: PaymentAddress,
            Utxos: utxos,
            Outputs: outputs,
            ProtocolParameter: protocolParameter,
            Metadata: metadata,
            MetadataLabel: metadataLabel,
            Delegation: null
        })

        return await this._signSubmitTx(RawTransaction)
    }

    async signData(string: string): Promise<string> {
        let address = await this.getAddressHex()
        let coseSign1Hex = await this.walletFull.signData(
            address,
            Buffer.from(
                string,
                "ascii"
            ).toString('hex')
        )
        return coseSign1Hex
    }

    //////////////////////////////////////////////////

    _makeMultiAsset(assets: Asset[]): MultiAsset {
        let AssetsMap: any = {}
        for (let asset of assets) {
            let [policy, assetName] = asset.unit.split('.')
            let quantity = asset.quantity
            if (!Array.isArray(AssetsMap[policy])) {
                AssetsMap[policy] = []
            }
            AssetsMap[policy].push({
                "unit": Buffer.from(assetName, 'ascii').toString('hex'),
                "quantity": quantity
            })

        }
        let multiAsset = this.S.MultiAsset.new()
        for (const policy in AssetsMap) {

            const ScriptHash = this.S.ScriptHash.from_bytes(
                Buffer.from(policy, 'hex')
            )
            const Assets = this.S.Assets.new()

            const _assets = AssetsMap[policy]

            for (const asset of _assets) {
                const AssetName = this.S.AssetName.new(Buffer.from(asset.unit, 'hex'))
                const BigNum = this.S.BigNum.from_str(asset.quantity)

                Assets.insert(AssetName, BigNum)
            }
            multiAsset.insert(ScriptHash, Assets)
        }
        return multiAsset
    }

    _utxoToAssets(utxo: TransactionUnspentOutput): Asset[] {
        let value: any = utxo.output().amount()
        const assets = [];
        assets.push({ unit: 'lovelace', quantity: value.coin().to_str() });
        if (value.multiasset()) {
            const multiAssets = value.multiasset().keys();
            for (let j = 0; j < multiAssets.len(); j++) {
                const policy = multiAssets.get(j);
                const policyAssets = value.multiasset().get(policy);
                const assetNames = policyAssets.keys();
                for (let k = 0; k < assetNames.len(); k++) {
                    const policyAsset = assetNames.get(k);
                    const quantity = policyAssets.get(policyAsset);
                    const asset =
                        Buffer.from(
                            policy.to_bytes()
                        ).toString('hex') + "." +
                        Buffer.from(
                            policyAsset.name()
                        ).toString('ascii')


                    assets.push({
                        unit: asset,
                        quantity: quantity.to_str(),
                    });
                }
            }
        }
        return assets;
    }

    _txBuilder({ PaymentAddress, Utxos, Outputs, ProtocolParameter, Metadata = null, MetadataLabel = '721', Delegation = null }: {
        PaymentAddress: string
        Utxos: any,
        Outputs: TransactionOutputs,
        ProtocolParameter: any,
        Metadata?: any,
        MetadataLabel?: string,
        Delegation?: {
            stakeKeyHash: string,
            poolHex: string,
            delegation: {
                active: boolean,
                rewards: string,
                poolId: string
            }
        } | null
    }): Uint8Array {
        const MULTIASSET_SIZE = 5000;
        const VALUE_SIZE = 5000;
        const totalAssets = 0
        this.CoinSelection.setLoader(this.S)
        this.CoinSelection.setProtocolParameters(
            ProtocolParameter.minUtxo.toString(),
            ProtocolParameter.linearFee.minFeeA.toString(),
            ProtocolParameter.linearFee.minFeeB.toString(),
            ProtocolParameter.maxTxSize.toString()
        )
        const selection = this.CoinSelection.randomImprove(
            Utxos,
            Outputs,
            20 + totalAssets,
            //ProtocolParameter.minUtxo.to_str()
        )
        const inputs = selection.input;
        const txBuilder = this.S.TransactionBuilder.new(
            this.S.LinearFee.new(
                this.S.BigNum.from_str(ProtocolParameter.linearFee.minFeeA),
                this.S.BigNum.from_str(ProtocolParameter.linearFee.minFeeB)
            ),
            this.S.BigNum.from_str(ProtocolParameter.minUtxo.toString()),
            this.S.BigNum.from_str(ProtocolParameter.poolDeposit.toString()),
            this.S.BigNum.from_str(ProtocolParameter.keyDeposit.toString()),
            MULTIASSET_SIZE,
            MULTIASSET_SIZE
        );

        for (let i = 0; i < inputs.length; i++) {
            const utxo = inputs[i];
            txBuilder.add_input(
                utxo.output().address(),
                utxo.input(),
                utxo.output().amount()
            );
        }

        if (Delegation) {
            let certificates = this.S.Certificates.new();
            if (!Delegation.delegation.active) {
                certificates.add(
                    this.S.Certificate.new_stake_registration(
                        this.S.StakeRegistration.new(
                            this.S.StakeCredential.from_keyhash(
                                this.S.Ed25519KeyHash.from_bytes(
                                    Buffer.from(Delegation.stakeKeyHash, 'hex')
                                )
                            )
                        )
                    )
                )
            }

            let poolKeyHash = Delegation.poolHex
            certificates.add(
                this.S.Certificate.new_stake_delegation(
                    this.S.StakeDelegation.new(
                        this.S.StakeCredential.from_keyhash(
                            this.S.Ed25519KeyHash.from_bytes(
                                Buffer.from(Delegation.stakeKeyHash, 'hex')
                            )
                        ),
                        this.S.Ed25519KeyHash.from_bytes(
                            Buffer.from(poolKeyHash, 'hex')
                        )
                    )
                )
            );
            txBuilder.set_certs(certificates)
        }


        let AUXILIARY_DATA
        if (Metadata) {
            let METADATA = this.S.GeneralTransactionMetadata.new()
            METADATA.insert(
                this.S.BigNum.from_str(MetadataLabel),
                this.S.encode_json_str_to_metadatum(
                    JSON.stringify(Metadata),
                    0
                )
            )
            AUXILIARY_DATA = this.S.AuxiliaryData.new()
            AUXILIARY_DATA.set_metadata(METADATA)
            //const auxiliaryDataHash = this.Shash_auxiliary_data(AUXILIARY_DATA)
            txBuilder.set_auxiliary_data(AUXILIARY_DATA)
        }

        for (let i = 0; i < Outputs.len(); i++) {
            txBuilder.add_output(Outputs.get(i))
        }


        const change = selection.change;
        const changeMultiAssets = change.multiasset();
        // check if change value is too big for single output
        if (changeMultiAssets && change.to_bytes().length * 2 > VALUE_SIZE) {
            const partialChange = this.S.Value.new(
                this.S.BigNum.from_str('0')
            );

            const partialMultiAssets = this.S.MultiAsset.new();
            const policies = changeMultiAssets.keys();
            const makeSplit = () => {
                for (let j = 0; j < changeMultiAssets.len(); j++) {
                    const policy = policies.get(j);
                    const policyAssets = changeMultiAssets.get(policy);
                    const assetNames = policyAssets.keys();
                    const assets = this.S.Assets.new();
                    for (let k = 0; k < assetNames.len(); k++) {
                        const policyAsset = assetNames.get(k);
                        const quantity = policyAssets.get(policyAsset);
                        assets.insert(policyAsset, quantity);
                        //check size
                        const checkMultiAssets = this.S.MultiAsset.from_bytes(
                            partialMultiAssets.to_bytes()
                        );
                        checkMultiAssets.insert(policy, assets);
                        const checkValue = this.S.Value.new(
                            this.S.BigNum.from_str('0')
                        );
                        checkValue.set_multiasset(checkMultiAssets);
                        if (
                            checkValue.to_bytes().length * 2 >=
                            VALUE_SIZE
                        ) {
                            partialMultiAssets.insert(policy, assets);
                            return;
                        }
                    }
                    partialMultiAssets.insert(policy, assets);
                }
            };

            makeSplit();
            partialChange.set_multiasset(partialMultiAssets);

            const minAda = this.S.min_ada_required(
                partialChange,
                this.S.BigNum.from_str(ProtocolParameter.minUtxo)
            );
            partialChange.set_coin(minAda);

            txBuilder.add_output(
                this.S.TransactionOutput.new(
                    this.S.Address.from_bech32(PaymentAddress),
                    partialChange
                )
            );
        }
        txBuilder.add_change_if_needed(
            this.S.Address.from_bech32(PaymentAddress)
        );
        const transaction = this.S.Transaction.new(
            txBuilder.build(),
            this.S.TransactionWitnessSet.new(),
            AUXILIARY_DATA
        )

        const size = transaction.to_bytes().length * 2;
        if (size > ProtocolParameter.maxTxSize) throw ERROR.TX_TOO_BIG;

        return transaction.to_bytes()
    }

    async _signSubmitTx(transactionRaw: Uint8Array): Promise<string> {
        let transaction = this.S.Transaction.from_bytes(transactionRaw)
        const witneses = await this.walletFull.signTx(
            Buffer.from(
                transaction.to_bytes()
            ).toString('hex')
        )

        const signedTx = this.S.Transaction.new(
            transaction.body(),
            this.S.TransactionWitnessSet.from_bytes(
                Buffer.from(
                    witneses,
                    "hex"
                )
            ),
            transaction.auxiliary_data()
        )

        const txhash = await this.walletFull.submitTx(
            Buffer.from(
                signedTx.to_bytes()
            ).toString('hex')
        )
        return txhash

    }

    async _getProtocolParameter(): Promise<any> {
        let data = await fetch("/protocolparams.json"); // first step
        return await data.json()

    }
}

//////////////////////////////////////////////////
//Auxiliary

function AsciiToBuffer(string: string): Buffer {
    return Buffer.from(string, "ascii")
}

function HexToBuffer(string: string): Buffer {
    return Buffer.from(string, "hex")
}

function AsciiToHex(string: string): string {
    return AsciiToBuffer(string).toString('hex')
}

function HexToAscii(string: string): string {
    return HexToBuffer(string).toString("ascii")
}

function BufferToAscii(buffer: Buffer): string {
    return buffer.toString('ascii')
}

function BufferToHex(buffer: Buffer): string {
    return buffer.toString("hex")
}