// js/fluid-bg.js - 独立高性能 WebGL 3D 流体背景渲染器
document.addEventListener('DOMContentLoaded', () => {
    // 1. 动态安全引入官方 WebGL 流体仿真引擎的 CDN
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/webgl-fluid-simulation@1.1.2/dist/webgl-fluid-simulation.min.js";
    
    script.onload = () => {
        const canvas = document.getElementById('ripple-canvas');
        if (!canvas) return;

        // 2. 初始化顶级 WebGL 模拟器，严格锁死以下艺术级预设参数
        WebGLFluidSimulation.init(canvas, {
            TRIGGER: 'mousemove',
            SIM_RESOLUTION: 128,         // 仿真细腻度
            DYE_RESOLUTION: 512,         // 渲染细腻度
            CAPTURE_ZOOM: 1,
            DENSITY_DISSIPATION: 0.98,   // 液体消散速度，保留丝滑油画厚重感
            VELOCITY_DISSIPATION: 0.98,  // 速度阻尼
            PRESSURE: 0.8,               // 流体压力
            PRESSURE_ITERATIONS: 20,
            CURL: 35,                    // 漩涡卷曲度，复刻艺术涡流
            SPLAT_RADIUS: 0.25,          // 鼠标划痕粗细
            SPLAT_FORCE: 6000,
            SHADING: true,               // 开启高级 3D 立体光泽阴影（波光粼粼的关键）
            COLORFUL: false,             // 关闭非主流五彩，保持高冷单色调
            BACK_COLOR: { r: 4, g: 20, b: 16 },    // 极客深色：深夜墨绿底色
            MAIN_COLOR: { r: 74, g: 222, b: 128 }  // 划痕颜色：翡翠绿
        });

        // 首次加载根据当前 HTML 的 data-theme 初始化流体色彩配置
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'geek';
        window.updateFluidTheme(currentTheme === 'geek');
    };
    
    document.head.appendChild(script);

    // 3. 全局封装双主题平滑切换函数（可供外部导航栏按钮调用）
    window.updateFluidTheme = function(isDark) {
        if (typeof WebGLFluidSimulation === 'undefined') return;
        if (isDark) {
            // 极客主题：深夜墨绿底色 + 荧光翡翠绿水流
            WebGLFluidSimulation.updateOptions({
                BACK_COLOR: { r: 4, g: 20, b: 16 },
                MAIN_COLOR: { r: 74, g: 222, b: 128 }
            });
        } else {
            // 商务主题：清爽雾蓝白底色 + 清澈蔚蓝水流
            WebGLFluidSimulation.updateOptions({
                BACK_COLOR: { r: 244, g: 247, b: 246 },
                MAIN_COLOR: { r: 56, g: 189, b: 248 }
            });
        }
    };
});
