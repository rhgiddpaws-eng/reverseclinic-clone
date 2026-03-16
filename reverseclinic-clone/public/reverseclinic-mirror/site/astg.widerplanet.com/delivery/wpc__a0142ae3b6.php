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
        var links = ["https:\/\/act.ds.kakao.com\/match?d=106\u0026uid=7b432e18567778e8f2fbbc8e406239c9","https:\/\/cm.g.doubleclick.net\/pixel?google_nid=wider_planet\u0026google_cm\u0026google_ula=12153253,1773165126\u0026poaid=7b432e18567778e8f2fbbc8e406239c9","https:\/\/cm.mman.kr\/cm.mezzo\/?buyerid=7b432e18567778e8f2fbbc8e406239c9\u0026partnerkey=widerplanet\u0026url=__STR_URL_SET","https:\/\/cm-exchange.toast.com\/bi\/pixel?cm_pid=1107948209\u0026puid=7b432e18567778e8f2fbbc8e406239c9\u0026toast_push","https:\/\/sbm.nate.com\/setCookie?venderKey=wider\u0026userKey=7b432e18567778e8f2fbbc8e406239c9","https:\/\/cm.igaw.io\/v1\/usersync?dsp_no=700\u0026user_id=7b432e18567778e8f2fbbc8e406239c9","https:\/\/mixer.mobon.net\/match?id=7b432e18567778e8f2fbbc8e406239c9\u0026code=03","https:\/\/sync.bidence.net\/dsp\/9504ed4c5482b211d593135eb26474aa?dsp_uid=7b432e18567778e8f2fbbc8e406239c9","https:\/\/cookie.momento.dev\/cookie\/WIDER?buyeruid=7b432e18567778e8f2fbbc8e406239c9"],
            len = links.length,
            i;
        for (i=0; i<len; i++) {
            doPair(links[i]);
        }
    } catch(e) {}
})(window);
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
        doPair("https:\/\/astg.widerplanet.com\/delivery\/storage?request_id=null\u0026wp_uid=2-7b432e18567778e8f2fbbc8e406239c9-s1773165126.45809%7Cwindows_10%7Cchrome-zie911\u0026qsc=bk1f6t");
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

        identity.setCookie('_wp_uid', "1-7b432e18567778e8f2fbbc8e406239c9-s1773165126.45809|windows_10|chrome-155imiw", 365);

    } catch(e) {}
})(window);
/*]]>*/



