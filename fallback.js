function aiPanel(){return '<div class="analysis-output"><p class="muted">GitHub 备用入口不提供 Grok 分析。成本结构、损益表与图表仍会根据输入实时计算。</p></div>';}
const githubDashboard = dashboard;
dashboard = () => githubDashboard().replace('AI 数据分析与建议 · Grok', '数据分析说明');
document.querySelector('#backup-shortcut').onclick = () => document.querySelector('#backup').click();
render();
