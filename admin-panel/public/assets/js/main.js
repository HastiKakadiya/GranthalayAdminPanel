(function ($) {
    "use strict";
	//===== jquery code for sidebar menu
	// console.log("url is",window.location.pathname);
	$(function() {
		for (var e = window.location, o = $(".menu-aside .menu-item a").filter(function() {
			// if($(".menu-item").hasClass("has-submenu")){
				// console.log("hello",$(".menu-item").hasClass("has-submenu"));
				return this.href == e
			// }
			}).addClass("select").parent().addClass("active").parent().addClass("active"); o.is("li");) o = o.addClass("2-2").parent().addClass("3-3")
	})
	$('.menu-item.has-submenu .menu-link').on('click', function(e){
		e.preventDefault();
		if($(this).next('.submenu').is(':hidden')){
			$(this).parent('.has-submenu').siblings().find('.submenu').slideUp(200);
		} 
		$(this).next('.submenu').slideToggle(200);
	});
	// $('.menu-item .menu-link').on('click', function(e){
	// 	console.log("active")
	// 	$('.menu-item.active').removeClass("active");
	// 	$(this).parent().addClass('active');
	// });
$(".menu-item").click(function(){
	// alert("cliks")
	// console.log("active",$("li").html())
})
	// mobile offnavas triggerer for generic use
	$("[data-trigger]").on("click", function(e){
		e.preventDefault();
		e.stopPropagation();
		var offcanvas_id =  $(this).attr('data-trigger');
		$(offcanvas_id).toggleClass("show");
		$('body').toggleClass("offcanvas-active");
		$(".screen-overlay").toggleClass("show");

	}); 

	$(".screen-overlay, .btn-close").click(function(e){
		$(".screen-overlay").removeClass("show");
		$(".mobile-offcanvas, .show").removeClass("show");
		$("body").removeClass("offcanvas-active");
	}); 

	// minimize sideber on desktop

	$('.btn-aside-minimize').on('click', function(){
		if( window.innerWidth < 768) {
			$('body').removeClass('aside-mini');
			$(".screen-overlay").removeClass("show");
			$(".navbar-aside").removeClass("show");
			$("body").removeClass("offcanvas-active");
		} 
		else {
			// minimize sideber on desktop
			$('body').toggleClass('aside-mini');
		}
	});

	//Nice select
	if ($('.select-nice').length) {
    	$('.select-nice').select2();
	}
	// Perfect Scrollbar
	if ($('#offcanvas_aside').length) {
		const demo = document.querySelector('#offcanvas_aside');
		const ps = new PerfectScrollbar(demo);
	}

	// Dark mode toogle
	$('.darkmode').on('click', function () {
		$('body').toggleClass("dark");
	});
	
})(jQuery);