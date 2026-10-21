# 李永辉 · 个人主页

线上地址：https://lyj1120.github.io/smart-money/

纯静态站点（HTML + CSS + 原生 JS），GitHub Pages 直接托管，无需构建。

## 页面

| 文件 | 内容 |
|---|---|
| `index.html` | 关于我：首屏、关键数据、工作经历、能力 / 教育 / 荣誉 / 联系、作品预告 |
| `works.html` | 作品集：企业研读、合成小鸡的完整案例 |
| `works/research/midea-report.html` | 企业研读示范报告（静态副本） |
| `works/chick/index.html` | 合成小鸡游戏（字体已改为自托管） |

## 主题与语言

- 两套主题：**暗夜极光**（默认）与**纸墨**。颜色全部是 `css/style.css` 顶部的变量，纸墨在 `:root[data-theme="paper"]` 中覆盖。新组件只用变量，两套主题自动适配。
- 两种语言：中文写在 HTML 里；英文在 `js/i18n.js`，用元素上的 `data-i18n="键名"` 对应。属性（如 `aria-label`、`alt`）用 `data-i18n-attr="属性:键名"`。
- 偏好保存在浏览器本地；链接可带参数直接指定：`?lang=en`、`?theme=paper`。

## 常见修改

- **改文字**：中文直接改 HTML；英文改 `js/i18n.js` 里同名的键。
- **改了标题文字**（纸墨主题用宋体显示的标题）：运行 `python tools/build_fonts.py` 重新生成字体子集，否则新字会用系统宋体显示。
- **宣传片**：`assets/video/` 下的 `research.mp4`、`chick.mp4`，作品标题下的「观看宣传片」按钮（`data-watch`）打开带声音的播放浮层。视频的制作工程在 `F:/Claude_workfile/02_作品集/宣传片`，改文案后可一键重新生成。
- **展示区换成静音视频**（可选）：在 `.work-stage` 上填写 `data-video="...mp4"`，会替换为静音循环视频。
- **加作品**：在 `works.html` 复制一个 `<section class="work">` 章节，并在 `index.html` 的作品预告里加一张卡片。

## 目录

```
css/style.css     共用样式：主题变量、导航、关于我页面
css/works.css     作品集页面样式
js/site.js        共用脚本：背景点阵、主题 / 语言切换、联系弹窗、作品页交互
js/i18n.js        英文文案
fonts/            自托管字体（Inter、思源宋体子集）
tools/            字体子集生成脚本
assets/works/     作品截图（webp）
```
