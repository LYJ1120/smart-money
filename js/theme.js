// js/theme.js - 全局主题切换逻辑

function switchTheme(theme) {
    const html = document.documentElement;
    const body = document.body;
    const hero = document.getElementById('hero');

    // 切换 data-theme 属性
    html.setAttribute('data-theme', theme);

    if (theme === 'geek') {
        // 极客深色模式
        body.classList.remove('bg-[#f4f7f6]', 'text-gray-800');
        body.classList.add('bg-[#041410]', 'text-gray-300');
        if (hero) hero.style.backgroundColor = '#041410';
    } else {
        // 商务浅色模式
        body.classList.remove('bg-[#041410]', 'text-gray-300');
        body.classList.add('bg-[#f4f7f6]', 'text-gray-800');
        if (hero) hero.style.backgroundColor = '#f4f7f6';
    }

    // 联动 WebGL 流体背景色彩
    if (window.updateFluidTheme) {
        window.updateFluidTheme(theme === 'geek');
    }
}

// 将方法挂载到全局，供外部UI调用
window.switchTheme = switchTheme;

document.addEventListener('DOMContentLoaded', () => {
    // 默认可以从 localStorage 获取，这里暂定默认为 geek
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'geek';
    switchTheme(currentTheme);
});
