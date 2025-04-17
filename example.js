import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 加载环境变量
dotenv.config();

// 获取当前文件目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 视频分析与思维导图生成示例
 */
async function runExample() {
  try {
    console.error('启动视频分析MCP服务...');
    
    // 创建输出目录（如果不存在）
    const outputDir = path.resolve(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 创建MCP客户端实例，连接到本地服务
    const transport = new StdioClientTransport({
      command: 'node',
      args: [path.resolve(process.cwd(), 'src/index.js')]
    });
    
    const client = new Client({
      name: 'video-analysis-client',
      version: '1.0.0'
    });
    
    await client.connect(transport);
    console.error('已连接到MCP服务');
    
    // 获取可用工具列表
    const toolsResponse = await client.listTools();
    // 确保tools是一个数组，MCP返回格式可能是{tools: [...]}或直接是数组
    const tools = Array.isArray(toolsResponse) ? toolsResponse : (toolsResponse.tools || []);
    console.error('可用工具:', tools.map(tool => tool.name).join(', '));
    
    // -----------------
    // 步骤1: 分析视频
    // -----------------
    console.error('\n[步骤1] 分析视频...');
    
    // 设置视频URL (B站视频示例)
    const videoUrl = 'https://www.bilibili.com/video/BV1NMoFYoEsb/?spm_id_from=333.1007.tianma.1-1-1.click&vd_source=e708021282dc99e56579d60ed1e204a8';
    
    const analysisResult = await client.callTool({
      name: 'analyzeVideo',
      arguments: { url: videoUrl }
    });
    
    // 解析JSON结果
    const resultData = JSON.parse(analysisResult.content[0].text);
    
    // 保存分析结果到JSON文件
    const analysisResultPath = path.join(outputDir, 'analysis-result.json');
    fs.writeFileSync(analysisResultPath, JSON.stringify(resultData, null, 2), 'utf8');
    console.error(`分析结果已保存到: ${analysisResultPath}`);
    
    console.error('\n视频分析结果:');
    console.error('- 关键词数量:', resultData.keywords.length);
    console.error('- 关键词:', resultData.keywords.join(', '));
    console.error('- 摘要前100字:', resultData.summary.substring(0, 100) + '...');
    console.error('- 关键时间点数量:', resultData.keyTimepoints.length);
    
    // -----------------
    // 步骤2: 生成思维导图JSON
    // -----------------
    console.error('\n[步骤2] 生成思维导图JSON...');
    
    const mindmapJsonResult = await client.callTool({
      name: 'generateMindmapJson',
      arguments: {
        keywords: resultData.keywords,
        summary: resultData.summary,
        keyTimepoints: resultData.keyTimepoints
      }
    });
    
    // 解析JSON结果
    const mindmapJson = JSON.parse(mindmapJsonResult.content[0].text);
    
    // 保存思维导图JSON到文件
    const videoAnalysisPath = path.join(outputDir, 'video-analysis.json');
    fs.writeFileSync(videoAnalysisPath, JSON.stringify(mindmapJson, null, 2), 'utf8');
    console.error(`思维导图JSON已保存到: ${videoAnalysisPath}`);
    
    console.error('思维导图JSON格式校验:');
    console.error('- 格式:', mindmapJson.format);
    console.error('- 根节点ID:', mindmapJson.data?.id);
    console.error('- 根节点主题:', mindmapJson.data?.topic);
    
    // -----------------
    // 步骤3: 生成思维导图图片
    // -----------------
    console.error('\n[步骤3] 生成思维导图PNG图片...');
    
    // 设置输出文件路径
    const pngPath = path.join(outputDir, 'mindmap.png');
    
    const imageResult = await client.callTool({
      name: 'generateMindmapImage',
      arguments: {
        json: mindmapJson,
        outputPath: pngPath
      }
    });
    
    console.error(imageResult.content[0].text);
    
    // -----------------
    // 步骤4: 生成思维导图HTML
    // -----------------
    console.error('\n[步骤4] 生成可交互思维导图HTML...');
    
    const htmlPath = path.join(outputDir, 'mindmap.html');
    
    const htmlResult = await client.callTool({
      name: 'generateMindmapHtml',
      arguments: {
        json: mindmapJson,
        outputPath: htmlPath,
        title: '视频内容思维导图'
      }
    });
    
    console.error(htmlResult.content[0].text);
    console.error('\n处理完成!');
    
    // 断开MCP连接
    await client.close();
    
  } catch (error) {
    console.error('示例运行失败:', error);
  }
}

// 运行示例
runExample();