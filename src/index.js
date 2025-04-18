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
    keywords: z.preprocess(
      // 预处理keywords数组，确保所有字符串都被正确处理
      (val) => {
        if (typeof val === 'string') {
          try {
            // 尝试解析可能是字符串形式的JSON
            return JSON.parse(val);
          } catch (e) {
            // 如果解析失败，返回原始值
            return val;
          }
        }
        return val;
      },
      z.array(z.string())
    ),
    summary: z.string(),
    keyTimepoints: z.string()
  },
  async (params) => {
    try {
      console.error('生成思维导图JSON');

      // 对传入的数据进行安全处理
      let safeParams = {};

      try {
        // 处理keywords，确保是数组并处理引号
        if (params.keywords) {
          safeParams.keywords = Array.isArray(params.keywords)
            ? params.keywords.map(k => String(k).replace(/"/g, '\''))
            : [String(params.keywords).replace(/"/g, '\'')];
        } else {
          safeParams.keywords = [];
        }

        // 处理summary，确保是字符串并处理引号
        safeParams.summary = String(params.summary || '').replace(/"/g, '\'');

        // 处理keyTimepoints，确保是格式正确的数组并处理引号
        if (params.keyTimepoints) {
          if (Array.isArray(params.keyTimepoints)) {
            safeParams.keyTimepoints = params.keyTimepoints.map(point => ({
              title: String(point.title || '').replace(/"/g, '\''),
              summary: String(point.summary || '').replace(/"/g, '\''),
              start: Number(point.start || 0),
              end: Number(point.end || 0)
            }));
          } else {
            safeParams.keyTimepoints = [];
          }
        } else {
          safeParams.keyTimepoints = [];
        }

        console.error('数据预处理完成，开始生成思维导图');
      } catch (preprocessError) {
        console.error('数据预处理失败:', preprocessError);
        console.error('尝试使用原始数据');
        safeParams = params;
      }

      // 调用mindmapService生成思维导图
      const result = await mindmapService.generateMindmapJson(safeParams);

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



// 注册思维导图HTML生成工具
server.tool(
  'generateMindmapHtml',
  {
    json: z.object({}).passthrough(),
    title: z.string().optional().default('视频内容思维导图')
  },
  async ({ json, outputPath, title }) => {
    try {
      console.error('生成思维导图HTML');
      const html = await mindmapService.generateMindmapHtml({
        json,
        title
      });
      return {
        content: [{ type: 'text', text: html }]
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