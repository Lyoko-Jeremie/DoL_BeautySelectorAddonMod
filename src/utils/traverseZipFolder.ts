// code from `Claude 3.5 Sonnet (New)` & `Github Copilot`
import JSZip from 'jszip';
import {
    JSZipObjectLikeReadOnlyInterface,
    JSZipLikeReadOnlyInterface,
    OutputType,
} from '../../../../dist-BeforeSC2/JSZipLikeReadOnlyInterface';
import {isPlainObject, isNil, isString, isBoolean} from 'lodash';

export interface ZipFile {
    pathInZip: string;
    pathInSpecialFolder?: string;
    file?: JSZipObjectLikeReadOnlyInterface;
    content?: string | Awaited<ReturnType<JSZipObjectLikeReadOnlyInterface['async']>>;
    isFile: boolean;
    isFolder: boolean;
    isInSpecialFolderPath: boolean;
}

export function isZipFileObj(A: any): A is ZipFile {
    return isPlainObject(A) && isString(A.path) && isBoolean(A.isFile) && isBoolean(A.isFolder) && isBoolean(A.isInSpecialFolderPath);
}

export interface TraverseOptions {
    /**
     * 是否获取JSZipObject文件引用
     * @default false
     */
    getFileRef?: boolean;
    /**
     * 是否读取文件内容
     * @default false
     */
    readContent?: boolean;
    /**
     * 文件内容读取格式
     * @default 'string'
     */
    contentFormat?: OutputType;
    /**
     * 是否跳过文件夹
     * @default false
     */
    skipFolder?: boolean;
}

type FileTreeMap = Map<string, FileTreeMap | JSZipObjectLikeReadOnlyInterface>;

/**
 * 广度优先遍历 JSZip 文件树，并生成文件树结构
 * @param zip
 * @return
 */
function buildFileTree(zip: JSZipLikeReadOnlyInterface): FileTreeMap {
    const root: FileTreeMap = new Map();

    for (const [path, file] of Object.entries(zip.files)) {
        const parts = path.split('/');
        let current = root;

        for (const part of parts) {
            if (!current.has(part)) {
                current.set(part, new Map());
            }
            current = current.get(part) as FileTreeMap;
        }

        current.set('__file__', file);
    }

    return root;
}

/**
 * 使用迭代方式异步遍历 JSZip 中指定路径的文件夹
 * @param zip JSZip 实例
 * @param specialFolderPath 指定的文件夹路径
 * @param options 遍历选项
 * @returns 文件列表，可包含文件内容
 */
export async function traverseZipFolder(
    zip: JSZipLikeReadOnlyInterface,
    specialFolderPath: string,
    options: TraverseOptions = {}
): Promise<ZipFile[]> {
    const {
        getFileRef = false,
        readContent = false,
        contentFormat = 'string',
    } = options;

    const normalizedPath = specialFolderPath.endsWith('/') ? specialFolderPath : specialFolderPath + '/';
    const folderStack: [string, FileTreeMap][] = [['', buildFileTree(zip)]];
    const result: ZipFile[] = [];

    console.log('folderStack', folderStack);

    while (folderStack.length > 0) {
        const [currentPath, currentMap] = folderStack.pop()!;

        for (const [name, value] of currentMap.entries()) {
            if (name === '__file__') continue;
            if (!(value instanceof Map)) {
                // never go there
                throw new Error('Invalid file tree structure');
            }


            const newPath = currentPath + name;
            // const newPath = name;
            // if name not start with currentPath, skip
            if (!newPath.startsWith(currentPath)) {
                continue;
            }
            // console.log('newPath', newPath);
            if (value.has('__file__')) {
                const file = value.get('__file__') as JSZipObjectLikeReadOnlyInterface;
                const isInSpecialFolderPath = newPath.startsWith(normalizedPath);
                const zipFile: ZipFile = {
                    pathInZip: newPath,
                    pathInSpecialFolder: isInSpecialFolderPath ? newPath.slice(normalizedPath.length) : undefined,
                    isFile: !file.dir,
                    isFolder: file.dir,
                    isInSpecialFolderPath: isInSpecialFolderPath,
                };

                if (getFileRef) {
                    zipFile.file = file;
                }

                if (readContent && !file.dir) {
                    result.push(zipFile);
                } else {
                    result.push(zipFile);
                }
            } else {
                folderStack.push([newPath + '/', value]);
            }
        }
    }

    if (readContent) {
        await Promise.all(result.map(async (zipFile) => {
            if (zipFile.file && !zipFile.file.dir) {
                try {
                    zipFile.content = await zipFile.file.async(contentFormat);
                } catch (error) {
                    console.error(`Failed to read content of ${zipFile.pathInZip}:`, error);
                }
            }
        }));
    }

    // console.log('result', result);
    return result;
}

// /**
//  * 辅助函数：格式化文件大小
//  */
// function formatFileSize(bytes: number): string {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
// }

// 使用示例
async function example() {
    const zip = new JSZip();

    // 添加一些测试文件
    zip.file('folder1/file1.txt', 'content1');
    zip.file('folder1/file2.txt', 'content2');
    zip.file('folder1/subfolder/file3.txt', 'content3');

    try {
        // 基本遍历
        const filesBasic = await traverseZipFolder(zip, 'folder1');
        console.log('Basic traversal:', filesBasic);

        // 带内容遍历
        const filesWithContent = await traverseZipFolder(zip, 'folder1', {
            readContent: true,
            contentFormat: 'string'
        });

    } catch (error) {
        console.error('Error during traversal:', error);
    }
}
