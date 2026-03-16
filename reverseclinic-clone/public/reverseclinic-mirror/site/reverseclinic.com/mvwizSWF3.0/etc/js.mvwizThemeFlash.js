/*******************************************************

Copyright 2014@mvwizSystems


*******************************************************/
function mvwizThemeFlash(){


this.movie = null;
this.runflag = "";



this.init = function(thisf){
	this.thisf = thisf;
	this.runflag = 1;

	var drawhtml = "";
	var thumb_html = "";




	for(var i =0;i<this.config.lst.length;i++){

if(!this.config.lst[i]){continue;}


if(this.config.tnposd==1){
			thumb_html += "<img onclick=\""+thisf+".move("+i+")\" id=\""+this.config.dspid+"_thumb_"+i+"\"  src=\""+this.config.lst[i].thumb.img+"\" style=\"cursor:pointer;position:relative;z-index:3;\">\n";
}else{
			thumb_html += "<div style=\"margin-bottom:5px;\"><img onclick=\""+thisf+".move("+i+")\" id=\""+this.config.dspid+"_thumb_"+i+"\"  src=\""+this.config.lst[i].thumb.img+"\" style=\"cursor:pointer;position:relative;z-index:3;\"></div>";
}

			for(var ii in this.config.lst[i].obj){
				if(this.config.lst[i].obj[ii].link){
					drawhtml += "<img id=\""+this.config.dspid+"_"+i+"_"+ii+"\" src=\""+this.config.lst[i].obj[ii].img+"\" style=\"position:absolute;left:"+this.config.lst[i].obj[ii].start_left+"px;top:"+this.config.lst[i].obj[ii].start_top+"px;z-index:1;cursor:pointer;width:"+this.config.lst[i].obj[ii].width+";height:"+this.config.lst[i].obj[ii].height+";\" onclick=\"location.href='"+this.config.lst[i].obj[ii].link+"';\">\n";
				}else{
					drawhtml += "<img id=\""+this.config.dspid+"_"+i+"_"+ii+"\" src=\""+this.config.lst[i].obj[ii].img+"\" style=\"position:absolute;left:"+this.config.lst[i].obj[ii].start_left+"px;top:"+this.config.lst[i].obj[ii].start_top+"px;z-index:1;width:"+this.config.lst[i].obj[ii].width+";height:"+this.config.lst[i].obj[ii].height+";\">\n";
				}
			}
	}
	drawhtml +=("<input type=\"hidden\" id=\"mainLoadmove_rf\" value=\"1\">");
	drawhtml +=("<img src=\""+this.config.leftbtn.img+"\" style=\"top:"+this.config.leftbtn.top+"px;left:"+this.config.leftbtn.left+"px;z-index:3;position:absolute;cursor:pointer;width:"+this.config.leftbtn.width+";height:"+this.config.leftbtn.height+";\" onclick=\""+this.thisf+".prev();\">");
	drawhtml +=("<img src=\""+this.config.rightbtn.img+"\" style=\"top:"+this.config.rightbtn.top+"px;left:"+this.config.rightbtn.left+"px;z-index:3;position:absolute;cursor:pointer;width:"+this.config.rightbtn.width+";height:"+this.config.rightbtn.height+";\" onclick=\""+this.thisf+".next();\">");
	drawhtml += "<div style=\"position:absolute;left:"+this.config.tnposx+"px;top:"+this.config.tnposy+"px;\">"+thumb_html+"</div>";
	document.getElementById(this.config.dspid).innerHTML=drawhtml;
}


this.move = function(no){
this.hide();

if(this.config.lst[no]){
var obj = this.config.lst[no].obj;
	for(var i in obj){
		$("#"+this.config.dspid+"_"+no+"_"+i).animate({left:obj[i].left,top:obj[i].top},600);
	}
}

for(var iii=0;iii<this.config.lst.length;iii++){
	try{
	document.getElementById(this.config.dspid+"_thumb_"+iii).style.border=this.config.tnoutc;
	}catch(e){}
}

	try{
document.getElementById(this.config.dspid+"_thumb_"+no).style.border=this.config.tnoverc;
	}catch(e){}

this.movie = no;
}




this.hide = function(){
	if(this.movie==null){return false;}

if(!this.config.lst[this.movie]){return false;}
var obj = this.config.lst[this.movie].obj;
	for(var i in obj){
		$("#"+this.config.dspid+"_"+this.movie+"_"+i).animate({left:obj[i].start_left,top:obj[i].start_top},obj[i].speed);
	}
}



this.next = function(){
	total = this.config.lst.length;
	loadmovie = this.movie+1;
	if(loadmovie<0){loadmovie = total-1;}
	if(loadmovie>=total){loadmovie = 0;}
	this.move(loadmovie);
}

this.prev = function(){
	total = this.config.lst.length;
	loadmovie = this.movie-1;
	if(loadmovie<0){loadmovie = total-1;}
	if(loadmovie>=total){loadmovie = 0;}
	this.move(loadmovie);
}




this._start = function(){
	if(document.getElementById('mainLoadmove_rf').value==0){return false;}
	this.next();
}



this.start = function(){


try{
	document.getElementById(this.config.dspid).addEventListener("mouseover",function(){
		document.getElementById('mainLoadmove_rf').value=0;
	});

	document.getElementById(this.config.dspid).addEventListener("mouseout",function(){
		document.getElementById('mainLoadmove_rf').value=1;
	});
}catch(e){
	document.getElementById(this.config.dspid).attachEvent("onmouseover",function(){
		document.getElementById('mainLoadmove_rf').value=0;
	});

	document.getElementById(this.config.dspid).attachEvent("onmouseout",function(){
		document.getElementById('mainLoadmove_rf').value=1;
	});
}




	this.move(0);
	setInterval(this.thisf+"._start();",this.config.movietime);
}
}