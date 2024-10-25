export function getRelativePath(filePath: string, basePath: string): string {
    // 规范化路径分隔符，将所有反斜杠转换为正斜杠
    const normalizedFilePath = filePath.replace(/\\/g, '/');
    const normalizedBasePath = basePath.replace(/\\/g, '/');

    // 确保基础路径以斜杠结尾
    const basePathWithSlash = normalizedBasePath.endsWith('/')
        ? normalizedBasePath
        : normalizedBasePath + '/';

    // 检查文件路径是否在基础路径下
    if (!normalizedFilePath.startsWith(basePathWithSlash)) {
        throw new Error('File is not in the base directory');
    }

    // 计算相对路径
    const relativePath = normalizedFilePath.slice(basePathWithSlash.length);

    return relativePath;
}
