$(document).ready ->
	names = $('#names li')
	areas = $('#facemap area')

	names.each (index, name) ->
		$(name).hover (->
				$(this).addClass('highlight')

				pointer = $('#pointer')
				radius = pointer.width() // 2
				offset = $('#faces').offset()
				area = $('#facemap area[data-id="' + index + '"]')
				x = parseInt area.attr 'data-x'
				y = parseInt area.attr 'data-y'
				pointer.css({
					visibility: "visible"
					left: offset.left + x - radius
					top: offset.top + y - radius
				})
			),
			(->
				$('#pointer').css {visibility: "hidden"}
				$(this).removeClass('highlight'))

	areas.each (index, area) ->
		$(area).attr 'title', $(names[index]).text()
		$(area).hover (->
				curName = $(names[index])
				curName.addClass('highlight')
				container = $('#names')
				container.animate {
					scrollTop: curName.offset().top - container.offset().top + container.scrollTop()
				}, 32
				),
			( ->
				$(names[index]).removeClass('highlight')
			)
