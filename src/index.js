import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { videoAnalysisService } from './services/videoAnalysis.js';
import { mindmapService } from './services/mindmap.js';
import { z } from 'zod';

// 加载环境变量
dotenv.config();

// 创建MCP服务器
const server = new McpServer({
  name: 'video-analysize-mcp',
  version: '1.0.0',
  description: '视频理解和思维导图生成的MCP服务'
});

// 注册视频分析服务工具
server.tool(
  'analyzeVideo',
  { url: z.string().url('请提供有效的视频URL') },
  async ({ url }) => {
    try {
      console.error(`分析视频: ${url}`);
      const result = await videoAnalysisService.analyzeVideo({ url });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error('视频分析失败:', error);
      return {
        isError: true,
        content: [{ type: 'text', text: `视频分析失败: ${error.message}` }]
      };
    }
  }
);

// 注册思维导图生成工具
server.tool(
  'generateMindmapJson',
  {
    keywords: z.array(z.string()),
    summary: z.string(),
    keyTimepoints: z.array(z.object({
      title: z.string(),
      summary: z.string(),
      start: z.number(),
      end: z.number()
    }))
  },
  async ({ keywords, summary, keyTimepoints }) => {
    try {
      console.error('生成思维导图JSON');
      const result = await mindmapService.generateMindmapJson({
        keywords,
        summary,
        keyTimepoints
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      console.error('生成思维导图JSON失败:', error);
      return {
        isError: true,
        content: [{ type: 'text', text: `生成思维导图JSON失败: ${error.message}` }]
      };
    }
  }
);

// 注册思维导图图片生成工具
server.tool(
  'generateMindmapImage',
  {
    json: z.object({}).passthrough(),
    outputPath: z.string().optional().default('./mindmap.png')
  },
  async ({ json, outputPath }) => {
    try {
      console.error('生成思维导图图片');
      const imagePath = await mindmapService.generateMindmapImage({
        json,
        outputPath
      });
      return {
        content: [{ type: 'text', text: `思维导图图片已保存到: ${imagePath}` }]
      };
    } catch (error) {
      console.error('生成思维导图图片失败:', error);
      return {
        isError: true,
        content: [{ type: 'text', text: `生成思维导图图片失败: ${error.message}` }]
      };
    }
  }
);

// 注册思维导图HTML生成工具
server.tool(
  'generateMindmapHtml',
  {
    json: z.object({}).passthrough(),
    outputPath: z.string().optional().default('./mindmap.html'),
    title: z.string().optional().default('视频内容思维导图')
  },
  async ({ json, outputPath, title }) => {
    try {
      console.error('生成思维导图HTML');
      const htmlPath = await mindmapService.generateMindmapHtml({
        json,
        outputPath,
        title
      });
      return {
        content: [{ type: 'text', text: `思维导图HTML已保存到: ${htmlPath}` }]
      };
    } catch (error) {
      console.error('生成思维导图HTML失败:', error);
      return {
        isError: true,
        content: [{ type: 'text', text: `生成思维导图HTML失败: ${error.message}` }]
      };
    }
  }
);

// 启动服务
async function main() {
  try {
    // 创建stdio传输层
    const transport = new StdioServerTransport();
    
    // 连接传输层并启动服务
    await server.connect(transport);
    
    console.error('视频分析MCP服务已启动');
  } catch (error) {
    console.error('启动MCP服务失败:', error);
    process.exit(1);
  }
}

// 启动服务
main(); 