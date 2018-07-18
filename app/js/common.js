$(function() {
	$(document).ready(function() {
		reinitSlider();
		$(".features__list").owlCarousel({
			items: 1,
			nav: true,
			navText: ["<svg viewBox='0 0 21 38' class='icon-prev'><use xlink:href='#icon-prev'></use></svg>","<svg viewBox='0 0 21 38' class='icon-next'><use xlink:href='#icon-next'></use></svg>"]
		});
		$(window).resize(function() {
			reinitSlider();
		});
		function reinitSlider() {
			var widthWindow = $(window).width(),
				widthTablet = 1280,
				slider = $(".slider__list");
			if (widthWindow >= widthTablet) {
				slider.trigger('destroy.owl.carousel');
				slider.removeClass('owl-carousel');
			} else if (widthWindow < widthTablet) {
				slider.addClass('owl-carousel');
				slider.owlCarousel({
					items: 1
				});
			}
		}
	});
});
