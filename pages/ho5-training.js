// HO5 訓練資料頁面 — 智行安踏 AI 助理學習資料
// 部署後 URL：https://sentinel-orchestrator.vercel.app/ho5-training

export default function HO5Training() {
  return null; // Server-side only — see getServerSideProps
}

export async function getServerSideProps({ res }) {
  const html = buildTrainingPage();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(html);
  res.end();
  return { props: {} };
}

function buildTrainingPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HO5 训练资料 — 迪桑特材料总监 AI 知识库</title>
<style>
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; max-width: 900px; margin: 0 auto; padding: 24px 16px; background: #fff; color: #1a1a1a; line-height: 1.8; }
  h1 { font-size: 22px; border-bottom: 2px solid #c8102e; padding-bottom: 8px; color: #c8102e; }
  h2 { font-size: 17px; background: #f5f5f5; padding: 6px 12px; border-left: 4px solid #c8102e; margin-top: 28px; }
  h3 { font-size: 15px; color: #333; margin-top: 18px; border-bottom: 1px solid #eee; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0; }
  th { background: #c8102e; color: #fff; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #fafafa; }
  .tag { display: inline-block; background: #eef; border: 1px solid #99b; border-radius: 3px; padding: 1px 6px; font-size: 11px; margin: 1px; }
  .section { margin-bottom: 32px; }
  .meta { font-size: 11px; color: #888; margin-bottom: 16px; }
  p { margin: 6px 0; }
  ul { padding-left: 20px; margin: 6px 0; }
  li { margin: 3px 0; }
  .highlight { background: #fff8e1; border-left: 3px solid #f0a500; padding: 8px 12px; margin: 10px 0; font-size: 13px; }
</style>
</head>
<body>

<h1>HO5 训练资料 — 迪桑特材料总监 AI 知识库</h1>
<p class="meta">版本：HO5 | 更新：2025 | 用途：智行安踏 AI 助理学习资料 | 覆盖范围：面料技术 · 竞品分析 · 战略框架</p>

<div class="section">
<h2>一、系统角色定义（Sentinel Orchestrator 智囊团）</h2>
<p>本 AI 系统为迪桑特台湾籍材料总监提供多角色战略决策支援，以下为各 AI 角色定义：</p>
<table>
  <tr><th>角色</th><th>职位</th><th>核心职责</th><th>分析重点</th></tr>
  <tr><td>Gemini</td><td>战略长（CSO）</td><td>战略思维、利益相关者分析、组织能力评估</td><td>两岸局势、油价、原物料数据对迪桑特材料策略影响</td></tr>
  <tr><td>NVIDIA</td><td>营运长（COO）</td><td>执行力、组织扩展、流程优化</td><td>供应链管理、库存策略、成本控制</td></tr>
  <tr><td>Perplexity</td><td>策略情报长</td><td>市场趋势、竞争分析、弱讯号捕捉</td><td>竞争对手动态（Nike/Adidas/优衣库）、市场讯号</td></tr>
  <tr><td>Grok</td><td>创业家</td><td>快速行动、大胆决策、质疑稳健</td><td>市场时机、快速迭代、机会成本</td></tr>
  <tr><td>OpenAI</td><td>风控长（CRO）</td><td>长期主义、系统性风险、永续发展</td><td>供应链风险、合规风险、环保法规</td></tr>
  <tr><td>Vertex</td><td>董事会主席</td><td>综合视角、利益平衡、辩证思维</td><td>综合所有角色建议，给出分层策略</td></tr>
  <tr><td>Local LLM</td><td>独立顾问</td><td>独立思考、不受干扰、回归本质</td><td>去除偏见后的第一性原理分析</td></tr>
</table>

<div class="highlight">
<strong>决策模式：</strong><br>
• 快速模式：战略长 + 营运长快速诊断<br>
• 预测模式：加入情报长的市场洞察<br>
• 深度研究：全智囊团综合分析<br>
• AI 辩论：正方（创业家+风控）vs 反方（营运+战略）/ 主席裁决
</div>
</div>

<div class="section">
<h2>二、迪桑特品牌背景</h2>
<h3>迪桑特（Descente）</h3>
<p><strong>创立：</strong>1935年 | <strong>国家：</strong>日本 | <strong>类别：</strong>顶级运动户外品牌</p>
<p>日本顶级运动品牌，以滑雪服装和高技术布料研发闻名，长期赞助顶尖滑雪国家队。品牌色：#C8102E</p>

<h3>中国迪桑特面料科技（Descente China Fabric Technology）</h3>
<p>迪桑特中国面料科技部门，专为中国运动员及市场需求研发高性能面料，融合日本匠人精神与本土创新研发，打造适合中国气候与运动场景的专业技术面料。</p>

<h3>安踏集团（ANTA Sports）</h3>
<p>安踏体育用品集团，迪桑特中国业务核心合作方。集团旗下品牌矩阵覆盖大众至高端市场，智行安踏（ZhiXing ANTA）为集团内部 AI 赋能平台。</p>
</div>

<div class="section">
<h2>三、迪桑特核心面料技术</h2>

<h3>3.1 DERMIZAX EV — 旗舰防水透气膜</h3>
<table>
  <tr><th>参数</th><th>数值</th></tr>
  <tr><td>防水值</td><td>20,000mm</td></tr>
  <tr><td>透湿度（MVTR）</td><td>20,000 g/m²/24h</td></tr>
  <tr><td>重量</td><td>150 gsm</td></tr>
  <tr><td>弹性</td><td>2-way 25%</td></tr>
  <tr><td>PFC-free</td><td>是</td></tr>
  <tr><td>推出年份</td><td>2015</td></tr>
</table>
<p>采用膨胀型聚氨酯（e-PU）微孔结构，是迪桑特最具代表性的核心防水透气技术。2-way 弹性设计满足滑雪动作需求。</p>

<h3>3.2 DERMIZAX NX — 超高透气防水膜</h3>
<table>
  <tr><th>参数</th><th>数值</th></tr>
  <tr><td>防水值</td><td>20,000mm</td></tr>
  <tr><td>透湿度（MVTR）</td><td>40,000 g/m²/24h（业界领先）</td></tr>
  <tr><td>重量</td><td>120 gsm（轻量化）</td></tr>
  <tr><td>技术</td><td>奈米级微孔工程</td></tr>
  <tr><td>推出年份</td><td>2018</td></tr>
</table>
<p>下一代 DERMIZAX，透湿度较 EV 提升 100%，适合高强度竞技运动需求。</p>

<h3>3.3 DERMIZAX Dynamic — 四向弹性防水膜</h3>
<table>
  <tr><th>参数</th><th>数值</th></tr>
  <tr><td>防水值</td><td>20,000mm</td></tr>
  <tr><td>透湿度（MVTR）</td><td>20,000 g/m²/24h</td></tr>
  <tr><td>弹性</td><td>4-way 50%（各方向）</td></tr>
  <tr><td>重量</td><td>160 gsm</td></tr>
  <tr><td>适用</td><td>滑雪竞赛、高山竞技</td></tr>
  <tr><td>推出年份</td><td>2019</td></tr>
</table>
<p>专为竞技运动设计，各方向 50% 延伸率，零束缚感。</p>

<h3>3.4 GLOBAL ALPINISM — 高山技术布系</h3>
<table>
  <tr><th>参数</th><th>数值</th></tr>
  <tr><td>防水值</td><td>25,000mm</td></tr>
  <tr><td>透湿度（MVTR）</td><td>30,000 g/m²/24h</td></tr>
  <tr><td>重量</td><td>130 gsm</td></tr>
  <tr><td>认证</td><td>Bluesign + PFC-free</td></tr>
</table>
<p>迪桑特旗舰高山技术布料系统，专为极端登山环境设计。</p>

<h3>3.5 MOVING COMFORT — 运动弹力软壳布</h3>
<p>四向弹力软壳布料，防风 + 导湿，适合滑雪与训练。重量 140 gsm，弹性 40%。</p>

<h3>3.6 TRANSFORM SYSTEM — 模块化保暖系统</h3>
<p>四向弹性合成保暖，80 gsm 轻量，CLO 1.2，适合主动型冬季运动。</p>

<h3>3.7 ELAST4 — 压缩底层布</h3>
<p>四向弹性压缩底层，150 gsm，排汗 + 抗菌，适合滑雪与冬季运动。</p>
</div>

<div class="section">
<h2>四、面料分类体系</h2>
<table>
  <tr><th>类别ID</th><th>中文名称</th><th>说明</th></tr>
  <tr><td>hardshell</td><td>硬壳防水</td><td>防水透气外层，应对极端天候</td></tr>
  <tr><td>softshell</td><td>软壳弹力</td><td>弹性防风布，兼顾天候防护与活动性</td></tr>
  <tr><td>insulation</td><td>合成保暖</td><td>湿润环境下维持保暖效能的合成填充</td></tr>
  <tr><td>midlayer</td><td>中层刷毛</td><td>刷毛与中层布料，调节体温与导湿</td></tr>
  <tr><td>base-layer</td><td>底层排汗</td><td>贴身排汗布，为运动性能打基础</td></tr>
  <tr><td>windshell</td><td>防风轻量</td><td>超轻量防风布，可折叠收纳</td></tr>
  <tr><td>down</td><td>天然羽绒</td><td>天然羽绒保暖，最佳保暖重量比</td></tr>
</table>
</div>

<div class="section">
<h2>五、竞争品牌面料技术对比</h2>

<h3>5.1 面料技术供应商（Material Suppliers）</h3>
<table>
  <tr><th>品牌</th><th>国家</th><th>核心技术</th><th>市场地位</th></tr>
  <tr><td>Gore-Tex</td><td>美国</td><td>PTFE 防水透气膜，Gore-Tex Pro/Paclite</td><td>业界黄金标准，被全球顶尖品牌广泛采用</td></tr>
  <tr><td>Polartec</td><td>美国</td><td>Power Stretch、Power Dry、Alpha 刷毛</td><td>发明现代刷毛，顶尖中层布料供应商</td></tr>
  <tr><td>PrimaLoft</td><td>美国</td><td>PrimaLoft Gold/Silver/Black 合成保暖</td><td>湿润环境保暖最优，正替代传统羽绒</td></tr>
</table>

<h3>5.2 日本户外运动品牌（日系对标）</h3>
<table>
  <tr><th>品牌</th><th>核心技术</th><th>与迪桑特关系</th></tr>
  <tr><td>Goldwin（日本）</td><td>极简技术设计，代理 The North Face</td><td>同源竞争，共同争夺日本高端滑雪市场</td></tr>
  <tr><td>Phenix（日本）</td><td>P.A.C.S 通风系统，日本国家滑雪队</td><td>直接竞争对手，同样赞助日本滑雪</td></tr>
  <tr><td>Mizuno（日本）</td><td>BreathThermo 自发热、BioGear 压缩</td><td>运动品类竞争</td></tr>
  <tr><td>Mont-bell（日本）</td><td>EXCELOFT 合成保暖、Zeo-Line 底层</td><td>超轻量策略竞争者</td></tr>
</table>

<h3>5.3 顶级户外品牌（高端竞争）</h3>
<table>
  <tr><th>品牌</th><th>国家</th><th>核心技术</th><th>防水值/透湿度</th></tr>
  <tr><td>Arc'teryx 始祖鸟</td><td>加拿大</td><td>N40p/N40r/AC2 层压，Gore-Tex Pro 核心用户</td><td>28,000mm / 28,000+</td></tr>
  <tr><td>The North Face 北面</td><td>美国</td><td>Futurelight、DryVent</td><td>20,000mm+</td></tr>
  <tr><td>Mammut 猛犸象</td><td>瑞士</td><td>DRYtech、FLEXIDOWN</td><td>20,000mm / 20,000</td></tr>
  <tr><td>Salomon 萨洛蒙</td><td>法国</td><td>AdvancedSkin、S/Lab 超轻量</td><td>20,000mm+</td></tr>
  <tr><td>Norrøna 挪诺纳</td><td>挪威</td><td>Trollveggen Gore-Tex Pro、bitihorn 轻量</td><td>28,000mm+</td></tr>
  <tr><td>Patagonia</td><td>美国</td><td>H2No、NetPlus 回收、永续理念</td><td>20,000mm+</td></tr>
  <tr><td>Rab</td><td>英国</td><td>Kinetic Alpine、Neutrino Down</td><td>20,000mm+</td></tr>
  <tr><td>Helly Hansen 黑力汉森</td><td>挪威</td><td>Helly Tech Professional、LIFALOFT</td><td>20,000mm+</td></tr>
</table>

<h3>5.4 滑雪专项品牌（直接竞争）</h3>
<table>
  <tr><th>品牌</th><th>国家</th><th>核心技术</th><th>市场定位</th></tr>
  <tr><td>KJUS</td><td>瑞士</td><td>Speed Reader 防水透气、FRX Pro 保暖</td><td>顶级滑雪，价位高于迪桑特</td></tr>
  <tr><td>Spyder</td><td>美国</td><td>ProWeb 赛级面料、Stryke 弹力</td><td>国家滑雪队合作品牌</td></tr>
  <tr><td>Peak Performance</td><td>瑞典</td><td>Alum Light 轻量保暖、北欧风格</td><td>高端时尚滑雪</td></tr>
</table>

<h3>5.5 大众运动品牌（下方竞争）</h3>
<table>
  <tr><th>品牌</th><th>国家</th><th>核心技术</th><th>中国市场</th></tr>
  <tr><td>Nike</td><td>美国</td><td>Dri-FIT、Storm-FIT、ACG</td><td>主导大众市场，但技术布料逊于迪桑特</td></tr>
  <tr><td>Adidas</td><td>德国</td><td>TERREX、Primeknit、HEAT.RDY/COLD.RDY</td><td>TERREX 系列与迪桑特户外线有重叠</td></tr>
  <tr><td>Under Armour</td><td>美国</td><td>HeatGear、ColdGear、UA RUSH</td><td>中高端运动市场竞争者</td></tr>
  <tr><td>lululemon</td><td>加拿大</td><td>Luon、Everlux、Nulu</td><td>女性运动市场快速增长</td></tr>
</table>

<h3>5.6 中国本土品牌（国内竞争）</h3>
<table>
  <tr><th>品牌</th><th>核心技术</th><th>威胁程度</th></tr>
  <tr><td>凯乐石（Kailas）</td><td>KAISHELL 防水透气膜、KAIDRY 排汗系统</td><td>高 — 攀岩登山市场直接竞争</td></tr>
  <tr><td>安踏（ANTA）</td><td>A-Flashfoam、A-Shield 防水</td><td>集团内部协同，非竞争关系</td></tr>
  <tr><td>李宁（Li-Ning）</td><td>丝路系列、AT DRY 技术</td><td>中等 — 国潮市场有压力</td></tr>
</table>
</div>

<div class="section">
<h2>六、关键面料性能指标解读</h2>
<table>
  <tr><th>指标</th><th>单位</th><th>含义</th><th>迪桑特水准</th></tr>
  <tr><td>防水值（Waterproof）</td><td>mm</td><td>水柱压力承受值，越高越防水</td><td>20,000–25,000mm（业界顶级）</td></tr>
  <tr><td>透湿度（MVTR）</td><td>g/m²/24h</td><td>24小时水蒸气传导量，越高越透气</td><td>20,000–40,000（DERMIZAX NX 业界领先）</td></tr>
  <tr><td>重量</td><td>gsm</td><td>每平方米克重，越轻负担越小</td><td>80–160 gsm 涵盖各场景</td></tr>
  <tr><td>弹性（Stretch）</td><td>%</td><td>延伸率，越高活动性越好</td><td>25–50%，2-way 至 4-way</td></tr>
  <tr><td>CLO 值</td><td>clo</td><td>保暖度单位，越高越保暖</td><td>1.2 clo（TRANSFORM SYSTEM）</td></tr>
  <tr><td>蓬松度（Fill Power）</td><td>in³/oz</td><td>羽绒品质指标，越高越轻暖</td><td>600–800（依产品线）</td></tr>
</table>

<h3>关键环保认证说明</h3>
<ul>
  <li><strong>PFC-free</strong>：无全氟化合物拨水处理，对环境友好，是 2024 年后行业新标准</li>
  <li><strong>Bluesign</strong>：蓝标认证，确保生产过程符合环保、工安与资源效率标准</li>
  <li><strong>OEKO-TEX</strong>：纺织品有害物质检测认证，确保消费者安全</li>
  <li><strong>GRS</strong>：全球回收标准，适用于再生材料面料</li>
</ul>
</div>

<div class="section">
<h2>七、迪桑特中国市场战略框架</h2>

<h3>7.1 市场定位</h3>
<ul>
  <li>高端技术运动服装，价位对标始祖鸟、北面高端线</li>
  <li>核心用户：25–45 岁高收入专业运动人士及滑雪爱好者</li>
  <li>主力场景：滑雪、高山、户外探索、高端训练</li>
  <li>渠道：一二线城市旗舰店 + 高端百货 + 官方电商</li>
</ul>

<h3>7.2 材料策略重点</h3>
<ul>
  <li><strong>自主技术壁垒：</strong>DERMIZAX 系列是差异化核心，需持续升级维持技术领先</li>
  <li><strong>本土化研发：</strong>中国迪桑特面料科技针对中国气候与运动习惯做针对性研发</li>
  <li><strong>供应链在地化：</strong>降低对日本原材料依赖，提升中国供应商比例</li>
  <li><strong>环保布局：</strong>PFC-free 全线布局，应对欧盟 PFAS 禁令浪潮</li>
  <li><strong>竞品材料追踪：</strong>持续监测始祖鸟、北面、凯乐石的新材料动态</li>
</ul>

<h3>7.3 关键风险因素</h3>
<ul>
  <li>原材料价格波动：石油衍生纤维（尼龙、聚酯）受油价影响</li>
  <li>中日贸易关系：政治因素可能影响日本技术授权与原料进口</li>
  <li>环保法规：PFAS 禁令在中国市场的落地时间与执行力度</li>
  <li>国潮崛起：凯乐石等中国品牌技术快速追赶，价格优势明显</li>
  <li>滑雪市场饱和：一二线城市滑雪人群增速放缓，需开拓三线城市</li>
</ul>

<h3>7.4 四种决策场景</h3>
<table>
  <tr><th>场景</th><th>适用问题</th><th>推荐决策模式</th></tr>
  <tr><td>新材料引进</td><td>是否采用新技术供应商？引进成本效益？</td><td>深度研究模式（全智囊团）</td></tr>
  <tr><td>竞品应对</td><td>如何应对始祖鸟/凯乐石的新材料发布？</td><td>预测模式（加入情报长）</td></tr>
  <tr><td>供应链决策</td><td>备选供应商、交期压力、价格谈判</td><td>快速模式（战略长+营运长）</td></tr>
  <tr><td>创新方向</td><td>下一代面料技术投入方向？</td><td>AI 辩论模式</td></tr>
</table>
</div>

<div class="section">
<h2>八、竞争对手关键材料速查</h2>

<h3>始祖鸟（Arc'teryx）</h3>
<ul>
  <li>N40p Paclite Plus：超轻量防水，60D 尼龙，Gore-Tex 层压</li>
  <li>AC2 System：始祖鸟自主防水系统</li>
  <li>Coreloft：自主合成保暖填充</li>
  <li>防水值：28,000mm | 透湿度：28,000+</li>
</ul>

<h3>北面（The North Face）</h3>
<ul>
  <li>Futurelight：纳米纺技术，超轻量防水透气</li>
  <li>DryVent：自主防水系统，亲民价位</li>
  <li>ThermoBall：合成保暖，可机洗</li>
</ul>

<h3>凯乐石（Kailas — 中国本土竞争）</h3>
<ul>
  <li>KAISHELL：自主防水透气膜，对标 Gore-Tex 价位更低</li>
  <li>KAIDRY：排汗系统</li>
  <li>优势：国产认同感、价格优势、登山场景专业度高</li>
</ul>

<h3>优衣库（Uniqlo — 大众市场压力）</h3>
<ul>
  <li>HEATTECH：蓄热保暖底层，大众价位颠覆者</li>
  <li>BLOCKTECH：防水风衣，极低价位</li>
  <li>威胁：大众消费者对功能性面料的"足够好"心理</li>
</ul>
</div>

<div class="section">
<h2>九、AI 助理使用指南</h2>

<h3>9.1 提问最佳实践</h3>
<ul>
  <li>提供具体数据参考（例：与 DERMIZAX NX 的透湿度 40,000 相比...）</li>
  <li>说明决策时间限制（例：季度采购截止前 3 周...）</li>
  <li>指定分析角度（例：请从风控长角度分析...）</li>
  <li>附上对比维度（例：与凯乐石 KAISHELL 相比...）</li>
</ul>

<h3>9.2 常见查询场景</h3>
<ul>
  <li>新供应商面料评估：防水值、透湿度、重量、弹性、认证</li>
  <li>竞品材料拆解：参考上方竞品面料速查表</li>
  <li>季节性采购建议：结合市场趋势与库存策略</li>
  <li>技术标准制定：参考迪桑特 DERMIZAX 系列数据</li>
</ul>

<h3>9.3 迪桑特关键词汇</h3>
<p>
  <span class="tag">DERMIZAX</span>
  <span class="tag">防水透气</span>
  <span class="tag">硬壳</span>
  <span class="tag">软壳</span>
  <span class="tag">合成保暖</span>
  <span class="tag">刷毛中层</span>
  <span class="tag">底层排汗</span>
  <span class="tag">羽绒</span>
  <span class="tag">PFC-free</span>
  <span class="tag">Bluesign</span>
  <span class="tag">四向弹性</span>
  <span class="tag">奈米微孔</span>
  <span class="tag">层压技术</span>
  <span class="tag">Gore-Tex</span>
  <span class="tag">Polartec</span>
  <span class="tag">PrimaLoft</span>
  <span class="tag">凯乐石</span>
  <span class="tag">始祖鸟</span>
  <span class="tag">材料总监</span>
  <span class="tag">供应链</span>
  <span class="tag">滑雪</span>
  <span class="tag">高山</span>
  <span class="tag">竞技</span>
</p>
</div>

<div class="section">
<h2>十、数据来源与更新说明</h2>
<ul>
  <li>数据来源：迪桑特材料数据库（descente-materials）、Sentinel Orchestrator 战略框架</li>
  <li>本页面版本：HO5 | 2025年</li>
  <li>访问地址：https://sentinel-orchestrator.vercel.app/ho5-training</li>
  <li>更新频率：每季度与材料数据库同步</li>
  <li>使用授权：安踏集团内部 AI 助理学习资料，限内部使用</li>
</ul>
<p style="font-size:11px; color:#aaa; margin-top:20px; border-top:1px solid #eee; padding-top:10px;">
HO5 Training Data | Descente Materials Director AI Knowledge Base | ANTA Sports Internal Use Only<br>
Sentinel Orchestrator v5 | Generated for 智行安踏 AI Assistant Learning
</p>
</div>

</body>
</html>`;
}
