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
		@faces = []
		@cells = []
		@diagram = null
		@printView = false

		@update()

		@init()

	update: =>
		@doVoronoi()
		@sortFaces()
		@draw @printView

	resetData: () =>
		@faces = []
		@update()

	sortFaces: =>
		score = (face) ->
			face.y * 100 + face.x
		@faces.sort((a, b) ->
			score(a) - score(b)
		)
		@faces.forEach (face, index) ->
			face.voronoiId = index + 1
		#(face.voronoiId = index + 1 for face, index in @faces)# 1-based indices
	
	drawImage: =>
		# get the actual dom element from jquery object
		pic = @picture[0]
		@ctx.drawImage pic, 0, 0

	drawEdges: (style) =>
		if (@faces.length == 0)
			return
		@ctx.lineWidth = 2
		@ctx.strokeStyle = style ? "#0f0"

		@ctx. beginPath()
		@diagram.edges.forEach((edge) =>
			@ctx.moveTo(edge.va.x, edge.va.y)
			@ctx.lineTo(edge.vb.x, edge.vb.y)
		)

		@ctx.stroke()

	draw: (print) =>
		@ctx.clearRect 0, 0, @canvas.width(), @canvas.height()
		@drawImage()

		if (print)
			@drawMask()

		@drawEdges(if print then "#000" else "#fff")

		if (!print)
			@drawMarkers()
		if (print)
			@drawNumbers()

	drawCells: (style) =>
		@ctx.strokeStyle = style
		@cells.forEach (cell) =>
			poly = cell.points
			@ctx.beginPath()
			return if poly.length == 0
			@ctx.moveTo poly[0].x, poly[0].y
			poly.forEach (point) =>
				@ctx.lineTo point.x, point.y
			@ctx.closePath()
			@ctx.stroke()

	drawNumbers: =>
		ctx = @ctx
		ctx.fillStyle = "#000"
		ctx.font = "20px Sans"
		ctx.textAlign = "center"
		ctx.textBaseline = "middle"

		rect = @canvas[0].getBoundingClientRect()

		(ctx.fillText face.voronoiId, face.x, face.y for face in @faces)

	drawMask: =>
		@ctx.fillStyle = "rgba(255,255,255,0.5)"
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
	
	doVoronoi: =>
		bbox = {
			xl: 0,
			xr: @canvas.width(),
			yt: 0,
			yb: @canvas.height()
		}

		voronoi = new Voronoi()
		sites = ({x: f.x, y: f.y} for f in @faces)
		@diagram = voronoi.compute(sites, bbox)
		@cells = (
			{
				id: cell.site.voronoiId
				x: cell.site.x
				y: cell.site.y
				points: _.flatten (
					[
						{x:he.getStartpoint().x>>0, y:he.getStartpoint().y>>0},
						{x:he.getEndpoint().x>>0, y:he.getEndpoint().y>>0}
					] for he in cell.halfedges
				)
			} for cell in @diagram.cells)

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

		@resetData()
		@draw()

		@picture.faceDetection({
			async: false
			grayscale: false
			minNeighbors: 1
			interval: 6
			complete: (f) =>
				f.forEach (fc) =>
					@faces.push {
						x: (fc.x + fc.width / 2) >> 0
						y: (fc.y + fc.height / 2) >> 0
					}
				e.target.disabled = false
				@update()
			error: (code, msg) ->
				console.log 'Oh no! Error ' + code + ' occurred. The message was "' + msg + '".'
		})

	# no fat arrow, will not be called as a callback
	init: ->
		button = $('#detectfaces')
		button.prop 'disabled', false
		button.click @detectFaces
		printButton = $('#printview')
		printButton.prop 'disabled', false

		toggle = =>
			@printView = !@printView
			@update()
			printButton.attr 'value', (if @printView then "edit" else "print") + " view"

		printButton.click toggle

		addOrRemoveSite = (e) =>
			rect = @canvas[0].getBoundingClientRect()
			cx = (e.clientX - rect.left) >> 0
			cy = (e.clientY - rect.top) >> 0

			if e.ctrlKey || e.metaKey
				@removeClosest @faces, {x: cx, y: cy}
			else
				@faces.push({x: cx, y: cy, width: 0, height: 0})

			@update()

		@canvas.click addOrRemoveSite

		$('#savehtml').click =>
			polys = (
				'<area shape="poly" coords="' +
					(_.flatten ([p.x, p.y] for p in poly.points)) +
				'" href="javascript:;" data-id="' +
					poly.id +
				'" data-x="' +
					poly.x +
				'" data-y="' +
					poly.y +
				'" />\n' for poly in @cells)
			foo = new Blob polys, {type: "text/html;charset=utf-8"}
			saveAs foo, "areas.html"

		$('#savefile').click =>
			facesPlusIds = (
				{
					x: f.x,
					y: f.y,
					id: f.voronoiId
				} for f in @faces
			)
			foo = new Blob [JSON.stringify(facesPlusIds, null, 2)], {type: "application/json;charset=utf-8"}
			saveAs foo, "faces.json"

		$('#loadfile').change (e) =>
			file = e.target.files[0]
			unless file?
				return
			reader = new FileReader()
			reader.onload = (e) =>
				contents = e.target.result
				@faces = JSON.parse contents
				@update()
			reader.readAsText file

$(document).ready ->
	new FaceApp($('#canvas'), $('#picture'))
