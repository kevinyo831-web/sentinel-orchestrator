// URL 內容學習端點 — 僅允許中國大陸長城牆內可訪問網址

// GFW 封鎖的域名模式（境外被牆網站）
const GFW_BLOCKED = [
  // Google 全系列
  /^(www\.)?google\.(com|co\.|ad|ae|com\.af|com\.ag|com\.ai|al|am|co\.ao|com\.ar|as|at|com\.au|az|ba|com\.bd|be|bf|bg|bh|bi|bj|com\.bn|com\.bo|com\.br|bs|bt|co\.bw|by|com\.bz|ca|cd|cf|cg|ch|ci|co\.ck|cl|cm|co\.cr|com\.cu|cv|com\.cy|cz|de|dj|dk|dm|com\.do|dz|com\.ec|ee|com\.eg|es|com\.et|fi|com\.fj|fm|fr|ga|ge|gg|com\.gh|com\.gi|gl|gm|gp|gr|com\.gt|com\.gy|com\.hk|hn|hr|ht|hu|co\.id|ie|co\.il|im|co\.in|iq|is|it|je|com\.jm|jo|co\.jp|co\.ke|com\.kh|ki|kg|co\.kr|com\.kw|kz|la|com\.lb|li|lk|co\.ls|lt|lu|lv|com\.ly|co\.ma|md|me|mg|mk|ml|com\.mm|mn|ms|com\.mt|mu|mv|mw|com\.mx|com\.my|co\.mz|com\.na|com\.ng|com\.ni|ne|nl|no|com\.np|nr|nu|co\.nz|com\.om|com\.pa|com\.pe|com\.pg|com\.ph|com\.pk|pl|pn|com\.pr|ps|pt|com\.py|com\.qa|ro|ru|rw|com\.sa|com\.sb|sc|se|com\.sg|sh|si|sk|com\.sl|sn|so|sm|sr|st|com\.sv|td|tg|co\.th|com\.tj|tk|tl|tm|tn|to|com\.tr|tt|com\.tw|co\.tz|com\.ua|co\.ug|co\.uk|com\.uy|co\.uz|com\.vc|co\.ve|vg|co\.vi|com\.vn|vu|ws|rs|co\.za|co\.zm|co\.zw)/,
  /googleapis\.com$/,
  /youtube\.com$/,
  /youtu\.be$/,
  /googlevideo\.com$/,
  /googleusercontent\.com$/,
  /gstatic\.com$/,
  /google-analytics\.com$/,
  /doubleclick\.net$/,
  /googlesyndication\.com$/,
  // Meta / Facebook
  /^(www\.)?facebook\.com$/,
  /instagram\.com$/,
  /whatsapp\.com$/,
  /messenger\.com$/,
  /fbcdn\.net$/,
  /meta\.com$/,
  /threads\.net$/,
  // Twitter / X
  /^(www\.)?(twitter|x)\.com$/,
  /t\.co$/,
  /twimg\.com$/,
  // Wikipedia
  /wikipedia\.org$/,
  /wikimedia\.org$/,
  /wikidata\.org$/,
  // GitHub
  /github\.(com|io)$/,
  /githubusercontent\.com$/,
  /githubassets\.com$/,
  // Reddit
  /reddit\.com$/,
  /redd\.it$/,
  /redditstatic\.com$/,
  // 串流媒體
  /netflix\.com$/,
  /twitch\.tv$/,
  /spotify\.com$/,
  /soundcloud\.com$/,
  /vimeo\.com$/,
  /dailymotion\.com$/,
  // 通訊工具
  /discord(app)?\.com$/,
  /slack\.com$/,
  /telegram\.(org|me)$/,
  /signal\.org$/,
  /zoom\.us$/,
  /line\.me$/,
  // 雲端服務
  /dropbox\.com$/,
  /box\.com$/,
  /onedrive\.com$/,
  // 社交平台
  /pinterest\.com$/,
  /linkedin\.com$/,
  /tumblr\.com$/,
  /medium\.com$/,
  /substack\.com$/,
  /quora\.com$/,
  // 境外新聞媒體
  /nytimes\.com$/,
  /(bbc)\.(co\.uk|com)$/,
  /theguardian\.com$/,
  /wsj\.com$/,
  /bloomberg\.com$/,
  /reuters\.com$/,
  /ft\.com$/,
  /economist\.com$/,
  /apnews\.com$/,
  /cnn\.com$/,
  /nbcnews\.com$/,
  /foxnews\.com$/,
  /washingtonpost\.com$/,
  /theatlantic\.com$/,
  /time\.com$/,
  /forbes\.com$/,
  /businessinsider\.com$/,
  /techcrunch\.com$/,
  /wired\.com$/,
  /theverge\.com$/,
  /engadget\.com$/,
  /ars(technica)?\.com$/,
  // AI / 科技公司境外
  /openai\.com$/,
  /anthropic\.com$/,
  /chatgpt\.com$/,
  /claude\.ai$/,
  /gemini\.google\.com$/,
  /perplexity\.ai$/,
  /huggingface\.co$/,
  /replicate\.com$/,
  // Amazon AWS
  /amazon\.(com|co\.uk|de|fr|co\.jp)$/,
  /amazonaws\.com$/,
  // 加密貨幣
  /coinbase\.com$/,
  /kraken\.com$/,
  // VPN
  /nordvpn\.com$/,
  /expressvpn\.com$/,
  /surfshark\.com$/,
];

