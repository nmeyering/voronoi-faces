$(document).ready ->
	names = $('#names li')
	areas = $('#facemap area')

	names.each (index, name) ->
		$(name).hover (->
				$(this).addClass('highlight')

				pointer = $('#pointer')
				radius = pointer.width() // 2
				offset = $('#faces').offset()
				area = $('#facemap area[data-id="' + (index + 1) + '"]')
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

	areas.each (area) ->
		id = parseInt $(this).attr 'data-id'
		index = id - 1
		$(this).attr 'title', $(names[index]).text()
		$(this).hover (->
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
