const fs = require('fs');

try {
    const content = fs.readFileSync('.github/workflows/build-and-release.yml', 'utf8');
    
    // 基础的YAML结构检查
    const lines = content.split('\n');
    let indentStack = [];
    let hasErrors = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        
        // 跳过空行和注释
        if (line.trim() === '' || line.trim().startsWith('#')) continue;
        
        // 检查缩进
        const indent = line.length - line.trimStart().length;
        const trimmed = line.trim();
        
        // 检查是否有制表符
        if (line.includes('\t')) {
            console.log(`❌ 第${lineNum}行包含制表符，应该使用空格缩进`);
            hasErrors = true;
        }
        
        // 检查YAML键值对格式
        if (trimmed.includes(':') && !trimmed.startsWith('-')) {
            const colonIndex = trimmed.indexOf(':');
            const afterColon = trimmed.substring(colonIndex + 1).trim();
            
            // 如果冒号后有内容但没有空格分隔，这可能是错误
            if (afterColon && !trimmed.includes(': ')) {
                const beforeColon = trimmed.substring(0, colonIndex);
                if (!beforeColon.includes('${{') && !beforeColon.includes('}}')) {
                    console.log(`❌ 第${lineNum}行可能缺少空格: ${trimmed}`);
                    hasErrors = true;
                }
            }
        }
        
        // 检查列表项格式
        if (trimmed.startsWith('-') && trimmed.length > 1 && trimmed[1] !== ' ') {
            console.log(`❌ 第${lineNum}行列表项格式错误，缺少空格: ${trimmed}`);
            hasErrors = true;
        }
    }
    
    if (!hasErrors) {
        console.log('✅ YAML基础语法检查通过！');
        console.log('📝 文件包含 ' + lines.length + ' 行');
    }
    
} catch (error) {
    console.log('❌ 读取文件时出错:', error.message);
}
