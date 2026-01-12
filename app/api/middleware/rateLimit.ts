// 速率限制中间件
// 使用内存存储来跟踪用户请求频率
// 适用于开发环境和小型应用

interface RateLimitOptions {
  windowMs: number; // 时间窗口（毫秒）
  max: number; // 时间窗口内的最大请求数
  message?: string; // 超出限制时的错误信息
  standardHeaders?: boolean; // 是否在响应头中包含速率限制信息
  legacyHeaders?: boolean; // 是否在响应头中包含传统速率限制信息
}

// 内存存储接口
interface MemoryStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// 默认配置
const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 10000, // 10秒
  max: 5, // 10秒内最多5个请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
};

// 内存存储
const memoryStore: MemoryStore = {};

// 清理过期的存储数据（每5分钟执行一次）
setInterval(() => {
  const now = Date.now();
  for (const key in memoryStore) {
    if (memoryStore[key].resetTime < now) {
      delete memoryStore[key];
    }
  }
}, 5 * 60 * 1000);

/**
 * 速率限制中间件
 * @param options 速率限制配置
 * @returns 中间件函数
 */
export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  return async (req: any, res: any, next: () => void) => {
    // 获取用户标识（使用IP地址或用户ID）
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const userId = req.session?.user?.id || null;
    const key = userId ? `user:${userId}` : `ip:${ip}`;
    
    const now = Date.now();
    const resetTime = now + mergedOptions.windowMs;
    
    // 检查是否存在存储记录
    if (!memoryStore[key] || memoryStore[key].resetTime < now) {
      // 初始化或重置记录
      memoryStore[key] = {
        count: 1,
        resetTime,
      };
    } else {
      // 增加计数
      memoryStore[key].count += 1;
      
      // 检查是否超出限制
      if (memoryStore[key].count > mergedOptions.max) {
        // 计算重试时间
        const retryAfter = Math.ceil((memoryStore[key].resetTime - now) / 1000);
        
        // 设置响应头
        if (mergedOptions.standardHeaders) {
          res.headers.set('RateLimit-Limit', mergedOptions.max.toString());
          res.headers.set('RateLimit-Remaining', '0');
          res.headers.set('RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
        }
        
        if (mergedOptions.legacyHeaders) {
          res.headers.set('X-RateLimit-Limit', mergedOptions.max.toString());
          res.headers.set('X-RateLimit-Remaining', '0');
          res.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
          res.headers.set('Retry-After', retryAfter.toString());
        }
        
        // 返回错误响应
        return new Response(JSON.stringify({ error: mergedOptions.message }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...(mergedOptions.standardHeaders && {
              'RateLimit-Limit': mergedOptions.max.toString(),
              'RateLimit-Remaining': '0',
              'RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
            }),
            ...(mergedOptions.legacyHeaders && {
              'X-RateLimit-Limit': mergedOptions.max.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
              'Retry-After': retryAfter.toString(),
            }),
          },
        });
      }
    }
    
    // 设置响应头
    if (mergedOptions.standardHeaders) {
      res.headers.set('RateLimit-Limit', mergedOptions.max.toString());
      res.headers.set('RateLimit-Remaining', (mergedOptions.max - memoryStore[key].count).toString());
      res.headers.set('RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    }
    
    if (mergedOptions.legacyHeaders) {
      res.headers.set('X-RateLimit-Limit', mergedOptions.max.toString());
      res.headers.set('X-RateLimit-Remaining', (mergedOptions.max - memoryStore[key].count).toString());
      res.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    }
    
    // 继续处理请求
    next();
  };
}

// 博客API的速率限制配置
export const blogRateLimit = rateLimit({
  windowMs: 10000, // 10秒
  max: 3, // 10秒内最多3个请求（发布/保存草稿）
  message: '发布请求过于频繁，请稍后再试',
});
