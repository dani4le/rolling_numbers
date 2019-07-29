var user_agent=navigator.userAgent, firefox=false, chrome=false, safari=false, opera=false, ie=false;
if(/Firefox/i.test(user_agent)) firefox=true;
else if(/Chrome/i.test(user_agent)) chrome=true;
else if(/Opera/i.test(user_agent)) opera=true;
else if(/Safari/i.test(user_agent)) safari=true;
else if(/MSIE/i.test(user_agent)) ie=true;

function setRollingNumbers(root, settings){
	"use strict";
	
	var inputs_container, buttons, inp_hidden;
	var fields = {
			//default settings
			value: 0,								//starting value
			step: 1,								//minimum increment
			max: Number.POSITIVE_INFINITY,			//top limit
			min: Number.NEGATIVE_INFINITY,			//down limit
			decimal: 0,								//numbers of digits after the decimal point
			editable: false,						//allow the interaction via keyboard
			disabled: false,						//allow the user interaction
			draggable: true,						//allow the interaction via pointer
			rolling:true,							//allow spatial movement of input fields and background
			toggle_buttons:true,					//display the buttons
			mousewheel_invert: false				//invert the effect of the mouse wheel action
		};
	
	if (settings!=null) $.extend(fields, settings);
	if(root.filter('input').size()==root.size()){
		var obj=new Object();
		//take properties from the first element of the selection
		if(isFinite(root.attr('value'))) obj.value=Number(root.attr('value'));
		if(isFinite(root.attr('min'))) obj.min=Number(root.attr('min'));
		if(isFinite(root.attr('max'))) obj.max=Number(root.attr('max'));
		if(isFinite(root.attr('step'))) obj.step=Number(root.attr('step'));
		obj.disabled=Boolean(root.attr('disabled'));
		$.extend(fields, obj);
		
		root.each(function(){
			//replication of accepted local properties
			var html='';
			if(typeof $(this).attr('name') != 'undefined')
				html+=' name="'+$(this).attr('name')+'"';
			if(typeof $(this).attr('style') != 'undefined')
				html+=' style="'+$(this).attr('style')+'"';
			if(typeof $(this).attr('title') != 'undefined')
				html+=' title="'+$(this).attr('title')+'"';
			$(this).after('<div'+html+'></div>');
		});
		root=root.next();
		root.prev().remove();
	}
	else if(root.filter('input').size()>0){
		console.log(root);
		console.error("The selection must have similar tag elements: container or INPUT");
		return;
	}
	if(ie) fields.editable=false;
	
	var x;
	if(isNaN(fields.value))
		x=0;
	else x = Number(fields.value);
	
	var decim=fields.decimal,string_step=fields.step.toString();
	if(decim<=0){
		var string_x = fields.value.toString();
		if(string_x.indexOf('.')>-1)
			decim=string_x.split('.')[1].length;
		
		if(string_step.indexOf('.')>-1){
			var step_d=string_step.split('.')[1].length;
			if(step_d>decim)
				decim=step_d;
		}
	}
	
	var max = fields.max;
	var min = fields.min;
	if(x>max)
		console.error("value higher than max attribute");
	if(x<min)
		console.error("value lower than min attribute");
	if(max<min)
		console.error("impossible range of values, check the min and max attributes");
	root.attr('value', x.toFixed(decim));
	
	var input_html='<div class="rolling_numbers_input"';
	input_html+='><div title="">'+x.toFixed(decim)+'</div><div>'+((x-Number(string_step)).toFixed(decim))+'</div>';
	input_html+='</div>';
	
	var buttons_html='<div class="rolling_numbers_buttons"';
	buttons_html+=' ><button value="1" type="button" title=""';
	if(x==max)
		buttons_html+=' disabled';
	//first button text is equal to '\u25B2'
	buttons_html+='>▲</button><button value="-1" type="button" title=""';
	if(x==min)
		buttons_html+=' disabled';
	//second button text is equal to '\u25BC'
	buttons_html+='>▼</button></div>';
	
	root.addClass('rolling_numbers shaded glossy');
	if(opera) root.css('display', 'table-cell');
	root.empty();
	buttons=$(buttons_html).appendTo(root).children();
	inputs_container=$(input_html).appendTo(root);
	inp_hidden=$('<input type="hidden" />').appendTo(root);
	if(! fields.toggle_buttons) buttons.parent().hide();
	
	var l_height=root.innerHeight();
	if(x==min){
		inputs_container.html('<div>'+((x+Number(string_step)).toFixed(decim))+'</div><div>'+x+'</div>');
		inputs_container.css('top',(-l_height)+'px');
		inputs_container.prop('defaultValue',-l_height);
		root.css('backgroundPosition','0px '+(-l_height)+'px');
	}
	else root.css('backgroundPosition','0px 0px');
	fields.decimal=decim;
	
	inp_hidden.each(function(){
		var source=$(this);
		source.attr('name', source.parent().attr('name'));
		if(fields.value) source.attr('value', fields.value);
	});
	setEditable(fields.editable);
	if(fields.disabled) setDisabled(fields.disabled);
	
	var mousewheelevt;
	if(firefox) mousewheelevt="DOMMouseScroll";
	else mousewheelevt="mousewheel";
	var js_root=root.get(), js_buttons=buttons.get();
	if(document.attachEvent){
		for(var i=0; i<js_root.length; i++){
			var thi=js_root[i];
			thi.attachEvent("on"+mousewheelevt, function(event)
				{mouseWheel(event, $(event.srcElement).closest('.rolling_numbers'));}
			);
			//touch handler
			thi.attachEvent('touchstart', function(event)
				{event.preventDefault();dragStart(event, this);}
			);
			thi.attachEvent('touchmove', function(event)
				{event.preventDefault();dragMove(event, this);}
			);
			thi.attachEvent('touchend', function(event)
				{event.preventDefault();dragEnd(event, this);}
			);
		}
		for(var i=0; i<js_buttons.length; i++){
			var thi=js_buttons[i];
			thi.addEventListener('touchstart', function(event)
					{buttonDown(event, this);}
				);
			thi.addEventListener('touchenter', function(event)
					{buttonEnter(event, this);}
				);
			thi.addEventListener('touchend', function(event)
					{buttonEnd(event, this);}
				);
			thi.addEventListener('touchleave', function(event)
					{buttonEnd(event, this);}
				);
		}
	}
	else if(document.addEventListener)
		for(var i=0; i<js_root.length; i++){
			js_root[i].addEventListener(mousewheelevt, function(event)
				{mouseWheel(event, $(this));}
			, false);
			//touch handler
			js_root[i].addEventListener('touchstart', function(event)
					{event.preventDefault();dragStart(event, this);}
				, false);
			js_root[i].addEventListener('touchmove', function(event)
					{event.preventDefault();dragMove(event, this);}
				, false);
			js_root[i].addEventListener('touchend', function(event)
					{event.preventDefault();dragEnd(event, this);}
				, false);
		}
		for(var i=0; i<js_buttons.length; i++){
			js_buttons[i].addEventListener('touchstart', function(event)
					{buttonDown(event, this);}
				, false);
			js_buttons[i].addEventListener('touchenter', function(event)
					{buttonEnter(event, this);}
				, false);
			js_buttons[i].addEventListener('touchend', function(event)
					{buttonEnd(event, this);}
				, false);
			js_buttons[i].addEventListener('touchleave', function(event)
					{buttonEnd(event, this);}
				, false);
		}
	
	inputs_container.on("keydown", function(event){
		if(!fields.disabled && fields.editable){
			var source=$(this);
			var keycode=event.which;
			if(keycode<48 || (keycode>57 && keycode<96) || keycode>105){ //not numbers
				if(keycode<37 || keycode>40){ //not arrows 
					if(keycode!=8 && keycode!=46) //not extra keys: backspace, canc
						event.preventDefault();
				}
				else if(keycode==38 || keycode==40){//up and down arrows
					modifyValue(source, 39-keycode, 0);
				}
			}
		}
		else event.preventDefault();
	});
	inputs_container.children().on("keyup", function(event){
		if(!fields.disabled && fields.editable){
			var source=$(this);
			var x=Number(source.text());
			if(isNaN(x)) x=0;
			var currValue=source.closest('.rolling_numbers').val();
			var keycode=event.which;
			if(keycode<37 || keycode>40){//not arrows
				source.text(currValue);
				if(fields.step!=0) modifyValue(source.parent(), Math.round((Number(x)-Number(currValue))/fields.step), 0);
			}
		}
	});
	
	root.on("mousedown", function(event){
		event.preventDefault();
		if(!fields.disabled){
			if(fields.editable && !safari){
				$(this).find('.rolling_numbers_input [title]').focus();
			}
			dragStart(event, this);
		}
	});

	var coord=null, time, speed=0;
	function dragStart(event, sou){
		if(fields.draggable && (event.type=="touchstart" || event.which==1) && !$(event.target).is('button')){
			var source=$(sou).children('.rolling_numbers_input');
			source.stop();
			source.queue(function () {
				normalize($(this));
				$(this).dequeue();
			});
			var d=new Date();
			if(event.type=='mousedown') coord=event.pageY;
			else if(event.type=='touchstart') coord=event.touches[0].pageY;
			time=d.getTime();
			speed=0;
		}
	}
	root.on("mousemove", function(event){
		dragMove(event, this);
	});
	function dragMove(event, sou){
		if($(event.target).is('button')) coord=null;
		else if(coord!=null){
			var source=$(sou), amount;
			var d=new Date();
			if(event.type=='mousemove') amount=event.pageY-coord;
			else if(event.type=='touchmove') amount=event.touches[0].pageY-coord;
			coord=amount+coord;
			
			if(fields.rolling) amount/=source.innerHeight();
			speed=amount/(d.getTime()-time);
			time=d.getTime();
			modifyValue(source.children('.rolling_numbers_input'), amount, 0.01);
		}
	}
	root.on("mouseup mouseleave", function(event){
		dragEnd(event, this);
	});
	function dragEnd(event, sou){
		if(coord!=null && fields.rolling){
			var duration=5000;
			modifyValue($(sou).children('.rolling_numbers_input'), Math.round((speed/3.5)*duration), duration);
		}
		coord=null;
	}
	
	var intervalID, interval_time=50, interval_duration=0;
	buttons.on("mousedown", function(event){
		buttonDown(event, this);
	});
	function buttonDown(event, sou){
		event.stopPropagation();
		if(event.which==1){
			var source=$(sou);
			var i=Number(source.val());
			var inputs_cont=source.closest('.rolling_numbers').children('.rolling_numbers_input');
			modifyValue(inputs_cont, i, 500);
			intervalID = setTimeout(function(){
				intervalID = setInterval(function(){
					modifyValue(inputs_cont, i, interval_duration);
				}, interval_time);
			}, 500);
		}
	}
	buttons.on("mouseenter", function(event){
		buttonEnter(event, this);
	});
	function buttonEnter(event, sou){
		event.stopPropagation();
		if(event.buttons==1){
			var source=$(sou);
			var i=Number(source.val());
			var inputs_cont=source.closest('.rolling_numbers').children('.rolling_numbers_input');
			clearInterval(intervalID);
			intervalID = setInterval(function(){
				modifyValue(inputs_cont, i, interval_duration);
			}, interval_time);
		}
	}
	buttons.on("mouseup mouseleave", function(event){
		buttonEnd(event);
	});
	function buttonEnd(event){
		event.stopPropagation();
		clearInterval(intervalID);
	}
	
	function modifyValue(source, increment, duration){
		var source_root=source.parent();
		var l_height=source_root.innerHeight();
		var step_value=fields.step;
		var max=fields.max, min=fields.min;
		var decim=fields.decimal;
		
		var currValue=Number(source_root.val()), delta;
		if(currValue+increment*step_value>max && increment>=0.2)
			delta=parseInt((max-currValue)/step_value);
		else if(currValue+increment*step_value<min && increment<=-0.2)
			delta=parseInt((min-currValue)/step_value);
		else
			delta=increment;
		
		if(delta!=0){
			var upBtn=source.siblings('.rolling_numbers_buttons').children(':first');
			var downBtn=upBtn.next();
			var turns=0;
			var direction, inc_element;
			if(delta>0){
				direction=1;
				inc_element=source.children(':first');
			}
			else{
				direction=-1;
				inc_element=source.children(':last');
			}
			if(Math.abs(delta)>=1){
				upBtn.prop('disabled', false);
				downBtn.prop('disabled', false);
			}
			if(duration>0 && fields.rolling){
				var position;
				source.stop();
				source.animate({defaultValue:"+="+delta*l_height},{
					duration:duration*delta/increment,
					easing:'easeOutCubic',
					step: function(now, fx){
						var dummy=now.toFixed(decim);
						position=dummy-l_height*turns;
						var bound_check=false;
						
						if(position>0 && direction==1)
							bound_check=true;
						else if(position<=-l_height && direction==-1)
							bound_check=true;
						else if(position<=-l_height/2)
							setActiveInput(source.children(':last'));
						else if(position>-l_height/2)
							setActiveInput(source.children(':first'));
						
						var sum=Number(inc_element.text())+direction*step_value;
						if(bound_check && !(sum>max || sum<min)){
							turns+=direction;
							position-=direction*l_height;
							inc_element.text(function(a,old){
								var sibling=inc_element.siblings();
								sibling.text(old);
								setActiveInput(sibling);
								return sum.toFixed(decim);
							});
						}
						source.css('top',(position)+'px');
						source_root.css('backgroundPosition','0px '+(position)+'px');
					},
					complete: function(){
						normalize(source);
					}
				});
			}
			else{
				//immediate change value, triggered from keyboard interaction and fields.rolling=false
				inc_element.text(function(a,old){
					old=Number(old);
					var sum=old+delta*step_value;
					var sibl=$(this).siblings();
					//control if the increment exceed the limits
					if(sum>max || sum<min){
						//set active input and show it
						var pos=-inc_element.position().top;
						setActiveInput(inc_element);
						source.css('top',(pos)+'px');
						source.prop('defaultValue', pos);
						source_root.css('backgroundPosition','0px '+(pos)+'px');
						//change text to the nearest admitted
						var bound;
						if(delta>0) bound=max-old;
						else bound=min-old;
						bound=old+parseInt(bound/step_value)*step_value;
						sibl.text((bound-direction*step_value).toFixed(decim));
						return bound.toFixed(decim);
					}
					else{
						sibl.text((sum-direction*step_value).toFixed(decim));
						return sum.toFixed(decim);
					}
				});
			}
			source.queue(function(){
				source.prop('defaultValue', function(a, old){
					if(isNaN(old))
						old=0;
					return old-turns*l_height;
				});
				var active_input=source.children('[title]');
				var finalValue=active_input.text();
				source_root.attr('value', finalValue);
				source_root.children(':last').attr('value', finalValue);
				if(! fields.disabled){
					upBtn.prop('disabled', (finalValue>=max));
					downBtn.prop('disabled', (finalValue<=min));
				}
				source.dequeue();
			});
		}
		else clearInterval(intervalID);
	}
	function normalize(source){
		source.animate({defaultValue:-source.children('[title]').position().top},{
			duration:500,
			easing:'easeInCubic',
			step: function(now, fx){
				source.css('top',(now)+'px');
				source.parent().css('backgroundPosition','0px '+(now)+'px');
			},
			complete: function(){
				coord=null;
			}
		});
	}
	function mouseWheel(event, source){
		if(! fields.disabled){
			var inp_cont=source.children('.rolling_numbers_input');
			
			var inv;
			if(fields.mousewheel_invert) inv=-1;
			else inv=1;
			
			var incr=-inv;
			if(event.detail)
				incr*=event.detail/3;
			else if(event.wheelDelta)
				incr*=-event.wheelDelta/120;
			
			modifyValue(inp_cont, incr, 500);
			event.preventDefault();
		}
	}
	
	function setActiveInput(element){
		var attr='title';
		element.siblings().removeAttr(attr);
		element.attr(attr, '');
		return element;
	}
	function setEditable(bool){
		if(!ie && !safari && !('ontouchstart' in document.documentElement)){
			bool=Boolean(bool);
			fields.editable=bool;
			inputs_container.children().prop('contenteditable', bool);
			if(bool) root.css('cursor', 'text');
			else root.css('cursor', 'default');
		}
	}
	function setDisabled(bool){
		bool=Boolean(bool);
		root.add(buttons).attr('disabled', bool);
		fields.disabled=bool;
		fields.draggable=!bool;
	}
	
	//public interface
	return {
		disable: function(disab){
			if(disab==null) return Boolean(fields.disabled);
			else setDisabled(disab);
		},
		draggable: function(drag){
			if(drag==null) return Boolean(fields.draggable);
			else fields.draggable=drag;
		},
		editable: function(edit){
			if(edit==null) return Boolean(fields.editable);
			else setEditable(edit);
		},
		limits: function(lim_obj){
			if(lim_obj==null) return {min:fields.min, max:fields.max};
			else{
				var max, min, error=false;
				if(lim_obj.max!=null) max = lim_obj.max;
				else max=fields.max;
				if(lim_obj.min!=null) min = lim_obj.min;
				else min=fields.min;
				//several validation controls using new limits
				if(max<min){
					console.error("impossible range of limits, max is lower than min");
					error=true;
				}
				root.each(function(){
					var x = $(this).val();
					if(lim_obj.max!=null && x>max){
						console.log($(this));
						console.error("has value higher than max limit");
						error=true;
					}
					if(lim_obj.min!=null && x<min){
						console.log($(this));
						console.error("has value lower than min limit");
						error=true;
					}
				});
				if(!error){
					$.extend(fields, lim_obj);
					if(! fields.disabled){
						//refresh buttons state according to new limits
						root.each(function(){
							var source = $(this);
							source.find('button:first').prop('disabled', (source.val()>=max));
							source.find('button:last').prop('disabled', (source.val()<=min));
						});
					}
				}
				return !error;
			}
		},
		rolling: function(roll){
			if(roll==null) return Boolean(fields.rolling);
			else fields.rolling=roll;
		},
		toggleButtons: function(toggle_b){
			var b_container=buttons.parent();
			
			if(toggle_b==null) b_container.toggle();
			else b_container.toggle(Boolean(toggle_b));
			fields.toggle_buttons=toggle_b;
		},
		value: function(increment, duration){
			if(increment==null || duration==null){
				var elements=new Array();
				root.each(function(){
					elements.push($(this).val());
				});
				return elements;
			}
			else{
				inputs_container.stop();
				inputs_container.each(function(){
					modifyValue($(this), increment, duration);
				});
			}
		},
		getRoot: function(){
			return root;
		},
		getActiveInput: function(){
			return inputs_container.find('[title]');
		},
		setHeight: function(height){
			root.css('height', height);
			root.css('font-size', Math.round(height*0.9355));
		},
		setLook: function(look){
			switch(look){
				case 'plain':
					root.removeClass('shaded glossy');
					break;
				case 'shaded':
					root.removeClass('glossy');
					root.addClass(look);
					break;
				case 'glossy':
					root.removeClass('shaded');
					root.addClass(look);
					break;
				default:
					root.addClass('shaded glossy');
					break;
			}
		},
		setWidth: function(width){
			//if width is not enough, the element will change height ratio
			root.css('width', width);
		},
		turnToHtml5: function(settings){
			inputs_container.stop();
			var options;
			if (settings!=null) options=settings;
			else options=fields;
			var html5="<input type='number'";
			html5+=" min='"+options.min+"'";
			html5+=" max='"+options.max+"'";
			html5+=" step='"+options.step+"'";
			if(fields.disabled) html5+=" disabled";
			html5+="></input>";
			root.html(html5);
			root.each(function(){
				var source=$(this), child=source.children();
				child.attr('style', source.attr('style'));
				child.val(source.val());
				child.unwrap();
			});
		}
	};
}