function isGFWBlocked(hostname) {
  const h = hostname.toLowerCase();
  return GFW_BLOCKED.some(pattern => pattern.test(h));
}

// 中國大陸常見頂級域（直接放行）
const CN_TLDS = /\.(cn|com\.cn|net\.cn|org\.cn|gov\.cn|edu\.cn|ac\.cn|mil\.cn)$/;

// 已知中國境內可訪問的 .com 等域名白名單
const CN_DOMESTIC = [
  'baidu.com', 'baidu.net',
  'qq.com', 'weixin.qq.com', 'qpic.cn',
  'taobao.com', 'tmall.com', 'alipay.com', 'alibaba.com', 'alibabacloud.com',
  'jd.com', 'jd.hk',
  'weibo.com', 'sinaimg.cn',
  'zhihu.com',
  'bilibili.com', 'bilivideo.com',
  'douyin.com', 'tiktok.com',
  'toutiao.com', 'bytedance.com',
  'meituan.com', 'dianping.com',
  'didi.com', 'didichuxing.com',
  'xiaomi.com', 'miui.com',
  'huawei.com', 'hicloud.com',
  'oppo.com', 'vivo.com',
  'lenovo.com', 'honor.com',
  '163.com', 'netease.com', '126.com',
  'sohu.com', 'changyou.com',
  'ifeng.com',
  'sina.com', 'sina.com.cn',
  'youku.com', 'iqiyi.com', 'le.com', 'mgtv.com', 'pptv.com',
  'pinduoduo.com', 'temu.com',
  'ctrip.com', 'trip.com', 'fliggy.com',
  'ele.me', 'eleme.cn',
  'autohome.com.cn',
  'pcauto.com.cn',
  'csdn.net',
  'jianshu.com',
  'segmentfault.com',
  'cnblogs.com',
  'oschina.net', 'gitee.com',
  'lagou.com', 'zhaopin.com', 'liepin.com', 'boss.com', 'bosszhipin.com',
  'anjuke.com', 'lianjia.com', 'fang.com',
  'dangdang.com',
  'suning.com',
  '360.cn', 'qihoo.com',
  'unionpay.com',
  'icbc.com.cn',
  'ccb.com',
  'boc.cn',
  'abchina.com',
  'psbc.com',
  'cmbchina.com',
  'spdb.com.cn',
  'citicbank.com',
  'hainanairlines.com',
  'airchina.com.cn',
  'csair.com',
  'ceair.com',
  'xiamenair.com',
  'shenzhenair.com',
  '12306.cn',
  'sfexpress.com', 'sf-express.com',
  'sto.cn', 'yto.net.cn',
  'yunda.com', 'ems.com.cn',
  'zto.com',
];

function isCNDomestic(hostname) {
  const h = hostname.toLowerCase();
  if (CN_TLDS.test(h)) return true;
  return CN_DOMESTIC.some(d => h === d || h.endsWith('.' + d));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: '請提供有效的 URL（需以 http 或 https 開頭）' });
  }

  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return res.status(400).json({ error: 'URL 格式不正確' });
  }

  // GFW 封鎖檢查
  if (isGFWBlocked(hostname)) {
    return res.status(403).json({
      error: `🚫 此網址在中國大陸受 GFW 封鎖，無法學習。請改用境內可訪問的網址。`,
    });
  }

  // 非中國境內域名提示
  if (!isCNDomestic(hostname)) {
    return res.status(403).json({
      error: `⚠️ 僅支援中國大陸長城牆內可訪問的網址。請使用 .cn 或已知境內域名。`,
    });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SentinelOrchestrator/5.0)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(400).json({ error: `無法存取網頁（HTTP ${response.status}）` });
    }

    const html = await response.text();

    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 6000);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    return res.json({ text, title, url });
  } catch (error) {
    const msg = error.name === 'TimeoutError' ? '網頁載入超時（10秒）' : error.message;
    return res.status(500).json({ error: msg });
  }
}
