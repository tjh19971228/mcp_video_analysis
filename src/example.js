import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { videoAnalysisService } from './services/videoAnalysis.js';
import { mindmapService } from './services/mindmap.js';
import axios from 'axios';

// 加载环境变量
dotenv.config();

/**
 * 示例：分析视频并生成思维导图
 */
async function example() {
  try {
    console.error('开始运行示例...');
    
    // 确保输出目录存在
    const outputDir = path.resolve(process.cwd(), 'output');
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      // 目录可能已存在，忽略错误
    }
    
    // 视频URL
    const videoUrl = 'https://www.bilibili.com/video/BV1HFd6YhErb/';
    let mindmapJson;
    
    try {
      // 1. 调用视频分析服务，获取视频信息
      console.error(`正在分析视频: ${videoUrl}`);
      const videoData = await videoAnalysisService.analyzeVideo({ url: videoUrl });
      
      if (!videoData) {
        throw new Error('获取视频数据失败');
      }
      
      console.error('视频分析完成，获取到以下信息:');
      console.error(`- 关键词数量: ${videoData.keywords.length}`);
      console.error(`- 摘要长度: ${videoData.summary.length} 字符`);
      console.error(`- 关键时间点数量: ${videoData.keyTimepoints.length}`);
      
      // 保存视频分析结果
      const videoDataPath = path.join(outputDir, 'video-analysis.json');
      await fs.writeFile(videoDataPath, JSON.stringify(videoData, null, 2), 'utf-8');
      console.error(`视频分析结果已保存到: ${videoDataPath}`);
      
      // 2. 生成思维导图JSON
      console.error('正在生成思维导图JSON...');
      mindmapJson = await mindmapService.generateMindmapJson({
        keywords: videoData.keywords,
        summary: videoData.summary,
        keyTimepoints: videoData.keyTimepoints
      });
      
      // 保存思维导图JSON
      const jsonFilePath = path.join(outputDir, 'mindmap.json');
      await fs.writeFile(jsonFilePath, JSON.stringify(mindmapJson, null, 2), 'utf-8');
      console.error(`思维导图JSON已保存到: ${jsonFilePath}`);
      
    } catch (err) {
      console.warn('使用API获取数据失败:', err.message);
      console.error('将使用示例数据继续...');
      
      // 使用本地现有的JSON文件（如果不存在，则创建一个示例JSON）
      const jsonFilePath = path.join(outputDir, 'mindmap.json');
      
      try {
        // 尝试读取已有的JSON文件
        const jsonContent = await fs.readFile(jsonFilePath, 'utf-8');
        mindmapJson = JSON.parse(jsonContent);
        console.error('成功读取现有JSON文件');
      } catch (err) {
        // 如果文件不存在，创建一个示例JSON
        console.error('未找到现有JSON文件，使用示例数据');
        mindmapJson = {
          "name": "示例思维导图",
          "children": [
            {
              "name": "一级主题1",
              "children": [
                {
                  "name": "二级主题1-1",
                  "size": 3000
                },
                {
                  "name": "二级主题1-2",
                  "children": [
                    {
                      "name": "三级主题1-2-1",
                      "size": 2500
                    }
                  ]
                }
              ]
            },
            {
              "name": "一级主题2",
              "children": [
                {
                  "name": "二级主题2-1",
                  "size": 4000
                }
              ]
            }
          ]
        };
        
        // 保存示例JSON以便后续使用
        await fs.writeFile(jsonFilePath, JSON.stringify(mindmapJson, null, 2), 'utf-8');
      }
    }
    
    // 3. 生成思维导图图片
    console.error('正在生成思维导图图片...');
    const imagePath = await mindmapService.generateMindmapImage({
      json: mindmapJson,
      outputPath: path.join(outputDir, 'mindmap.png')
    });
    
    // 4. 生成思维导图HTML（可以在浏览器中打开查看）
    console.error('正在生成思维导图HTML...');
    const htmlPath = await mindmapService.generateMindmapHtml({
      json: mindmapJson,
      outputPath: path.join(outputDir, 'mindmap.html'),
      title: mindmapJson.name || '思维导图'
    });
    
    console.error(`示例完成！结果已保存到 ${outputDir} 目录`);
    console.error(`- 图片版本: ${path.join(outputDir, 'mindmap.png')}`);
    console.error(`- HTML版本: ${path.join(outputDir, 'mindmap.html')}`);
    console.error('提示: 可以在浏览器中打开HTML文件，直接查看交互式思维导图');
  } catch (error) {
    console.error('示例运行失败:', error);
  }
}

// 运行示例
example(); 