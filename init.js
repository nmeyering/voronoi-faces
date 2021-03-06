// Generated by CoffeeScript 1.9.2
(function() {
  var FaceApp,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  FaceApp = (function() {
    function FaceApp(canvas, picture) {
      this.canvas = canvas;
      this.picture = picture;
      this.editAction = bind(this.editAction, this);
      this.editBoundary = bind(this.editBoundary, this);
      this.addOrRemoveSite = bind(this.addOrRemoveSite, this);
      this.detectFaces = bind(this.detectFaces, this);
      this.removeClosest = bind(this.removeClosest, this);
      this.doVoronoi = bind(this.doVoronoi, this);
      this.drawMarkers = bind(this.drawMarkers, this);
      this.drawMask = bind(this.drawMask, this);
      this.drawNumbers = bind(this.drawNumbers, this);
      this.drawPolygon = bind(this.drawPolygon, this);
      this.drawCells = bind(this.drawCells, this);
      this.draw = bind(this.draw, this);
      this.drawImage = bind(this.drawImage, this);
      this.clipCells = bind(this.clipCells, this);
      this.sortFaces = bind(this.sortFaces, this);
      this.resetData = bind(this.resetData, this);
      this.update = bind(this.update, this);
      this.picture.load((function(_this) {
        return function() {
          var pic;
          pic = _this.picture[0];
          pic.crossOrigin = "Anonymous";
          _this.canvas[0].width = pic.naturalWidth;
          _this.canvas[0].height = pic.naturalHeight;
          _this.canvas.width(pic.naturalWidth);
          _this.canvas.height(pic.naturalHeight);
          return _this.drawImage();
        };
      })(this));
      this.ctx = this.canvas[0].getContext('2d');
      this.cells = [];
      this.names = [];
      this.printView = false;
      this.editingBoundary = false;
      this.boundary = [];
      this.title = "Title";
      this.update();
      this.init();
    }

    FaceApp.prototype.update = function() {
      this.doVoronoi();
      this.sortFaces();
      return this.draw(this.printView);
    };

    FaceApp.prototype.resetData = function() {
      this.cells = [];
      return this.update();
    };

    FaceApp.prototype.sortFaces = function() {
      var score;
      score = function(c) {
        return c.y * 100 + c.x;
      };
      this.cells.sort(function(a, b) {
        return score(a) - score(b);
      });
      return this.cells.forEach(function(cell, index) {
        return cell.id = index + 1;
      });
    };

    FaceApp.prototype.clipCells = function() {
      var cell, i, len, other, p, ref, res, results;
      ref = this.cells;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        other = (function() {
          var j, len1, ref1, results1;
          ref1 = cell.points;
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j += 2) {
            p = ref1[j];
            results1.push(p);
          }
          return results1;
        })();
        res = (function() {
          var j, len1, ref1, results1;
          ref1 = clip(this.boundary, other.reverse());
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            p = ref1[j];
            results1.push(p);
          }
          return results1;
        }).call(this);
        if (res.length === 0) {
          res = other;
        }
        results.push(cell.points = res);
      }
      return results;
    };

    FaceApp.prototype.drawImage = function() {
      var pic;
      pic = this.picture[0];
      return this.ctx.drawImage(pic, 0, 0);
    };

    FaceApp.prototype.draw = function(print) {
      this.ctx.clearRect(0, 0, this.canvas.width(), this.canvas.height());
      this.drawImage();
      if (print) {
        this.drawMask();
      }
      this.drawCells(print ? '#000' : '#fff');
      if (!print) {
        this.drawMarkers();
      }
      if (print) {
        this.drawNumbers();
      }
      if (this.editingBoundary) {
        return this.drawPolygon(this.boundary, '#0f0');
      }
    };

    FaceApp.prototype.drawCells = function(style) {
      var cell, i, len, ref, results;
      ref = this.cells;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        results.push(this.drawPolygon(cell.points, style));
      }
      return results;
    };

    FaceApp.prototype.drawPolygon = function(polygon, style) {
      var i, len, p;
      this.ctx.strokeStyle = style;
      if (polygon.length === 0) {
        return;
      }
      this.ctx.beginPath();
      this.ctx.moveTo(polygon[0][0], polygon[0][1]);
      for (i = 0, len = polygon.length; i < len; i++) {
        p = polygon[i];
        this.ctx.lineTo(p[0], p[1]);
      }
      this.ctx.closePath();
      return this.ctx.stroke();
    };

    FaceApp.prototype.drawNumbers = function() {
      var cell, ctx, i, len, rect, ref, results;
      ctx = this.ctx;
      ctx.fillStyle = "#000";
      ctx.font = "20px Sans";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      rect = this.canvas[0].getBoundingClientRect();
      ref = this.cells;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        results.push(ctx.fillText(cell.id, cell.x, cell.y));
      }
      return results;
    };

    FaceApp.prototype.drawMask = function() {
      this.ctx.fillStyle = "rgba(255,255,255,0.5)";
      return this.ctx.fillRect(0, 0, this.canvas.width(), this.canvas.height());
    };

    FaceApp.prototype.drawMarkers = function() {
      var ctx;
      if (this.cells.length === 0) {
        return;
      }
      ctx = this.ctx;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.fillStyle = "rgba(150,150,255,0.35)";
      this.cells.forEach(function(cell) {
        var w;
        w = 4;
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, 2 * w, 0, Math.PI * 2, true);
        ctx.fill();
        return ctx.stroke();
      });
      return ctx.lineWidth = 1;
    };

    FaceApp.prototype.doVoronoi = function() {
      var bbox, c, cell, diagram, he, sites, voronoi;
      bbox = {
        xl: 0,
        xr: this.canvas.width(),
        yt: 0,
        yb: this.canvas.height()
      };
      voronoi = new Voronoi();
      sites = (function() {
        var i, len, ref, results;
        ref = this.cells;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          c = ref[i];
          results.push({
            x: c.x,
            y: c.y
          });
        }
        return results;
      }).call(this);
      diagram = voronoi.compute(sites, bbox);
      this.cells = (function() {
        var i, len, ref, results;
        ref = diagram.cells;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          cell = ref[i];
          results.push({
            id: cell.site.voronoiId,
            x: cell.site.x,
            y: cell.site.y,
            points: _.flatten((function() {
              var j, len1, ref1, results1;
              ref1 = cell.halfedges;
              results1 = [];
              for (j = 0, len1 = ref1.length; j < len1; j++) {
                he = ref1[j];
                results1.push([[he.getStartpoint().x, he.getStartpoint().y], [he.getEndpoint().x, he.getEndpoint().y]]);
              }
              return results1;
            })(), true)
          });
        }
        return results;
      })();
      if (this.boundary.length > 0) {
        return this.clipCells();
      }
    };

    FaceApp.prototype.removeClosest = function(cells, pos) {
      var dist, minDist, minIndex;
      dist = function(a, b) {
        return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
      };
      minIndex = -1;
      minDist = 5 * (this.canvas.width() + this.canvas.height());
      this.cells.forEach(function(cell, idx) {
        var d;
        d = dist(cell, pos);
        if (d < minDist) {
          minDist = d;
          return minIndex = idx;
        }
      });
      if (minIndex === -1) {
        return;
      }
      return this.cells.splice(minIndex, 1);
    };

    FaceApp.prototype.detectFaces = function(e) {
      $('#detectfaces').prop('disabled', true);
      this.resetData();
      return this.picture.faceDetection({
        async: true,
        grayscale: false,
        complete: (function(_this) {
          return function(f) {
            var face;
            _this.cells = (function() {
              var i, len, results;
              results = [];
              for (i = 0, len = f.length; i < len; i++) {
                face = f[i];
                results.push({
                  x: (face.x + face.width / 2) << 0,
                  y: (face.y + face.height / 2) << 0
                });
              }
              return results;
            })();
            $('#detectfaces').prop('disabled', false);
            return _this.update();
          };
        })(this),
        error: function(code, msg) {
          return console.log('Oh no! Error ' + code + ' occurred. The message was "' + msg + '".');
        }
      });
    };

    FaceApp.prototype.addOrRemoveSite = function(e) {
      var cx, cy, rect;
      rect = this.canvas[0].getBoundingClientRect();
      cx = (e.clientX - rect.left) << 0;
      cy = (e.clientY - rect.top) << 0;
      if (e.ctrlKey || e.metaKey) {
        return this.removeClosest(this.cells, {
          x: cx,
          y: cy
        });
      } else {
        return this.cells.push({
          x: cx,
          y: cy
        });
      }
    };

    FaceApp.prototype.editBoundary = function(e) {
      var cx, cy, rect;
      rect = this.canvas[0].getBoundingClientRect();
      cx = (e.clientX - rect.left) << 0;
      cy = (e.clientY - rect.top) << 0;
      if (e.ctrlKey || e.metaKey) {
        return this.boundary = this.boundary.slice(0, -1);
      } else {
        return this.boundary.push([cx, cy]);
      }
    };

    FaceApp.prototype.editAction = function(e) {
      if (this.editingBoundary) {
        this.editBoundary(e);
      } else {
        this.addOrRemoveSite(e);
      }
      return this.update();
    };

    FaceApp.prototype.init = function() {
      var button, printButton;
      button = $('#detectfaces');
      button.prop('disabled', false);
      button.click(this.detectFaces);
      printButton = $('#printview');
      printButton.prop('disabled', false);
      printButton.click((function(_this) {
        return function() {
          _this.printView = !_this.printView;
          _this.update();
          return printButton.attr('value', (_this.printView ? "edit" : "print") + " view");
        };
      })(this));
      this.canvas.click(this.editAction);
      $('#boundaryResetButton').click((function(_this) {
        return function() {
          _this.boundary = [];
          return _this.update();
        };
      })(this));
      $('#boundaryButton').click((function(_this) {
        return function() {
          _this.editingBoundary = !_this.editingBoundary;
          $('#boundaryButton').val("editing " + (_this.editingBoundary ? "boundary" : "faces"));
          $('#boundaryHelp').text(_this.editingBoundary ? 'You can edit the boundary the same way as you would the faces. Click to add a new vertex, Ctrl + Click (Cmd + Click) to remove the last one. Press button again to go back to editing faces.' : '');
          if (!_this.editingBoundary) {
            return _this.clipCells();
          }
        };
      })(this));
      $('#savehtml').click((function(_this) {
        return function() {
          var cell, polys;
          polys = (function() {
            var i, len, ref, results;
            ref = this.cells;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              cell = ref[i];
              results.push({
                points: _.flatten(cell.points),
                id: cell.id,
                x: cell.x,
                y: cell.y
              });
            }
            return results;
          }).call(_this);
          return $.get('template.html', function(template) {
            var areas, image_src, n, namelis, output, p, pt;
            areas = (function() {
              var i, len, results;
              results = [];
              for (i = 0, len = polys.length; i < len; i++) {
                p = polys[i];
                results.push('<area shape="poly" href="javascript:;" coords="' + ((function() {
                  var j, len1, ref, results1;
                  ref = p.points;
                  results1 = [];
                  for (j = 0, len1 = ref.length; j < len1; j++) {
                    pt = ref[j];
                    results1.push(pt << 0);
                  }
                  return results1;
                })()) + '"' + ' data-id="' + p.id + '"' + ' data-x="' + p.x + '"' + ' data-y="' + p.y + '"' + '/>');
              }
              return results;
            })();
            namelis = (function() {
              var i, len, ref, results;
              ref = this.names;
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                n = ref[i];
                results.push(("<li data-id=\"" + n.id + "\"><span class=\"last\">" + n.last + "</span>, ") + ("<span class=\"first\">" + n.first + "</span></li>"));
              }
              return results;
            }).call(_this);
            image_src = ($('#loadimage').val().split(/[\\\/]+/)).slice(-1)[0] || '<<<INSERT IMAGE URL HERE>>>';
            template = template.replace(/<%title%>/g, _this.title);
            template = template.replace('<%image%>', image_src);
            template = template.replace('<%names%>', namelis.join('\n'));
            template = template.replace('<%areas%>', areas.join('\n'));
            output = new Blob([template], {
              type: "text/html;charset=utf-8"
            });
            return saveAs(output, "output.html");
          });
        };
      })(this));
      $('#savefile').click((function(_this) {
        return function() {
          var c, data, foo;
          data = {
            faces: (function() {
              var i, len, ref, results;
              ref = this.cells;
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                c = ref[i];
                results.push({
                  x: c.x,
                  y: c.y
                });
              }
              return results;
            }).call(_this),
            boundary: _this.boundary
          };
          foo = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json;charset=utf-8"
          });
          return saveAs(foo, "faces.json");
        };
      })(this));
      $('#loadfile').change((function(_this) {
        return function(e) {
          var file, reader;
          file = e.target.files[0];
          if (file == null) {
            return;
          }
          reader = new FileReader();
          reader.onload = function(e) {
            var contents, error;
            contents = e.target.result;
            try {
              contents = JSON.parse(contents);
              _this.cells = contents.faces;
              _this.boundary = contents.boundary;
              return _this.update();
            } catch (_error) {
              error = _error;
            }
          };
          return reader.readAsText(file);
        };
      })(this));
      $('#loadnames').change((function(_this) {
        return function(e) {
          var file, reader;
          file = e.target.files[0];
          if (file == null) {
            return;
          }
          reader = new FileReader();
          reader.onload = function(e) {
            var contents, error, help, n, valid;
            contents = e.target.result;
            valid = false;
            try {
              contents = JSON.parse(contents);
              valid = 'length' in contents && _.all((function() {
                var i, len, results;
                results = [];
                for (i = 0, len = contents.length; i < len; i++) {
                  n = contents[i];
                  results.push('first' in n && 'last' in n && 'id' in n);
                }
                return results;
              })());
            } catch (_error) {
              error = _error;
            }
            if (valid === true) {
              _this.names = contents;
            }
            help = $('#namesHelp');
            help.removeClass();
            help.addClass('help');
            help.addClass(valid ? 'info' : 'error');
            return help.text((valid ? "Success! " + _this.names.length + " names loaded." : "Name list did not validate! Make sure your inputs conform to the format described above."));
          };
          return reader.readAsText(file);
        };
      })(this));
      $('#loadimage').change(function(e) {
        var file, imageType, reader;
        file = $('#loadimage')[0].files[0];
        imageType = /image.*/;
        if (file.type.match(imageType)) {
          reader = new FileReader();
          reader.onload = (function(_this) {
            return function(e) {
              var img;
              img = $('#picture');
              return img.attr('src', reader.result);
            };
          })(this);
          return reader.readAsDataURL(file);
        } else {

        }
      });
      return $('#titleinput').change((function(_this) {
        return function() {
          return _this.title = $('#titleinput').val();
        };
      })(this));
    };

    return FaceApp;

  })();

  $(document).ready(function() {
    return new FaceApp($('#canvas'), $('#picture'));
  });

}).call(this);
