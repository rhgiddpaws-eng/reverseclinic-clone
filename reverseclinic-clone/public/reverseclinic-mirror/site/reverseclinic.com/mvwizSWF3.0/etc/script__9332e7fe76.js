function mvwizWin(link){
	$('#blacksheepwall').fadeIn(300);
	jframe(link,'blacksheepwall',this);
}


function mvwizEmbed(config){
	jframe("/?_mvwizEmbed="+encodeURIComponent(JSON.stringify(config)),config.target,this);
}


function menu_select(obj,cls){
	$(obj.parentNode).children().removeClass(cls);
	$(obj).addClass(cls);
}  
function menu_select_parent(obj,cls){
	$(obj.parentNode.parentNode).children().children().removeClass(cls);
	$(obj).addClass(cls);
}  

function viewpcver(){
	setCookie('viewpc','y', 1);
	location.reload();
}

function viewmobilever(){
	setCookie('viewpc','n', 1);
	location.reload();
}

function intropage_close(){
	document.getElementById('_intropageDsp_').parentNode.removeChild(document.getElementById('_intropageDsp_'));
}

function pasteHTMLDemo_(sHTML,edname){
	eval("oEditors_"+edname+".getById[\"nhnEditor_"+edname+"\"].exec(\"PASTE_HTML\", [\""+sHTML+"\"]);");
}



function blacksheepwall_close(){
	$("#blacksheepwall").fadeOut(300);
}



