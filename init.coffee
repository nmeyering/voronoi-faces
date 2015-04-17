class FaceApp
	constructor: (@canvas, @picture) ->
		# FIXME this can sometimes fail
		@picture.load =>
			pic = @picture[0]
			pic.crossOrigin = "Anonymous"
			@canvas[0].width = pic.naturalWidth
			@canvas[0].height = pic.naturalHeight
			@canvas.width pic.naturalWidth
			@canvas.height pic.naturalHeight
			@drawImage()
		@ctx = @canvas[0].getContext('2d')
		@cells = []
		@names = []
		@printView = false
		@editingBoundary = false
		@boundary = []

		@update()

		@init()

	update: =>
		@doVoronoi()
		@sortFaces()
		@draw @printView

	resetData: () =>
		@cells = []
		@update()

	sortFaces: =>
		score = (c) ->
			c.y * 100 + c.x
		@cells.sort((a, b) ->
			score(a) - score(b)
		)
		@cells.forEach (cell, index) ->
			cell.id = index + 1

	clipCells: =>
		for cell in @cells
			other = (p for p in cell.points by 2)
			res = (p for p in clip @boundary, other.reverse())
			if res.length == 0
				res = other
			cell.points = res
	
	drawImage: =>
		# get the actual dom element from jquery object
		pic = @picture[0]
		@ctx.drawImage pic, 0, 0

	draw: (print) =>
		@ctx.clearRect 0, 0, @canvas.width(), @canvas.height()
		@drawImage()

		if print
			@drawMask()

		@drawCells(if print then '#000' else '#fff')

		if not print
			@drawMarkers()
		if print
			@drawNumbers()
		if @editingBoundary
			@drawPolygon @boundary, '#0f0'

	drawCells: (style) =>
		((@drawPolygon cell.points, style) for cell in @cells)

	drawPolygon: (polygon, style) =>
		@ctx.strokeStyle = style
		return if polygon.length == 0
		@ctx.beginPath()
		@ctx.moveTo polygon[0][0], polygon[0][1]
		(@ctx.lineTo p[0], p[1] for p in polygon)
		@ctx.closePath()
		@ctx.stroke()

	drawNumbers: =>
		ctx = @ctx
		ctx.fillStyle = "#000"
		ctx.font = "20px Sans"
		ctx.textAlign = "center"
		ctx.textBaseline = "middle"

		rect = @canvas[0].getBoundingClientRect()

		(ctx.fillText cell.id, cell.x, cell.y for cell in @cells)

	drawMask: =>
		@ctx.fillStyle = "rgba(255,255,255,0.5)"
		@ctx.fillRect(0,0,@canvas.width(),@canvas.height())

	drawMarkers: =>
		if @cells.length == 0
			return
		ctx = @ctx
		ctx.strokeStyle = "#000"
		ctx.lineWidth = 2
		ctx.fillStyle = "rgba(150,150,255,0.35)"

		@cells.forEach((cell) ->
			w = 4

			ctx.beginPath()
			ctx.arc cell.x, cell.y, 2*w, 0, Math.PI*2, true
			ctx.fill()
			ctx.stroke()
		)
		ctx.lineWidth = 1
	
	doVoronoi: =>
		bbox = {
			xl: 0,
			xr: @canvas.width(),
			yt: 0,
			yb: @canvas.height()
		}

		voronoi = new Voronoi()
		sites = ({x: c.x, y: c.y} for c in @cells)
		diagram = voronoi.compute(sites, bbox)
		@cells = (
			{
				id: cell.site.voronoiId
				x: cell.site.x
				y: cell.site.y
				# flatten, but only one level deep
				points: _.flatten (
					[
						[he.getStartpoint().x, he.getStartpoint().y],
						[he.getEndpoint().x, he.getEndpoint().y]
					] for he in cell.halfedges
				), true
			} for cell in diagram.cells)
		if @boundary.length > 0
			@clipCells()

	removeClosest: (cells, pos) =>
		dist = (a, b) ->
			Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))

		minIndex = -1
		minDist = 5 * (@canvas.width() + @canvas.height())
		@cells.forEach((cell, idx) ->
			d = dist(cell, pos)
			if d < minDist
				minDist = d
				minIndex = idx
		)

		if minIndex == -1
			return

		@cells.splice(minIndex, 1)

	detectFaces: (e) =>
		$('#detectfaces').prop 'disabled', true
		@resetData()

		@picture.faceDetection {
			async: true
			grayscale: false
			complete: (f) =>
				@cells = ({
						# floor these numbers?
						x: (face.x + face.width / 2)
						y: (face.y + face.height / 2)
					} for face in f)
				$('#detectfaces').prop 'disabled', false
				@update()
			error: (code, msg) ->
				console.log 'Oh no! Error ' + code + ' occurred. The message was "' + msg + '".'
		}

	addOrRemoveSite: (e) =>
		# Never add border or padding to the canvas or this won't be correct anymore!
		rect = @canvas[0].getBoundingClientRect()
		cx = (e.clientX - rect.left) << 0
		cy = (e.clientY - rect.top) << 0

		if e.ctrlKey || e.metaKey
			@removeClosest @cells, {x: cx, y: cy}
		else
			@cells.push {x: cx, y: cy}

	editBoundary: (e) =>
		rect = @canvas[0].getBoundingClientRect()
		cx = (e.clientX - rect.left) << 0
		cy = (e.clientY - rect.top) << 0

		if e.ctrlKey || e.metaKey
			# delete last
			@boundary = @boundary[..-2]
		else
			@boundary.push [cx,cy]

	editAction: (e) =>
		if @editingBoundary then @editBoundary(e) else @addOrRemoveSite(e)
		@update()

	# no fat arrow, will not be called as a callback
	init: ->
		button = $('#detectfaces')
		button.prop 'disabled', false
		button.click @detectFaces
		printButton = $('#printview')
		printButton.prop 'disabled', false

		printButton.click =>
			@printView = not @printView
			@update()
			printButton.attr 'value', (if @printView then "edit" else "print") + " view"

		@canvas.click @editAction

		$('#boundaryResetButton').click =>
			@boundary = []
			@update()

		$('#boundaryButton').click =>
			@editingBoundary = not @editingBoundary
			$('#boundaryButton').val "editing " + (if @editingBoundary then "boundary" else "faces")
			$('#boundaryHelp').text if @editingBoundary then 'You can edit the boundary the same way as you would the faces. Click to add a new vertex, Ctrl + Click (Cmd + Click) to remove the last one. Press button again to go back to editing faces.' else ''
			if not @editingBoundary
				@clipCells()

		# don't look at this
		$('#savehtml').click =>
			console.dir @cells
			polys = ({
				points: (_.flatten cell.points)
				id: cell.id
				x: cell.x
				y: cell.y
			} for cell in @cells)
			$.get 'template.html', (template) =>
				areas = (
					'<area type="poly" href="javascript:;" coords="' +
					((x << 0 for x in pt) for pt in p.points) + '"' +
					' data-id="' + p.id + '"' +
					' data-x="' + p.x + '"' +
					' data-y="' + p.y + '"' +
					'/>' for p in polys)
				namelis = (
					"<li><span class=\"last\">#{n.last}</span>, " +
					"<span class=\"first\">#{n.first}</span></li>" for n in @names)
				image_src = ($('#loadimage').val().split /[\\/]+/)[-1..][0]
				template = template.replace '<%image%>', image_src
				template = template.replace '<%names%>', namelis.join '\n'
				template = template.replace '<%areas%>', areas.join '\n'
				output = new Blob [template], {type: "text/html;charset=utf-8"}
				saveAs output, "output.html"

		$('#savefile').click =>
			data = {
				faces: ({x: c.x, y: c.y} for c in @cells)
				boundary: @boundary
			}
			foo = new Blob [JSON.stringify(data, null, 2)], {type: "application/json;charset=utf-8"}
			saveAs foo, "faces.json"

		$('#loadfile').change (e) =>
			file = e.target.files[0]
			unless file?
				return
			reader = new FileReader()
			reader.onload = (e) =>
				contents = e.target.result
				try
					contents = JSON.parse contents
					@cells = contents.faces
					@boundary = contents.boundary
					@update()
				catch error
					# TODO display an error
			reader.readAsText file

		$('#loadnames').change (e) =>
			file = e.target.files[0]
			unless file?
				return
			reader = new FileReader()
			reader.onload = (e) =>
				contents = e.target.result
				valid = false
				try
					contents = JSON.parse contents
					valid = _.all ('first' of n and 'last' of n and 'id' of n for n in contents)
				catch error
					# do nothing
				if valid
					@names = contents
				help = $('#namesHelp')
				help.removeClass()
				help.addClass 'help'
				help.addClass if valid then 'info' else 'error'
				help.text (if valid then "Success! #{@names.length} names loaded." else "Name list did not validate! Make sure your inputs conform to the format described above.")
			reader.readAsText file

		$('#loadimage').change (e) ->
			file = $('#loadimage')[0].files[0]
			imageType = /image.*/

			if (file.type.match imageType)
				reader = new FileReader()

				reader.onload = (e) =>
					img = $('#picture')
					img.attr('src', reader.result)

				reader.readAsDataURL file
			else
				# error

$(document).ready ->
	new FaceApp($('#canvas'), $('#picture'))
