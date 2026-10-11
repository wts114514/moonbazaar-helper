// ============================================================
// MoonBazaar Helper Worker · 路由演示版
// 说明：这是接口结构的展示，不是实际实现。所有响应都是 mock 数据。
// ============================================================

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Timestamp,X-Nonce,X-Signature',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    const path = url.pathname;

    // ---- 系统 ----
    if (path === '/api/version') {
      return json({ version: '1.0.5', downloadUrl: 'https://github.com/.../releases/latest' }, cors);
    }
    if (path === '/api/config') {
      return json({ config: { minVersion: '1.0.0', announcement: null, sponsorList: [] } }, cors);
    }

    // ---- AI ----
    if (path === '/api/ai/providers') {
      return json({
        providers: [
          { id: 'zhipu', name: '智谱 GLM', defaultModel: 'glm-4-flash',
            models: ['glm-4-flash', 'glm-4-air'], free: true }
        ]
      }, cors);
    }
    if (path === '/api/ai') {
      return json({ content: '[Demo] Mock AI response', used: 1, limit: 3, isPro: false }, cors);
    }
    if (path === '/api/ai/usage') {
      return json({ used: 0, limit: 3, isPro: false }, cors);
    }

    // ---- 卡密 ----
    if (path === '/api/check') {
      return json({ activated: false, level: null }, cors);
    }
    if (path === '/api/activate') {
      return json({ error: 'Demo only' }, 400, cors);
    }

    // ---- 统计 ----
    if (path === '/api/stats/heartbeat') return json({ success: true }, cors);
    if (path === '/api/stats/public') {
      return json({ total: 0, activeWeek: 0, activeDay: 0 }, cors);
    }

    // ---- 问卷 / 被踢 ----
    if (path === '/api/survey/upload')       return json({ success: true }, cors);
    if (path === '/api/survey/lookup')       return json({ records: [] }, cors);
    if (path === '/api/survey/kickout')      return json({ success: true }, cors);
    if (path === '/api/survey/kickout-list') return json({ kickouts: [] }, cors);
    if (path === '/api/survey/kickout-stats') {
      return json({ total: 0, positions: [], riskLevel: 'none' }, cors);
    }
    if (path === '/api/survey/stats-batch')  return json({ stats: {} }, cors);

    // ---- 注意力题 ----
    if (path === '/api/attention/upload')  return json({ success: true }, cors);
    if (path === '/api/attention/lookup')  return json({ answer: null }, cors);

    // ---- 回声洞 ----
    if (path === '/api/echo/list') return json({ messages: [] }, cors);
    if (path === '/api/echo/post') return json({ success: true }, cors);
    if (path === '/api/like')      return json({ success: true }, cors);

    // ---- 举报 / 成就 ----
    if (path === '/api/report')              return json({ success: true }, cors);
    if (path === '/api/achievements')        return json({ achievements: [] }, cors);
    if (path === '/api/achievements/unlock') return json({ success: true }, cors);

    // ---- GC ----
    if (path === '/api/gc/record')  return json({ success: true }, cors);
    if (path === '/api/gc/history') return json({ records: [] }, cors);

    // ---- 崩溃 ----
    if (path === '/api/crash') return json({ success: true }, cors);

    // ---- 后台管理 ----
    if (path.startsWith('/api/admin/')) {
      return json({ error: 'Admin API is not part of the open source demo' }, 403, cors);
    }

    return json({ error: 'Not Found', path }, 404, cors);
  }
};

function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// ⚠️ 真实 Worker 还包含：
// - HMAC-SHA256 签名校验（verifySignature、getDailySecret）
// - KV 缓存（license、config、stats、version）
// - R2 图片上传
// - Turnstile 人机验证
// - AI 用量记录与限额
// - 卡密生成与等级判断
// - 定时清理（scheduled）
// - WAF 相关的 admin 白名单逻辑