function mvwizPage_qa(pagename,preset){
	preset = preset?preset:'';
	jframe("/?_simpleApps=etc/pageqa&idx=add&pagename="+encodeURIComponent(pagename)+"&preset="+encodeURIComponent(preset),'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}

function mvwizPopupDB(title,type){
	jframe('/?_simpleApps=etc/db-popup&title='+encodeURIComponent(title)+'&type='+encodeURIComponent(type),'blacksheepwall',this);
	$('#blacksheepwall').fadeIn(300);   
}



var mvwizCart_hide_price = false;
function mvwizCart_add(name,price,etc,img,noshow,resv_link){
	jframe("/?_simpleApps=etc/cart&idx=add&name="+encodeURIComponent(name)+"&price="+encodeURIComponent(price)+"&etc="+encodeURIComponent(etc)+"&img="+encodeURIComponent(img)+"&resv_link="+encodeURIComponent(resv_link),'blacksheepwall',this);

	try{
		if(noshow=='y'){
			return false;
		}
		
	}catch(e){
	
	}
	$("#blacksheepwall").fadeIn(300);
}

function login_open(){
	jframe("/?_simpleApps=member/login",'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}






function imgopen(img,size){
	jframe("/?_simpleApps=etc/imginfo&img="+img+"&size="+size,'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}

function logout(){
	jframe("/?_simpleApps=member/logout",'blacksheepwall',this);
}
function join_open(){
	jframe("/?_simpleApps=member/join",'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}
function user_modify(){
	jframe("/?_simpleApps=member/modify",'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}

function termsofuse(){
	jframe("/?_simpleApps=member/terms-of-use",'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}
function privacypolicy(){
	jframe("/?_simpleApps=member/privacy-policy",'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}
function patientsrights(){
	jframe("/?_simpleApps=member/patients-rights",'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}


function popupinfonote(id){
	jframe("/?_simpleApps=member/etc-info&id="+id,'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}

function agree_pop(type){
	jframe("/?_simpleApps=member/"+type,'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}




function search_all(){
	jframe("/?_simpleApps=etc/search",'blacksheepwall',this);
	$("#blacksheepwall").fadeIn(300);
}






uniqid_ = function(prefix, more_entropy) {
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +    revised by: Kankrelune (http://www.webfaktory.info/)
    // %        note 1: Uses an internal counter (in php_js global) to avoid collision
    // *     example 1: uniqid();    // *     returns 1: 'a30285b160c14'
    // *     example 2: uniqid('foo');
    // *     returns 2: 'fooa30285b1cd361'
    // *     example 3: uniqid('bar', true);
    // *     returns 3: 'bara20285b23dfd1.31879087'    if (typeof prefix == 'undefined') {
 
    var retId;    var formatSeed = function (seed, reqWidth) {
        seed = parseInt(seed, 10).toString(16); // to hex str
        if (reqWidth < seed.length) { // so long we split
            return seed.slice(seed.length - reqWidth);
        }        if (reqWidth > seed.length) { // so short we pad
            return Array(1 + (reqWidth - seed.length)).join('0') + seed;
        }
        return seed;
    }; 
    // BEGIN REDUNDANT
    if (!this.php_js) {
        this.php_js = {};
    }    // END REDUNDANT
    if (!this.php_js.uniqidSeed) { // init seed with big random int
        this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
    }
    this.php_js.uniqidSeed++; 
    retId = prefix; // start with prefix, add current milliseconds hex string
    retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
    retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
    if (more_entropy) {        // for more entropy we add a float lower to 10
        retId += (Math.random() * 10).toFixed(8).toString();
    }
 
return retId;}


function menu_fixed(ids,top_height){
var prev_top = 0;
$(window).scroll(function(){
var movePos = prev_top - $(this).scrollTop();
if(movePos>0)movePos = movePos+3;
if(movePos<0)movePos = movePos-3;

for(var i in ids){

try{
	var mposl1 = $("#"+ids[i]).position().top + movePos;
	if($(this).scrollTop()<top_height){
		$("#"+ids[i]).css({ "position" : "fixed","top" : -$(this).scrollTop()+top_height+"px"});
	}else 	if(($("#"+ids[i]).height() - $( window ).height())<0){
		$("#"+ids[i]).css({ "position" : "fixed","top" : "0px"});
	}else if(($("#"+ids[i]).height() - $( window ).height()) < -mposl1){
		$("#"+ids[i]).css({ "position" : "fixed","top" : -($("#"+ids[i]).height() - $( window ).height())+"px"});
	}else if(mposl1>0){
		$("#"+ids[i]).css({ "position" : "fixed","top" : "0px"});
	}else{
		$("#"+ids[i]).css({ "position" : "fixed","top" : mposl1+"px"});
	}
}catch(e){}

}
prev_top = $(this).scrollTop();

});
}



function resizeimgwidth(obj,width){
	if(obj.width>width){obj.width = width;}
}

function window_open(link){
window.open(link,'_blank','fullscreen=no,menubar=no,status=no,toolbar=no,titlebar=no,location=no,scrollbars=yes,width=100, height=100');
}


function zipcode_search(zc){
window_open("/mvwizSWF2.1/etc/postCode.php?input1="+zc);
}



function flash(file,width,height,bgcolor,quality,name){
        document.write('<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0" width="'+width+'" height="'+height+'" id="'+name+'">');  //플래쉬플레이어 버전이 이전버전일경우 버전 8을 변경
        document.write('<param name="movie" value="'+file+'" />');
        document.write('<param name="quality" value="'+quality+'" />');
        document.write('<param name="wmode" value="transparent" />');  //투명플래쉬가 아닐경우 이 라인을 삭제
        document.write('<param name="bgcolor" value="'+bgcolor+'" />');
        document.write('<param name="salign" value="lt" />');
		document.write('<param name="scale" value="noscale" />');
		document.write('<param name="menu" value="false" />');
		document.write('<embed src="'+file+'" quality="'+quality+'" wmode="transparent" bgcolor="'+bgcolor+'" width="'+width+'" height="'+height+'" name="'+name+'" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />');
        document.write('</object>')
}





function ssnConfirm(num){


var ssn1 = num.substring(0, 6);
var ssn2 = num.substring(6, 13);
if((ssn1.length==6) &&(ssn2.length==7)){
var ssn=ssn1+ssn2;
a = new Array(13);
for (var i=0; i < 13; i++) {
a[i] = parseInt(ssn.charAt(i));
}
var k = 11 - (((a[0] * 2) + (a[1] * 3) + (a[2] * 4) + (a[3] * 5) + (a[4] * 6) + (a[5] * 7) + (a[6] * 8) + (a[7] * 9) + (a[8] * 2) + (a[9] * 3) + (a[10] * 4) + (a[11] * 5)) % 11);
if (k > 9){
k -= 10;
}
if (k == a[12]){
return true;
}else{
return false;
}
}
}




function form2post(obj){
if(!obj){return false;}
if(!obj.elements){return false;}
return new FormData(obj);


var result="";

	for(var i=0;i<obj.elements.length;i++){if(obj.elements[i].name){
	if(i>0)result+="&";
		if(obj.elements[i].type=="checkbox"||obj.elements[i].type=="radio"){
			if(obj.elements[i].checked){
				result+=encodeURIComponent(obj.elements[i].name)+"="+encodeURIComponent(obj.elements[i].value);
			}
		}else if(obj.elements[i].type=="file"){
			//fd.append(obj.elements[i].name,obj.elements[i][0]);
			return ("file");
		}else{
			result+=encodeURIComponent(obj.elements[i].name)+"="+encodeURIComponent(obj.elements[i].value);
		}
	}
}
return result;}


















var mvwiz_jframe_hash_back = true;

function jframe(url, target, form, callbackfunction) {
    try { document.getElementById('mvwizajaxloadingstatus').style.display = ''; } catch (e) {}
    mvwiz_jframe_hash_back = false;
    setTimeout(function () { mvwiz_jframe_hash_back = true; }, 1000);

    var url2 = url + '&_ajaxpage=true';
    var _resultTarget = document.getElementById(target);

    var fobj = (typeof (form) == "string") ? document.getElementById(form) : form;
    var sendData = form2post(fobj);

    var xmlhttp = window.ActiveXObject ? new ActiveXObject("Msxml2.XMLHTTP") : new XMLHttpRequest();
    xmlhttp.open('POST', url2, true);
    xmlhttp.setRequestHeader("ENCTYPE", "multipart/form-data");
    xmlhttp.send(sendData);

    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200 && xmlhttp.statusText == 'OK') {
            if (xmlhttp.responseText) {
                var data = xmlhttp.responseText;
                _resultTarget.innerHTML = data;

                data = data.replace(/<xmp\b[^>]*>([\s\S]*?)<\/xmp>/gmi, function (match) { return match.replace(/<xmp\b[^>]*>([\s\S]*?)<\/xmp>/gmi, ""); });
                data = data.replace(/<textarea\b[^>]*>([\s\S]*?)<\/textarea>/gmi, function (match) { return match.replace(/<textarea\b[^>]*>([\s\S]*?)<\/textarea>/gmi, ""); });

                var regex = new RegExp(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi);
                var scripts = data.match(regex);
                if (scripts) {
                    for (var si = 0; si < scripts.length; si++) {
                        scripts[si] = scripts[si].replace(/<script\b[^>]*>|<\/script>/gi, "");
                        eval(scripts[si]);
                    }
                }

                try { document.getElementById('mvwizajaxloadingstatus').style.display = 'none'; } catch (e) {}
                
                // 콜백 함수 실행
                if (typeof callbackfunction === "function") {
                    callbackfunction();
                }
            }
        } else {
            if ((0 <= xmlhttp.readyState) && (xmlhttp.readyState < 4)) { } else {
                _resultTarget.innerHTML = ('404 - Page Not found<br><br><a href=' + url + ' target=_blank>' + url + '</a>');
            }
            try { document.getElementById('mvwizajaxloadingstatus').style.display = 'none'; } catch (e) {}
        }
    }
    return false;
}
/*
function jframe(url,target,form){
	try{document.getElementById('mvwizajaxloadingstatus').style.display='';}catch(e){}
	mvwiz_jframe_hash_back = false;
	setTimeout(function() {mvwiz_jframe_hash_back = true;}, 1000);


	var url2 = url+'&_ajaxpage=true';
	var _resultTarget = document.getElementById(target);
	//_resultTarget.innerHTML = '데이터 로드중...';



	
	var fobj = (typeof(form)=="string")?document.getElementById(form):form;


	var sendData = form2post(fobj);
	if(window.ActiveXObject){var xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");}
	else if(window.XMLHttpRequest){var xmlhttp = new XMLHttpRequest();}
	xmlhttp.open('POST',url2,'true');
	//xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlhttp.setRequestHeader ("ENCTYPE", "multipart/form-data");
	xmlhttp.send(sendData);





	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState==4 && xmlhttp.status == 200 && xmlhttp.statusText=='OK') {

			if(xmlhttp.responseText){
				var data = xmlhttp.responseText;
				_resultTarget.innerHTML = data;

				data = data.replace(/<xmp\b[^>]*>([\s\S]*?)<\/xmp>/gmi,function(match){return match.replace(/<xmp\b[^>]*>([\s\S]*?)<\/xmp>/gmi,"");});
				data = data.replace(/<textarea\b[^>]*>([\s\S]*?)<\/textarea>/gmi,function(match){return match.replace(/<textarea\b[^>]*>([\s\S]*?)<\/textarea>/gmi,"");});

				var regex = new RegExp(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi);
				var scripts = data.match(regex);
				if(scripts){
					for(var si = 0;si<scripts.length;si++){
						scripts[si] = scripts[si].replace(/<script\b[^>]*>|<\/script>/gi,"");
						eval(scripts[si]);
					}
				}
			try{document.getElementById('mvwizajaxloadingstatus').style.display='none';}catch(e){}
			}
		}else{
			if((0<=xmlhttp.readyState)&&(xmlhttp.readyState<4)){}else{_resultTarget.innerHTML = ('404 - Page Not found<br><br><a href='+url+' target=_blank>' + url +'</a>');}
			try{document.getElementById('mvwizajaxloadingstatus').style.display='none';}catch(e){}
		}
	}

return false;
}

*/



















/**************************************************************************************
  htmlDatePicker v0.1
  
  Copyright (c) 2005, Jason Powell
  All Rights Reserved

  Redistribution and use in source and binary forms, with or without modification, are 
    permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of 
      conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list 
      of conditions and the following disclaimer in the documentation and/or other materials 
      provided with the distribution.
    * Neither the name of the product nor the names of its contributors may be used to 
      endorse or promote products derived from this software without specific prior 
      written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS 
  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF 
  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL 
  THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE 
  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
  AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING 
  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
  OF THE POSSIBILITY OF SUCH DAMAGE.
  
  -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  
***************************************************************************************/
// User Changeable Vars
var HighlightToday  = true;    // use true or false to have the current day highlighted
var DisablePast    = true;    // use true or false to allow past dates to be selectable
// The month names in your native language can be substituted below
//var MonthNames = new Array("January","February","March","April","May","June","July","August","September","October","November","December");
var MonthNames = new Array("01","02","03","04","05","06","07","08","09","10","11","12");

// Global Vars
var now = new Date();
var dest = null;
var ny = now.getFullYear(); // Today's Date
var nm = now.getMonth();
var nd = now.getDate();
var sy = 0; // currently Selected date
var sm = 0;
var sd = 0;
var y = now.getFullYear(); // Working Date
var m = now.getMonth();
var d = now.getDate();
var l = 0;
var t = 0;
var MonthLengths = new Array(31,28,31,30,31,30,31,31,30,31,30,31);

/*
  Function: GetDate(control)

  Arguments:
    control = ID of destination control
*/
function GetDate() {
  EnsureCalendarExists();
  DestroyCalendar();
  // One arguments is required, the rest are optional
  // First arguments must be the ID of the destination control
  if(arguments[0] == null || arguments[0] == "") {
    // arguments not defined, so display error and quit
    alert("ERROR: Destination control required in funciton call GetDate()");
    return;
  } else {
    // copy argument
    dest = arguments[0];
  }
  y = now.getFullYear();
  m = now.getMonth();
  d = now.getDate();
  sm = 0;
  sd = 0;
  sy = 0;
  var cdval = dest.value;
  if(/\d{1,2}.\d{1,2}.\d{4}/.test(dest.value)) {
    // element contains a date, so set the shown date
    var vParts = cdval.split("/"); // assume mm/dd/yyyy
    sm = vParts[0] - 1;
    sd = vParts[1];
    sy = vParts[2];
    m=sm;
    d=sd;
    y=sy;
  }
  
//  l = dest.offsetLeft; // + dest.offsetWidth;
//  t = dest.offsetTop - 125;   // Calendar is displayed 125 pixels above the destination element
//  if(t<0) { t=0; }      // or (somewhat) over top of it. ;)

  /* Calendar is displayed 125 pixels above the destination element
  or (somewhat) over top of it. ;)*/
  l = dest.offsetLeft + dest.offsetParent.offsetLeft+10;
  t = dest.offsetTop + 45;


if (window.pageYOffset){  
	scrollTop = window.pageYOffset 
} else if(document.documentElement && document.documentElement.scrollTop){ 
	scrollTop = document.documentElement.scrollTop; 
} else if(document.body){ 
	scrollTop = document.body.scrollTop; 
} 

if(window.pageXOffset){ 
	scrollLeft=window.pageXOffset 
} else if(document.documentElement && document.documentElement.scrollLeft){ 
	scrollLeft=document.documentElement.scrollLeft; 
} else if(document.body){ 
	scrollLeft=document.body.scrollLeft; 
}

var isNav = (navigator.appName == "Netscape") ? true:false;
if(isNav) {evt = e;}else{evt = event;}
l = window.evt.x+scrollLeft;
//t = window.evt.y+scrollTop;
t = window.evt.y;




  if(t < 0) t = 0; // >
  DrawCalendar(dest.offsetLeft);
}

/*
  function DestoryCalendar()
  
  Purpose: Destory any already drawn calendar so a new one can be drawn
*/
function DestroyCalendar() {
  var cal = document.getElementById("dpCalendar");
  if(cal != null) {
    cal.innerHTML = null;
    cal.style.display = "none";
  }
  return
}

function DrawCalendar() {
  DestroyCalendar();
  cal = document.getElementById("dpCalendar");
  cal.style.left = l + "px";
  cal.style.top = t + "px";
  
  var sCal = "<table><tr>"+
    "<td class=\"cellMonth\" colspan=\"7\">"
	+"<a href=\"javascript: PrevYear();\" title=\"Previous Month\"><img src=/mvwizSWF2/img/b_prev.gif border=0></a> <span style=\"position:relative;top:-3px;\">"+y+"</span> <a href=\"javascript: NextYear();\" title=\"Next Month\"><img src=/mvwizSWF2/img/b_next.gif border=0></a> &nbsp; "
   +"<a href=\"javascript: PrevMonth();\" title=\"Previous Month\"><img src=/mvwizSWF2/img/b_prev.gif border=0></a> <span style=\"position:relative;top:-3px;\">"+MonthNames[m]+"</span> <a href=\"javascript: NextMonth();\" title=\"Next Month\"><img src=/mvwizSWF2/img/b_next.gif border=0></a></td>"+
    "</tr>"+
    "<tr><td style=\"color:red;font-weight:bold;\">S</td><td>M</td><td>T</td><td>W</td><td>T</td><td>F</td><td style=\"color:blue;font-weight:bold;\">S</td></tr>";
  var wDay = 1;
  var wDate = new Date(y,m,wDay);
  if(isLeapYear(wDate)) {
    MonthLengths[1] = 29;
  } else {
    MonthLengths[1] = 28;
  }
  var dayclass = "";
  var isToday = false;
  for(var r=1; r<7; r++) {
    sCal = sCal + "<tr>";
    for(var c=0; c<7; c++) {
      var wDate = new Date(y,m,wDay);
      if(wDate.getDay() == c && wDay<=MonthLengths[m]) {
        if(wDate.getDate()==sd && wDate.getMonth()==sm && wDate.getFullYear()==sy) {
          dayclass = "cellSelected";
          isToday = true;  // only matters if the selected day IS today, otherwise ignored.
        } else if(wDate.getDate()==nd && wDate.getMonth()==nm && wDate.getFullYear()==ny && HighlightToday) {
          dayclass = "cellToday";
          isToday = true;
        } else {
          dayclass = "cellDay";
          isToday = false;
        }
        if(((now > wDate) && !DisablePast) || (now <= wDate) || isToday) { // >
          // user wants past dates selectable
          sCal = sCal + "<td class=\""+dayclass+"\"><a href=\"javascript: ReturnDay("+wDay+");\">"+wDay+"</a></td>";
        } else {
          // user wants past dates to be read only
          //sCal = sCal + "<td class=\""+dayclass+"\">"+wDay+"</td>";
		            sCal = sCal + "<td class=\""+dayclass+"\"><a href=\"javascript: ReturnDay("+wDay+");\">"+wDay+"</a></td>";
        }
        wDay++;
      } else {
        sCal = sCal + "<td class=\"unused\"></td>";
      }
    }
    sCal = sCal + "</tr>";
  }
  sCal = sCal + "<tr><td colspan=\"4\" class=\"unused\"></td><td colspan=\"3\" class=\"cellCancel\"><a href=\"javascript: DestroyCalendar();\">Close</a></td></tr></table>"
  cal.innerHTML = sCal; // works in FireFox, opera
  cal.style.display = "inline";
}






function PrevMonth() {
  m--;
  if(m==-1) {
    m = 11;
    y--;
  }
  DrawCalendar();
}

function NextMonth() {
  m++;
  if(m==12) {
    m = 0;
    y++;
  }
  DrawCalendar();
}














function PrevYear() {
    y--;
  DrawCalendar();
}


function NextYear() {
    y++;
  DrawCalendar();
}














function ReturnDay(day) {
  cDest = document.getElementById(dest);
	
	var vm = m+1;
	var vd = day;

	if(vm<10){vm = "0"+vm;}
	if(vd<10){vd = "0"+vd;}


  dest.value = y+"-"+vm+"-"+vd;
  DestroyCalendar();
}

function EnsureCalendarExists() {
  if(document.getElementById("dpCalendar") == null) {
    var eCalendar = document.createElement("div");
    eCalendar.setAttribute("id", "dpCalendar");
    document.body.appendChild(eCalendar);
  }
}

function isLeapYear(dTest) {
  var y = dTest.getYear();
  var bReturn = false;
  
  if(y % 4 == 0) {
    if(y % 100 != 0) {
      bReturn = true;
    } else {
      if (y % 400 == 0) {
        bReturn = true;
      }
    }
  }
  
  return bReturn;
}















function setCookie(cName, cValue, cDay){
        var expire = new Date();
        expire.setDate(expire.getDate() + cDay);
        cookies = cName + '=' + encodeURIComponent(cValue) + '; path=/ '; // 한글 깨짐을 막기위해 escape(cValue)를 합니다.
        if(typeof cDay != 'undefined') cookies += ';expires=' + expire.toGMTString() + ';';
        document.cookie = cookies;
    }


function getCookie(cName) {
        cName = cName + '=';
        var cookieData = document.cookie;
        var start = cookieData.indexOf(cName);
        var cValue = '';
        if(start != -1){
            start += cName.length;
            var end = cookieData.indexOf(';', start);
            if(end == -1)end = cookieData.length;
            cValue = cookieData.substring(start, end);
        }
        return unescape(cValue);
    }













function allies_lst_go(wt){
	if(allies_lst_stop==1){return false;}
	if(allies_lst_pos<-wt){allies_lst_pos = 0;}
	document.getElementById('allies_lst_flow').style.left=allies_lst_pos+"px";
	allies_lst_pos = allies_lst_pos - 1;
}

function allies_lst(wt,w,h,cont){

	var tmp1 = "";
	var cont = ("<td>"+document.getElementById(cont).innerHTML+"</td>");
	cont += cont;
	cont += cont;
	tmp1 += ("<div style=\"width:"+w+"px;height:"+h+"px;overflow:hidden;position:relative;\" onmouseover=\"allies_lst_stop=1;\" onmouseout=\"allies_lst_stop=0;\">");
	tmp1 += ("<table border=0 cellpadding=0 cellspacing=0 id=\"allies_lst_flow\" style=\"position:absolute;left:0px;top:0px;\"><tr>");
	tmp1 += (cont);
	tmp1 += ("</tr></table>");
	tmp1 += ("</div>");
	document.getElementById('allies_cont_dsp').innerHTML = tmp1;
	setInterval(
	function(){
		allies_lst_go(wt);
	},20);
}



var mvwizinitdivwrite = "";
function ajaxstatus(){
	mvwizinitdivwrite = document.createElement('div');
	mvwizinitdivwrite.style.cssText = "position:fixed;left:10px;top:10px;width:100px;background-color:#ff6600;color:#FFFFFF;text-align:center;padding:5px;font-family:tahoama,arial,verdana;font-weight:bold;font-size:8pt;z-index:9999999;display:none;";
	mvwizinitdivwrite.id="mvwizajaxloadingstatus";
	mvwizinitdivwrite.innerHTML = "Loading...";
	document.body.append(mvwizinitdivwrite);
}


window.onload = function () {
	$("img").error(function(){
			$(this).hide();
	});
	ajaxstatus();
}



function checkNumber(event) {
  if(event.key === '.' 
     || event.key === '-'
     || event.key >= 0 && event.key <= 9) {
    return true;
  }
  
  return false;
}