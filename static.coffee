$(window).load ->
	names = $('#names li')
	areas = $('#facemap area')
	$('#footer').click ->
		$(@).hide()
	pointer_radius = 60
	$('#pointer').css {
		width: pointer_radius + "px"
		height: pointer_radius + "px"
		"border-radius": pointer_radius + "px"
	}

	names.each (index, name) ->
		last = $('span.last', name).text()
		first = $('span.first', name).text()
		if not last and not first
			$(name).html('(Unbekannt)')

		$(name).hover (->
			$(@).addClass('highlight')
			id = parseInt $(@).attr 'data-id'

			image_offset = $('#faces').offset()
			f = $('#faces')
			area = $('#facemap area[data-id="' + id + '"]')

			oleft = image_offset.left - f.scrollLeft()
			otop = image_offset.top - f.scrollTop()

			x = (parseInt area.attr 'data-x') - pointer_radius//2 + oleft
			y = (parseInt area.attr 'data-y') - pointer_radius//2 + otop
			$('#pointer').css({
				visibility: "visible"
				left: x
				top: y
			})
		),
		(->
			$('#pointer').css {visibility: "hidden"}
			$(@).removeClass('highlight'))

	areas.each (index, area) ->
		id = parseInt $(@).attr 'data-id'
		name = $("#names li[data-id=\"#{id}\"]")
		$(@).attr 'title', name.text()
		$(@).attr 'alt', name.text()
		$(@).hover (->
				name.addClass('highlight')
				container = $('#names')
				container.animate {
					scrollTop: name.offset().top - container.offset().top + container.scrollTop()
				}, 32
				),
			( ->
				name.removeClass('highlight')
			)
