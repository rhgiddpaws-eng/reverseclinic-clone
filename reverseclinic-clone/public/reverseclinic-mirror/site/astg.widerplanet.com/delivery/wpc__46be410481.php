/*<![CDATA[*/
(function(w) {
    var wg = w.document.getElementById('wp_tg_cts');
    function doPair(url) {
        if (wg == null) { return; }
        (function(_url) {
            var frm = w.document.createElement('IFRAME');
            frm.width = '1px';
            frm.height = '1px';
            frm.style.display = 'none';
            frm.src='about:blank';
            frm.title = 'tgpairing';
            wg.appendChild(frm);

            var ifrm = (frm.contentWindow) ? frm.contentWindow : (frm.contentDocument.document ? frm.contentDocument.document : frm.contentDocument);
            ifrm.document.open();
            ifrm.document.write('<img src=\"' + _url + '\"/>');
            ifrm.document.close();

            setTimeout(function() {
                wg.removeChild(frm);
            }, 2000);
        })(url);
    }

    try {
        var links = ["https:\/\/act.ds.kakao.com\/match?d=106\u0026uid=9ed7ba64900af7661689f9426332c5ef","https:\/\/cm.g.doubleclick.net\/pixel?google_nid=wider_planet\u0026google_cm\u0026google_ula=12153253,1773165195\u0026poaid=9ed7ba64900af7661689f9426332c5ef","https:\/\/cm.mman.kr\/cm.mezzo\/?buyerid=9ed7ba64900af7661689f9426332c5ef\u0026partnerkey=widerplanet\u0026url=__STR_URL_SET","https:\/\/cm-exchange.toast.com\/bi\/pixel?cm_pid=1107948209\u0026puid=9ed7ba64900af7661689f9426332c5ef\u0026toast_push","https:\/\/sbm.nate.com\/setCookie?venderKey=wider\u0026userKey=9ed7ba64900af7661689f9426332c5ef","https:\/\/cm.igaw.io\/v1\/usersync?dsp_no=700\u0026user_id=9ed7ba64900af7661689f9426332c5ef","https:\/\/mixer.mobon.net\/match?id=9ed7ba64900af7661689f9426332c5ef\u0026code=03","https:\/\/sync.bidence.net\/dsp\/9504ed4c5482b211d593135eb26474aa?dsp_uid=9ed7ba64900af7661689f9426332c5ef","https:\/\/cookie.momento.dev\/cookie\/WIDER?buyeruid=9ed7ba64900af7661689f9426332c5ef"],
            len = links.length,
            i;
        for (i=0; i<len; i++) {
            doPair(links[i]);
        }
    } catch(e) {}
})(window);
/*]]>*/


/*<![CDATA[*/
(function() {
var ttd = new Image();
ttd.src = "https:\/\/match.adsrvr.org\/track\/cmf\/generic?ttd_pid=ven6wdk\u0026ttd_tpi=1\u0026ttd_puid=9ed7ba64900af7661689f9426332c5ef";
})();
/*]]>*/





/*<![CDATA[*/
(function(w) {
    var origin = "https:\/\/astg.widerplanet.com";
    var wg = w.document.getElementById('wp_tg_cts');
    function doPair(url) {
        if (wg == null) { return; }
        (function(_url) {
            var frm = w.document.createElement('IFRAME');
            frm.width = '1px';
            frm.height = '1px';
            frm.style.display = 'none';
            frm.src= _url;
            frm.title = 'tgpairing';
            frm.addEventListener('load', function(o) {
                try {
                    frm.contentWindow.postMessage({}, origin);
                } catch(e) {}
            });

            wg.appendChild(frm);
            setTimeout(function() {
                wg.removeChild(frm);
            }, 3000);
        })(url);
    }

    try {
        doPair("https:\/\/astg.widerplanet.com\/delivery\/storage?request_id=null\u0026wp_uid=2-9ed7ba64900af7661689f9426332c5ef-s1773165110.220578%7Cwindows_10%7Cchrome-44ub33\u0026qsc=17cznm");
    } catch(e) {}
})(window);
/*]]>*/



/*<![CDATA[*/
(function(w) {
    try {
        var identity = {
            setCookie: function(cname, cvalue, exdays) {
                var d = new Date();
                d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
                var expires = 'expires='+d.toUTCString();
                var domain = 'domain=.'+this.extractRootDomain(location.host);
                document.cookie = cname + '=' + cvalue + ';' + domain + ';' + expires + ';path=/';
            },
            getCookie: function(cname) {
                var name = cname + '=';
                var ca = document.cookie.split(';');
                for(var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                    }
                }
                return '';
            },
            extractRootDomain: function (domain) {
                var splitArr = domain.split('.'),
                    arrLen = splitArr.length;

                if (arrLen > 2) {
                    //TODO: .me 와 같은 특수도메인 예외처리 필요.
                    domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
                    if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
                        domain = splitArr[arrLen - 3] + '.' + domain;
                    }
                }
                return domain;
            }
        };

        identity.setCookie('_wp_uid', "1-9ed7ba64900af7661689f9426332c5ef-s1773165110.220578|windows_10|chrome-1g4jkkm", 365);

    } catch(e) {}
})(window);
/*]]>*/



