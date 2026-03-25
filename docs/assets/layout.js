// ===== LAYOUT.JS — Footer, Modal, hreflang injection =====

(function(){
    // Footer
    var footer=document.getElementById('site-footer');
    if(footer){
        footer.innerHTML='<footer class="footer"><p data-i18n-html="footer.copy">© 2026 Logic Architecture. Консалтинг · Разработка · Документация<br><a href="https://t.me/LogicArchitecture" target="_blank" rel="noopener">Telegram</a> · Конфиденциально · Все права защищены</p><p style="margin-top:12px;font-size:11px;color:var(--t3);max-width:600px;margin-left:auto;margin-right:auto;line-height:1.5" data-i18n="footer.disc">Материалы, предоставляемые Logic Architecture в рамках образовательных услуг, носят вспомогательный характер и предназначены для помощи в подготовке учебных работ.</p></footer>';
    }

    // Modal
    var modal=document.getElementById('site-modal');
    if(modal){
        modal.innerHTML='<div class="modal-overlay" id="modalOverlay" onclick="closeModal(event)"><div class="modal modal--contact"><button class="modal-close" onclick="closeModal()">×</button><h3 data-i18n="modal.t">Связаться с нами</h3><p class="mdesc" data-i18n="modal.d">Напишите нам в Telegram — максимально подробно изложите вашу задачу, чтобы мы могли оказать качественную консультацию:</p><ul class="contact-list"><li data-i18n="modal.i1">Тип задачи (разработка, документация, исследование…)</li><li data-i18n="modal.i2">Описание проекта или проблемы</li><li data-i18n="modal.i3">Сроки и бюджет</li></ul><a href="https://t.me/LogicArchitecture" target="_blank" rel="noopener" class="btn btn--tg"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.751-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg><span data-i18n="modal.btn">Написать в Telegram</span></a></div></div>';
    }

    // hreflang tags
    var pagePath=window.location.pathname.replace(/^\/(?:ru|en|vi|zh)\//,'/').replace(/\/index\.html$/,'/');
    if(pagePath.length>1&&pagePath.endsWith('/'))pagePath=pagePath.slice(0,-1);
    var base='https://logic-architecture.com';
    var langs=[
        {code:'ru',prefix:'/ru'},
        {code:'en',prefix:'/en'},
        {code:'vi',prefix:'/vi'},
        {code:'zh',prefix:'/zh'}
    ];
    langs.forEach(function(l){
        var link=document.createElement('link');
        link.rel='alternate';
        link.hreflang=l.code;
        link.href=base+l.prefix+pagePath;
        document.head.appendChild(link);
    });
    var xdef=document.createElement('link');
    xdef.rel='alternate';
    xdef.hreflang='x-default';
    xdef.href=base+pagePath;
    document.head.appendChild(xdef);
})();
