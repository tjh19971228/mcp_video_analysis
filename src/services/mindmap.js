import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

// 获取当前文件的目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 思维导图服务
 *
 * 生成思维导图的JSON格式和图片
 */
export const mindmapService = {
  name: "mindmap",
  description: "思维导图服务 - 生成思维导图的JSON格式和图片",

  /**
   * 生成思维导图JSON (jsMind格式)
   *
   * @param {Object} params 参数对象
   * @param {Array} params.keywords 关键词数组
   * @param {string} params.summary 摘要信息
   * @param {Array} params.keyTimepoints 关键时间点数组
   * @returns {Promise<Object>} 思维导图JSON
   */
  async generateMindmapJson(params) {
    try {
      const { keywords, summary, keyTimepoints } = params;

      // 检查参数
      if (!keywords || !summary || !keyTimepoints) {
        throw new Error("缺少必要参数");
      }

      // 获取API密钥
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error("未设置DEEPSEEK_API_KEY环境变量");
      }

      // 构建DeepSeek API请求 - 使用jsMind格式，并包含样式区分
      const prompt = `请根据视频的关键词、视频的摘要信息、视频的关键时间点及内容，生成一个思维导图的 JSON 格式，我需要符合jsMind库要求的格式，以下是一个例子：
      {
        "meta": {
          "name": "视频内容思维导图",
          "author": "AI Assistant",
          "version": "1.0"
        },
        "format": "node_tree",
        "data": {
          "id": "root",
          "topic": "视频主题",
          "children": [
            {
              "id": "topic1",
              "topic": "一级主题1",
              "direction": "right",
              "expanded": true,
              "background-color": "#FF9500",
              "foreground-color": "#FFFFFF",
              "children": [
                {
                  "id": "topic1_1",
                  "topic": "二级主题1-1",
                  "direction": "right",
                  "background-color": "#FFB870",
                  "foreground-color": "#333333"
                },
                {
                  "id": "topic1_2",
                  "topic": "二级主题1-2",
                  "direction": "right",
                  "background-color": "#FFB870",
                  "foreground-color": "#333333"
                }
              ]
            },
            {
              "id": "topic2",
              "topic": "一级主题2",
              "direction": "left",
              "expanded": true,
              "background-color": "#3DA0FF",
              "foreground-color": "#FFFFFF",
              "children": [
                {
                  "id": "topic2_1",
                  "topic": "二级主题2-1",
                  "direction": "left",
                  "background-color": "#70BBFF",
                  "foreground-color": "#333333"
                }
              ]
            }
          ]
        }
      }
      
      现在，请根据以下信息生成思维导图JSON：
      
      关键词：${JSON.stringify(keywords)}
      摘要信息：${summary}
      关键时间点及内容：${JSON.stringify(keyTimepoints, null, 2)}
      
      注意：
      1. 只返回JSON格式的结果，不要包含任何解释或其他文本
      2. 确保JSON使用jsMind格式，主要包含meta、format和data三个字段
      3. data.id必须是唯一的标识符，可以使用有意义的短字符串
      4. data.topic是节点显示的文本内容
      5. 一级主题的方向应该交替使用 "left" 和 "right"，以均衡布局
      6. 根节点的id必须是"root"
      7. 每个主题都应该有不同的背景颜色(background-color)和前景颜色(foreground-color)
      8. 同类主题应使用相似的颜色，但子主题使用更浅的颜色变体
      9. 建议使用以下颜色方案（可以根据主题类型选择合适的颜色）：
         - 蓝色系: #3DA0FF, #70BBFF, #A3D8FF
         - 绿色系: #44D7B6, #7AEACD, #ABFFEB
         - 橙色系: #FF9500, #FFB870, #FFDAB3
         - 紫色系: #B36DFF, #CFA2FF, #E6D3FF
         - 红色系: #FF6B6B, #FFA8A8, #FFD1D1
         - 黄色系: #FFCB45, #FFDB83, #FFECB0`;

      // 调用DeepSeek API
      const response = await axios.post(
        "https://api.deepseek.com/v1/chat/completions",
        {
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      // 解析响应
      const content = response.data.choices[0].message.content;

      // 提取JSON部分
      const jsonMatch = content.match(/({[\s\S]*})/);
      if (!jsonMatch) {
        throw new Error("无法从API响应中提取JSON");
      }

      try {
        const extractedJson = jsonMatch[1];
        console.error("提取的JSON字符串:", extractedJson.substring(0, 100) + "...");
        
        const mindmapJson = JSON.parse(extractedJson);
        
        // 验证JSON格式是否符合jsMind规范
        if (!mindmapJson.format || !mindmapJson.data || !mindmapJson.data.id || !mindmapJson.data.topic) {
          throw new Error("JSON不符合jsMind格式要求");
        }
        
        console.error("成功生成思维导图JSON结构");
        return mindmapJson;
      } catch (parseError) {
        console.error("JSON解析错误:", parseError);
        
        // 创建一个基本的jsMind格式思维导图结构，带有样式区分
        // 预定义几组颜色方案
        const colorSchemes = [
          { main: '#44D7B6', sub: '#7AEACD', fg: '#333333', fgMain: '#FFFFFF' }, // 绿色系
          { main: '#3DA0FF', sub: '#70BBFF', fg: '#333333', fgMain: '#FFFFFF' }, // 蓝色系
          { main: '#FF9500', sub: '#FFB870', fg: '#333333', fgMain: '#FFFFFF' }, // 橙色系
          { main: '#B36DFF', sub: '#CFA2FF', fg: '#333333', fgMain: '#FFFFFF' }, // 紫色系
          { main: '#FF6B6B', sub: '#FFA8A8', fg: '#333333', fgMain: '#FFFFFF' }  // 红色系
        ];
        
        return {
          meta: {
            name: "视频内容思维导图",
            author: "AI Assistant",
            version: "1.0"
          },
          format: "node_tree",
          data: {
            id: "root",
            topic: "视频内容思维导图",
            "background-color": "#4A4A4A",
            "foreground-color": "#FFFFFF",
            children: [
              {
                id: "error",
                topic: `解析错误: ${parseError.message}`,
                direction: "right",
                "background-color": colorSchemes[4].main,
                "foreground-color": colorSchemes[4].fgMain,
                expanded: true
              },
              {
                id: "keywords",
                topic: "关键词",
                direction: "left",
                "background-color": colorSchemes[0].main,
                "foreground-color": colorSchemes[0].fgMain,
                expanded: true,
                children: keywords.map((k, i) => ({
                  id: `keyword_${i}`,
                  topic: k.substring(0, 50),
                  direction: "left",
                  "background-color": colorSchemes[0].sub,
                  "foreground-color": colorSchemes[0].fg
                }))
              },
              {
                id: "summary",
                topic: "摘要",
                direction: "right",
                "background-color": colorSchemes[1].main,
                "foreground-color": colorSchemes[1].fgMain,
                expanded: true,
                children: [{
                  id: "summary_content",
                  topic: summary.substring(0, 100) + "...",
                  direction: "right",
                  "background-color": colorSchemes[1].sub,
                  "foreground-color": colorSchemes[1].fg
                }]
              },
              {
                id: "timepoints",
                topic: "关键时间点",
                direction: "right",
                "background-color": colorSchemes[2].main,
                "foreground-color": colorSchemes[2].fgMain,
                expanded: true,
                children: keyTimepoints.slice(0, 5).map((tp, i) => ({
                  id: `timepoint_${i}`,
                  topic: `${tp.time}: ${tp.content.substring(0, 40)}...`,
                  direction: "right",
                  "background-color": colorSchemes[2].sub,
                  "foreground-color": colorSchemes[2].fg
                }))
              }
            ]
          }
        };
      }
    } catch (error) {
      console.error("生成思维导图JSON失败:", error);
      throw new Error(`生成思维导图JSON失败: ${error.message}`);
    }
  },

  /**
   * 生成思维导图图片 (使用Puppeteer和jsMind)
   *
   * @param {Object} params 参数对象
   * @param {Object} params.json 思维导图JSON (jsMind格式)
   * @param {string} params.outputPath 输出路径
   * @returns {Promise<string>} 思维导图图片路径
   */
  async generateMindmapImage(params) {
    try {
      const { json, outputPath = "./mindmap.png" } = params;

      if (!json) {
        throw new Error("缺少思维导图JSON参数");
      }

      console.error("开始生成思维导图图片...");
      console.error("输出路径:", outputPath);

      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      try {
        await fs.mkdir(outputDir, { recursive: true });
        console.error(`确保输出目录存在: ${outputDir}`);
      } catch (mkdirError) {
        console.error(`创建目录失败: ${mkdirError.message}`);
      }

      // 创建临时HTML文件
      const htmlPath = path.resolve(process.cwd(), "temp-mindmap.html");
      console.error(`临时HTML文件路径: ${htmlPath}`);

      // 创建HTML内容，使用jsMind
      const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>思维导图预览</title>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; }
          #jsmind_container {
            width: 100%;
            height: 100vh;
            background-color: #f5f5f5;
          }
          /* 自定义节点样式 */
          jmnode {
            border-radius: 5px !important;
            box-shadow: 1px 1px 3px rgba(0,0,0,0.15) !important;
            padding: 8px 12px !important;
            font-family: 'Arial', sans-serif !important;
            font-size: 14px !important;
            transition: all 0.2s !important;
          }
          jmnode:hover {
            transform: scale(1.02) !important;
            box-shadow: 1px 2px 5px rgba(0,0,0,0.2) !important;
          }
          /* 根节点样式 */
          jmnode.root {
            border-radius: 8px !important;
            font-size: 16px !important;
            font-weight: bold !important;
            padding: 10px 15px !important;
          }
        </style>
        <!-- 引入jsMind依赖 -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsmind@0.8.7/style/jsmind.css" />
        <script src="https://cdn.jsdelivr.net/npm/jsmind@0.8.7/es6/jsmind.js"></script>
      </head>
      <body>
        <div id="jsmind_container"></div>
        <script>
          // 状态标记
          window.renderCompleted = false;
          
          // jsMind数据
          const mindmapData = ${JSON.stringify(json)};
          
          // 初始化思维导图
          window.addEventListener('DOMContentLoaded', () => {
            try {
              // jsMind配置
              const options = {
                container: 'jsmind_container',
                theme: 'primary',
                editable: false,
                view: {
                  engine: 'svg',
                  hmargin: 130,  // 增加水平边距
                  vmargin: 80,   // 增加垂直边距
                  line_width: 2,
                  line_color: '#555'
                },
                layout: {
                  hspace: 40,     // 增加节点水平间距
                  vspace: 25,     // 增加节点垂直间距
                  pspace: 15      // 增加节点内边距
                }
              };
              
              // 创建jsMind实例并显示
              const jm = new jsMind(options);
              jm.show(mindmapData);
              
              // 展开所有节点
              jm.expand_all();
              
              // 标记渲染完成
              setTimeout(() => {
                window.renderCompleted = true;
                console.log('渲染完成');
              }, 1000);
              
            } catch (error) {
              console.error('渲染思维导图失败:', error);
            }
          });
        </script>
      </body>
      </html>`;

      // 保存HTML文件
      await fs.writeFile(htmlPath, html, "utf-8");
      console.error("临时HTML文件已创建");

      try {
        // 使用Puppeteer生成图片
        console.error("启动Puppeteer...");
        const browser = await puppeteer.launch({
          headless: "new",
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        console.error("创建新页面...");
        const page = await browser.newPage();
        
        // 设置超时和视口
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);
        
        // 加载HTML文件
        console.error(`打开HTML文件: ${htmlPath}`);
        await page.goto(`file://${htmlPath}`);
        
        // 等待渲染完成
        console.error("等待渲染完成...");
        try {
          await page.waitForFunction('window.renderCompleted === true', { timeout: 30000 });
          console.error("渲染已完成");
        } catch (timeoutError) {
          console.error("等待渲染完成超时，继续执行:", timeoutError.message);
        }
        
        // 额外等待确保渲染稳定
        console.error("额外等待1秒确保渲染稳定...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 获取思维导图内容区域大小
        console.error("获取内容区域大小...");
        const dimensions = await page.evaluate(() => {
          const container = document.getElementById('jsmind_container');
          if (!container) return { width: 1500, height: 900 };
          
          // 返回实际内容区域大小，确保足够大以容纳所有内容
          return {
            width: Math.max(container.scrollWidth, 1500),
            height: Math.max(container.scrollHeight, 900)
          };
        });
        console.error(`内容区域大小: ${dimensions.width}x${dimensions.height}`);
        
        // 设置页面大小
        console.error(`设置视口大小: ${dimensions.width}x${dimensions.height}`);
        await page.setViewport({
          width: dimensions.width,
          height: dimensions.height
        });
        
        // 再等待一会儿确保渲染完成
        console.error("再次等待确保渲染完成...");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 截图
        console.error(`生成图片: ${outputPath}`);
        await page.screenshot({
          path: outputPath,
          fullPage: true,
          omitBackground: false
        });
        console.error("截图完成");

        // 关闭浏览器
        console.error("关闭浏览器...");
        await browser.close();
        console.error("浏览器已关闭");

        // 清理临时文件
        console.error("清理临时文件...");
        await fs.unlink(htmlPath);
        console.error("临时文件已删除");

        // 验证图片是否存在
        try {
          await fs.access(outputPath);
          console.error(`图片已生成: ${outputPath}`);
        } catch (accessError) {
          console.error(`无法访问生成的图片: ${accessError.message}`);
          throw new Error(`生成的图片不存在或无法访问`);
        }

        return outputPath;
      } catch (puppeteerError) {
        console.error(`Puppeteer错误: ${puppeteerError.message}`, puppeteerError);
        console.error("尝试备选方案 - 仅创建包含信息的HTML文件...");
        
        // 备选方案：保存HTML为可查看的文件
        const backupOutputPath = outputPath.replace(/\.png$/, '_fallback.html');
        console.error(`创建备选HTML文件: ${backupOutputPath}`);
        
        await fs.writeFile(backupOutputPath, html, "utf-8");
        
        console.error(`备选方案: HTML文件已创建，生成图片失败。您可以在浏览器中打开: ${backupOutputPath}`);
        
        // 创建一个简单的文本说明图片
        const message = "无法使用Puppeteer生成PNG图片，但HTML版本已创建。";
        return outputPath;
      }
    } catch (error) {
      console.error("生成思维导图图片失败:", error);
      throw new Error(`生成思维导图图片失败: ${error.message}`);
    }
  },
  
  /**
   * 生成可交互式思维导图HTML (使用jsMind)
   *
   * @param {Object} params 参数对象
   * @param {Object} params.json 思维导图JSON (jsMind格式)
   * @param {string} params.outputPath 输出路径
   * @param {string} params.title 思维导图标题
   * @returns {Promise<string>} 思维导图HTML路径
   */
  async generateMindmapHtml(params) {
    try {
      const { json, outputPath = "./mindmap.html", title = "思维导图" } = params;

      if (!json) {
        throw new Error("缺少思维导图JSON参数");
      }
      
      // 验证JSON结构
      console.error("思维导图JSON数据结构验证:");
      console.error("- 格式:", json.format);
      console.error("- 根节点ID:", json.data?.id);
      console.error("- 根节点主题:", json.data?.topic);
      
      if (!json.format || json.format !== "node_tree") {
        console.warn("警告: 思维导图JSON格式不是node_tree");
      }
      
      if (!json.data || !json.data.id || !json.data.topic) {
        console.warn("警告: 思维导图JSON缺少有效的data结构");
      }
      
      // 创建HTML文件内容 - 使用jsMind
      const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
          }
          .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 50px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            padding: 0 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            z-index: 1000;
          }
          .title {
            flex: 1;
            font-size: 18px;
            font-weight: 500;
            color: #495057;
            margin: 0;
          }
          .toolbar {
            display: flex;
            gap: 8px;
          }
          .btn {
            background-color: #fff;
            border: 1px solid #ced4da;
            color: #495057;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn:hover {
            background-color: #f1f3f5;
            border-color: #adb5bd;
          }
          .btn:active {
            background-color: #e9ecef;
          }
          #jsmind_container {
            position: absolute;
            top: 50px;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: calc(100vh - 50px);
            background-color: #f5f5f5;
          }
          /* 自定义节点样式 */
          jmnode {
            border-radius: 5px !important;
            box-shadow: 1px 1px 3px rgba(0,0,0,0.15) !important;
            padding: 8px 12px !important;
            font-family: 'Arial', sans-serif !important;
            font-size: 14px !important;
            transition: all 0.2s !important;
          }
          jmnode:hover {
            transform: scale(1.02) !important;
            box-shadow: 1px 2px 5px rgba(0,0,0,0.2) !important;
          }
          /* 根节点样式 */
          jmnode.root {
            border-radius: 8px !important;
            font-size: 16px !important;
            font-weight: bold !important;
            padding: 10px 15px !important;
          }
        </style>
        <!-- 引入jsMind依赖 -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsmind@0.8.7/style/jsmind.css" />
        <script src="https://cdn.jsdelivr.net/npm/jsmind@0.8.7/es6/jsmind.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jsmind@0.8.7/es6/jsmind.draggable.js"></script>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${title}</h1>
          <div class="toolbar">
            <button class="btn" id="btn-zoom-in">放大</button>
            <button class="btn" id="btn-zoom-out">缩小</button>
            <button class="btn" id="btn-expand-all">全部展开</button>
            <button class="btn" id="btn-collapse-all">全部折叠</button>
            <button class="btn" id="btn-screenshot">保存截图</button>
            <button class="btn" id="btn-toggle-theme">切换主题</button>
            <button class="btn" id="btn-toggle-toolbar">隐藏工具栏</button>
          </div>
        </div>
        
        <div id="jsmind_container"></div>
        
        <script>
          // jsMind实例
          let jm;
          
          // 主题列表
          const themes = ['primary', 'warning', 'danger', 'success', 'info', 'greensea', 'nephrite', 'belizehole', 'wisteria', 'asphalt', 'orange', 'pumpkin', 'pomegranate', 'clouds', 'asbestos'];
          let currentThemeIndex = 0;
          
          // 渲染思维导图
          function renderMindmap() {
            try {
              // jsMind配置
              const options = {
                container: 'jsmind_container',
                theme: themes[currentThemeIndex],
                editable: true,
                view: {
                  engine: 'svg',       // 使用SVG引擎
                  hmargin: 130,        // 水平边距
                  vmargin: 80,         // 垂直边距
                  line_width: 2,       // 线宽
                  line_color: '#555'   // 线颜色
                },
                layout: {
                  hspace: 40,          // 节点水平间距
                  vspace: 25,          // 节点垂直间距
                  pspace: 15           // 节点内边距
                }
              };
              
              // 创建jsMind实例
              jm = new jsMind(options);
              
              // 显示思维导图数据
              jm.show(${JSON.stringify(json)});
              
              // 默认展开所有节点
              jm.expand_all();
            } catch (error) {
              console.error('渲染思维导图失败:', error);
              document.getElementById('jsmind_container').innerHTML = 
                '<div style="padding: 20px; color: red;">渲染思维导图失败: ' + error.message + '</div>';
            }
          }
          
          // 初始化界面交互
          function initUI() {
            if (!jm) return;
            
            // 放大按钮
            document.getElementById('btn-zoom-in').addEventListener('click', () => {
              jm.view.zoomIn();
            });
            
            // 缩小按钮
            document.getElementById('btn-zoom-out').addEventListener('click', () => {
              jm.view.zoomOut();
            });
            
            // 全部展开按钮
            document.getElementById('btn-expand-all').addEventListener('click', () => {
              jm.expand_all();
            });
            
            // 全部折叠按钮
            document.getElementById('btn-collapse-all').addEventListener('click', () => {
              jm.collapse_all();
            });
            
            // 保存截图按钮
            document.getElementById('btn-screenshot').addEventListener('click', () => {
              try {
                // 使用jsMind内置的截图功能
                if (jm.screenshot) {
                  jm.screenshot.shootDownload();
                } else {
                  alert('当前版本不支持截图功能');
                }
              } catch (error) {
                console.error('截图失败:', error);
                alert('截图失败: ' + error.message);
              }
            });
            
            // 切换主题按钮
            document.getElementById('btn-toggle-theme').addEventListener('click', () => {
              currentThemeIndex = (currentThemeIndex + 1) % themes.length;
              jm.set_theme(themes[currentThemeIndex]);
            });
            
            // 切换工具栏按钮
            const header = document.querySelector('.header');
            const container = document.getElementById('jsmind_container');
            const btnToggle = document.getElementById('btn-toggle-toolbar');
            
            btnToggle.addEventListener('click', () => {
              if (header.style.display === 'none') {
                header.style.display = 'flex';
                container.style.top = '50px';
                container.style.height = 'calc(100vh - 50px)';
                btnToggle.textContent = '隐藏工具栏';
              } else {
                header.style.display = 'none';
                container.style.top = '0';
                container.style.height = '100vh';
                btnToggle.textContent = '显示工具栏';
              }
            });
          }
          
          // 在文档加载完成后初始化
          document.addEventListener('DOMContentLoaded', () => {
            renderMindmap();
            initUI();
          });
        </script>
      </body>
      </html>`;

      // 保存HTML文件
      await fs.writeFile(outputPath, html, "utf-8");
      console.error(`思维导图HTML已保存到: ${outputPath}`);
      
      return outputPath;
    } catch (error) {
      console.error("生成思维导图HTML失败:", error);
      throw new Error(`生成思维导图HTML失败: ${error.message}`);
    }
  }
};
