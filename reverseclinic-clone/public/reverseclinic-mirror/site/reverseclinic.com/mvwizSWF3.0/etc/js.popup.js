

function mvwiz_close_popup_write(id,color){

var theDate = new Date();
var oneDayLater = new Date( theDate.getTime() + 12*3600000 );
var expiryDate = oneDayLater.toGMTString();
var _echo = ("<table width=\"100%\" style=\"cursor:pointer;color:"+color+";font-size:9pt;font-family:verdana;\"><tr><td align=left><span style=\"color:"+color+";\"");
_echo += ("onclick=\"document.getElementById('"+id+"').style.display='none';document.getElementById('"+id+"').innerHTML='';set_cookie('mvwiz_close_popup_"+id+"', 1, 1 );\">오늘하루 그만보기</span></td><td align=right>");
_echo += ("<span onclick=\"document.getElementById('"+id+"').style.display='none';document.getElementById('"+id+"').innerHTML='';\" style=\"color:"+color+";\">닫기</span></td></tr></table>");
document.write(_echo);



}



function mvwiz_close_popup_exec(id){


	if(document.cookie.indexOf("mvwiz_close_popup_"+id+"=1")!=-1){
		document.getElementById(id).style.display='none';
			//jwplayer('mediaplayer').onPause();

	}
}




function popup_close(id)
{
    var div = document.getElementById(id);
    div.style.display = 'none';
}


function set_cookie( name, value, expiredays)
{

    var todayDate = new Date();
	todayDate.setDate( todayDate.getDate() + expiredays );
	document.cookie = name + "=" + escape( value ) + "; path=/; expires=" + todayDate.toGMTString() + ";"
}




