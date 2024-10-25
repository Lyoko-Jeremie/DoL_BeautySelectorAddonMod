import JSZip from "jszip";
import type {LifeTimeCircleHook, LogWrapper} from "../../../dist-BeforeSC2/ModLoadController";
import type {AddonPluginHookPointEx} from "../../../dist-BeforeSC2/AddonPlugin";
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {
    IModImgGetter,
    IModImgGetterLRUCache,
    ImgLruCacheItemType,
    ModBootJson,
    ModImg,
    ModInfo,
} from "../../../dist-BeforeSC2/ModLoader";
import type {ModZipReader} from "../../../dist-BeforeSC2/ModZipReader";
import {every, isArray, isNil, isString} from 'lodash';
import {LRUCache} from 'lru-cache';
import {extname} from "./extname";
import JSON5 from 'json5';
import {
    BeautySelectorAddonParamsType0,
    BeautySelectorAddonParamsType1,
    BeautySelectorAddonParamsType2, BeautySelectorAddonParamsType2ATypeItem, BeautySelectorAddonParamsType2BTypeItem,
    BSModItem,
    ModImgEx,
    TypeOrderItem,
} from "./BeautySelectorAddonType";
import {BeautySelectorAddonInterface} from "./BeautySelectorAddonInterface";
import {traverseZipFolder} from "./utils/traverseZipFolder";
import {getRelativePath} from "./utils/getRelativePath";
import type {
    ModSubUiAngularJsModeExportInterface
} from "../../ModSubUiAngularJs/dist-ts/ModSubUiAngularJsModeExportInterface";
import {StringTable} from "./GUI_StringTable/StringTable";

// https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript

/*
    cyrb53 (c) 2018 bryc (github.com/bryc)
    License: Public domain. Attribution appreciated.
    A fast and simple 53-bit string hash function with decent collision resistance.
    Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
*/
const cyrb53 = function (str: string, seed = 0): number {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export function imgWrapBase64Url(fileName: string, base64: string) {
    let ext = extname(fileName);
    if (ext.startsWith('.')) {
        ext = ext.substring(1);
    }
    // console.log('imgWrapBase64Url', [fileName, ext, base64]);
    return `data:image/${ext};base64,${base64}`;
}

export class BeautySelectorAddonImgGetter implements IModImgGetter {
    constructor(
        public modName: string,
        public zip: ModZipReader,
        public imgPath: string,
        public logger: LogWrapper,
    ) {
    }

    imgCache?: string | undefined;
    invalid: boolean = false;

    async forceCache() {
        this.imgCache = await this.getBase64Image();
    }

    async getBase64Image() {
        arguments.length > 0 && console.error('BeautySelectorAddonImgGetter getBase64Image() cannot have arguments.', arguments);
        if (this.invalid) {
            return undefined;
        }
        // add mod prefix to cache path
        const key = `[${this.modName}]_${this.imgPath}`;
        if (this.imgCache) {
            return this.imgCache;
        }
        const cache = BeautySelectorAddonImgLruCache.get(key);
        if (cache) {
            return cache.invalid ? undefined : cache.imageBase64;
        }
        const imgFile = this.zip.zip.file(this.imgPath);
        if (imgFile) {
            const data = await imgFile.async('base64');
            const imgCache = imgWrapBase64Url(this.imgPath, data);
            BeautySelectorAddonImgLruCache.set(key, {
                imageBase64: imgCache,
                invalid: false,
            });
            return imgCache;
        }
        this.invalid = true;
        BeautySelectorAddonImgLruCache.set(key, {
            imageBase64: '',
            invalid: true,
        });
        console.error(`[BeautySelectorAddon] BeautySelectorAddonImgGetter getBase64Image() imgFile not found: ${this.imgPath} in ${this.zip.modInfo?.name}`);
        this.logger.error(`[BeautySelectorAddon] BeautySelectorAddonImgGetter getBase64Image() imgFile not found: ${this.imgPath} in ${this.zip.modInfo?.name}`);
        return undefined;
        // return Promise.reject(`[BeautySelectorAddon] BeautySelectorAddonImgGetter getBase64Image() imgFile not found: ${this.imgPath} in ${this.zip.modInfo?.name}`);
    }

}

// prefix_with_mod_name
export const BeautySelectorAddonImgLruCache = new LRUCache<string, ImgLruCacheItemType>({
    max: 30,
    ttl: 1000 * 60 * 1,
    dispose: (value: ImgLruCacheItemType, key: string, reason: LRUCache.DisposeReason) => {
        console.log('[BeautySelectorAddon] BeautySelectorAddonImgLruCache dispose', [value], [reason]);
    },
    updateAgeOnGet: true,
    updateAgeOnHas: true,
});


export function isParamsType0(a: any): a is BeautySelectorAddonParamsType0 {
    return a
        && isString(a.type)
        && isNil(a.imgFileList)
        && isNil(a.types)
        ;
}

export function isParamsType1(a: any): a is BeautySelectorAddonParamsType1 {
    return a
        && isString(a.type)
        && !isNil(a.imgFileList) && isArray(a.imgFileList) && every(a.imgFileList, isString)
        && isNil(a.types)
        ;
}

export function isParamsType2AItem(a: any): a is BeautySelectorAddonParamsType2ATypeItem {
    return a
        && isString(a.type)
        && isString(a.imgFileListFile)
        && isNil(a.imgDir)
        ;
}

export function isParamsType2BItem(a: any): a is BeautySelectorAddonParamsType2BTypeItem {
    return a
        && isString(a.type)
        && isString(a.imgDir)
        && isNil(a.imgFileListFile)
        ;
}

export function isParamsType2(a: any): a is BeautySelectorAddonParamsType2 {
    return a
        && isNil(a.type)
        && isNil(a.imgFileList)
        && isArray(a.types) && every(a.types, T => isParamsType2AItem(T) || isParamsType2BItem(T))
        ;
}

export function getDirFromPath(path: string) {
    if (path.endsWith('/') || path.endsWith('\\')) {
        // is dir
        return path;
    }
    const lastSlash1 = path.lastIndexOf('/');
    const lastSlash2 = path.lastIndexOf('\\');
    const lastSlash = Math.max(lastSlash1, lastSlash2);
    if (lastSlash === -1) {
        // only a file name
        return '';
    }
    return path.substring(0, lastSlash + 1);
}

export class BeautySelectorAddon implements AddonPluginHookPointEx, BeautySelectorAddonInterface {
    private logger: LogWrapper;

    constructor(
        public gSC2DataManager: SC2DataManager,
        public gModUtils: ModUtils,
    ) {
        this.logger = gModUtils.getLogger();
        this.gSC2DataManager.getAddonPluginManager().registerAddonPlugin(
            'BeautySelectorAddon',
            'BeautySelectorAddon',
            this,
        );
        this.gSC2DataManager.getModLoadController().addLifeTimeCircleHook(
            'BeautySelectorAddon',
            {
                ModLoaderLoadEnd: async () => {
                    await this.onModLoaderLoadEnd();
                },
            }
        );
        this.IdbKeyValRef = this.gModUtils.getIdbKeyValRef();
        this.IdbRef = this.gModUtils.getIdbRef();
        this.cachedFileList = new CachedFileList(this.gModUtils, this.IdbKeyValRef, this.IdbRef);

        const theName = this.gModUtils.getNowRunningModName();
        if (!theName) {
            console.error('[BeautySelectorAddon] init() (!theName).', [theName]);
            this.logger.error(`[BeautySelectorAddon] init() [${theName}].`);
            return;
        }
        const mod = this.gModUtils.getMod(theName);
        if (!mod) {
            console.error('[BeautySelectorAddon] init() (!mod). ', [theName]);
            this.logger.error(`[BeautySelectorAddon] init() (!mod). [${theName}].`);
            return;
        }
        console.log('[BeautySelectorAddon] register modRef done.', [theName]);
        this.logger.log(`[BeautySelectorAddon] register modRef done. [${theName}].`);
        mod.modRef = this;
        if (window.modLoaderGui_ModSubUiAngularJsService) {
            this.typeOrderSubUi = new TypeOrderSubUi(window.modLoaderGui_ModSubUiAngularJsService, this);
        }
    }

    protected cachedFileList?: CachedFileList;
    protected typeOrderSubUi?: TypeOrderSubUi;

    async onModLoaderLoadEnd() {

        if (!this.typeOrderUsed) {
            this.typeOrderUsed = this.typeOrder;
        }
        await this.loadSavedOrder();

        await this.typeOrderSubUi?.init();

        console.log('[BeautySelectorAddon] all ok');
        this.logger.log('[BeautySelectorAddon] all ok');
    }

    private table: Map<string, BSModItem> = new Map<string, BSModItem>();

    private typeOrder: TypeOrderItem[] = [];

    getTypeOrder() {
        return this.typeOrder;
    }

    // can re-order this list
    typeOrderUsed?: TypeOrderItem[];

    async registerMod(addonName: string, mod: ModInfo, modZip: ModZipReader) {
        const ad = mod.bootJson.addonPlugin?.find(T => T.modName === 'BeautySelectorAddon' && T.addonName === 'BeautySelectorAddon');
        if (!ad) {
            console.error(`[BeautySelectorAddon] registerMod: cannot find addonPlugin in bootJson`, [addonName, mod.name, mod, modZip]);
            this.logger.error(`[BeautySelectorAddon] registerMod: cannot find addonPlugin in bootJson [${mod.name}]`);
            return;
        }
        const modName = mod.name;
        const modHash = modZip.modZipReaderHash;
        if (isParamsType0(ad.params)) {
        } else if (isParamsType1(ad.params)) {
            const params: BeautySelectorAddonParamsType1 = ad.params;
            const type = params.type;
            if (this.table.has(type)) {
                console.warn(`[BeautySelectorAddon] registerMod: type already exist`, [addonName, mod.name, mod, modZip, type, this.table.get(type)]);
                this.logger.warn(`[BeautySelectorAddon] registerMod: type[${type}] already exist in [${this.table.get(type)!.name}]. this type will not be add.`);
                return;
            }
            const imgList = new Map<string, ModImgEx>(
                params.imgFileList.map(T => {
                    return [T, {
                        path: T,
                        realPath: T,
                        getter: new BeautySelectorAddonImgGetter(modName, modZip, T, this.logger),
                    }];
                }),
            );
            const BS = {
                name: addonName,
                mod: mod,
                modZip: modZip,
                type: [type],
                params: ad.params,
                typeImg: new Map<string, Map<string, ModImgEx>>([[type, imgList]]),
            };
            this.table.set(type, BS);
            this.typeOrder.push({
                type: type,
                modRef: BS,
                imgListRef: imgList,
            });
        } else if (isParamsType2(ad.params)) {
            const params: BeautySelectorAddonParamsType2 = ad.params;
            if ((new Set(params.types.map(T => T.type))).size !== params.types.length) {
                console.error(`[BeautySelectorAddon] registerMod: have duplicate type`, [addonName, mod.name, mod, modZip]);
                this.logger.error(`[BeautySelectorAddon] registerMod: have duplicate type in mod[${mod.name}]. invalid mod config`);
                return;
            }
            const BS: BSModItem = {
                name: addonName,
                mod: mod,
                modZip: modZip,
                type: [],
                params: ad.params,
                typeImg: new Map<string, Map<string, ModImgEx>>(),
            };
            for (const L of params.types) {
                const type = L.type;
                if (this.table.has(type)) {
                    console.warn(`[BeautySelectorAddon] registerMod: type already exist`, [addonName, mod.name, mod, modZip, type, L, this.table.get(type)]);
                    this.logger.warn(`[BeautySelectorAddon] registerMod: type[${type}] already exist in [${this.table.get(type)!.name}]`);
                    continue;
                }
                const existType = this.typeOrder.find(T => T.type === type);
                if (existType) {
                    console.error(`[BeautySelectorAddon] registerMod: type already exist.`, [addonName, mod.name, mod, modZip, type, L, existType]);
                    this.logger.error(`[BeautySelectorAddon] registerMod: modName[${mod.name}] type[${type}] already exist in otherModeName[${existType.modRef.name}]. this type will not be add.`);
                    continue;
                }
                if (isParamsType2AItem(L)) {
                    const imgFileListFile = await modZip.zip.file(L.imgFileListFile)?.async('string');
                    if (!imgFileListFile) {
                        console.error(`[BeautySelectorAddon] registerMod: imgFileListFile not found.`, [addonName, mod.name, mod, modZip, type, L]);
                        this.logger.error(`[BeautySelectorAddon] registerMod: modName[${mod.name}] type[${type}] imgFileListFile[${L.imgFileListFile}] not found. this type will not be add.`);
                        continue;
                    }
                    let imgFileList: string[] = [];
                    try {
                        imgFileList = JSON5.parse(imgFileListFile);
                        if (!(isArray(imgFileList) && every(imgFileList, isString))) {
                            console.error(`[BeautySelectorAddon] registerMod: imgFileListFile is not a string array.`, [addonName, mod.name, mod, modZip, type, L]);
                            this.logger.error(`[BeautySelectorAddon] registerMod: modName[${mod.name}] type[${type}] imgFileListFile is not a string array. this type will not be add.`);
                            continue;
                        }
                    } catch (e: Error | any) {
                        console.error(`[BeautySelectorAddon] registerMod: imgFileListFile is not a valid json.`, [addonName, mod.name, mod, modZip, type, L]);
                        this.logger.error(`[BeautySelectorAddon] registerMod: modName[${mod.name}] type[${type}] imgFileListFile is not a valid json. this type will not be add.`);
                        continue;
                    }
                    // calc real path in zip
                    const dirP = getDirFromPath(L.imgFileListFile);
                    const imgList = new Map<string, ModImgEx>(
                        imgFileList.map(T => {
                            const realPath = dirP + T;
                            return [T, {
                                path: T,
                                realPath: realPath,
                                getter: new BeautySelectorAddonImgGetter(modName, modZip, realPath, this.logger),
                            }];
                        }),
                    );
                    BS.typeImg.set(type, imgList);
                    BS.type.push(type);

                    this.typeOrder.push({
                        type: type,
                        modRef: BS,
                        imgListRef: imgList,
                    });
                    this.table.set(type, BS);
                } else if (isParamsType2BItem(L)) {
                    // this.getCachedFileList(modName, modHash.toString(), type);

                    const fileList = await traverseZipFolder(modZip.zip, L.imgDir);
                    const imgList = new Map<string, ModImgEx>(
                        fileList.map(T => {
                            const realPath = T.path;
                            const path = getRelativePath(realPath, L.imgDir);
                            return [path, {
                                path: path,
                                realPath: realPath,
                                getter: new BeautySelectorAddonImgGetter(modName, modZip, realPath, this.logger),
                            }];
                        }),
                    );
                    BS.typeImg.set(type, imgList);
                    BS.type.push(type);

                    this.typeOrder.push({
                        type: type,
                        modRef: BS,
                        imgListRef: imgList,
                    });
                    this.table.set(type, BS);
                } else {
                    // never go here
                    throw new Error(`[BeautySelectorAddon] registerMod: invalid type. [${addonName}] [${mod.name}] [${type}]. never go there.`);
                }
            }
        } else {
            console.error(`[BeautySelectorAddon] registerMod: invalid params`, [addonName, mod.name, mod, modZip]);
            this.logger.error(`[BeautySelectorAddon] registerMod: invalid params [${mod.name}]`);
            return;
        }
    }

    async imageLoader(
        src: string,
        layer: any,
        successCallback: (src: string, layer: any, img: HTMLImageElement) => void,
        errorCallback: (src: string, layer: any, event: any) => void,
    ) {
        const imgString = await this.imageGetter(src);
        // console.log('[BeautySelectorAddon] imgLoaderHooker', [src, n]);
        if (imgString) {
            try {
                // this may throw error
                const image = new Image();
                image.onload = () => {
                    successCallback(src, layer, image);
                };
                image.onerror = (event) => {
                    console.error('[BeautySelectorAddon] imageLoader replace error', [src, event]);
                    this.logger.error(`[BeautySelectorAddon] imageLoader replace error: src[${src}]`);
                    errorCallback(src, layer, event);
                };
                image.src = imgString;
                // console.log('[BeautySelectorAddon] loadImage replace', [n.modName, src, image, n.imgData]);
                return true;
            } catch (e: Error | any) {
                console.error('[BeautySelectorAddon] imageLoader replace error', [src, e]);
                this.logger.error(`[BeautySelectorAddon] imageLoader replace error: src[${src}] e[${e?.message ? e.message : e}]`);
                return false;
            }
        } else {
            // ignore it
            // console.warn('[BeautySelectorAddon] cannot find img. ', [src]);
            // this.logger.warn(`[BeautySelectorAddon] cannot find img. src[${src}]`);
            return false;
        }
    }

    errorCount = 0;

    async imageGetter(
        src: string,
    ) {

        if (!this.typeOrderUsed) {
            if (this.errorCount < 10) {
                ++this.errorCount;
                console.error('[BeautySelectorAddon] imageGetter typeOrderUsed not set. maybe not init?');
                this.logger.error('[BeautySelectorAddon] imageGetter typeOrderUsed not set. maybe not init?');
                if (this.errorCount === 10) {
                    console.error('[BeautySelectorAddon] imageGetter typeOrderUsed not set. maybe not init? this error will not show again');
                    this.logger.error('[BeautySelectorAddon] imageGetter typeOrderUsed not set. maybe not init? this error will not show again');
                }
            }
            return undefined;
        }

        if (this.typeOrderUsed.length === 0) {
            // ignore
            return undefined;
        }

        // always running on fallback mode
        for (const type of this.typeOrderUsed) {
            const n = type.imgListRef?.get(src);
            if (n) {
                try {
                    // this may throw error
                    return await n.getter.getBase64Image();
                } catch (e: Error | any) {
                    console.error('[BeautySelectorAddon] imageGetter error', [src, type, e]);
                    this.logger.error(`[BeautySelectorAddon] imageGetter error: src[${src}] type[${type}] e[${e?.message ? e.message : e}]`);
                    return undefined;
                }
            }
        }
        // ignore ?
        return undefined;
    }


    init() {
        if (window.modImgLoaderHooker) {
            // this hook only will be call if other mod not direct use the `ImageLoaderHookAddon`
            // this hook will be call if `ImageLoaderHook` cannot find the image in it cache
            window.modImgLoaderHooker.addSideHooker({
                hookName: 'BeautySelectorAddonImageSideHook',
                // those 2 function must have same result
                imageLoader: this.imageLoader.bind(this),
                imageGetter: this.imageGetter.bind(this),
            });
        } else {
            console.error('[BeautySelectorAddon] window.modImgLoaderHooker not found');
            this.logger.error('[BeautySelectorAddon] window.modImgLoaderHooker not found');
            return;
        }
    }

    async iniCustomStore() {
        if (!this.customStore) {
            const loaderKeyConfig = this.gModUtils.getModLoader().getLoaderKeyConfig();
            this.BeautySelectorAddon_dbName = loaderKeyConfig.getLoaderKey(this.BeautySelectorAddon_dbName, this.BeautySelectorAddon_dbName);
            this.BeautySelectorAddon_storeName = loaderKeyConfig.getLoaderKey(this.BeautySelectorAddon_storeName, this.BeautySelectorAddon_storeName);
            this.BeautySelectorAddon_OrderSaveKey = loaderKeyConfig.getLoaderKey(this.BeautySelectorAddon_OrderSaveKey, this.BeautySelectorAddon_OrderSaveKey);
            this.customStore = this.IdbKeyValRef.createStore(this.BeautySelectorAddon_dbName, this.BeautySelectorAddon_storeName);
        }
    }

    async loadSavedOrder() {
        await this.iniCustomStore();
        const listFile = await this.IdbKeyValRef.keyval_get(this.BeautySelectorAddon_OrderSaveKey, this.customStore);
        if (!listFile) {
            return undefined;
        }
        let list: string[];
        try {
            list = JSON5.parse(listFile);
        } catch (e) {
            console.error(e);
            return undefined;
        }
        if (!(isArray(list) && list.every(isString))) {
            return undefined;
        }
        const nn = new Map(this.typeOrder.map(T => [T.type, T]));
        if (list.every(T => nn.has(T))) {
            this.typeOrderUsed = list.map(T => nn.get(T)!);
            console.log('[BeautySelectorAddon] loadSavedOrder: ok.', [list]);
        } else {
            const nt = list.filter(T => !nn.has(T));
            console.log('[BeautySelectorAddon] loadSavedOrder: some type not found. reset.', [list, nt]);
            await this.saveOrder(this.typeOrder.map(T => T.type));
            this.typeOrderUsed = this.typeOrder;
        }
    }

    async saveOrder(list: string[]) {
        await this.iniCustomStore();
        if (!(isArray(list) && list.every(isString))) {
            // never go there
            throw new Error(`[BeautySelectorAddon] saveOrder: invalid list`);
        }
        await this.IdbKeyValRef.keyval_set(this.BeautySelectorAddon_OrderSaveKey, JSON.stringify(list), this.customStore);
    }

    BeautySelectorAddon_dbName: string = 'BeautySelectorAddon';
    BeautySelectorAddon_storeName: string = 'BeautySelectorAddon';
    BeautySelectorAddon_OrderSaveKey = 'BeautySelectorAddon_OrderSaveKey';

    // customStore?: UseStore;
    customStore?: ReturnType<ReturnType<ModUtils['getIdbKeyValRef']>['createStore']>;
    IdbKeyValRef: ReturnType<ModUtils['getIdbKeyValRef']>;
    IdbRef: ReturnType<ModUtils['getIdbRef']>;

}

export class TypeOrderSubUi {
    constructor(
        public modSubUiAngularJsService: typeof window['modLoaderGui_ModSubUiAngularJsService'],
        public beautySelectorAddon: BeautySelectorAddon,
    ) {
    }

    async init() {
        this.modSubUiAngularJsService.addLifeTimeCallback('BeautySelectorAddon-TypeOrderSubUi', {
            whenCreate: this.whenCreate.bind(this),
        });
    }

    async whenCreate(Ref: ModSubUiAngularJsModeExportInterface) {

        const typeAllList = this.beautySelectorAddon.getTypeOrder();
        const typeAllSet = new Map<string, TypeOrderItem>(typeAllList.map(T => [T.type, T]));
        const typeEnabledList = this.beautySelectorAddon.typeOrderUsed || [];
        const typeDisabledList = typeAllList.filter(T => !typeEnabledList?.find(T2 => T2.type === T.type));
        Ref.addComponentModGuiConfig({
            selector: 'enable-order-component',
            data: {
                listEnabled: typeEnabledList.map(T => {
                    return {
                        key: T.type,
                        str: T.type,
                        selected: false,
                    };
                }),
                listDisabled: typeDisabledList.map(T => {
                    return {
                        key: T.type,
                        str: T.type,
                        selected: false,
                    };
                }),
                onChange: async (
                    action: any,
                    listEnabled: {
                        key: string | number,
                        str: string,
                        selected: boolean,
                    }[],
                    listDisabled: {
                        key: string | number,
                        str: string,
                        selected: boolean,
                    }[],
                    selectedKeyEnabled: string | number,
                    selectedKeyDisabled: string | number,
                ) => {
                    // console.log('onChange', [action, listEnabled, listDisabled, selectedKeyEnabled, selectedKeyDisabled]);
                    this.beautySelectorAddon.typeOrderUsed = listEnabled.map(T => typeAllSet.get(T.key as string)).filter((T): T is TypeOrderItem => !!T);
                    // const enabledSet = new Set(this.beautySelectorAddon.typeOrderUsed.map(T => T.type));
                    await this.beautySelectorAddon.saveOrder(this.beautySelectorAddon.typeOrderUsed.map(T => T.type));
                },
                noHrSplit: true,
                buttonClass: 'btn btn-sm btn-secondary',
                text: {
                    MoveEnabledSelectedItemUp: StringTable.MoveEnabledSelectedItemUp,
                    MoveEnabledSelectedItemDown: StringTable.MoveEnabledSelectedItemDown,
                    EnableSelectedItem: StringTable.EnableSelectedItem,
                    DisableSelectedItem: StringTable.DisableSelectedItem,
                    MoveDisabledSelectedItemUp: StringTable.MoveDisabledSelectedItemUp,
                    MoveDisabledSelectedItemDown: StringTable.MoveDisabledSelectedItemDown,
                    title: StringTable.TypeGuiTitle,
                },
            },
        });
    }

}

export class CachedFileList {

    constructor(
        public gModUtils: ModUtils,
        public IdbKeyValRef: ReturnType<ModUtils['getIdbKeyValRef']>,
        public IdbRef: ReturnType<ModUtils['getIdbRef']>,
    ) {
    }

    dbRef?: Awaited<ReturnType<ReturnType<ModUtils['getIdbRef']>['idb_openDB']>>;

    isInit = false;

    protected async iniCacheCustomStore() {
        if (!this.isInit) {
            const loaderKeyConfig = this.gModUtils.getModLoader().getLoaderKeyConfig();
            this.BeautySelectorAddon_dbNameCacheFileList = loaderKeyConfig.getLoaderKey(this.BeautySelectorAddon_dbNameCacheFileList, this.BeautySelectorAddon_dbNameCacheFileList);
            this.BeautySelectorAddon_storeNameCacheFileList = loaderKeyConfig.getLoaderKey(this.BeautySelectorAddon_storeNameCacheFileList, this.BeautySelectorAddon_storeNameCacheFileList);
            // this.customStoreCache = this.IdbKeyValRef.createStore(this.BeautySelectorAddon_dbNameCacheFileList, this.BeautySelectorAddon_storeNameCacheFileList);
            this.dbRef = await this.IdbRef.idb_openDB(this.BeautySelectorAddon_dbNameCacheFileList);
        }
        this.isInit = true;
    }

    BeautySelectorAddon_dbNameCacheFileList: string = 'BeautySelectorAddon';
    BeautySelectorAddon_storeNameCacheFileList: string = 'BeautySelectorAddon_storeNameCacheFileList';
    // customStoreCache?: ReturnType<ReturnType<ModUtils['getIdbKeyValRef']>['createStore']>;

    // async getCachedFileList(modName: string, modHashString: string, type: string) {
    //     await this.iniCacheCustomStore();
    //     const hashKey = `${modName}_${modHashString}_${type}`;
    //
    // }
    //
    // async writeCachedFileList(modName: string, modHashString: string, type: string, fileList: string[]) {
    //     await this.iniCacheCustomStore();
    //
    // }
}
