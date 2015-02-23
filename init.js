var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var faces = [];

var drawImage = function()
{
	console.log("drawing image");

	var pic = document.getElementById('picture');
	canvas.width = pic.width;
	canvas.height = pic.height;
	ctx.drawImage(
			pic,
			0,
			0,
			canvas.width,
			canvas.height
	);
};

var drawEdges = function(edges, style){
	ctx.lineWidth = 2;
	ctx.strokeStyle = style ? style : "#0f0";

	edges.forEach(function(edge){
		ctx.moveTo(edge.va.x, edge.va.y);
		ctx.lineTo(edge.vb.x, edge.vb.y);
	});

	ctx.stroke();
};


var draw = function(print){
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawImage();

	if (print)
		drawMask();

	var bbox = {
		xl: 0,
		xr: canvas.width,
		yt: 0,
		yb: canvas.height
	};

	var voronoi = new Voronoi();
	result = voronoi.compute(faces, bbox);

	drawEdges(result.edges, print ? "#000" : "#fff");

	if (!print)
		drawMarkers();
	if (print)
		drawNumbers();
};

var drawNumbers = function(){
	ctx.fillStyle = "#000";
	ctx.font = "20px Sans";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	var rect = canvas.getBoundingClientRect();

	faces.forEach(function(face, idx){
		ctx.fillText(idx, face.x, face.y);
	});
}

var drawMask = function(){
	ctx.fillStyle = "rgba(255,255,255,0.75)";
	ctx.fillRect(0,0,canvas.width,canvas.height);
}

var drawMarkers = function(){
	var highlight = function(rect, confidence)
	{
		var alpha = 1.0;
		var conf = ~~(255 * ((confidence + 10) / 20));

		var w = 4;
		//ctx.fillStyle = "rgba(" + conf + ",0," + (255 - conf) + "," + alpha + ")";
		ctx.strokeStyle = "#000";
		ctx.lineWidth = 2;
		ctx.fillStyle = "rgba(150,150,255,0.35)";

		ctx.beginPath();
		ctx.arc(rect[0],rect[1],2*w,0,Math.PI*2,true);
		ctx.fill();
		ctx.stroke();
	};

	faces.forEach(function(face){
		highlight([face.x, face.y], face.confidence);
	});
};

var removeClosest = function(faces, pos){
	var dist = function(a, b){
		return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
	};

	var minIndex = -1;
	var minDist = 5 * (canvas.width + canvas.height);
	faces.forEach(function(face, idx){
		var d = dist(face, pos);
		if (d < minDist) {
			minDist = d;
			minIndex = idx;
		}
	});

	console.log(pos);
	if (minIndex == -1) return;

	faces.splice(minIndex, 1);
};

var detectFaces = function(e){
	console.log("detecting faces");
	e.target.disabled = true;

	$('#picture').faceDetection({
		complete: function (f) {
			f.forEach(function(fc){
				fc.x = fc.x + fc.width / 2;
				fc.y = fc.y + fc.height / 2;
			});
			faces = f;
			e.target.disabled = false;
			draw();
		},
		error: function(code, msg) {
			console.log('Oh no! Error ' + code + ' occurred. The message was "' + msg + '".');
		}
	});
};

document.getElementById('picture').addEventListener('load',function(){
	console.log('image loaded');
	drawImage();
	var button = document.getElementById('detectfaces');
	button.disabled = false;
	button.addEventListener('click',detectFaces);
	var printButton = document.getElementById('printview');
	printButton.disabled = false;
	printButton.addEventListener('click', function(){
		draw(true);
	});
});

canvas.addEventListener('click',function(e){
	var rect = canvas.getBoundingClientRect();
	var cx = e.clientX - rect.left;
	var cy = e.clientY - rect.top;
	if (e.ctrlKey) {
		removeClosest(faces, {x: cx, y: cy});
	}
	else {
		faces.push({x: cx, y: cy, width: 0, height: 0, confidence: 10});
	}
	draw();
});
