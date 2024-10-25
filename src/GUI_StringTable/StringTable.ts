import {StringTable_CN} from "./CN";
import {StringTable_EN} from "./EN";

const StringTableKeys = [
    'MoveEnabledSelectedItemUp',
    'MoveEnabledSelectedItemDown',
    'EnableSelectedItem',
    'DisableSelectedItem',
    'MoveDisabledSelectedItemUp',
    'MoveDisabledSelectedItemDown',
    'TypeGuiTitle',

] as const;

export type StringTableTypeStringPart = { [key in typeof StringTableKeys[number]]: string; };

export interface StringTableType extends StringTableTypeStringPart {
    errorMessage2I18N(s: string): string;
}

export function getStringTable(): StringTableType {
    // zh, zh-CN, zh-TW
    if (navigator.language.startsWith('zh')) {
        return StringTable_CN;
    }
    switch (navigator.language) {
        case 'zh-CN':
            return StringTable_CN;
        default:
            return StringTable_EN;
    }
}

export const StringTable: StringTableType = new Proxy({}, {
    get: function (obj, prop: keyof StringTableType) {
        const s = getStringTable();
        return s[prop];
    },
}) as StringTableType;
