// code from Claude 3.5 Sonnet (New)
import JSZip from 'jszip';

export interface ZipFile {
    path: string;
    file?: JSZip.JSZipObject;
    content?: string | Awaited<ReturnType<JSZip.JSZipObject['async']>>;
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
    contentFormat?: JSZip.OutputType;
}

/**
 * 使用迭代方式异步遍历 JSZip 中指定路径的文件夹
 * @param zip JSZip 实例
 * @param folderPath 要遍历的文件夹路径
 * @param options 遍历选项
 * @returns 文件列表，可包含文件内容
 */
export async function traverseZipFolder(
    zip: JSZip,
    folderPath: string,
    options: TraverseOptions = {}
): Promise<ZipFile[]> {
    const {
        getFileRef = false,
        readContent = false,
        contentFormat = 'string',
    } = options;

    // 标准化路径格式
    const normalizedPath = folderPath.endsWith('/') ? folderPath : folderPath + '/';

    // 保存所有待处理的文件夹路径
    const folderStack: string[] = [normalizedPath];

    // 保存结果
    const result: ZipFile[] = [];

    // 使用栈进行迭代
    while (folderStack.length > 0) {
        const currentPath = folderStack.pop()!;

        // 遍历 zip 中的所有文件和文件夹
        for (const [path, file] of Object.entries(zip.files)) {
            // 检查是否在当前处理的文件夹下
            if (path.startsWith(currentPath)) {
                const relativePath = path.slice(currentPath.length);

                // 跳过当前文件夹本身
                if (relativePath === '') {
                    continue;
                }

                // 如果是直接子文件夹，将其加入待处理栈
                if (relativePath.includes('/') &&
                    !relativePath.slice(relativePath.indexOf('/') + 1).includes('/')) {
                    folderStack.push(path);
                }
                // 如果是直接子文件，加入结果列表
                else if (!relativePath.includes('/')) {
                    const zipFile: ZipFile = {
                        path: path,
                    };

                    if (getFileRef) {
                        zipFile.file = file;
                    }

                    if (readContent && !file.dir) {
                        try {
                            // 异步读取文件内容
                            zipFile.content = await file.async(contentFormat);
                        } catch (error) {
                            console.error(`Failed to read content of ${path}:`, error);
                        }
                    }

                    result.push(zipFile);
                }
            }
        }
    }

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
