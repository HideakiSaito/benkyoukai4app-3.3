window.ysy = window.ysy || {};
ysy.proManager = ysy.proManager || {};
ysy.pro = ysy.pro || {};
$.extend(ysy.proManager, {
  pros: [],
  functionPros: {},
  patch: function () {
    window.ysy = window.ysy || {};
    ysy.settings = ysy.settings || {};
    for (var key in ysy.pro) {
      if (!ysy.pro.hasOwnProperty(key)) continue;
      if (ysy.pro[key].patch) {
        this.pros.push(ysy.pro[key]);
      }
    }

    this.forEachPro(function () {
      this.patch()
    }, "patch");

  },
  forEachPro: function (func, funcName) {
    var pros;
    if (funcName === undefined) {
      pros = this.pros;
    } else if (this.functionPros[funcName] !== undefined) {
      pros = this.functionPros[funcName];
    } else {
      pros = [];
      for (var i = 0; i < this.pros.length; i++) {
        var pro = this.pros[i];
        if (pro[funcName]) {
          pros.push(pro);
        }
      }
      this.functionPros[funcName] = pros;
    }
    for (i = 0; i < pros.length; i++) {
      func.call(pros[i]);
    }
  },
  getConfig: function () {
    var config = {};
    this.forEachPro(function () {
      var featureConfig = this.getConfig();
      if (featureConfig) {
        $.extend(config, featureConfig);
      }
    }, "getConfig");
    return config;
  },
  getTaskClass: function (task) {
    var css = "";
    this.forEachPro(function () {
      var featureCss = this.getTaskClass(task);
      if (featureCss) {
        css += featureCss;
      }
    }, "getTaskClass");
    return css;
  },
  extendGanttTask: function (issue, gantt_issue) {
    this.forEachPro(function () {
      this.extendGanttTask(issue, gantt_issue);
    }, "extendGanttTask");
  },
  showHelp: function () {
    var div = $(this).next();
    var x = div.clone().attr({"id": div[0].id + "_popup"}).appendTo($("body"));
    showModal(x[0].id);
  },
  closeAll: function (except) {
    this.forEachPro(function () {
      if (except !== this) this.close();
    }, "close");
  },
  initProToolbars: function (ctx) {
    this.forEachPro(function () {
      this.initToolbar(ctx)
    }, "initToolbar");
  }
});
