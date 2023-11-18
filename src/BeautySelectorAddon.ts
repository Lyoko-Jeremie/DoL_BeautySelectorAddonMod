import JSZip from "jszip";
import type {LifeTimeCircleHook, LogWrapper} from "../../../dist-BeforeSC2/ModLoadController";
import type {AddonPluginHookPointEx} from "../../../dist-BeforeSC2/AddonPlugin";
import type {SC2DataManager} from "../../../dist-BeforeSC2/SC2DataManager";
import type {ModUtils} from "../../../dist-BeforeSC2/Utils";
import type {ModBootJson, ModInfo} from "../../../dist-BeforeSC2/ModLoader";
import type {ModZipReader} from "../../../dist-BeforeSC2/ModZipReader";
import {isArray, isNil, isString} from 'lodash';


export interface BeautySelectorAddonParams {
    type: string;
}

export function checkParams(a: any): a is BeautySelectorAddonParams {
    return a
        && isString(a.type)
        ;
}

export interface BSModItem {
    name: string;
    mod: ModInfo;
    modZip: ModZipReader;
    type: string;
    params: BeautySelectorAddonParams;
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
        this.table.set(type, {
            name: addonName,
            mod,
            modZip,
            type,
            params: ad.params,
        });
    }

    init() {
    }
}
