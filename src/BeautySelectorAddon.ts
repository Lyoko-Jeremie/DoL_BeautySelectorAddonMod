import JSZip from "jszip";
import type {LifeTimeCircleHook, LogWrapper} from "../../../dist-BeforeSC2/ModLoadController";
import type {AddonPluginHookPointEx} from "../../../dist-BeforeSC2/AddonPlugin";
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {
    IModImgGetter,
    IModImgGetterLRUCache,
    ModBootJson,
    ModImg,
    ModInfo,
} from "../../../dist-BeforeSC2/ModLoader";
import type {ModZipReader} from "../../../dist-BeforeSC2/ModZipReader";
import {every, isArray, isNil, isString} from 'lodash';
import {LRUCache} from 'lru-cache';
import {extname} from "./extname";

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

    async getBase64Image(lruCache?: IModImgGetterLRUCache) {
        const cache = (lruCache ?? BeautySelectorAddonImgLruCache).get(this.imgPath);
        if (cache) {
            return cache;
        }
        const imgFile = this.zip.zip.file(this.imgPath);
        if (imgFile) {
            const data = await imgFile.async('base64');
            const imgCache = imgWrapBase64Url(this.imgPath, data);
            (lruCache ?? BeautySelectorAddonImgLruCache).set(this.imgPath, imgCache);
            return imgCache;
        }
        console.error(`[BeautySelectorAddon] BeautySelectorAddonImgGetter getBase64Image() imgFile not found: ${this.imgPath} in ${this.zip.modInfo?.name}`);
        this.logger.error(`[BeautySelectorAddon] BeautySelectorAddonImgGetter getBase64Image() imgFile not found: ${this.imgPath} in ${this.zip.modInfo?.name}`);
        return Promise.reject(`[BeautySelectorAddon] BeautySelectorAddonImgGetter getBase64Image() imgFile not found: ${this.imgPath} in ${this.zip.modInfo?.name}`);
    }

}

// prefix_with_mod_name
export const BeautySelectorAddonImgLruCache = new LRUCache<string, string>({
    max: 20,
    ttl: 1000 * 60 * 1,
    dispose: (value: string, key: string, reason: LRUCache.DisposeReason) => {
        console.log('[BeautySelectorAddon] BeautySelectorAddonImgLruCache dispose', [value], [reason]);
    },
    updateAgeOnGet: true,
    updateAgeOnHas: true,
});

export interface BeautySelectorAddonParams {
    type: string;
    imgFileList?: string[];
}

export function checkParams(a: any): a is BeautySelectorAddonParams {
    return a
        && isString(a.type)
        && (isNil(a.imgFileList) ? true : (isArray(a.imgFileList) && every(a.imgFileList, isString)))
        ;
}

export interface BSModItem {
    name: string;
    mod: ModInfo;
    modZip: ModZipReader;
    type: string;
    params: BeautySelectorAddonParams;
    imgList?: Map<string, ModImg>;
    selfImg?: Map<string, ModImg>;
}

export class BeautySelectorAddon implements AddonPluginHookPointEx {
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
    }

    table: Map<string, BSModItem> = new Map<string, BSModItem>();

    typeOrder: string[] = [];

    async registerMod(addonName: string, mod: ModInfo, modZip: ModZipReader) {
        const ad = mod.bootJson.addonPlugin?.find(T => T.modName === 'BeautySelectorAddon' && T.addonName === 'BeautySelectorAddon');
        if (!ad) {
            console.error(`[BeautySelectorAddon] registerMod: cannot find addonPlugin in bootJson`, [addonName, mod.name, mod, modZip]);
            this.logger.error(`[BeautySelectorAddon] registerMod: cannot find addonPlugin in bootJson [${mod.name}]`);
            return;
        }
        if (!checkParams(ad.params)) {
            console.error(`[BeautySelectorAddon] registerMod: invalid params`, [addonName, mod.name, mod, modZip]);
            this.logger.error(`[BeautySelectorAddon] registerMod: invalid params [${mod.name}]`);
            return;
        }
        const type = ad.params.type;
        const modName = mod.name;
        if (this.table.has(type)) {
            console.warn(`[BeautySelectorAddon] registerMod: type already exist`, [addonName, mod.name, mod, modZip, this.table.get(type)]);
            this.logger.warn(`[BeautySelectorAddon] registerMod: type[${type}] already exist in [${this.table.get(type)!.name}]`);
            return;
        }
        if (!isNil(ad.params.imgFileList)) {
            const imgList = new Map<string, ModImg>(
                ad.params.imgFileList.map(T => {
                    return [T, {
                        path: T,
                        getter: new BeautySelectorAddonImgGetter(modName, modZip, T, this.logger),
                    }];
                }),
            );
            this.table.set(type, {
                name: addonName,
                mod,
                modZip,
                type,
                params: ad.params,
                imgList: imgList,
                selfImg: undefined,
            });
        } else {
            const selfImg = new Map<string, ModImg>(
                mod.imgs.map(T => [T.path, T]),
            );
            this.table.set(type, {
                name: addonName,
                mod,
                modZip,
                type,
                params: ad.params,
                imgList: undefined,
                selfImg: selfImg,
            });
        }
        this.typeOrder.push(type);
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
                    console.error('[BeautySelectorAddon] imageLoader replace error', [src]);
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

    async imageGetter(
        src: string,
    ) {
        // ~~~check path , if it need replace , redirect to a type[mod] , (and optional , use fallback type[mod] list)~~~

        if (this.typeOrder.length === 0) {
            // ignore
            return undefined;
        }

        // always running on fallback mode
        for (const type of this.typeOrder) {
            const m = this.table.get(type);
            if (!m) {
                // never go there
                console.error('[BeautySelectorAddon] imageGetter cannot find mod. never go there.', [src, type]);
                this.logger.error(`[BeautySelectorAddon] imageGetter cannot find mod. never go there. src[${src}] type[${type}]`);
                continue;
            }
            if (isNil(m.imgList) && isNil(m.selfImg)) {
                // never go there
                console.error('[BeautySelectorAddon] imageGetter not have imgList and selfImg. never go there.', [src, type, m]);
                this.logger.error(`[BeautySelectorAddon] imageGetter not have imgList and selfImg. never go there. src[${src}] type[${type}]`);
                continue;
            }
            const n = (m.imgList ?? m.selfImg)?.get(src);
            if (n) {
                try {
                    // this may throw error
                    return await n.getter.getBase64Image(BeautySelectorAddonImgLruCache);
                } catch (e: Error | any) {
                    console.error('[BeautySelectorAddon] imageGetter error', [src, type, e]);
                    this.logger.error(`[BeautySelectorAddon] imageGetter error: src[${src}] type[${type}] e[${e?.message ? e.message : e}]`);
                    return undefined;
                }
            } else {
                continue;
            }
        }
        // console.warn('[BeautySelectorAddon] imageGetter cannot find img. ', [src]);
        // this.logger.warn(`[BeautySelectorAddon] imageGetter cannot find img. src[${src}]`);
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
}
