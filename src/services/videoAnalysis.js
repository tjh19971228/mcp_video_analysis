import axios from 'axios';
import nodejieba from 'nodejieba';

/**
 * 视频分析服务
 *
 * 从视频URL中提取关键信息，包括关键词、摘要信息和关键时间点
 */
export const videoAnalysisService = {
  name: 'videoAnalysis',
  description: '视频分析服务 - 从视频中提取关键信息',

  /**
   * 分析视频
   *
   * @param {Object} params 参数对象
   * @param {string} params.url 视频URL
   * @returns {Promise<Object>} 视频分析结果
   */
  async analyzeVideo(params) {
    try {
      const { url } = params;

      if (!url) {
        throw new Error('缺少视频URL参数');
      }

      // 获取API密钥
      const apiKey = process.env.BILIGPT_API_KEY;
      if (!apiKey) {
        throw new Error('未设置BILIGPT_API_KEY环境变量');
      }
      console.error(apiKey);

      // 发送请求到BiliGPT API
      const encodedUrl = encodeURIComponent(url);
      const response = await axios.get(
        `https://api.bibigpt.co/api/open/${apiKey}/chapter-summary?url=${encodedUrl}`,
        { method: 'GET' }
      );

      const data = response.data;
      console.error(data);

      if (!data.success) {
        throw new Error('API请求失败');
      }

      // 处理视频分析结果
      return processVideoAnalysisResult(data);
    } catch (error) {
      console.error('视频分析失败:', error.message);
      throw new Error(`视频分析失败: ${error.message}`);
    }
  }
};

/**
 * 处理视频分析结果
 *
 * @param {Object} data API响应数据
 * @returns {Object} 处理后的视频分析结果
 */
function processVideoAnalysisResult(data) {
  // 提取摘要信息
  const summary = data.overallSummary || '';

  // 提取关键词
  const keywords = extractKeywords(summary);

  // 提取关键时间点及内容
  const keyTimepoints = extractKeyTimepoints(data.chapters || []);

  // 处理引号问题，将双引号替换为单引号
  const processedSummary = summary.replace(/"/g, '\'');

  // 返回处理后的对象
  return {
    keywords,
    summary: processedSummary,
    keyTimepoints
  };
}

/**
 * 从摘要中提取关键词
 *
 * @param {string} summary 摘要信息
 * @returns {Array} 关键词数组
 */
function extractKeywords(summary) {
  // 检测摘要是否主要为英文
  const isEnglishDominant = isEnglishText(summary);
  
  try {
    if (isEnglishDominant) {
      // 处理英文摘要
      return extractEnglishKeywords(summary);
    } else {
      // 处理中文摘要
      const keywordsWithWeight = nodejieba.extract(summary, 15);
      return keywordsWithWeight.map(item => item.word.replace(/"/g, '\''));
    }
  } catch (error) {
    console.error('关键词提取失败:', error.message);
    
    // 如果提取失败，回退到手动实现
    return fallbackExtractKeywords(summary, isEnglishDominant);
  }
}

/**
 * 检测文本是否主要为英文
 *
 * @param {string} text 待检测文本
 * @returns {boolean} 是否主要为英文
 */
function isEnglishText(text) {
  if (!text) return false;
  
  // 计算文本中英文单词和中文字符的数量
  const englishWordCount = (text.match(/[a-zA-Z]+/g) || []).length;
  const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  
  // 如果英文单词数量明显多于中文字符，则认为是英文文本
  return englishWordCount > chineseCharCount;
}

/**
 * 从英文摘要中提取关键词
 *
 * @param {string} summary 英文摘要
 * @returns {Array} 关键词数组
 */
function extractEnglishKeywords(summary) {
  // 英文停用词列表
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'can', 'will', 'just', 'should', 'now', 'this', 'that', 'these', 'those', 'it', 'its'
  ]);
  
  // 将文本转换为小写并分割成单词
  const words = summary.toLowerCase().match(/[a-z]+/g) || [];
  
  // 统计词频（排除停用词和少于3个字母的单词）
  const wordCounts = {};
  words.forEach(word => {
    if (!stopWords.has(word) && word.length >= 3) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // 按频率排序并选择前15个单词
  return Object.entries(wordCounts)
    .sort((a, b) => {
      // 首先按频率排序
      const countDiff = b[1] - a[1];
      if (countDiff !== 0) return countDiff;
      
      // 频率相同时，优先选择较长的单词
      return b[0].length - a[0].length;
    })
    .slice(0, 15)
    .map(entry => entry[0]);
}

/**
 * 关键词提取的备用方法
 *
 * @param {string} summary 摘要信息
 * @param {boolean} isEnglish 是否英文摘要
 * @returns {Array} 关键词数组
 */
function fallbackExtractKeywords(summary, isEnglish) {
  if (isEnglish) {
    // 英文摘要备用处理方法
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'into'
    ]);
    
    const words = summary.toLowerCase().match(/[a-z]+/g) || [];
    const wordCounts = {};
    
    words.forEach(word => {
      if (!stopWords.has(word) && word.length >= 3) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  } else {
    // 中文摘要备用处理方法
    const stopWords = new Set([
      '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', 
      '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', 
      '着', '没有', '看', '好', '这', '这个', '那', '那个', '但', '但是',
      '吗', '啊', '呢', '啦', '吧', '呀', '等', '等等', '中', '以', '可以',
      '这些', '那些', '什么', '怎么', '如何', '为什么'
    ]);

    const regex = /[\u4e00-\u9fa5]{2,6}/g;
    const matches = summary.match(regex) || [];
    
    const wordCounts = {};
    matches.forEach(word => {
      if (!stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    const filteredWords = Object.entries(wordCounts)
      .filter(([_, count]) => count >= 2);
    
    const finalWords = filteredWords.length >= 5 ? 
      filteredWords : Object.entries(wordCounts);
    
    return finalWords
      .sort((a, b) => {
        const countDiff = b[1] - a[1];
        if (countDiff !== 0) return countDiff;
        return b[0].length - a[0].length;
      })
      .slice(0, 10)
      .map(entry => entry[0].replace(/"/g, '\''));
  }
}

/**
 * 提取关键时间点及内容
 *
 * @param {Array} chapters 章节数据
 * @returns {Array} 关键时间点数组
 */
function extractKeyTimepoints(chapters) {
  return chapters.map(chapter => {
    // 处理标题和摘要中的引号问题
    const title = (chapter.title || '').replace(/"/g, '\'');
    const summary = (chapter.summary || '').replace(/"/g, '\'');

    return {
      title: title,
      summary: summary,
      start: chapter.start || 0,
      end: chapter.end || 0
    };
  });
}