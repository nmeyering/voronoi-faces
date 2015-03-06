var FaceApp = {
	picture : null, // (!)
	canvas : null, // (!)
	ctx : null, // (!)
	faces : [],
	printView: false,
	sortFaces : function()
	{
		this.faces.sort(function(f1, f2){
			return (f1.y * 100 + f1.x)
					-
					(f2.y * 100 + f2.x);
		});
	},

	drawImage : function()
	{
		console.log("drawing image");

		var pic = document.getElementById('picture');
		this.canvas.width = pic.width;
		this.canvas.height = pic.height;
		this.ctx.drawImage(
				pic,
				0,
				0,
				this.canvas.width,
				this.canvas.height
		);
	},

	drawEdges : function(edges, style)
	{
		var ctx = this.ctx;
		ctx.lineWidth = 2;
		ctx.strokeStyle = style ? style : "#0f0";

		edges.forEach(function(edge){
			ctx.moveTo(edge.va.x, edge.va.y);
			ctx.lineTo(edge.vb.x, edge.vb.y);
		});

		ctx.stroke();
	},

	draw : function(print){
		this.ctx.clearRect(0,0,canvas.width,canvas.height);
		this.drawImage();

		if (print)
			this.drawMask();

		var bbox = {
			xl: 0,
			xr: this.canvas.width,
			yt: 0,
			yb: this.canvas.height
		};

		var voronoi = new Voronoi();
		result = voronoi.compute(this.faces, bbox);

		this.drawEdges(result.edges, print ? "#000" : "#fff");

		if (!print)
			this.drawMarkers();
		if (print)
			this.drawNumbers();
	},

	drawNumbers : function()
	{
		var ctx = this.ctx;
		ctx.fillStyle = "#000";
		ctx.font = "20px Sans";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		var rect = this.canvas.getBoundingClientRect();

		this.faces.forEach(function(face, idx){
			ctx.fillText(idx, face.x, face.y);
		});
	},

	drawMask : function(){
		this.ctx.fillStyle = "rgba(255,255,255,0.75)";
		this.ctx.fillRect(0,0,canvas.width,canvas.height);
	},

	drawMarkers : function(){
		var ctx = this.ctx;
		this.faces.forEach(function(face){
			var rect = [face.x, face.y];
			var alpha = 1.0;
			var conf = ~~(255 * ((face.confidence + 10) / 20));

			var w = 4;
			ctx.strokeStyle = "#000";
			ctx.lineWidth = 2;
			ctx.fillStyle = "rgba(150,150,255,0.35)";

			ctx.beginPath();
			ctx.arc(rect[0],rect[1],2*w,0,Math.PI*2,true);
			ctx.fill();
			ctx.stroke();
		});
	},

	removeClosest : function(faces, pos){
		var dist = function(a, b){
			return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
		};

		var minIndex = -1;
		var minDist = 5 * (this.canvas.width + this.canvas.height);
		this.faces.forEach(function(face, idx){
			var d = dist(face, pos);
			if (d < minDist) {
				minDist = d;
				minIndex = idx;
			}
		});

		console.log(pos);
		if (minIndex == -1) return;

		this.faces.splice(minIndex, 1);
	},

	detectFaces : function(e){
		var that = this;
		console.log("detecting faces");
		console.log(e.target);
		e.target.disabled = true;

		$('#picture').faceDetection({
			async: true,
			grayscale: false,
			minNeighbors: 1,
			interval: 10,
			complete: function (f) {
				f.forEach(function(fc){
					fc.x = fc.x + fc.width / 2;
					fc.y = fc.y + fc.height / 2;
				});
				that.faces = f;
				e.target.disabled = false;
				that.draw();
			},
			error: function(code, msg) {
				console.log('Oh no! Error ' + code + ' occurred. The message was "' + msg + '".');
			}
		});
	},

	init : function(){
		this.canvas = document.getElementById('canvas');
		this.picture = document.getElementById('picture');
		this.ctx = this.canvas.getContext('2d');

		this.drawImage();
		var button = document.getElementById('detectfaces');
		button.disabled = false;
		button.addEventListener('click', this.detectFaces.bind(this));
		var printButton = document.getElementById('printview');
		printButton.disabled = false;

		var toggle = function(){
			this.printView = !this.printView;

			this.sortFaces();
			this.draw(this.printView);
			printButton.value = (this.printView ? "edit" : "print") + " view";
		};

		printButton.addEventListener('click', toggle.bind(this));

		var onClick = function(e){
			var rect = this.canvas.getBoundingClientRect();
			var cx = e.clientX - rect.left;
			var cy = e.clientY - rect.top;
			if (e.ctrlKey || e.metaKey) {
				this.removeClosest(this.faces, {x: cx, y: cy});
			}
			else {
				this.faces.push({x: cx, y: cy, width: 0, height: 0, confidence: 10});
			}
			this.draw(this.printView);
		};

		this.canvas.addEventListener('click', onClick.bind(this));
	}
};

//window.addEventListener('load', FaceApp.init);
FaceApp.init();
