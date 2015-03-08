class FaceApp
	constructor: (@canvas, @picture) ->
		@picture.load =>
			pic = @picture[0]
			@canvas[0].width = pic.naturalWidth
			@canvas[0].height = pic.naturalHeight
			@canvas.width pic.naturalWidth
			@canvas.height pic.naturalHeight
			@drawImage()
		@ctx = @canvas[0].getContext('2d')
		@faces = []
		@printView = false

		@init()

	sortFaces: =>
		score = (face) ->
			face.y * 100 + face.x
		@faces.sort((a, b) ->
			score(a) - score(b)
		)
	
	drawImage: =>
		# get the actual dom element from jquery object
		pic = @picture[0]
		@ctx.drawImage pic, 0, 0

	drawEdges: (edges, style) =>
		if (@faces.length == 0)
			return
		@ctx.lineWidth = 2
		@ctx.strokeStyle = style ? "#0f0"

		@ctx. beginPath()
		edges.forEach((edge) =>
			@ctx.moveTo(edge.va.x, edge.va.y)
			@ctx.lineTo(edge.vb.x, edge.vb.y)
		)

		@ctx.stroke()

	draw: (print) =>
		@ctx.clearRect 0, 0, @canvas.width(), @canvas.height()
		@drawImage()

		if (print)
			@drawMask()

		bbox = {
			xl: 0,
			xr: @canvas.width(),
			yt: 0,
			yb: @canvas.height()
		}

		voronoi = new Voronoi()
		sites = ({x: f.x, y: f.y} for f in @faces)
		result = voronoi.compute(sites, bbox)

		@drawEdges(result.edges, if print then "#000" else "#fff")

		if (!print)
			@drawMarkers()
		if (print)
			@drawNumbers()

	drawNumbers: =>
		ctx = @ctx
		ctx.fillStyle = "#000"
		ctx.font = "20px Sans"
		ctx.textAlign = "center"
		ctx.textBaseline = "middle"

		rect = @canvas[0].getBoundingClientRect()

		@faces.forEach (face, idx) ->
			ctx.fillText idx, face.x, face.y

	drawMask: =>
		@ctx.fillStyle = "rgba(255,255,255,0.75)"
		@ctx.fillRect(0,0,@canvas.width(),@canvas.height())

	drawMarkers: =>
		if @faces.length == 0
			return
		ctx = @ctx
		ctx.strokeStyle = "#000"
		ctx.lineWidth = 2
		ctx.fillStyle = "rgba(150,150,255,0.35)"

		@faces.forEach((face) ->
			w = 4

			ctx.beginPath()
			ctx.arc face.x, face.y, 2*w, 0, Math.PI*2, true
			ctx.fill()
			ctx.stroke()
		)

	removeClosest: (faces, pos) =>
		dist = (a, b) ->
			Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))

		minIndex = -1
		minDist = 5 * (@canvas.width() + @canvas.height())
		@faces.forEach((face, idx) ->
			d = dist(face, pos)
			if d < minDist
				minDist = d
				minIndex = idx
		)

		if minIndex == -1
			return

		@faces.splice(minIndex, 1)

	detectFaces: (e) =>
		e.target.disabled = true

		@picture.faceDetection({
			async: true
			grayscale: false
			minNeighbors: 1
			interval: 8
			complete: (f) =>
				f.forEach (fc) =>
					@faces.push {
						x: (fc.x + fc.width / 2) >> 0
						y: (fc.y + fc.height / 2) >> 0
					}
				e.target.disabled = false
				@draw()
			error: (code, msg) ->
				console.log 'Oh no! Error ' + code + ' occurred. The message was "' + msg + '".'
		})

	# no fat arrow, will only be called once, and not as a callback
	init: ->
		button = $('#detectfaces')
		button.prop 'disabled', false
		button.click @detectFaces
		printButton = $('#printview')
		printButton.prop 'disabled', false

		toggle = =>
			@printView = !@printView

			@sortFaces()
			@draw @printView
			printButton.attr('value', (if @printView then "edit" else "print") + " view")

		printButton.click toggle

		onClick = (e) =>
			rect = @canvas[0].getBoundingClientRect()
			cx = (e.clientX - rect.left) >> 0
			cy = (e.clientY - rect.top) >> 0

			if e.ctrlKey || e.metaKey
				@removeClosest @faces, {x: cx, y: cy}
			else
				@faces.push({x: cx, y: cy, width: 0, height: 0})

			@draw @printView

		@canvas.click onClick

$(document).ready ->
	new FaceApp($('#canvas'), $('#picture'))
