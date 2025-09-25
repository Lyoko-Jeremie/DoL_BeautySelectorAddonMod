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
    isFile: boolean;
    isFolder: boolean;
    isInSpecialFolderPath: boolean;
    isImage?: boolean; // flag to indicate if this is an image file
}

export function isZipFileObj(A: any): A is ZipFile {
    return isPlainObject(A) && isString(A.pathInZip) && isBoolean(A.isFile) && isBoolean(A.isFolder) && isBoolean(A.isInSpecialFolderPath);
}

export interface TraverseOptions {
    /**
     * 是否获取JSZipObject文件引用
     * @default false
     */
    getFileRef?: boolean;
    /**
     * 是否跳过文件夹
     * @default false
     */
    skipFolder?: boolean;
    /**
     * 图片处理回调函数 - 在发现图片时立即调用，避免内存积累
     */
    onImageFound?: (imageInfo: {
        pathInZip: string;
        pathInSpecialFolder?: string;
        file: JSZipObjectLikeReadOnlyInterface;
    }) => Promise<void>;
}

/**
 * Helper function to check if a file is an image based on extension
 */
export function isImageFile(path: string): boolean {
    const ext = path.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
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
        onImageFound,
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
                const isImage = !file.dir && isImageFile(newPath);

                const zipFile: ZipFile = {
                    pathInZip: newPath,
                    pathInSpecialFolder: isInSpecialFolderPath ? newPath.slice(normalizedPath.length) : undefined,
                    isFile: !file.dir,
                    isFolder: file.dir,
                    isInSpecialFolderPath: isInSpecialFolderPath,
                    isImage: isImage,
                };

                if (getFileRef) {
                    zipFile.file = file;
                }

                // Process images immediately if callback is provided
                if (isImage && onImageFound && isInSpecialFolderPath) {
                    await onImageFound({
                        pathInZip: newPath,
                        pathInSpecialFolder: zipFile.pathInSpecialFolder,
                        file: file
                    });
                }

                result.push(zipFile);
            } else {
                folderStack.push([newPath + '/', value]);
            }
        }
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

        // 带图片处理回调的遍历
        const filesWithImageProcessing = await traverseZipFolder(zip, 'folder1', {
            onImageFound: async (imageInfo) => {
                console.log('Processing image:', imageInfo.pathInZip);
                // 在这里可以直接处理图片，例如存储到数据库
            }
        });

    } catch (error) {
        console.error('Error during traversal:', error);
    }
}
